// 构建单条视频：script.json → 配音 + 出图 + manifest.json（全程缓存，改一句不重烧整片）。
// 用法: node scripts/build.mjs <videoId>
// 读 public/videos/<shard>/<id>/script.json（分镜/翻译由会话生成），产出同目录 manifest.json。
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadSettings, loadMotion, loadCharacters, loadPrompts, buildImagePrompt, buildFluxPrompt, buildScenePrompt, buildStoryPrompt, pickMotion } from "./lib/config.mjs";
import { synth } from "./tts.mjs";
import { genImage, MODEL_USD } from "./gen-image.mjs";
import sharp from "sharp";

// 量出白底图上「非白内容」的纵向高度占比（人物身高占画面比例）。
// 用于尺寸归一化：把每个人物缩到统一目标占比，所有拍人物一样大。白底让非白检测很干净。
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

const videoId = process.argv[2];
if (!videoId) throw new Error("用法: node scripts/build.mjs <videoId>");

const ROOT = process.cwd();
const catalog = JSON.parse(readFileSync(join(ROOT, "catalog.json"), "utf8"));
const entry = catalog.videos.find((v) => v.id === videoId);
if (!entry) throw new Error(`catalog.json 里找不到 videoId=${videoId}`);
const shard = entry.shard;

const dir = join(ROOT, "public", "videos", shard, videoId);
const rel = (...p) => `videos/${shard}/${videoId}/${p.join("/")}`;
const ensure = (p) => { mkdirSync(dirname(p), { recursive: true }); return p; };

// 出图成本日志（用户 2026-07-05 锁定）：每次「真实调用」出图模型追加一行到 <id>/cost/coast.md。
// 记：调用时间(精确到秒) | 拍 | 模型 | 花费(USD)。缓存命中不算调用、不记（$0）。
const costLog = join(dir, "cost", "coast.md");
function logImageCost({ beatId, model, usd }) {
  ensure(costLog);
  if (!existsSync(costLog)) {
    writeFileSync(costLog, `# 出图成本日志 · ${videoId}\n\n每次**真实调用**出图模型记一行：\`时间 | 拍 | 模型 | 花费\`。缓存命中不计（$0）。\n\n`);
  }
  const ts = new Date().toLocaleString("sv-SE"); // YYYY-MM-DD HH:MM:SS（到秒）
  appendFileSync(costLog, `- ${ts} | ${beatId} | ${model} | $${usd.toFixed(2)}\n`);
}

const settings = loadSettings();
const motion = loadMotion();
const characters = loadCharacters();
const prompts = loadPrompts();

const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));

// ★★ 省钱铁律（用户 2026-07-05）：一条视频最多允许 1 个多角色拍 → 最多 1 次 nano-banana-pro($0.15)。
// 其余全部走 flux($0.04)。出图前先校验，避免烧钱后才发现。多算的多角色拍要改成单人/空镜。
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
    // ★ v2 版式（2026-07-07）：3:4 画布，上半 3:2 横图、下半单行三层字幕+逐字跳字。
    // 渲染层按此字段分流；旧视频 manifest 无此字段走旧 9:16 版式，互不影响。
    layout: "v2-3x4",
    bandTopRatio: settings.captions.bandTopRatio,
    motionPresets: motion.presets,
    pageTurn: motion.pageTurn,
    ...(settings.audio.bgm?.src && { bgm: settings.audio.bgm }), // 全片固定古风 BGM，渲染层低音量循环
    ...(settings.fonts && { fonts: settings.fonts }), // 字幕字体配置化：换字体只改 config，不改代码
    // 字幕排版参数全量透传（字号/间距/颜色，见 config/settings.json.captions），渲染层带默认兜底
    captions: Object.fromEntries(
      Object.entries(settings.captions).filter(([k]) => !k.startsWith("_")),
    ),
  },
  beats: [],
};

