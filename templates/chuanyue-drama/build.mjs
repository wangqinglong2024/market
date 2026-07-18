// 模板『凰谋·现代穿越古代竖屏短剧(越南受众·图文+动态视频混搭)』构建流水线。
// 由通用编排器 scripts/build.mjs 调用 build()，返回 manifest 对象。
// 生产：script.json → 每拍配音(火山TTS,旁白vi/角色zh,带字级时间戳) + 每场景关键帧(nano-banana-pro/edit,喂定妆图,3:2)
//        + 动态拍(type:video)用关键帧走 kling I2V(关原声;喂图裁16:9→收片裁回3:2) → manifest。
// 版式 layout="chinese-drama"：上媒体区(图或视频)1080x720 + 下三行字幕(拼音/中文/越南语)逐字卡拉OK。
// 全程按 hash 缓存；预算硬卡 ≤$2/集。花钱铁律：fal 出问题不自动重试(见 /base/04)。
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";

const ID = "chuanyue-drama";
const isHan = (c) => /[㐀-鿿]/.test(c);
const hanCount = (s) => Array.from(s || "").filter(isHan).length;
function evenCharTimings(zh, ms) {
  const hans = Array.from(zh || "").filter(isHan);
  if (!hans.length || !ms) return null;
  const span = ms / hans.length;
  return hans.map((ch, i) => ({ ch, startMs: Math.round(i * span), endMs: Math.round((i + 1) * span) }));
}
function evenWordTimings(text, ms) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length || !ms) return null;
  const span = ms / words.length;
  return words.map((w, i) => ({ w, startMs: Math.round(i * span), endMs: Math.round((i + 1) * span) }));
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const readText = (p) => readFileSync(p, "utf8");
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();
function tpl(ROOT, ...p) { return join(ROOT, "templates", ID, ...p); }

