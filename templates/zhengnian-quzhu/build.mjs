// 正念翻牌引擎构建管线（驱逐/接收共用，series 由模板 settings 区分）。
// script.json → 越南语钩子配音 + 每词中文朗读 + 主题图/词图(纯文字画风描述) → manifest。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage } from "../../scripts/gen-image.mjs";

const STYLE = `Use the supplied image as a STYLE REFERENCE ONLY. Copy only its gentle naive wax-crayon and colored-pencil medium: deep warm charcoal-black textured paper, bold rough uneven graphite outlines, visibly scribbled pigment grain, handmade children's-book drawing, simple rounded forms, cream, muted gold, brick red, leaf green and dusty blue. ABSOLUTELY DO NOT INCLUDE OR RESEMBLE THE REFERENCE IMAGE'S BLOND CHILD, GREEN T-SHIRT, BLUE SHORTS, TREASURE CHEST, COINS, POSE OR COMPOSITION. The content and characters must be entirely new and determined only by the scene request. Vertical 3:4, one centered readable symbolic scene, generous dark negative space at top and bottom for captions. No text, letters, logo, watermark, photorealism, 3D, glossy vector finish, scenery, room, floor or gradient`;

export async function buildZhengnian({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const a = settings.audio;
  const img = async (name, prompt) => {
    const version = settings.image.version ?? "v2";
    const file = `${name}-${version}.png`;
    const p = ensure(join(dir, "images", file));
    const styleRef = join(ROOT, "public/videos/2026/07/12/style-preview/facai-gentle-crayon-bold-rough.png");
    const r = await genImage({ outPath: p, prompt: `${STYLE}. Scene request: ${prompt}`, refPaths: [styleRef], settings, model: "flux" });
    console.log(`  🖼 ${name}${r.cached ? " (cache)" : " curl/flux-kontext"}`);
    return rel("images", file);
  };

  const beats = [];
  const total = script.words.length;

  // ① 开场钩子（时长由越南语配音驱动）
  const hookAudio = ensure(join(dir, "audio", "hook.mp3"));
  const hookTts = await synth(script.hook.vi, hookAudio, { voice: a.viVoice, speed: a.viSpeed });
  console.log(`  🎙 hook(vi): ${hookTts.ms}ms`);
  beats.push({
    id: "hook", role: "hook", index: 0, total,
    durationMs: 200 + hookTts.ms + (a.hookTailMs ?? 400),
    audio: rel("audio", "hook.mp3"), audioDelayMs: 200,
    image: await img("theme", script.hook.themePrompt),
    zh: script.hook.zh, pinyin: script.hook.pinyin, vi: script.hook.vi,
  });

  // ② 词汇微循环（固定时长，中文朗读在 0.9s 处入）
  for (let i = 0; i < total; i++) {
    const w = script.words[i];
    const zhAudio = ensure(join(dir, "audio", `w${i + 1}-zh.mp3`));
    const tts = await synth(w.zh, zhAudio, { voice: a.zhVoice, speed: a.zhSpeed });
    console.log(`  🎙 ${w.zh}(zh): ${tts.ms}ms`);
    beats.push({
      id: `w${i + 1}`, role: "word", index: i + 1, total,
      durationMs: a.wordMs ?? 2400,
      zhAudio: rel("audio", `w${i + 1}-zh.mp3`),
      image: await img(`w${i + 1}`, w.imagePrompt),
      zh: w.zh, pinyin: w.pinyin, vi: w.vi, fx: w.fx, sfx: w.sfx,
    });
  }

  return {
    meta: {
      fps: settings.meta.fps, width: settings.meta.width, height: settings.meta.height,
      layout: "zhengnian", series: settings.series,
      transitionFrames: 4,
      captions: { bgColor: settings.captions.bgColor },
      fonts: settings.fonts,
    },
    beats,
  };
}

export const build = buildZhengnian;
