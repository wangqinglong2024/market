// 只换色：保持原图完全不变，仅改指定部位颜色
// 用法: node scripts/_recolor.mjs <输入图> "<recolor指令>" <输出图>
import { readFileSync, writeFileSync } from "node:fs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const dataUri = (p) =>
  "data:image/png;base64," + readFileSync(p).toString("base64");

const inPath = process.argv[2];
const instruction = process.argv[3];
const outPath = process.argv[4];

const prompt = `Keep this exact illustration COMPLETELY IDENTICAL — same character, same pose, same body shape, same face, same hair, same line work, same white background, and the same loose crayon coloring with white left around the edges. Do NOT redraw, reshape or move anything. ${instruction} Change ONLY that color; leave every other thing exactly as it is.`;

const res = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
  method: "POST",
  headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt,
    image_urls: [dataUri(inPath)],
    num_images: 1,
    output_format: "png",
  }),
});
const data = await res.json();
const url = data?.images?.[0]?.url;
if (!url) {
  console.log("FAILED", JSON.stringify(data).slice(0, 200));
  process.exit(1);
}
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
writeFileSync(outPath, buf);
console.log("saved", outPath, buf.length, "bytes");
