// 定妆图闸门:一次性生成某主持人的锁脸定妆图(model-sheet.png),用户审脸满意后锁定,再进 build 出场景。
// 用法: node templates/hsk-ziyuan/portrait.mjs <meinv|gongzi>
// 花钱铁律:出问题(黑图/不满意)不自动重试,报出来等用户批准再重跑(会覆盖同名文件)。
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";
import { loadSettings } from "../../scripts/lib/config.mjs";

const ID = "hsk-ziyuan";
const who = process.argv[2];
if (!who) throw new Error("用法: node templates/hsk-ziyuan/portrait.mjs <meinv|gongzi>");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

const reg = JSON.parse(readFileSync(join(HERE, "characters", "_registry.json"), "utf8"));
const ch = reg.characters.find((c) => c.id === who);
if (!ch) throw new Error(`_registry.json 无角色 ${who}`);

const canon = stripComments(readFileSync(join(HERE, "characters", who, ch.canonical), "utf8"));
const settings = loadSettings(ID);
const outPath = join(HERE, "characters", who, ch.ref);

// 定妆图=文生图(无参考),竖屏全身,清晰单人正面偏侧、干净背景,便于后续 nano-edit 保脸。
const prompt = [
  canon,
  "Full-body character reference, single person, facing camera 3/4 view, clean soft studio background, even flattering lighting, sharp clear detailed face, full body and outfit visible head to toe (keep the character's own described pose). Vertical 9:16.",
].join("\n\n");

// 覆盖生成:定妆图允许用户批准后重出,先删旧图再生成(genImage 命中已存在会当缓存返回)。
if (existsSync(outPath)) {
  console.log(`⚠️  已存在定妆图: ${outPath}\n如需重出,先手动删除该文件再跑(重出会覆盖,须用户批准)。`);
  process.exit(0);
}

console.log(`生成 ${who} 定妆图(nano-banana-pro 文生图)… → ${outPath}`);
const img = await genImage({ outPath, prompt, refPaths: [], settings, model: "nano-t2i" });
const usd = img.cached ? 0 : (MODEL_USD[img.model] ?? 0.15);
console.log(`DONE ${who} 定妆图 ${img.cached ? "(cached)" : `(gen, ~$${usd.toFixed(2)})`}: ${outPath}`);
console.log(`\n下一步:人工审脸。满意→进 build 出6场景;不满意→删图、调 characters/${who}/canonical.md、经用户批准后重跑。`);
