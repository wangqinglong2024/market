// 角色 AI 参考图 → 透明扁平矢量 SVG（保留形状/配色，丢纹理）。
// 用法: node scripts/vectorize.mjs config/characters/<id>/ref-front.png config/characters/<id>/character.svg [colorPrecision]
// 默认 cp=4：保色好、棕发不掉。个别顽固浅色块可用 --drop=#RRRRRR,#... 指定删除。
import { readFileSync, writeFileSync } from "node:fs";
import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from "@neplex/vectorizer";

const args = process.argv.slice(2);
const [inPath, outPath] = args.filter((a) => !a.startsWith("--"));
const cp = Number((args.find((a) => a.startsWith("--cp=")) || "--cp=4").slice(5));
const explicit = new Set(
  (args.find((a) => a.startsWith("--drop=")) || "--drop=").slice(7).split(",").filter(Boolean).map((s) => s.toUpperCase()),
);
// --nohl：不抠中性浅色（灰白毛色的角色如狗狗要用，否则灰毛会被当高光删掉）
const noHighlight = args.includes("--nohl");
if (!inPath || !outPath) throw new Error("用法: node scripts/vectorize.mjs <in.png> <out.svg> [--cp=4] [--drop=#hex,...]");

let svg = await vectorize(readFileSync(inPath), {
  colorMode: ColorMode.Color,
  colorPrecision: cp,
  filterSpeckle: 12,
  spliceThreshold: 60,
  cornerThreshold: 80,
  hierarchical: Hierarchical.Stacked,
  mode: PathSimplifyMode.Spline,
  layerDifference: 16,
  lengthThreshold: 8,
  maxIterations: 2,
  pathPrecision: 4,
});

// 抠掉背景与线稿留白：近白 + 中性浅高光 + 显式指定色
const parse = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const drop = (f) => {
  if (explicit.has(f.toUpperCase())) return true;
  const [r, g, b] = parse(f);
  const mn = Math.min(r, g, b), sp = Math.max(r, g, b) - mn;
  return mn > 0xee || (!noHighlight && mn > 0xce && sp < 18);
};
let removed = 0;
svg = svg.replace(/<path d="[^"]*" fill="(#[0-9a-fA-F]{6})"[^>]*\/>/g, (m, f) => (drop(f) ? (removed++, "") : m));
svg = svg.replace(/width="(\d+)" height="(\d+)">/, 'width="$1" height="$2" viewBox="0 0 $1 $2">');

writeFileSync(outPath, svg);
const paths = (svg.match(/<path/g) || []).length;
console.log(`OK ${outPath} (${(svg.length / 1024).toFixed(1)} KB, ${paths} paths, cp=${cp}, dropped ${removed})`);
