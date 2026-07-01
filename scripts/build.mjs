// 构建单条视频：script.json → 配音 + 出图 + manifest.json（全程缓存，改一句不重烧整片）。
// 用法: node scripts/build.mjs <videoId>
// 读 public/videos/<shard>/<id>/script.json（分镜/翻译由会话生成），产出同目录 manifest.json。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadSettings, loadMotion, loadCharacters, loadPrompts, buildImagePrompt, pickMotion } from "./lib/config.mjs";
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

  // 配音（缓存）
  const audioPath = ensure(join(dir, "audio", `${beat.id}.mp3`));
  const audio = await synth(beat.captions.zh, audioPath, { voice: undefined });
  console.log(`  audio: ${audio.cached ? "cached" : "synth"} ${audio.ms}ms`);

  // 出图：目前每 beat 取首个 shot 出一张（多 shot 交叉切换为后续增强）
  const shot = beat.shots[0];
  const charIds = beat.hasMainCharacter ? beat.characters : [];
  const refPaths = charIds.map((id) => characters[id]?.refPath).filter(Boolean);
  const prompt = buildImagePrompt({ shotContent: shot.content, charIds, prompts, characters });
  const imgPath = ensure(join(dir, "images", `${beat.id}.png`));
  const img = await genImage({ outPath: imgPath, prompt, refPaths, settings });
  console.log(`  image: ${img.cached ? "cached" : "gen"} ${imgPath}`);

  manifest.beats.push({
    id: beat.id,
    image: rel("images", `${beat.id}.png`),
    audio: rel("audio", `${beat.id}.mp3`),
    durationMs: audio.ms + settings.audio.tailPaddingMs,
    motion: pickMotion(beat, motion),
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
