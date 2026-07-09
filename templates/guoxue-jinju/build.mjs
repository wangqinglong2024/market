// 模板『国学金句·中华经典文化短视频』的构建流水线。
// 由通用编排器 scripts/build.mjs 调用 build()，返回 manifest 对象(编排器负责落盘+更新总账)。
// 流水线：script.json → 配音(火山) + 出图(fal，按角色数路由) + 尺寸归一化 → manifest。全程缓存，改一句不重烧整片。
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import {
  loadMotion, loadCharacters, loadPrompts,
  buildImagePrompt, buildFluxPrompt, buildScenePrompt, buildStoryPrompt, pickMotion,
} from "../../scripts/lib/config.mjs";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";
import sharp from "sharp";

const ID = "guoxue-jinju";

// 量出白底图上「非白内容」的纵向高度占比(人物身高占画面比例)，用于尺寸归一化。
async function contentHeightFrac(path, { thresh = 244, minPx = 10 } = {}) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minY = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    let cnt = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i] < thresh || data[i + 1] < thresh || data[i + 2] < thresh) { if (++cnt >= minPx) break; }
    }
    if (cnt >= minPx) { if (minY < 0) minY = y; maxY = y; }
  }
  if (minY < 0) return 1; // 全白，兜底不缩
  return (maxY - minY + 1) / height;
}

