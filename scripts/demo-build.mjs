// 一键构建 Demo：合成配音 + 按角色参考生成场景图 + 产出 manifest
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { beats, CHAR_REF } from "./demo-data.mjs";
import { synth, durationMs } from "./tts.mjs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const dataUri = (p) =>
  "data:image/png;base64," + readFileSync(p).toString("base64");

const SCENE_STYLE = `Art style (keep EXACTLY consistent across all images): bold rough hand-drawn black crayon outlines with varying thickness; LOOSE crayon coloring where each colored area is a soft fill that does NOT reach the outline, leaving clear white around the edges (NEVER a solid flat fill); brown colored hair (not flat black); very simple minimal shapes, few details, no clothing seams. Background: mostly plain white / very light, with only a few minimal simple props to suggest the place. KEEP THE SAME CHARACTERS FROM THE REFERENCE IMAGES IDENTICAL — same faces, hairstyles, clothes, colors and body shapes. Tall vertical 9:16 portrait composition; place the characters in the UPPER TWO-THIRDS and keep the LOWER THIRD empty and clear for subtitles. No text, no letters, no numbers, no logo, no watermark.`;

async function genImage(beat) {
  const out = `public/videos/demo/images/${beat.id}.png`;
  if (existsSync(out)) {
    console.log(`  image: ${out} (cached)`);
    return out;
  }
  const refs = beat.chars.map((c) => dataUri(CHAR_REF[c]));
  const prompt = `Scene: ${beat.scene}.\n\n${SCENE_STYLE}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
      method: "POST",
      headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_urls: refs,
        num_images: 1,
        output_format: "png",
        aspect_ratio: "9:16",
      }),
    });
    const data = await res.json();
    const url = data?.images?.[0]?.url;
    if (!url) {
      console.log(`  ${beat.id} image gen failed, retry`, JSON.stringify(data).slice(0, 150));
      continue;
    }
    try {
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      writeFileSync(out, buf);
      return out;
    } catch (e) {
      console.log(`  ${beat.id} download failed, retry`, e.message);
    }
  }
  throw new Error(`image gen permanently failed for ${beat.id}`);
}

const manifest = { meta: { fps: 30, width: 1080, height: 1920 }, beats: [] };

for (const beat of beats) {
  console.log(`== ${beat.id}: ${beat.zh}`);
  // 配音（已存在则复用）
  const mp3 = `public/videos/demo/audio/${beat.id}.mp3`;
  let audio;
  if (existsSync(mp3)) {
    audio = { engine: "cached", path: mp3, ms: durationMs(mp3) };
  } else {
    audio = await synth(beat.zh, `public/videos/demo/audio/${beat.id}`);
  }
  console.log(`  audio: ${audio.engine} ${audio.ms}ms`);
  // 场景图
  const imgPath = await genImage(beat);
  console.log(`  image: ${imgPath}`);

  manifest.beats.push({
    id: beat.id,
    image: imgPath.replace(/^public\//, ""),
    audio: audio.path.replace(/^public\//, ""),
    durationMs: audio.ms + 400, // 尾部留白
    captions: { pinyin: beat.pinyin, zh: beat.zh, vi: beat.vi },
  });
}

writeFileSync("public/videos/demo/manifest.json", JSON.stringify(manifest, null, 2));
writeFileSync("src/demo-manifest.json", JSON.stringify(manifest, null, 2));
console.log("\nDONE. total beats:", manifest.beats.length,
  "total ms:", manifest.beats.reduce((a, b) => a + b.durationMs, 0));
