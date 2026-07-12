// 正念翻牌引擎构建管线（驱逐/接收共用，series 由模板 settings 区分）。
// script.json → 越南语钩子/CTA 配音 + 每词中文朗读 + 主题图/词图(动漫风格锚) → manifest。
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage } from "../../scripts/gen-image.mjs";

const ANCHOR_PROMPT =
  "exaggerated Japanese anime style illustration, bold ink outlines, dramatic composition, dynamic action lines, high contrast vivid colors, epic fantasy landscape with storm clouds and golden light rays breaking through, painterly cel shading, no people, no characters, no text";

const STYLE = "exaggerated Japanese anime style, bold ink outlines, dramatic composition, dynamic action lines, high contrast vivid colors, painterly cel shading, no people, no characters, no text, edges fading into pure black background";

async function ensureAnimeAnchor(ROOT, settings) {
  const anchor = join(ROOT, settings.image.styleAnchor);
  if (existsSync(anchor)) return anchor;
  // 引导锚：借 shenfen 暗调渐变当参考底，让 flux 按提示词产出动漫风样例，之后全线锁定此图
  const bootstrap = join(ROOT, "templates", "shenfen-jiema", "style-anchor.png");
  await genImage({ outPath: anchor, prompt: ANCHOR_PROMPT, refPaths: [bootstrap], settings, model: "flux" });
  console.log("  🎨 动漫风格锚已生成(首次)，人工确认画风后锁定:", anchor);
  return anchor;
}

export async function buildZhengnian({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const a = settings.audio;
  const anchor = await ensureAnimeAnchor(ROOT, settings);
  const img = async (name, prompt) => {
    const p = ensure(join(dir, "images", `${name}.png`));
    const r = await genImage({ outPath: p, prompt: `${STYLE}. Scene: ${prompt}`, refPaths: [anchor], settings, model: "flux" });
    console.log(`  🖼 ${name}${r.cached ? " (cache)" : " flux $0.04"}`);
    return rel("images", `${name}.png`);
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

  // ③ 封印 + 领取
  const outroAudio = ensure(join(dir, "audio", "outro.mp3"));
  const outroTts = await synth(script.outro.vi, outroAudio, { voice: a.viVoice, speed: a.viSpeed });
  console.log(`  🎙 outro(vi): ${outroTts.ms}ms`);
  beats.push({
    id: "outro", role: "seal", index: total + 1, total,
    durationMs: 300 + outroTts.ms + (a.outroTailMs ?? 800),
    audio: rel("audio", "outro.mp3"), audioDelayMs: 300,
    vi: script.outro.cta ?? script.outro.vi, preview: script.outro.preview,
  });

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
