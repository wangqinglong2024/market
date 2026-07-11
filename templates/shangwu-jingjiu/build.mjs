import { readFileSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";
import { loadPrompts, buildStoryPrompt } from "../../scripts/lib/config.mjs";

const ID = "shangwu-jingjiu";
const BASE_TEMPLATE = "guoxue-jinju";

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
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

  // 群像聚餐（story 模式）：通用成年人、不用主角定妆、不保 IP。
  // 死命令：只出现红酒高脚杯(red wine glasses)，严禁白酒/小瓷杯/烈酒瓶；GROUP 描述逐字复用减少长相漂移。
  const GROUP = "a warm group of six cartoon adults in smart business attire (men in shirts and ties, women in elegant blouses), friendly smiling faces";
  const visualPlan = {
    intro: {
      id: "scene-dinner-gathering",
      shot: `${GROUP}, seated together around a round dining table at a business dinner, tasteful shared dishes in the middle, each person with a stemmed glass of red wine, chatting happily, warm pendant light above. Cozy convivial gathering. No text anywhere.`,
    },
    p1: {
      id: "scene-group-toast",
      shot: `${GROUP}, all standing around a round dinner table and raising stemmed glasses of red wine together toward the center in a cheerful toast, tasteful dishes on the table, warm celebratory mood. No text anywhere.`,
    },
    p2: {
      id: "scene-shared-meal",
      shot: `${GROUP}, calmly enjoying a meal together around a round dinner table, kindly passing dishes to each other, stemmed glasses of red wine resting on the table, relaxed composed harmonious mood, soft warm light. No text anywhere.`,
    },
    p3: {
      id: "scene-new-journey-toast",
      shot: `${GROUP}, leaning in and gently clinking stemmed glasses of red wine together above the center of a round dinner table, hopeful uplifting mood, warm light suggesting a bright new journey ahead. No text anywhere.`,
    },
    outro: {
      id: "scene-dinner-gathering",
      shot: `${GROUP}, seated together around a round dining table at a business dinner, tasteful shared dishes in the middle, each person with a stemmed glass of red wine, chatting happily, warm pendant light above. Cozy convivial gathering. No text anywhere.`,
    },
  };

  const imageCache = {};
  async function ensureVisual(key) {
    const plan = visualPlan[key] || visualPlan.intro;
    if (imageCache[plan.id]) return imageCache[plan.id];

    // story 模式：flux 喂风格锚图只借画风，群像按 shot 描述直接画（不用定妆、不保 IP）
    const prompt = buildStoryPrompt({ shotContent: plan.shot, prompts });
    const ref = settings.image.styleAnchor;
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
