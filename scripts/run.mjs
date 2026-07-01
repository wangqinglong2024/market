// 一键：构建 + （可选）渲染。
// 用法: node scripts/run.mjs <videoId> [--render]
// 前置：public/videos/<shard>/<id>/script.json 已就位（分镜/翻译由会话生成）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const videoId = process.argv[2];
const doRender = process.argv.includes("--render");
if (!videoId) throw new Error("用法: node scripts/run.mjs <videoId> [--render]");

// 1) 构建（配音+出图+manifest）
let r = spawnSync(process.execPath, ["scripts/build.mjs", videoId], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);

// 2) 渲染（可选）
if (doRender) {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), "catalog.json"), "utf8"));
  const entry = catalog.videos.find((v) => v.id === videoId);
  const out = `public/videos/${entry.shard}/${videoId}/成片.mp4`;
  console.log(`\n渲染 → ${out}`);
  r = spawnSync("npx", ["remotion", "render", videoId, out], { stdio: "inherit", shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
