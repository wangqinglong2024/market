// 一次性：用 nano-banana-pro 生成「戴书生方帽 + 汉服」的定妆样板图（config 模板），只做儿子/女儿两张。
// 用户 2026-07-05 定：banana 仅在此生成 config 样板时用；日常出图仍全走 flux，只是朗读拍改喂这张带帽样板。
// 用法: node scripts/gen-hat-refs.mjs [boy|girl|all]   产物: templates/guoxue-jinju/characters/<id>/model-sheet-hat.png
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const PROXY = "http://127.0.0.1:7897";
const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

// 每个孩子：喂日常定妆图，改成「全身长袍汉服 + 优雅方顶书生帽」，画风/脸型/发型不变、纯白底。
const TARGETS = {
  boy: {
    ref: "templates/guoxue-jinju/characters/boy/model-sheet.png",
    out: "templates/guoxue-jinju/characters/boy/model-sheet-hat.png",
    robe: "a full-length crossed-collar PALE-GREEN hanfu robe reaching the ankles (replacing the t-shirt and shorts)",
  },
  girl: {
    ref: "templates/guoxue-jinju/characters/girl/model-sheet.png",
    out: "templates/guoxue-jinju/characters/girl/model-sheet-hat.png",
    robe: "a full-length crossed-collar PALE-BLUE hanfu robe reaching the ankles (replacing the pink dress)",
  },
};

const promptFor = (robe) =>
  "Keep the EXACT same cartoon child from the reference — same face, same hair, same round chubby body type, same fair skin, " +
  "same hand-drawn healing style (rough grainy pencil/crayon outlines, warm crayon coloring), same clean solid PURE WHITE background. " +
  `Only change the outfit: dress the child in ${robe}, ` +
  "AND put an ELEGANT, neat, good-looking flat-topped SQUARE black scholar's cap on the head — a graduation-mortarboard / Chinese fāngjīn 方巾 scholar cap that pairs with hanfu, drawn tidy and cute (NOT lumpy, NOT ugly). " +
  "Full body from head to toe, standing, centered, comfortable even margins on all sides, on flat pure white #ffffff. No text, no watermark.";

async function genOne(id) {
  const t = TARGETS[id];
  const payload = {
    prompt: promptFor(t.robe),
    image_urls: [dataUri(t.ref)],
    num_images: 1,
    output_format: "png",
    aspect_ratio: "1:1",
  };
  const reqFile = join(tmpdir(), `hat-${randomUUID()}.json`);
  writeFileSync(reqFile, JSON.stringify(payload));
  console.log(`→ ${id}: nano-banana-pro/edit …`);
  const raw = execSync(
    `curl -s -m 180 -x ${PROXY} -X POST "https://fal.run/fal-ai/nano-banana-pro/edit" ` +
    `-H "Authorization: Key ${KEY}" -H "Content-Type: application/json" --data @${reqFile}`,
    { maxBuffer: 60 * 1024 * 1024 }
  ).toString();
  const data = JSON.parse(raw);
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`${id} 无返回图: ${JSON.stringify(data).slice(0, 200)}`);
  const buf = execSync(`curl -s -m 90 -x ${PROXY} "${url}"`, { maxBuffer: 60 * 1024 * 1024 });
  if (buf.length < 20000) throw new Error(`${id} 图过小(${buf.length}B)`);
  writeFileSync(t.out, buf);
  console.log(`✅ ${id} → ${t.out} (${(buf.length / 1024).toFixed(0)}KB)  [nano-pro $0.15]`);
}

const which = process.argv[2] || "all";
const ids = which === "all" ? ["boy", "girl"] : [which];
for (const id of ids) await genOne(id);
