// 模板『身份系·汉字解码(姓氏)』构建流水线。
// script.json.beats[] → 逐拍越南语配音(火山) + 悬念拍出图(fal flux+风格锚) → manifest。全程缓存。
// script beat 字段：{ id, role(hook|tease|suspense|reveal|cta), narration(朗读+底部字幕), display{...版式专属}, imagePrompt? }
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage } from "../../scripts/gen-image.mjs";
import sharp from "sharp";

const ID = "shenfen-jiema";

// 风格锚：暗调琥珀渐变(只借光调)。首次构建时程序生成，不占 fal 额度。
async function ensureStyleAnchor(path) {
  if (existsSync(path)) return path;
  const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="42%" r="75%">
        <stop offset="0%" stop-color="#2a1a08"/>
        <stop offset="45%" stop-color="#140d05"/>
        <stop offset="100%" stop-color="#040404"/>
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path);
  return path;
}

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const a = settings.audio;
  const anchor = await ensureStyleAnchor(join(ROOT, settings.image.styleAnchor));

  const beats = [];
  for (const b of script.beats) {
    const audioPath = ensure(join(dir, "audio", `${b.id}.mp3`));
    const tts = await synth(b.narration, audioPath, { voice: a.viVoice, speed: a.viSpeed });
    console.log(`  🎙 ${b.id}: ${tts.ms}ms${tts.cached ? " (cache)" : ""}`);

    let image;
    if (b.imagePrompt) {
      const imgPath = ensure(join(dir, "images", `${b.id}.png`));
      const r = await genImage({ outPath: imgPath, prompt: b.imagePrompt, refPaths: [anchor], settings, model: "flux" });
      console.log(`  🖼 ${b.id}: ${r.cached ? "(cache)" : "flux $0.04"}`);
      image = rel("images", `${b.id}.png`);
    }

    beats.push({
      id: b.id,
      role: b.role,
      durationMs: (a.leadMs ?? 180) + tts.ms + (a.tailMs?.[b.role] ?? 300),
      audio: rel("audio", `${b.id}.mp3`),
      audioDelayMs: a.leadMs ?? 180,
      transitionIn: "fade",
      ...(image ? { image } : {}),
      vi: b.sub ?? b.narration,
      display: b.display ?? {},
    });
  }

  return {
    meta: {
      fps: settings.meta.fps,
      width: settings.meta.width,
      height: settings.meta.height,
      layout: settings.layout,
      transitionFrames: 7,
      captions: settings.captions,
      fonts: settings.fonts,
      ...(a.bgm ? { bgm: a.bgm } : {}),
    },
    beats,
  };
}
