// 模板『HSK字源·九宫格识字』构建流水线(定稿)。由通用编排器 scripts/build.mjs 调用 build(),返回 manifest。
// 形态:9:16,每组4字(2×2格)。★两种模式(script.mode 或模板默认):
//   · parallel = 4字同时演变,朗读独立逐字(一组4.8s);
//   · sequential = 逐个来,每字独占 charSlot 帧走完全程+朗读,4格逐格填入保留;charSlot 可被 script.charSlot 覆盖调速(60=2s,36=1.2s)。
// ★可选顶部引导文字条(script.banner{lead,tail}):lead=最后一组之前各组顶部常驻文案,tail=最后一组切换成的文案。
//   纯视觉不朗读、不增加总时长;启用时格子按 settings.banner.grid/sizes 缩小下移给顶部让位。子模板清单见 SUBTEMPLATES.md。
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
  const ttsDir = join(ROOT, "public", "library", "tts-hanzi");
  mkdirSync(ttsDir, { recursive: true });

  const groups = script.groups || [];
  if (!groups.length) throw new Error(`${videoId}: script.groups 为空`);

  // 顶部引导文字条(可选):启用时格子缩小下移;lead 盖前 n-1 组,tail 盖最后一组(无 tail 则 lead 盖全程)。
  const bannerOn = !!script.banner;
  const bc = settings.banner || {};
  const gridGeo = bannerOn ? { ...bc.grid } : {};
  const sizes = bannerOn ? { ...settings.sizes, ...(bc.sizes || {}) } : settings.sizes;
  let bannerMeta = null;
  if (bannerOn) {
    const n = groups.length;
    const lead = script.banner.lead || [];
    const tail = script.banner.tail || [];
    const spans = [];
    if (lead.length) spans.push({ fromMs: 0, toMs: (tail.length ? n - 1 : n) * groupMs, lines: lead });
    if (tail.length) spans.push({ fromMs: (n - 1) * groupMs, toMs: n * groupMs, lines: tail });
    bannerMeta = { y: bc.y ?? 108, width: bc.width ?? 960, fontSize: bc.fontSize ?? 58, fontSize2: bc.fontSize2 ?? 46, lineGap: bc.lineGap ?? 18, spans };
  }

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

      const slot = seq ? i * charSlot : 0;
      const readFrame = seq ? slot + readAt : i * readFrames;
      chars.push({ c, py: gl.py, vi: item.vi ?? "", pic: gl.pic, chr: gl.chr, ...(gl.extra && { extra: gl.extra }), audio: `library/tts-hanzi/${hanHex(c)}.mp3`, slot, readFrame });
    }
    beats.push({ id: `g${gi + 1}`, durationMs: groupMs, chars });
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "hsk-ziyuan",
      grid: {
        mode, seq, x0: gridCfg.x0, y0: gridCfg.y0, cellW: gridCfg.cellW, cellH: gridCfg.cellH, box: gridCfg.box,
        ...gridGeo,
        groupFrames, charSlot, readFrames, readAt, draw, morph, real,
      },
      colors: Object.fromEntries(Object.entries(settings.colors).filter(([k]) => !k.startsWith("_"))),
      sizes,
      ...(bannerMeta && { banner: bannerMeta }),
      ...(settings.fonts && { fonts: settings.fonts }),
    },
    beats,
  };

  const totalMs = beats.reduce((a, b) => a + b.durationMs, 0);
  const nChars = beats.filter((b) => b.chars).reduce((a, b) => a + b.chars.length, 0);
  console.log(`\nHSK字源九宫格 ${videoId} [${mode}${seq ? ` charSlot=${charSlot}` : ""}] 完成: ${nChars}字, ${(totalMs / 1000).toFixed(1)}s (纯代码,零AI花费)`);
  return manifest;
}
