import { readFileSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";
import { loadCharacters, loadPrompts, buildFluxPrompt, buildScenePrompt } from "../../scripts/lib/config.mjs";

const ID = "shangwu-jingjiu";
const BASE_TEMPLATE = "guoxue-jinju";

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const characters = loadCharacters(BASE_TEMPLATE);
  const prompts = loadPrompts(BASE_TEMPLATE);
  const viVoice = settings.audio.viVoice;
  const zhVoice = settings.audio.zhVoice;
  const viSpeed = settings.audio.viSpeed ?? 1;
  const zhSpeed = settings.audio.zhSpeed ?? 1;
  const phraseLeadMs = settings.audio.phraseLeadMs ?? 520;
  const costLog = join(dir, "cost", "coast.md");

  function logImageCost({ beatId, model, usd }) {
    ensure(costLog);
    if (!existsSync(costLog)) {
      writeFileSync(costLog, `# 出图成本日志 · ${videoId}\n\n每次真实调用出图模型记一行；缓存命中不计。\n\n`);
    }
    appendFileSync(costLog, `- ${new Date().toLocaleString("sv-SE")} | ${beatId} | ${model} | $${usd.toFixed(2)}\n`);
  }

  const visualPlan = {
    intro: {
      id: "scene-banquet-empty",
      mode: "scene",
      shot: "An elegant modern Chinese business dinner banquet room with a round dining table, tasteful dishes, small porcelain cups, folded napkins, and warm pendant light. Refined commercial meal atmosphere. Empty scene only, no people, no characters, no text.",
    },
    p1: {
      id: "scene-toast-host",
      mode: "character",
      shot: "The chubby cartoon little girl host in pale-blue hanfu and scholar cap stands beside an elegant round business dinner table, politely raising a small porcelain cup with both hands in a graceful toast. Warm private dining room atmosphere, tasteful dishes on the table, refined and friendly. No text anywhere.",
    },
    p2: {
      id: "scene-steady-table",
      mode: "scene",
      shot: "A calm elegant business dinner table after a toast: two porcelain cups placed steadily side by side, simple dishes, warm tea steam, soft light, balanced and composed mood. Empty scene only, no people, no characters, no text.",
    },
    p3: {
      id: "scene-new-journey",
      mode: "scene",
      shot: "A refined business dinner table with two small porcelain cups gently touching, an open doorway with warm light in the background suggesting a new journey ahead. Elegant, hopeful, tasteful commercial meal setting. Empty scene only, no people, no characters, no text.",
    },
    outro: {
      id: "scene-banquet-empty",
      mode: "scene",
      shot: "An elegant modern Chinese business dinner banquet room with a round dining table, tasteful dishes, small porcelain cups, folded napkins, and warm pendant light. Refined commercial meal atmosphere. Empty scene only, no people, no characters, no text.",
    },
  };

  const imageCache = {};
  async function ensureVisual(key) {
    const plan = visualPlan[key] || visualPlan.intro;
    if (imageCache[plan.id]) return imageCache[plan.id];

    const isCharacter = plan.mode === "character";
    const prompt = isCharacter
      ? buildFluxPrompt({ shotContent: plan.shot, charIds: ["girl"], prompts, characters, useHat: true })
      : buildScenePrompt({ shotContent: plan.shot, prompts });
    const ref = isCharacter ? settings.image.charRef : settings.image.styleAnchor;
    const outPath = ensure(join(dir, "images", `${plan.id}.png`));
    const img = await genImage({
      outPath,
      prompt,
      refPaths: [join(ROOT, ref)],
      settings,
      model: "flux",
    });
    if (!img.cached) {
      const usd = MODEL_USD[img.model] ?? 0;
      logImageCost({ beatId: plan.id, model: img.model ?? "flux", usd });
    }
    imageCache[plan.id] = rel("images", `${plan.id}.png`);
    return imageCache[plan.id];
  }

  const introAudio = await synth(script.intro.vi, ensure(join(dir, "audio", "intro.mp3")), {
    voice: viVoice,
    speed: viSpeed,
  });

  const beats = [{
    id: "intro",
    role: "intro",
    image: await ensureVisual("intro"),
    audio: rel("audio", "intro.mp3"),
    durationMs: introAudio.ms + (settings.audio.introTailMs ?? 650),
    vi: script.intro.vi,
  }];

  for (const phrase of script.phrases) {
    const audio = await synth(phrase.zh, ensure(join(dir, "audio", `${phrase.id}.mp3`)), {
      voice: zhVoice,
      speed: zhSpeed,
    });
    beats.push({
      id: phrase.id,
      role: "phrase",
      image: await ensureVisual(phrase.id),
      audio: rel("audio", `${phrase.id}.mp3`),
      durationMs: phraseLeadMs + audio.ms + (settings.audio.phraseTailMs ?? 900),
      audioDelayMs: phraseLeadMs,
      zh: phrase.zh,
      pinyin: phrase.pinyin,
      vi: phrase.vi,
      charTimings: audio.charTimings,
    });
  }

  const outroAudio = await synth(script.outro.vi, ensure(join(dir, "audio", "outro.mp3")), {
    voice: viVoice,
    speed: viSpeed,
  });
  beats.push({
    id: "outro",
    role: "outro",
    image: await ensureVisual("outro"),
    audio: rel("audio", "outro.mp3"),
    durationMs: outroAudio.ms + (settings.audio.outroTailMs ?? 700),
    vi: script.outro.vi,
  });

  return {
    meta: {
      ...settings.meta,
      layout: settings.layout || ID,
      transitionFrames: 10,
      fonts: settings.fonts,
      captions: settings.captions,
      visual: settings.visual,
      ...(settings.audio.bgm?.src && { bgm: settings.audio.bgm }),
    },
    beats,
  };
}
