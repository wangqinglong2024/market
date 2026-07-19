// 模板『HSK字源·九宫格识字』构建流水线(定稿)。由通用编排器 scripts/build.mjs 调用 build(),返回 manifest。
// 形态:9:16,每组4字(2×2格)。★两种模式(script.mode 或模板默认):
//   · parallel = 4字同时演变,朗读独立逐字(一组4.8s);
//   · sequential = 逐个来,每字独占 charSlot 帧走完全程+朗读,4格逐格填入保留;charSlot 可被 script.charSlot 覆盖调速(60=2s,36=1.2s)。
// ★可选开头/结尾文字卡(script.intro/outro):越南语中央闪现,做记忆测试挑战/催评论。
// 生产:script.json → 查 glyphs.json 取骨架 + 每字配音(火山TTS·爽快思思,复用库) → manifest。纯代码渲染,零AI花费。
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";

const ID = "hsk-ziyuan";
const isHan = (c) => /[㐀-鿿]/.test(c);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const tpl = (ROOT, ...p) => join(ROOT, "templates", ID, ...p);
const hanHex = (c) => `han-${c.codePointAt(0).toString(16)}`;
const ms2f = (ms, fps) => Math.round((ms / 1000) * fps);

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = readJson(join(dir, "script.json"));
  const lib = readJson(tpl(ROOT, "glyphs.json")).glyphs;
  const gridCfg = settings.grid;
  const mode = script.mode || gridCfg.mode || "parallel";
  const prof = gridCfg[mode];
  if (!prof) throw new Error(`未知模式 mode="${mode}"(仅 parallel / sequential)`);
  const seq = mode === "sequential";
  const fps = settings.meta.fps;

  // 时序:parallel 用绝对帧;sequential 用 charSlot(可被 script 覆盖调速)× 比例。
  let groupFrames, charSlot = null, readFrames = null, readAt, draw, morph, real;
  if (seq) {
    charSlot = script.charSlot ?? prof.charSlot;
    groupFrames = 4 * charSlot;
    const A = (fr) => [Math.round(fr[0] * charSlot), Math.round(fr[1] * charSlot)];
    draw = A(prof.drawF); morph = A(prof.morphF); real = A(prof.realF);
    readAt = Math.round(prof.readAtF * charSlot);
  } else {
    groupFrames = prof.groupFrames; readFrames = prof.readFrames;
    draw = prof.draw; morph = prof.morph; real = prof.real; readAt = null;
  }
  const groupMs = Math.round((groupFrames / fps) * 1000);

  const voice = script.voice || settings.audio.voice;
  const speed = script.speed ?? settings.audio.speed ?? 1.2;
  const viVoice = script.viVoice || settings.audio.viVoice;
  const viSpeed = script.viSpeed ?? settings.audio.viSpeed ?? 1.05;
  const ttsDir = join(ROOT, "public", "library", "tts-hanzi");
  mkdirSync(ttsDir, { recursive: true });

  // 开头/结尾文字卡的越南语配音(say 字段);无 say 则无配音。
  async function cardAudio(id, say) {
    if (!say || !say.trim()) return null;
    const p = ensure(join(dir, "audio", `${id}.mp3`));
    const a = await synth(say, p, { voice: viVoice, speed: viSpeed });
    return { rel: rel("audio", `${id}.mp3`), ms: a.ms };
  }

  const groups = script.groups || [];
  if (!groups.length) throw new Error(`${videoId}: script.groups 为空`);

  const beats = [];
  // 开头文字卡(可含越南语配音;有配音则卡时长自动撑到读完+0.4s,script.ms 为下限)
  if (script.intro) {
    const a = await cardAudio("intro", script.intro.say);
    const ms = Math.max(script.intro.ms ?? 2000, a ? a.ms + 400 : 0);
    beats.push({ id: "intro", durationMs: ms, card: { kind: "intro", lines: script.intro.lines || [], ...(a && { audio: a.rel }) } });
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (g.length !== 4) throw new Error(`第${gi + 1}组必须恰好4字(2×2格),现有 ${g.length}`);
    const chars = [];
    for (let i = 0; i < g.length; i++) {
      const item = g[i];
      const c = item.c;
      if (!c || Array.from(c).filter(isHan).length !== 1) throw new Error(`第${gi + 1}组第${i + 1}字非单汉字: 「${c}」`);
      const gl = lib[c];
      if (!gl) throw new Error(`字「${c}」不在 glyphs.json 字形库,请先补其 pic/chr 骨架`);

      const audioAbs = join(ttsDir, `${hanHex(c)}.mp3`);
      const a = await synth(c, audioAbs, { voice, speed });
      console.log(`  ${c} ${gl.py} / ${item.vi}  ${a.cached ? "cached" : a.ms + "ms"}`);

      const slot = seq ? i * charSlot : 0;
      const readFrame = seq ? slot + readAt : i * readFrames;
      chars.push({ c, py: gl.py, vi: item.vi ?? "", pic: gl.pic, chr: gl.chr, ...(gl.extra && { extra: gl.extra }), audio: `library/tts-hanzi/${hanHex(c)}.mp3`, slot, readFrame });
    }
    beats.push({ id: `g${gi + 1}`, durationMs: groupMs, chars });
  }

  // 结尾文字卡(可含越南语配音;有配音则卡时长自动撑到读完+0.4s,script.ms 为下限)
  if (script.outro) {
    const a = await cardAudio("outro", script.outro.say);
    const ms = Math.max(script.outro.ms ?? 1600, a ? a.ms + 400 : 0);
    beats.push({ id: "outro", durationMs: ms, card: { kind: "outro", lines: script.outro.lines || [], ...(a && { audio: a.rel }) } });
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "hsk-ziyuan",
      grid: {
        mode, seq, x0: gridCfg.x0, y0: gridCfg.y0, cellW: gridCfg.cellW, cellH: gridCfg.cellH, box: gridCfg.box,
        groupFrames, charSlot, readFrames, readAt, draw, morph, real,
      },
      colors: Object.fromEntries(Object.entries(settings.colors).filter(([k]) => !k.startsWith("_"))),
      sizes: settings.sizes,
      ...(settings.fonts && { fonts: settings.fonts }),
    },
    beats,
  };

  const totalMs = beats.reduce((a, b) => a + b.durationMs, 0);
  const nChars = beats.filter((b) => b.chars).reduce((a, b) => a + b.chars.length, 0);
  console.log(`\nHSK字源九宫格 ${videoId} [${mode}${seq ? ` charSlot=${charSlot}` : ""}] 完成: ${nChars}字, ${(totalMs / 1000).toFixed(1)}s (纯代码,零AI花费)`);
  return manifest;
}
