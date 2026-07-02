// 单张：讨喜的现代彩色卡通简笔画（胖胖小女孩）。老少咸宜、年轻人也喜欢。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
mkdirSync("temp/style-tests", { recursive: true });

const prompt =
  "cute modern cartoon illustration of a chubby little girl, " +
  "clean bold friendly outlines, flat cheerful colors, big sparkly eyes, warm smile, " +
  "adorable and charming, appealing to kids parents and young adults, " +
  "modern animation / sticker style, simple minimal background, high quality, " +
  "no text, no watermark";

const res = await fetch("https://fal.run/fal-ai/nano-banana", {
  method: "POST",
  headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, num_images: 1, output_format: "png", aspect_ratio: "1:1" }),
});
const data = await res.json();
const url = data?.images?.[0]?.url;
if (!url) { console.log("NO URL:", JSON.stringify(data).slice(0, 300)); process.exit(1); }
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
writeFileSync("temp/style-tests/pick.png", buf);
console.log("ok -> temp/style-tests/pick.png");
