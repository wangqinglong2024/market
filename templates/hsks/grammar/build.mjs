// 模板『hsks-grammar · HSK语法点』构建流水线。守 templates/hsks/GANGLING.md + 家族引擎 _engine.mjs。
// ★用户定稿(2026-07-23)：无配音,做成『每页多条·中越文字结合·每条配彩色简笔画·翻页浏览』的密集信息卡。
// 系统化覆盖:05_grammar.csv 行序,_coverage.json 推进。幂等。零编造:语法点/规则/官方例句来自 CSV;拼音 pinyin-pro;越南语 vi-lexicon(缺则报错)。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pinyin } from "pinyin-pro";
import { LEVEL_ACCENT, LEVEL_LABEL, readCsv, takeBatch, evenChunks, writeProgress, makeMeta, assertDistinctIcons } from "../_engine.mjs";

const SUB = "grammar";
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// 语法关键词(在例句里脉冲高亮)。
const KEYWORDS = ["正在", "在", "把", "被", "过", "了", "着", "得", "呢", "吗", "的", "地", "不", "没", "很", "比"];
const pickKeyword = (s) => KEYWORDS.find((k) => (s || "").includes(k)) || "";
// 例句场景配图:扫例句关键词 → 插画 id;命不中退化到"体"概念图。
const SCENE = [["电影", "movie"], ["打电话", "progress"], ["上课", "class"], ["学生", "school"], ["学了", "done"], ["学习", "study"], ["起床", "clock8"], ["唱", "sing"], ["喝", "food"], ["电视", "tv"], ["买", "shopping"]];
const ASPECT = { "变化态": "change", "完成态": "done", "进行态": "progress" };
const iconOf = (example, detail) => (SCENE.find(([k]) => example.includes(k)) || [])[1] || ASPECT[detail] || "concept";

function readPoints(ROOT, level) {
  return readCsv(ROOT, level, "05_grammar.csv").map((r) => {
    const example = (r.cases || "").split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
    return { type: r.grammar_type || "", label: (r.grammar_detail || r.category_type || r.grammar_type || "").trim(), rule: (r.content || "").replace(/\r/g, "").trim(), example };
  });
}

export async function build({ videoId, dir, ROOT, settings }) {
  const script = readJson(join(dir, "script.json"));
  const level = script.level;
  if (!LEVEL_ACCENT[level]) throw new Error(`未知级别 level="${level}"`);
  const cfg = settings.grammar;
  const perPage = cfg.perPage;
  const count = script.count ?? cfg.defaultCount;

  const points = readPoints(ROOT, level);
  const { from, to, coverage } = takeBatch({ ROOT, sub: SUB, level, videoId, unitsLen: points.length, count });
  const picked = points.slice(from, to);

  const lex = readJson(join(ROOT, "templates", "hsks", SUB, "vi-lexicon.json"));
  const missing = [];
  const items = picked.map((p) => {
    const ruleVi = lex[p.rule]; const exampleVi = lex[p.example];
    if (p.rule && !ruleVi) missing.push(`[规则] ${p.rule}`);
    if (p.example && !exampleVi) missing.push(`[例句] ${p.example}`);
    return {
      label: p.label, type: p.type, rule: p.rule, ruleVi: ruleVi || "",
      example: p.example, examplePy: p.example ? pinyin(p.example, { toneType: "symbol", nonZh: "consecutive" }) : "",
      exampleVi: exampleVi || "", keyword: pickKeyword(p.rule) || pickKeyword(p.example), icon: iconOf(p.example, p.label),
    };
  });
  if (missing.length) throw new Error(`vi-lexicon.json 缺越南语(补后重跑):\n  ${missing.join("\n  ")}`);
  assertDistinctIcons(items, (it) => it.icon === "concept" ? null : it.icon, (it) => it.label || it.example, { label: "语法配图" });

  const levelLabel = LEVEL_LABEL[level] || level;
  const pageMs = cfg.pageMs ?? 4000;
  const chunks = evenChunks(items, perPage);
  const typeLabel = picked[0]?.type || "语法";
  const beats = chunks.map((its, p) => ({
    id: `p${p + 1}`, durationMs: pageMs, page: p + 1, pages: chunks.length,
    source: `${levelLabel}·语法·${typeLabel}`, titleVi: script.titleVi || `Ngữ pháp ${levelLabel}`,
    accent: LEVEL_ACCENT[level], items: its,
  }));
  const totalMs = beats.length * pageMs;
  console.log(`  无配音·翻页 ${items.length}点/${chunks.length}页 每页${pageMs}ms 总${(totalMs / 1000).toFixed(0)}s`);

  mkdirSync(dir, { recursive: true });
  const rangeLabel = `#${from + 1}-${to}`;
  writeFileSync(join(dir, "cover.json"), JSON.stringify({
    level: levelLabel, accent: LEVEL_ACCENT[level], kind: "Ngữ pháp · 语法",
    hook: script.coverHook || `Ngữ pháp ${levelLabel}`, range: rangeLabel, tag: "HSK · Tự học tiếng Trung", icon: "📐",
    samples: items.slice(0, 3).map((it) => ({ zh: it.label || it.example, vi: it.exampleVi || it.ruleVi })),
  }, null, 2) + "\n");

  writeProgress({
    ROOT, sub: SUB, coverage, level, levelLabel, videoId, rows: items, rangeLabel, totalMs, pagesN: chunks.length,
    unitsCount: (lvl) => readPoints(ROOT, lvl).length,
    cols: [{ h: "语法点", get: (r) => r.label }, { h: "规则", get: (r) => r.rule }, { h: "例句", get: (r) => r.example }, { h: "越南语", get: (r) => r.exampleVi }],
  });

  console.log(`\nhsks-grammar ${videoId}: ${level} [${from}-${to}) ${items.length}点/${chunks.length}页 总${(totalMs / 1000).toFixed(0)}s`);
  return { meta: makeMeta({ settings, cfg, level, layout: "hsks-grammar" }), beats };
}