// 编排器注入 { videoId, dir, ROOT, settings(全局+模板合并), rel, ensure }；返回 manifest 对象。
export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const motion = loadMotion(ID);
  const characters = loadCharacters(ID);
  const prompts = loadPrompts(ID);
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));

  // 出图成本日志(用户 2026-07-05 锁定)：每次「真实调用」出图模型追加一行到 <id>/cost/coast.md。缓存命中不记($0)。
  const costLog = join(dir, "cost", "coast.md");
  function logImageCost({ beatId, model, usd }) {
    ensure(costLog);
    if (!existsSync(costLog)) {
      writeFileSync(costLog, `# 出图成本日志 · ${videoId}\n\n每次**真实调用**出图模型记一行：\`时间 | 拍 | 模型 | 花费\`。缓存命中不计($0)。\n\n`);
    }
    const ts = new Date().toLocaleString("sv-SE"); // YYYY-MM-DD HH:MM:SS
    appendFileSync(costLog, `- ${ts} | ${beatId} | ${model} | $${usd.toFixed(2)}\n`);
  }

  // ★★ 省钱铁律(用户 2026-07-05)：一条视频最多允许 1 个多角色拍 → 最多 1 次 nano-banana-pro($0.15)。
  const nanoBeats = script.beats.filter((b) => (b.shots || []).some((s) => s.model === "nano-pro"));
  if (nanoBeats.length > 1) {
    throw new Error(
      `每条视频最多允许 1 个多角色(nano-pro)拍、只准调 1 次 banana(省钱铁律，用户 2026-07-05)。` +
      `当前有 ${nanoBeats.length} 个：${nanoBeats.map((b) => b.id).join(", ")}。请把多余的多角色拍改成单人/空镜(flux $0.04)。`
    );
  }

  const manifest = {
    meta: {
      ...settings.meta,
      // ★ v2 版式(2026-07-07)：3:4 画布，上半 3:2 横图、下半单行三层字幕+逐字跳字。渲染层按此字段分流。
      layout: "v2-3x4",
      bandTopRatio: settings.captions.bandTopRatio,
      motionPresets: motion.presets,
      pageTurn: motion.pageTurn,
      ...(settings.audio.bgm?.src && { bgm: settings.audio.bgm }),
      ...(settings.fonts && { fonts: settings.fonts }),
      captions: Object.fromEntries(
        Object.entries(settings.captions).filter(([k]) => !k.startsWith("_")),
      ),
    },
    beats: [],
  };

  // ★ 场景共图(2026-07-07)：同 sceneId 连续拍共用一张图，出图数 = 场景数。图路径 images/<sceneId>.png。
  const sceneImages = {}; // sceneId -> { image(rel), imgScale }

  for (let bi = 0; bi < script.beats.length; bi++) {
    const beat = script.beats[bi];
    console.log(`== ${beat.id} [${beat.sceneId}]: ${beat.captions.zh}`);

    // 配音(缓存)：一拍=一句短句单独合成；带字级时间戳
    const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
    const voices = settings.audio.voices || {};
    const voiceType = voices[beat.voice] || voices[settings.audio.defaultVoice];
    // 语速按内容类型分流：朗读古文 0.9，其余讲解/场景/收尾 1.1
    const speed = beat.role === "read-quote"
      ? (settings.audio.readQuoteSpeed ?? 1.0)
      : (settings.audio.speed ?? 1.0);
    // 多音字发音引导：ttsZh 只供合成不上屏，汉字数必须与 captions.zh 一致(时间戳按序号对齐)
    if (beat.ttsZh) {
      const hanCount = (s) => Array.from(s).filter((c) => /[㐀-鿿]/.test(c)).length;
      if (hanCount(beat.ttsZh) !== hanCount(beat.captions.zh)) {
        throw new Error(`${beat.id}: ttsZh 汉字数(${hanCount(beat.ttsZh)})与 captions.zh(${hanCount(beat.captions.zh)})不一致，逐字跳字会错位`);
      }
    }
    const audio = await synth(beat.ttsZh ?? beat.captions.zh, audioPath, { voice: voiceType, speed });
    console.log(`  audio: ${audio.cached ? "cached" : "synth"} ${audio.ms}ms  timings=${audio.charTimings ? audio.charTimings.length + "字" : "无"}  speed=${speed}`);

    // 出图：该场景首次出现时出一张，后续同场景拍直接复用
    const sceneId = beat.sceneId || beat.id;
    if (!sceneImages[sceneId]) {
      if (!beat.shots?.length) throw new Error(`场景 ${sceneId} 的第一个拍 ${beat.id} 缺 shots(每个场景第一拍必须带出图描述)`);
      const shot = beat.shots[0];
      const charIds = beat.hasMainCharacter ? beat.characters : [];
      let refPaths, prompt;
      if (beat.refMode === "style") {
        // ★ 古代典故故事重演：喂风格锚图只借画风，人物是典故里的古人、按 shot 描述画(不用定妆、不保 IP)。
        refPaths = [join(ROOT, settings.image.styleAnchor)];
        prompt = buildStoryPrompt({ shotContent: shot.content, prompts });
        console.log(`  ref: 典故重演→风格锚图(古人按描述画)`);
      } else if (charIds.length === 0) {
        // 空镜(无人物)：喂风格锚图，走 flux/kontext 只借画风、不要人
        refPaths = [join(ROOT, settings.image.styleAnchor)];
        prompt = buildScenePrompt({ shotContent: shot.content, prompts });
      } else {
        // 参考图路由：朗读古文拍(role=read-quote)喂「戴书生帽+汉服」样板，其它拍喂日常定妆图
        const useHat = beat.role === "read-quote";
        refPaths = charIds
          .map((id) => (useHat && characters[id]?.refHatPath) ? characters[id].refHatPath : characters[id]?.refPath)
          .filter(Boolean);
        if (useHat) console.log(`  ref: 朗读拍→喂带帽样板 (${charIds.join(",")})`);
        // 单角色走 flux 精简模板；beat.canonOverride 可整段替换角色 canon(该拍换装)
        prompt = refPaths.length === 1
          ? buildFluxPrompt({ shotContent: shot.content, charIds, prompts, characters, useHat, canonOverride: beat.canonOverride })
          : buildImagePrompt({ shotContent: shot.content, charIds, prompts, characters });
      }
      const imgPath = ensure(join(dir, "images", `${sceneId}.png`));
      const img = await genImage({ outPath: imgPath, prompt, refPaths, settings, model: shot.model });
      console.log(`  image: ${img.cached ? "cached" : "gen"} [${img.model ?? "?"}] ${imgPath}`);
      if (!img.cached) {
        const usd = MODEL_USD[img.model] ?? 0;
        logImageCost({ beatId: `${beat.id}(${sceneId})`, model: img.model ?? "?", usd });
        console.log(`  cost: +$${usd.toFixed(2)} → ${rel("cost", "coast.md")}`);
      }

      // ★ 尺寸归一化：含人物场景量人物身高占比缩到统一目标；空镜不缩。
      let imgScale = 1;
      if (charIds.length >= 1) {
        const target = settings.image.charTargetHeight ?? 0.66;
        const frac = await contentHeightFrac(imgPath);
        imgScale = Math.max(0.3, Math.min(1, target / frac));
        console.log(`  size: 人物高占比 ${(frac * 100).toFixed(0)}% → 缩到 ${(target * 100).toFixed(0)}% (scale ${imgScale.toFixed(3)})`);
      }
      sceneImages[sceneId] = { image: rel("images", `${sceneId}.png`), imgScale };
    }
    const sceneImg = sceneImages[sceneId];

    // 特效：透传 beat 自带 effects(固定 4 特效、≤2/片、按需)
    const ALLOWED_FX = new Set(["comicPops", "emojiRain", "scorePop", "zoomBlur"]);
    const effects = (beat.effects || []).filter((e) => ALLOWED_FX.has(e.type));
    if (effects.length) console.log(`  effects: ${effects.map((e) => e.type).join(", ")}`);

    // ★ 拍尾留白两档：场景末拍 280ms(换画面前换气)，同场景内 120ms
    const nextScene = script.beats[bi + 1]?.sceneId;
    const isSceneEnd = nextScene !== beat.sceneId;
    const tail = isSceneEnd
      ? (settings.audio.sceneTailPaddingMs ?? 280)
      : (settings.audio.tailPaddingMs ?? 120);

    manifest.beats.push({
      id: beat.id,
      sceneId,
      image: sceneImg.image,
      audio: rel("audio", `${beat.id}.mp3`),
      durationMs: audio.ms + tail,
      motion: pickMotion(beat, motion),
      ...(beat.transitionIn && { transitionIn: beat.transitionIn }),
      ...(effects.length && { effects }),
      ...(sceneImg.imgScale !== 1 && { imgScale: sceneImg.imgScale }),
      ...(audio.charTimings && { charTimings: audio.charTimings }),
      captions: {
        pinyin: beat.captions.pinyin,
        zh: beat.captions.zh,
        local: beat.captions.local,
      },
    });
  }

  return manifest;
}
