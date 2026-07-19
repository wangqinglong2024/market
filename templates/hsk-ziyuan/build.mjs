// 模板『HSK字源·九宫格识字』构建流水线(定稿)。由通用编排器 scripts/build.mjs 调用 build(),返回 manifest。
// 形态:9:16,每组4字(2×2格),每组4秒内同时逐点几何演变(简笔→线条字),末秒→真实毛笔字;朗读独立1秒/字。
// 生产:script.json(分组的{字,越南语释义}) → 查 glyphs.json 取骨架(pic/chr/py) + 每字配音(火山TTS·爽快思思,复用库) → manifest。
// 纯代码渲染,不出AI图/视频。发音复用库 public/library/tts-hanzi/(hash缓存,跨视频复用)。
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";

const ID = "hsk-ziyuan";
const isHan = (c) => /[㐀-鿿]/.test(c);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const tpl = (ROOT, ...p) => join(ROOT, "templates", ID, ...p);
const hanHex = (c) => `han-${c.codePointAt(0).toString(16)}`;

export async function build({ videoId, dir, ROOT, settings }) {
  const script = readJson(join(dir, "script.json"));
  const lib = readJson(tpl(ROOT, "glyphs.json")).glyphs;
  const grid = settings.grid;
  const voice = script.voice || settings.audio.voice;
  const speed = script.speed ?? settings.audio.speed ?? 1.2;
  const fps = settings.meta.fps;
  const groupMs = Math.round((grid.groupFrames / fps) * 1000);

  // 发音复用库(公共,跨视频):public/library/tts-hanzi/<han-hex>.mp3
  const ttsDir = join(ROOT, "public", "library", "tts-hanzi");
  mkdirSync(ttsDir, { recursive: true });

  const groups = script.groups || [];
  if (!groups.length) throw new Error(`${videoId}: script.groups 为空`);

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

      // 配音(复用库,爽快思思):只念这一个字。
      const audioAbs = join(ttsDir, `${hanHex(c)}.mp3`);
      const a = await synth(c, audioAbs, { voice, speed });
      console.log(`  ${c} ${gl.py} / ${item.vi}  ${a.cached ? "cached" : a.ms + "ms"}`);

      chars.push({
        c, py: gl.py, vi: item.vi ?? "",
        pic: gl.pic, chr: gl.chr,
        audio: `library/tts-hanzi/${hanHex(c)}.mp3`,
        readFrame: i * grid.readFrames,
      });
    }
    beats.push({ id: `g${gi + 1}`, durationMs: groupMs, chars });
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "hsk-ziyuan",
      grid,
      colors: Object.fromEntries(Object.entries(settings.colors).filter(([k]) => !k.startsWith("_"))),
      sizes: settings.sizes,
      ...(settings.fonts && { fonts: settings.fonts }),
    },
    beats,
  };

  const totalMs = beats.reduce((a, b) => a + b.durationMs, 0);
  console.log(`\nHSK字源九宫格 ${videoId} 完成: ${beats.length}组×4字=${beats.length * 4}字, ${(totalMs / 1000).toFixed(1)}s (纯代码,零AI花费)`);
  return manifest;
}