function loadChars(ROOT) {
  const reg = readJson(tpl(ROOT, "characters", "_registry.json"));
  const map = {};
  for (const c of reg.characters) {
    map[c.id] = {
      id: c.id, name: c.name, voice: c.voice,   // ★voice=该角色音色单一事实源(registry,与脸同处)
      refPath: tpl(ROOT, "characters", c.id, c.ref),
      canon: stripComments(readText(tpl(ROOT, "characters", c.id, c.canonical))),
    };
  }
  return map;
}
function loadPrompts(ROOT) {
  const raw = (f) => readText(tpl(ROOT, "prompts", f));
  return {
    style: stripComments(raw("style.md")),
    charTpl: stripComments(raw("image-char.tpl.md")),
    sceneTpl: stripComments(raw("image-scene.tpl.md")),
    multiTpl: stripComments(raw("image-multi.tpl.md")),
    videoTpl: stripComments(raw("video.tpl.md")),
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
function buildVideoPrompt({ v, prompts }) {
  return prompts.videoTpl.replace("{motion}", v.motion || "").replace("{camera}", v.camera || "");
}

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const motion = readJson(tpl(ROOT, "motion.json"));
  const chars = loadChars(ROOT);
  const prompts = loadPrompts(ROOT);
  const budget = settings.budget || {};
  const maxUsd = budget.maxUsdPerEpisode ?? 2.0;

  // 省钱铁律：一条视频最多 1 个多角色(nano-pro)拍。
  const nanoBeats = script.beats.filter((b) =>
    (b.hasMainCharacter ? (b.characters || []).length : 0) >= 2 ||
    (b.shots || []).some((s) => s.model === "nano-pro"));
  if (nanoBeats.length > 1) {
    throw new Error(`每条视频最多 1 个多角色(nano-pro)拍。当前 ${nanoBeats.length} 个: ${nanoBeats.map((b) => b.id).join(", ")}。改单人反打/空镜。`);
  }

  const costLog = join(dir, "cost", "coast.md");
  let spentUsd = 0;
  function logCost({ beatId, kind, usd }) {
    ensure(costLog);
    if (!existsSync(costLog)) writeFileSync(costLog, `# 成本日志 · ${videoId}\n\n每次真实付费调用记一行(缓存命中不计)。预算上限 $${maxUsd}。\n\n`);
    appendFileSync(costLog, `- ${new Date().toLocaleString("sv-SE")} | ${beatId} | ${kind} | $${usd.toFixed(3)}\n`);
    spentUsd += usd;
    if (spentUsd > maxUsd + 1e-6) throw new Error(`预算超支：已花 $${spentUsd.toFixed(2)} > 上限 $${maxUsd}。停止(花钱铁律)。`);
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "chuanyue-drama",
      motionPresets: motion.presets,
      source: { region: settings.source?.region ?? { top: 120, height: 720 }, focusY: settings.source?.focusY ?? 0.5 },
      subtitle: settings.subtitle ?? { top: 960, height: 360 },
      ...(settings.audio?.bgm?.src && { bgm: settings.audio.bgm }),
      ...(settings.fonts && { fonts: settings.fonts }),
      captions: Object.fromEntries(Object.entries(settings.captions).filter(([k]) => !k.startsWith("_"))),
    },
    beats: [],
  };

  const sceneImages = {};   // sceneId -> rel image path
  const beatScene = {};     // beatId -> sceneId (供 video.keyframeFrom 解析关键帧)
  // ★音色解析:template.json 非角色音色(narrator/mama) → registry 角色音色覆盖 → script.voices 本片覆盖(最高优先)。
  // script.voices 让「语言/旁白版本」成为一个模式:如纯中文版把 narrator 覆盖成中文悬疑解说音色,不动模板默认(越南版)。
  const voices = { ...(settings.audio.voices || {}) };
  for (const c of Object.values(chars)) if (c.voice) voices[c.id] = c.voice;
  Object.assign(voices, script.voices || {});

  // 确保某场景关键帧已生成，返回 { rel, abs }
  async function ensureKeyframe(beat) {
    const sceneId = beat.sceneId || beat.id;
    if (!sceneImages[sceneId]) {
      if (!beat.shots?.length) throw new Error(`场景 ${sceneId} 首拍 ${beat.id} 缺 shots(每场景首拍必须带出图描述)`);
      const shot = beat.shots[0];
      const charIds = beat.hasMainCharacter ? (beat.characters || []) : [];
      // ★参考图变体(用户 2026-07-18)：露腿场景喂 model-sheet-legs.png，现代闪回喂 model-sheet-modern.png，其余端庄版。
      const variant = shot.refVariant || "default";
      const variantFile = variant === "legs" ? "model-sheet-legs.png" : variant === "modern" ? "model-sheet-modern.png" : "model-sheet.png";
      const charRef = (id) => {
        const v = tpl(ROOT, "characters", id, variantFile);
        return existsSync(v) ? v : chars[id]?.refPath; // 变体缺失回落端庄版
      };
      // ★全部 nano-banana-pro(弃 flux)：空镜喂 styleAnchor 走 nano-edit；有角色喂定妆图走 nano-edit。
      const refPaths = charIds.length === 0
        ? [join(ROOT, settings.image.styleAnchor)]
        : charIds.map(charRef).filter(Boolean);
      // ★彻底弃用 flux(用户 2026-07-18:flux 效果差)。脚本里若残留 flux/flux-text 一律改走 banana。
      let model = shot.model || "nano-edit";
      if (model === "flux" || model === "flux-text") model = refPaths.length >= 2 ? "nano-pro" : "nano-edit";
      const prompt = buildPrompt({ shot, charIds, chars, prompts });
      const imgPath = ensure(join(dir, "images", `${sceneId}.png`));
      const img = await genImage({ outPath: imgPath, prompt, refPaths, settings, model });
      if (!img.cached) logCost({ beatId: `${beat.id}(${sceneId})`, kind: img.model ?? "nano-edit", usd: MODEL_USD[img.model] ?? 0 });
      console.log(`  keyframe: ${img.cached ? "cached" : "gen"} [${img.model ?? "?"}] ${sceneId}`);
      sceneImages[sceneId] = rel("images", `${sceneId}.png`);
    }
    return { rel: sceneImages[sceneId], abs: join(dir, "images", `${sceneId}.png`) };
  }

  for (let bi = 0; bi < script.beats.length; bi++) {
    const beat = script.beats[bi];
    const sceneId = beat.sceneId || beat.id;
    beatScene[beat.id] = sceneId;
    console.log(`== ${beat.id} [${sceneId}] ${beat.type === "video" ? "▶video" : "▢still"} ${beat.voice}: ${beat.captions.zh || beat.captions.local || ""}`);

    // 配音(缓存,带字级时间戳)。旁白 vi_ 读 captions.local；角色 zh_ 读 captions.zh。
    const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
    const voiceType = voices[beat.voice] || voices[settings.audio.defaultVoice];
    const isVi = /^vi_/.test(voiceType);
    const viText = beat.captions.local ?? beat.captions.vi ?? "";
    const ttsText = isVi ? viText : (beat.ttsZh ?? beat.captions.zh ?? "");
    if (!ttsText.trim()) throw new Error(`${beat.id}: 无可合成文本(${isVi ? "captions.local" : "captions.zh"}为空)`);
    const speed = isVi ? (settings.audio.viSpeed ?? 1.0) : (settings.audio.speed ?? 1.0);
    if (!isVi && beat.ttsZh && hanCount(beat.ttsZh) !== hanCount(beat.captions.zh)) {
      throw new Error(`${beat.id}: ttsZh 汉字数(${hanCount(beat.ttsZh)})≠captions.zh(${hanCount(beat.captions.zh)}),逐字跳字会错位`);
    }
    const audio = await synth(ttsText, audioPath, { voice: voiceType, speed });
    // 中文逐字卡拉OK时间戳:优先用音色返回的真时间戳;有些音色(uranus/ICL克隆)不返回→按字均分兜底,保住卡拉OK效果。
    const charTimings = isVi ? evenCharTimings(beat.captions.zh, audio.ms) : (audio.charTimings ?? evenCharTimings(beat.captions.zh, audio.ms));
    const viWordTimings = evenWordTimings(viText, audio.ms);

    // 关键帧(图或视频输入图都要)
    const kf = await ensureKeyframe(beat);

    // 动态拍：用关键帧走 kling I2V(关原声)，产静音 mp4。
    let videoSrc = null;
    if (beat.type === "video") {
      const v = beat.video || {};
      // 关键帧来源：video.keyframeFrom 指向另一拍的场景图，否则用本拍关键帧。
      let kfAbs = kf.abs;
      if (v.keyframeFrom) {
        const fromScene = beatScene[v.keyframeFrom];
        if (!fromScene || !sceneImages[fromScene]) throw new Error(`${beat.id}: video.keyframeFrom=${v.keyframeFrom} 的关键帧尚未生成(须排在其后)`);
        kfAbs = join(dir, "images", `${fromScene}.png`);
      }
      const { genVideo } = await import("../../scripts/gen-video.mjs"); // 惰性导入:纯图文测试不触发
      const clipPath = ensure(join(dir, "clips", `${beat.id}.mp4`));
      const motionPrompt = buildVideoPrompt({ v, prompts });
      const clip = await genVideo({
        outPath: clipPath, keyframePath: kfAbs, motionPrompt, camera: v.camera,
        durationSec: v.durationSec ?? settings.video?.defaultClipSeconds ?? 4,
        aspectRatio: settings.video?.aspectRatio ?? "16:9",   // 喂 kling 的比例
        finalAspect: settings.video?.finalAspect ?? null,      // ★收片后裁回的最终固定比例(3:2)
        negativePrompt: settings.video?.negativePrompt,
        settings,
      });
      if (!clip.cached) logCost({ beatId: `${beat.id}(${sceneId})`, kind: `kling ${clip.seconds}s`, usd: clip.usd });
      console.log(`  video: ${clip.cached ? "cached" : "gen"} ${clip.seconds}s ${beat.id}.mp4`);
      videoSrc = rel("clips", `${beat.id}.mp4`);
    }

    const isSceneEnd = script.beats[bi + 1]?.sceneId !== sceneId;
    const tail = isSceneEnd ? (settings.audio.sceneTailPaddingMs ?? 320) : (settings.audio.tailPaddingMs ?? 160);

    manifest.beats.push({
      id: beat.id,
      sceneId,
      image: kf.rel,                              // 图文拍画面 / 视频拍兜底静帧
      ...(videoSrc && { type: "video", videoSrc }), // 动态拍:渲染层静音播放 mp4,时长由音频驱动
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
  const vids = manifest.beats.filter((b) => b.type === "video").length;
  console.log(`\n凰谋 ${videoId} 完成: ${manifest.beats.length} 拍(${vids} 动态), ${(totalMs / 1000).toFixed(1)}s, 花费 ~$${spentUsd.toFixed(2)}/上限$${maxUsd}`);
  return manifest;
}