// ★ 场景共图（2026-07-07，plan/08）：同 sceneId 连续拍共用一张图，出图数 = 场景数。
// 每个场景取第一个带 shots 的拍出图；图路径 images/<sceneId>.png。
const sceneImages = {}; // sceneId -> { image(rel), imgScale }

for (let bi = 0; bi < script.beats.length; bi++) {
  const beat = script.beats[bi];
  console.log(`== ${beat.id} [${beat.sceneId}]: ${beat.captions.zh}`);

  // 配音（缓存）：一拍=一句短句单独合成；带字级时间戳（with_timestamp，见 tts.mjs）
  const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
  const voices = settings.audio.voices || {};
  const voiceType = voices[beat.voice] || voices[settings.audio.defaultVoice];
  // 语速按内容类型分流：朗读古文 0.9，其余讲解/场景/收尾 1.1；时长驱动画面节奏自动跟随
  const speed = beat.role === "read-quote"
    ? (settings.audio.readQuoteSpeed ?? 1.0)
    : (settings.audio.speed ?? 1.0);
  // 多音字发音引导（plan/04）：ttsZh 只供合成不上屏，汉字数必须与 captions.zh 一致（时间戳按序号对齐）
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
    if (!beat.shots?.length) throw new Error(`场景 ${sceneId} 的第一个拍 ${beat.id} 缺 shots（每个场景第一拍必须带出图描述）`);
    const shot = beat.shots[0];
    const charIds = beat.hasMainCharacter ? beat.characters : [];
    let refPaths, prompt;
    if (beat.refMode === "style") {
      // ★ 古代典故故事重演（2026-07-07，plan/10 4.10）：喂风格锚图只借画风，
      // 人物是典故里的古人、按 shot 描述画（不用定妆、不保 IP），文案说几个人就画几个人。
      refPaths = [join(ROOT, settings.image.styleAnchor)];
      prompt = buildStoryPrompt({ shotContent: shot.content, prompts });
      console.log(`  ref: 典故重演→风格锚图（古人按描述画）`);
    } else if (charIds.length === 0) {
      // 空镜(无人物)：喂风格锚图，走 flux/kontext 只借画风、不要人（严禁 flux/dev 文生图漂移）
      refPaths = [join(ROOT, settings.image.styleAnchor)];
      prompt = buildScenePrompt({ shotContent: shot.content, prompts });
    } else {
      // 参考图路由：朗读古文拍(role=read-quote)喂「戴书生帽+汉服」样板，其它拍喂日常定妆图
      const useHat = beat.role === "read-quote";
      refPaths = charIds
        .map((id) => (useHat && characters[id]?.refHatPath) ? characters[id].refHatPath : characters[id]?.refPath)
        .filter(Boolean);
      if (useHat) console.log(`  ref: 朗读拍→喂带帽样板 (${charIds.join(",")})`);
      // 单角色走 flux 精简模板；beat.canonOverride 可整段替换角色 canon（该拍换装，如长袍）
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

    // ★ 尺寸归一化（plan/10 4.6）：含人物场景量人物身高占比缩到统一目标；空镜不缩。3:2 横图同理。
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

  // 特效：透传 beat 自带 effects（固定 4 特效、≤2/片、按需，见 plan/11）
  const ALLOWED_FX = new Set(["comicPops", "emojiRain", "scorePop", "zoomBlur"]);
  const effects = (beat.effects || []).filter((e) => ALLOWED_FX.has(e.type));
  if (effects.length) console.log(`  effects: ${effects.map((e) => e.type).join(", ")}`);

  // ★ 拍尾留白两档（2026-07-07，plan/04）：场景末拍 280ms（换画面前换气），同场景内 120ms
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

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 回写总账状态
entry.beats = manifest.beats.length;
entry.status = "built";
writeFileSync(join(ROOT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

const totalMs = manifest.beats.reduce((a, b) => a + b.durationMs, 0);
console.log(`\nDONE ${videoId}: ${manifest.beats.length} beats, ${totalMs}ms → ${join(dir, "manifest.json")}`);
