// 构建单条视频：script.json → 配音 + 出图 + manifest.json（全程缓存，改一句不重烧整片）。
// 用法: node scripts/build.mjs <videoId>
// 读 public/videos/<shard>/<id>/script.json（分镜/翻译由会话生成），产出同目录 manifest.json。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadSettings, loadMotion, loadCharacters, loadPrompts, buildImagePrompt, buildFluxPrompt, buildScenePrompt, pickMotion } from "./lib/config.mjs";
import { synth } from "./tts.mjs";
import { genImage } from "./gen-image.mjs";

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

const settings = loadSettings();
const motion = loadMotion();
const characters = loadCharacters();
const prompts = loadPrompts();

const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));

const manifest = {
  meta: {
    ...settings.meta,
    bandTopRatio: settings.captions.bandTopRatio,
    motionPresets: motion.presets,
    pageTurn: motion.pageTurn,
    captions: {
      pinyinColor: settings.captions.pinyinColor,
      zhColor: settings.captions.zhColor,
      localColor: settings.captions.localColor,
      bgColor: settings.captions.bgColor,
    },
  },
  beats: [],
};

for (const beat of script.beats) {
  console.log(`== ${beat.id}: ${beat.captions.zh}`);

  // 配音（缓存）：按该拍 voice 角色映射到火山 voice_type（见 config/settings.json.voices）
  const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
  const voices = settings.audio.voices || {};
  const voiceType = voices[beat.voice] || voices[settings.audio.defaultVoice];
  const audio = await synth(beat.captions.zh, audioPath, { voice: voiceType });
  console.log(`  audio: ${audio.cached ? "cached" : "synth"} ${audio.ms}ms  [${beat.voice || settings.audio.defaultVoice}]`);

  // 出图：目前每 beat 取首个 shot 出一张（多 shot 交叉切换为后续增强）
  const shot = beat.shots[0];
  const charIds = beat.hasMainCharacter ? beat.characters : [];
  let refPaths, prompt;
  if (charIds.length === 0) {
    // 空镜(无人物)：喂风格锚图，走 flux/kontext 只借画风、不要人（严禁 flux/dev 文生图漂移）
    refPaths = [join(ROOT, settings.image.styleAnchor)];
    prompt = buildScenePrompt({ shotContent: shot.content, prompts });
  } else {
    refPaths = charIds.map((id) => characters[id]?.refPath).filter(Boolean);
    // 单角色走 flux 精简模板（长 prompt 含 negative 会触发 fal nsfw 黑图）
    prompt = refPaths.length === 1
      ? buildFluxPrompt({ shotContent: shot.content, charIds, prompts, characters })
      : buildImagePrompt({ shotContent: shot.content, charIds, prompts, characters });
  }
  const imgPath = ensure(join(dir, "images", `${beat.id}.png`));
  // shot.model 显式声明模型（flux/nano-pro），gen-image 会强制校验与参考图数一致
  const img = await genImage({ outPath: imgPath, prompt, refPaths, settings, model: shot.model });
  console.log(`  image: ${img.cached ? "cached" : "gen"} [${img.model ?? "?"}] ${imgPath}`);

  // 特效：直接透传 script.json 里 beat 自带的 effects（固定 4 特效、≤2/片、按需，见 plan/11）。
  // 只保留渲染层认识的 4 个 type，其它忽略。
  const ALLOWED_FX = new Set(["comicPops", "emojiRain", "scorePop", "zoomBlur"]);
  const effects = (beat.effects || []).filter((e) => ALLOWED_FX.has(e.type));
  if (effects.length) console.log(`  effects: ${effects.map((e) => e.type).join(", ")}`);

  manifest.beats.push({
    id: beat.id,
    image: rel("images", `${beat.id}.png`),
    audio: rel("audio", `${beat.id}.mp3`),
    durationMs: audio.ms + settings.audio.tailPaddingMs,
    motion: pickMotion(beat, motion),
    ...(beat.transitionIn && { transitionIn: beat.transitionIn }),
    ...(effects.length && { effects }),
    captions: { pinyin: beat.captions.pinyin, zh: beat.captions.zh, local: beat.captions.local },
  });
}

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 回写总账状态
entry.beats = manifest.beats.length;
entry.status = "built";
writeFileSync(join(ROOT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

const totalMs = manifest.beats.reduce((a, b) => a + b.durationMs, 0);
console.log(`\nDONE ${videoId}: ${manifest.beats.length} beats, ${totalMs}ms → ${join(dir, "manifest.json")}`);
