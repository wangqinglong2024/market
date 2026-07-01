// 实测 fal Recraft V3 矢量生成：看它返回 SVG 还是位图，存下来对比。
import { readFileSync, writeFileSync } from "node:fs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const prompt =
  "a cute chubby little boy, round face, rosy pink cheeks, small black dot eyes, messy short brown hair, wearing an all-yellow hoodie and matching yellow shorts, bare chubby legs, very round pudgy body, standing facing front, full body, centered, plain white background. Children's picture-book style: bold rough hand-drawn black crayon outline of varying thickness, loose watercolor coloring that leaves clear white gaps around the edges, flat simple shapes, brown hair, adorable and lively.";

const body = {
  prompt,
  style: "vector_illustration",
  image_size: { width: 800, height: 1100 },
};

console.log("calling fal-ai/recraft-v3 …");
const res = await fetch("https://fal.run/fal-ai/recraft-v3", {
  method: "POST",
  headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await res.json();
console.log("status", res.status);
console.log("keys:", Object.keys(data));
const img = data?.images?.[0];
console.log("image meta:", JSON.stringify(img && { url: img.url, content_type: img.content_type, ...(img.width ? { width: img.width, height: img.height } : {}) }, null, 2));
if (data?.error || (!img && res.status !== 200)) {
  console.log("raw:", JSON.stringify(data).slice(0, 500));
  process.exit(1);
}

if (img?.url) {
  const buf = Buffer.from(await (await fetch(img.url)).arrayBuffer());
  const isSvg = (img.content_type || "").includes("svg") || img.url.endsWith(".svg") || buf.slice(0, 200).toString().includes("<svg");
  const out = isSvg ? "config/characters/boy/recraft.svg" : "config/characters/boy/recraft.png";
  writeFileSync(out, buf);
  console.log(`saved -> ${out} (${(buf.length / 1024).toFixed(1)} KB, ${isSvg ? "SVG ✓" : "raster"})`);
}
