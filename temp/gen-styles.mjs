// 一次性：生成 12 种简笔漫画风的“胖胖小女孩”定妆试验图，供用户挑画风。
// 用法：node temp/gen-styles.mjs  （在项目根目录跑，需关闭沙箱）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const OUT = "temp/style-tests";
mkdirSync(OUT, { recursive: true });

// 主体统一：一个胖胖的小女孩，全身，简单站姿；差异只在“画风”。
const SUBJECT =
  "a chubby chubby little girl, round cheeks, short hair, full body, standing simple pose, friendly smile, plain white background, centered";
// 统一约束：简洁，别过度精细。
const COMMON =
  "simple, clean, minimal, uncluttered, flat, few details, no shading complexity, no text, no watermark";

// 全部限定在“蜡笔 / 水彩笔”家族内，只变技法与调色，主体和简洁度不变。
const STYLES = [
  ["01-crayon-thick",   "thick waxy crayon drawing, bold saturated crayon strokes, visible wax texture"],
  ["02-crayon-light",   "light sketchy crayon drawing, soft strokes with white paper showing through"],
  ["03-oil-pastel",     "oil pastel drawing, buttery bold strokes, rich blended crayon colors"],
  ["04-crayon-outline", "crayon coloring with black crayon outline, childlike coloring-book fill"],
  ["05-crayon-scribble","childlike crayon scribble, naive uneven strokes, out-of-line coloring, cute"],
  ["06-crayon-grain",   "grainy waxy crayon texture on rough paper, matte pastel tones, gentle"],
  ["07-watercolor-pen", "watercolor brush pen illustration, soft translucent washes, gentle colors"],
  ["08-watercolor-wet",  "wet-on-wet watercolor pen, soft bleeding colors blending, dreamy"],
  ["09-watercolor-pale", "pale delicate watercolor pen wash, light airy pastel palette, minimal"],
  ["10-watercolor-bright","bright saturated watercolor marker, vivid cheerful colors, playful"],
  ["11-watercolor-line", "watercolor wash with loose ink pen outline, sketchy and soft"],
  ["12-crayon-resist",   "crayon resist watercolor mixed media, waxy crayon lines over watercolor wash"],
];

async function gen([id, style]) {
  const outPath = `${OUT}/${id}.png`;
  if (existsSync(outPath)) return console.log(`skip (exists) ${id}`);
  const prompt = `${style}. ${SUBJECT}. ${COMMON}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://fal.run/fal-ai/nano-banana", {
        method: "POST",
        headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, num_images: 1, output_format: "png", aspect_ratio: "1:1" }),
      });
      const data = await res.json();
      const url = data?.images?.[0]?.url;
      if (!url) { console.log(`  ${id} no url (try ${attempt + 1})`, JSON.stringify(data).slice(0, 160)); continue; }
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      writeFileSync(outPath, buf);
      return console.log(`ok  ${id}`);
    } catch (e) {
      console.log(`  ${id} error (try ${attempt + 1})`, e.message);
    }
  }
  console.log(`FAIL ${id}`);
}

// 并发跑（每个 fal 调用独立），限并发 4。
const queue = [...STYLES];
const workers = Array.from({ length: 4 }, async () => {
  while (queue.length) await gen(queue.shift());
});
await Promise.all(workers);
console.log("done ->", OUT);
