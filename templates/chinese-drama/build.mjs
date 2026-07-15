// 模板『中文情景剧·图文(阿香·越南受众)』构建流水线。
// 由通用编排器 scripts/build.mjs 调用 build()，返回 manifest 对象。
// 生产方式照 guoxue-jinju：script.json → 每拍配音(火山TTS,带字级时间戳) + 每场景一张 AI 图(fal,按人数路由) → manifest。
// 版面照 chinese-learn：黑底 / 上图 1080x720 / 下三行字幕(拼音/中文/越南语)逐字卡拉OK。layout="chinese-drama"。
// 全程按 hash 缓存：改一句不重烧整片；出图缓存命中不重复烧 fal。
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";

const ID = "chinese-drama";
const isHan = (c) => /[㐀-鿿]/.test(c);
const hanCount = (s) => Array.from(s || "").filter(isHan).length;
// 越南语拍(旁白/独白)的中文行没有真字级时间戳 → 按拍时长把汉字均匀铺开,驱动卡拉OK逐字扫过。
function evenCharTimings(zh, ms) {
  const hans = Array.from(zh || "").filter(isHan);
  if (!hans.length || !ms) return null;
  const span = ms / hans.length;
  return hans.map((ch, i) => ({ ch, startMs: Math.round(i * span), endMs: Math.round((i + 1) * span) }));
}
// 越南语行卡拉OK:越南语音色不返回词级时间戳 → 按本拍音频时长把单词均匀铺开,逐词点亮。
function evenWordTimings(text, ms) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length || !ms) return null;
  const span = ms / words.length;
  return words.map((w, i) => ({ w, startMs: Math.round(i * span), endMs: Math.round((i + 1) * span) }));
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const readText = (p) => readFileSync(p, "utf8");
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

// 该模板私有资产读取(自包含,不走 guoxue 的 config 助手)。
function tpl(ROOT, ...p) { return join(ROOT, "templates", ID, ...p); }

function loadChars(ROOT) {
  const reg = readJson(tpl(ROOT, "characters", "_registry.json"));
  const map = {};
  for (const c of reg.characters) {
    map[c.id] = {
      id: c.id, name: c.name,
      refPath: tpl(ROOT, "characters", c.id, c.ref),
      canon: stripComments(readText(tpl(ROOT, "characters", c.id, c.canonical))),
    };
  }
  return map;
}

function loadPrompts(ROOT) {
  const p = (f) => stripComments(readText(tpl(ROOT, "prompts", f)));
  const raw = (f) => readText(tpl(ROOT, "prompts", f)); // 模板含占位符,注释先剥
  return {
    style: p("style.md"),
    charTpl: stripComments(raw("image-char.tpl.md")),
    sceneTpl: stripComments(raw("image-scene.tpl.md")),
    multiTpl: stripComments(raw("image-multi.tpl.md")),
  };
}

function pickMotion(beat, motion) {
  if (beat.motion && motion.presets[beat.motion]) return beat.motion;
  const zh = beat?.captions?.zh ?? "";
  for (const [pat, preset] of Object.entries(motion.rules.byKeyword || {})) {
    if (new RegExp(pat).test(zh)) return preset;
  }
  return motion.rules.default;
}

