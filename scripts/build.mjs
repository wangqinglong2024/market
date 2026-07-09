// 通用构建编排器：按视频所属模板派发到 templates/<模板>/build.mjs 的 build()。
// 用法: node scripts/build.mjs <videoId>
// 职责：定位视频目录、加载(全局+模板)settings、调用模板流水线、落盘 manifest.json、回写总账。
// 各模板的具体流水线(配音/出图/字幕/版式)完全由该模板的 build.mjs 决定，编排器不含模板逻辑。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { loadSettings } from "./lib/config.mjs";

const videoId = process.argv[2];
if (!videoId) throw new Error("用法: node scripts/build.mjs <videoId>");

const ROOT = process.cwd();
const catalog = JSON.parse(readFileSync(join(ROOT, "catalog.json"), "utf8"));
const entry = catalog.videos.find((v) => v.id === videoId);
if (!entry) throw new Error(`catalog.json 里找不到 videoId=${videoId}`);

// 模板名：优先 catalog 条目的 template；缺省回落到 guoxue-jinju(兼容改造前的旧条目)
const templateId = entry.template || "guoxue-jinju";
const shard = entry.shard;

const dir = join(ROOT, "public", "videos", shard, videoId);
const rel = (...p) => `videos/${shard}/${videoId}/${p.join("/")}`;
const ensure = (p) => { mkdirSync(dirname(p), { recursive: true }); return p; };

const settings = loadSettings(templateId);

// 派发到模板流水线
const modUrl = pathToFileURL(join(ROOT, "templates", templateId, "build.mjs")).href;
const tpl = await import(modUrl);
if (typeof tpl.build !== "function") {
  throw new Error(`templates/${templateId}/build.mjs 必须导出 async build({ videoId, dir, ROOT, settings, rel, ensure })`);
}

console.log(`模板: ${templateId}  视频: ${videoId}`);
const manifest = await tpl.build({ videoId, dir, ROOT, settings, rel, ensure });

writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 回写总账状态
entry.beats = manifest.beats.length;
entry.status = "built";
writeFileSync(join(ROOT, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");

const totalMs = manifest.beats.reduce((a, b) => a + b.durationMs, 0);
console.log(`\nDONE ${videoId}: ${manifest.beats.length} beats, ${totalMs}ms → ${join(dir, "manifest.json")}`);
