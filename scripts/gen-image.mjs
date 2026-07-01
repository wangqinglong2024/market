// 出图：fal.ai nano-banana。含主角色→参考条件生成(/edit)；无主角色→文生图。
// prompt 由 config/prompts 模板确定性拼装（见 lib/config.mjs）。命中缓存则跳过。
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

// { outPath, prompt, refPaths[], settings } -> { path, cached }
export async function genImage({ outPath, prompt, refPaths = [], settings }) {
  if (existsSync(outPath)) return { path: outPath, cached: true };

  const hasRefs = refPaths.length > 0;
  const model = hasRefs ? settings.image.model : "fal-ai/nano-banana"; // edit vs text2img
  const payload = {
    prompt,
    num_images: 1,
    output_format: "png",
    aspect_ratio: settings.image.aspectRatio,
  };
  if (hasRefs) payload.image_urls = refPaths.map(dataUri);

  const maxRetries = settings.image.maxRetries ?? 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const url = data?.images?.[0]?.url;
    if (!url) {
      console.log(`  image gen failed (try ${attempt + 1})`, JSON.stringify(data).slice(0, 150));
      continue;
    }
    try {
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      writeFileSync(outPath, buf);
      return { path: outPath, cached: false };
    } catch (e) {
      console.log(`  download failed (try ${attempt + 1})`, e.message);
    }
  }
  throw new Error(`image gen permanently failed: ${outPath}`);
}