function buildPrompt({ shot, charIds, chars, prompts }) {
  if (charIds.length === 0) {
    return prompts.sceneTpl.replace("{shot}", shot.content).replace("{style}", prompts.style);
  }
  const canon = charIds.map((id) => chars[id]?.canon).filter(Boolean).join("\n");
  const t = charIds.length >= 2 ? prompts.multiTpl : prompts.charTpl;
  return t.replace("{shot}", shot.content).replace("{canon}", canon).replace("{style}", prompts.style);
}

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const motion = readJson(tpl(ROOT, "motion.json"));
  const chars = loadChars(ROOT);
  const prompts = loadPrompts(ROOT);

  // 省钱铁律(继承 guoxue)：一条视频最多 1 个多角色(nano-pro)拍。
  const nanoBeats = script.beats.filter((b) =>
    (b.hasMainCharacter ? (b.characters || []).length : 0) >= 2 ||
    (b.shots || []).some((s) => s.model === "nano-pro"),
  );
  if (nanoBeats.length > 1) {
    throw new Error(`每条视频最多 1 个多角色(nano-pro)拍(省钱铁律)。当前 ${nanoBeats.length} 个: ${nanoBeats.map((b) => b.id).join(", ")}。把多余的改成单人/空镜。`);
  }

  // 出图成本日志(继承 guoxue)：真实调用记一行,缓存命中不记。
  const costLog = join(dir, "cost", "coast.md");
  function logCost({ beatId, model, usd }) {
    ensure(costLog);
    if (!existsSync(costLog)) writeFileSync(costLog, `# 出图成本日志 · ${videoId}\n\n每次真实调用出图模型记一行。缓存命中不计($0)。\n\n`);
    appendFileSync(costLog, `- ${new Date().toLocaleString("sv-SE")} | ${beatId} | ${model} | $${usd.toFixed(2)}\n`);
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "chinese-drama",
      motionPresets: motion.presets,
      source: { region: settings.source?.region ?? { top: 120, height: 720 }, focusY: settings.source?.focusY ?? 0.5 },
      subtitle: settings.subtitle ?? { top: 960, height: 360 },
      ...(settings.audio?.bgm?.src && { bgm: settings.audio.bgm }),
      ...(settings.fonts && { fonts: settings.fonts }),
      captions: Object.fromEntries(Object.entries(settings.captions).filter(([k]) => !k.startsWith("_"))),
    },
    beats: [],
  };

  const sceneImages = {}; // sceneId -> rel image path
  const voices = settings.audio.voices || {};

  for (let bi = 0; bi < script.beats.length; bi++) {
    const beat = script.beats[bi];
    console.log(`== ${beat.id} [${beat.sceneId}] ${beat.voice}: ${beat.captions.zh || beat.captions.local || beat.captions.vi || ""}`);

    // 配音(缓存,带字级时间戳)。★混合语言:vi_*音色合成越南语行(旁白/内心独白),zh_*音色合成中文行(人物对白)。
    const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
    const voiceType = voices[beat.voice] || voices[settings.audio.defaultVoice];
    const isVi = /^vi_/.test(voiceType);
    const viText = beat.captions.local ?? beat.captions.vi ?? "";
    const ttsText = isVi ? viText : (beat.ttsZh ?? beat.captions.zh ?? "");
    if (!ttsText.trim()) throw new Error(`${beat.id}: 无可合成文本(${isVi ? "越南语行 captions.local" : "中文行 captions.zh"}为空)`);
    const speed = isVi ? (settings.audio.viSpeed ?? 1.0) : (settings.audio.speed ?? 1.0);
    if (!isVi && beat.ttsZh && hanCount(beat.ttsZh) !== hanCount(beat.captions.zh)) {
      throw new Error(`${beat.id}: ttsZh 汉字数(${hanCount(beat.ttsZh)})≠captions.zh(${hanCount(beat.captions.zh)}),逐字跳字会错位`);
    }
    const audio = await synth(ttsText, audioPath, { voice: voiceType, speed });
    // 卡拉OK时间戳:中文对白用火山真字级时间戳;越南语拍(旁白/独白)的中文行用均匀铺字(跟拍时长扫过)。
    const charTimings = isVi ? evenCharTimings(beat.captions.zh, audio.ms) : audio.charTimings;
    const viWordTimings = evenWordTimings(viText, audio.ms);
    console.log(`  audio: ${audio.cached ? "cached" : "synth"} ${audio.ms}ms  timings=${charTimings ? charTimings.length + "字" + (isVi ? "(均匀)" : "") : "无"}`);

    // 出图：场景首拍出一张,同 sceneId 后续拍复用。
    const sceneId = beat.sceneId || beat.id;
    if (!sceneImages[sceneId]) {
      if (!beat.shots?.length) throw new Error(`场景 ${sceneId} 首拍 ${beat.id} 缺 shots(每场景首拍必须带出图描述)`);
      const shot = beat.shots[0];
      const charIds = beat.hasMainCharacter ? (beat.characters || []) : [];
      const model = shot.model || (charIds.length >= 2 ? "nano-pro" : "flux");
      const refPaths = charIds.length === 0
        ? [join(ROOT, settings.image.styleAnchor)]
        : charIds.map((id) => chars[id]?.refPath).filter(Boolean);
      const prompt = buildPrompt({ shot, charIds, chars, prompts });
      const imgPath = ensure(join(dir, "images", `${sceneId}.png`));
      const img = await genImage({ outPath: imgPath, prompt, refPaths, settings, model });
      console.log(`  image: ${img.cached ? "cached" : "gen"} [${img.model ?? "?"}] ${imgPath}`);
      if (!img.cached) {
        const usd = MODEL_USD[img.model] ?? 0;
        logCost({ beatId: `${beat.id}(${sceneId})`, model: img.model ?? "?", usd });
        console.log(`  cost: +$${usd.toFixed(2)}`);
      }
      sceneImages[sceneId] = rel("images", `${sceneId}.png`);
    }

    // 拍尾留白：场景末拍换气久一点。
    const isSceneEnd = script.beats[bi + 1]?.sceneId !== beat.sceneId;
    const tail = isSceneEnd ? (settings.audio.sceneTailPaddingMs ?? 320) : (settings.audio.tailPaddingMs ?? 160);

    manifest.beats.push({
      id: beat.id,
      sceneId,
      image: sceneImages[sceneId],
      audio: rel("audio", `${beat.id}.mp3`),
      durationMs: audio.ms + tail,
      motion: pickMotion(beat, motion),
      ...(isVi && { narration: true }),
      ...(beat.inner && { inner: true }),
      ...(beat.transitionIn && { transitionIn: beat.transitionIn }),
      ...(beat.effects?.length && { effects: beat.effects }),
      ...(charTimings && { charTimings }),
      ...(viWordTimings && { viWordTimings }),
      captions: { pinyin: beat.captions.pinyin ?? "", zh: beat.captions.zh ?? "", local: beat.captions.local ?? beat.captions.vi ?? "" },
    });
  }

  const totalMs = manifest.beats.reduce((a, b) => a + b.durationMs, 0);
  console.log(`\n情景剧完成: ${manifest.beats.length} 拍, ${(totalMs / 1000).toFixed(1)}s`);
  return manifest;
}
