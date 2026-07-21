// 模板『HSK字源·九宫格识字』构建流水线(定稿)。由通用编排器 scripts/build.mjs 调用 build(),返回 manifest。
// 形态:9:16,每组4字(2×2格)。★两种子模板(script.mode 或模板默认):
//   · parallel(纯字版) = 4字同时演变,朗读独立逐字(一组4.8s);
//   · inkburst(炸裂墨韵版) = 蓄势 easeIn 慢起急收 → burst 一记「墨炸弹」爆破;可选 script.intro 全屏单字冷开场。
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
  if (!prof) throw new Error(`未知模式 mode="${mode}"(仅 parallel / inkburst)`);
  const fps = settings.meta.fps;

  // 时序(parallel/inkburst 同用绝对帧):draw→morph→real,readFrames 逐字朗读间隔。
  const groupFrames = prof.groupFrames, readFrames = prof.readFrames;
  const draw = prof.draw, morph = prof.morph, real = prof.real;
  const groupMs = Math.round((groupFrames / fps) * 1000);

  const voice = script.voice || settings.audio.voice;
  const speed = script.speed ?? settings.audio.speed ?? 1.2;
  const ttsDir = join(ROOT, "public", "library", "tts-hanzi");
  mkdirSync(ttsDir, { recursive: true });

  const groups = script.groups || [];
  if (!groups.length) throw new Error(`${videoId}: script.groups 为空`);

  const sizes = settings.sizes;

  const beats = [];
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

      const readFrame = (prof.readAt0 ?? 0) + i * readFrames;
      chars.push({ c, py: gl.py, vi: item.vi ?? "", pic: gl.pic, chr: gl.chr, ...(gl.extra && { extra: gl.extra }), audio: `library/tts-hanzi/${hanHex(c)}.mp3`, slot: 0, readFrame });
    }
    beats.push({ id: `g${gi + 1}`, durationMs: groupMs, chars });
  }

  // ★炸裂墨韵版可选冷开场:script.intro 指定单字(如「日」)→ 全屏英雄镜头一条 beat(画→字→炸,教格式)。
  const intro = prof.intro;
  if (script.intro && intro) {
    const c = script.intro;
    if (Array.from(c).filter(isHan).length !== 1) throw new Error(`intro 必须是单个汉字: 「${c}」`);
    const gl = lib[c];
    if (!gl) throw new Error(`intro 字「${c}」不在 glyphs.json 字形库,请先补 pic/chr 骨架`);
    const audioAbs = join(ttsDir, `${hanHex(c)}.mp3`);
    await synth(c, audioAbs, { voice, speed });
    const introMs = Math.round((intro.frames / fps) * 1000);
    beats.unshift({
      id: "intro", durationMs: introMs, hero: true,
      chars: [{ c, py: gl.py, vi: "", pic: gl.pic, chr: gl.chr, ...(gl.extra && { extra: gl.extra }),
        audio: `library/tts-hanzi/${hanHex(c)}.mp3`, slot: 0, readFrame: intro.readAt }],
    });
    console.log(`  [intro] ${c} ${gl.py}  全屏冷开场 ${intro.frames}帧`);
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "hsk-ziyuan",
      grid: {
        mode, x0: gridCfg.x0, y0: gridCfg.y0, cellW: gridCfg.cellW, cellH: gridCfg.cellH, box: gridCfg.box,
        groupFrames, readFrames, draw, morph, real,
        ...(prof.burst != null && { burst: prof.burst }),
        ...(prof.intro && { introFrames: prof.intro.frames, introDraw: prof.intro.draw,
          introMorph: prof.intro.morph, introBurst: prof.intro.burst, heroBox: prof.intro.box }),
      },
      colors: Object.fromEntries(Object.entries(settings.colors).filter(([k]) => !k.startsWith("_"))),
      sizes,
      ...(settings.fonts && { fonts: settings.fonts }),
    },
    beats,
  };

  const totalMs = beats.reduce((a, b) => a + b.durationMs, 0);
  const nChars = beats.filter((b) => b.chars).reduce((a, b) => a + b.chars.length, 0);
  console.log(`\nHSK字源九宫格 ${videoId} [${mode}] 完成: ${nChars}字, ${(totalMs / 1000).toFixed(1)}s (纯代码,零AI花费)`);
  return manifest;
}
