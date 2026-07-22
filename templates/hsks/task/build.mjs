// 模板『hsks-task · HSK我能做到』构建流水线。守 GANGLING.md + 家族引擎 _engine.mjs。
// ★用户定稿(2026-07-23)：一个视频=一个交际主题(一个 task_type 的几条能力),密集图文卡『每页多条·中越结合·配彩色技能插画·逐条打钩✓』+ 保留朗读配音(读到哪条哪条勾亮)。
// 系统化覆盖:03_tasks.csv 行序,_coverage.json 推进。幂等。零编造:任务句原文来自 CSV;越南语 vi-lexicon(缺则报错)。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../../scripts/tts.mjs";
import { LEVEL_ACCENT, LEVEL_LABEL, readCsv, takeBatch, writeProgress, makeMeta, assertDistinctIcons } from "../_engine.mjs";

const SUB = "task";
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const SKILL = [["听懂", "ear"], ["看懂", "eye"], ["看", "eye"], ["介绍", "speak"], ["询问", "speak"], ["回答", "speak"], ["写", "pen"], ["说", "speak"]];
const iconOf = (text) => (SKILL.find(([k]) => text.includes(k)) || [])[1] || "speak";

const readTasks = (ROOT, level) => readCsv(ROOT, level, "03_tasks.csv")
  .map((r) => ({ type: (r.task_type || "").trim(), text: (r.task_example || "").trim() })).filter((t) => t.text);

export async function build({ videoId, dir, ROOT, settings }) {
  const script = readJson(join(dir, "script.json"));
  const level = script.level;
  if (!LEVEL_ACCENT[level]) throw new Error(`未知级别 level="${level}"`);
  const cfg = settings.task;
  const perPage = cfg.perPage;
  const count = script.count ?? cfg.defaultCount;

  const tasks = readTasks(ROOT, level);
  const { from, to, coverage } = takeBatch({ ROOT, sub: SUB, level, videoId, unitsLen: tasks.length, count });
  const picked = tasks.slice(from, to);

  const lex = readJson(join(ROOT, "templates", "hsks", SUB, "vi-lexicon.json"));
  const missing = [];
  const items = picked.map((t) => {
    const vi = lex[t.text]; if (!vi) missing.push(t.text);
    return { type: t.type, text: t.text, vi: vi || "", icon: iconOf(t.text), read: t.text };
  });
  if (missing.length) throw new Error(`vi-lexicon.json 缺越南语(补后重跑):\n  ${missing.join("\n  ")}`);
  // task 图标是技能类(听/说/读/写),多条能力可能同技能→仅警告不阻断。
  assertDistinctIcons(items, (it) => it.icon, (it) => it.text.slice(0, 10), { label: "技能图", mode: "warn" });

  // 配音:逐条朗读任务句(库 tts-task)。任务句长短悬殊→顺序节拍(每条=自身音频+等长 gap),条间停顿均分。
  const voice = script.voice || cfg.audio.voice;
  const speed = script.speed ?? cfg.audio.speed ?? 1.0;
  const gapMs = cfg.gapMs ?? 300;
  const libDir = join(ROOT, "public", "library", "tts-task");
  mkdirSync(libDir, { recursive: true });
  const { createHash } = await import("node:crypto");
  const hex = (s) => "k-" + createHash("sha1").update(`${s}|${speed}`).digest("hex").slice(0, 16);
  for (const it of items) {
    const a = await synth(it.read, join(libDir, `${hex(it.read)}.mp3`), { voice, speed });
    it.audio = `library/tts-task/${hex(it.read)}.mp3`; it.audioMs = Math.round(a.ms);
    console.log(`  ✓ ${it.text.slice(0, 16)}… ${a.cached ? "cached" : it.audioMs + "ms"}`);
  }
  const totalRaw = items.reduce((s, it) => s + it.audioMs + gapMs, 0);
  if (totalRaw > 24000) throw new Error(`总时长 ${(totalRaw / 1000).toFixed(1)}s 超 24s：减 count(当前 ${items.length} 条)或提 speed`);
  const totalMs = Math.ceil(totalRaw / 2000) * 2000;
  const extra = (totalMs - totalRaw) / items.length;
  // 顺序起点(全局) + 分页(perPage/页)。
  let cursor = 0;
  for (const it of items) { it.durMs = Math.round(it.audioMs + gapMs + extra); it.startMs = cursor; cursor += it.durMs; }

  const levelLabel = LEVEL_LABEL[level] || level;
  const chunks = [];
  for (let i = 0; i < items.length; i += perPage) chunks.push(items.slice(i, i + perPage));
  const beats = chunks.map((its, p) => {
    const pageStart = its[0].startMs;
    const durationMs = its.reduce((s, it) => s + it.durMs, 0);
    return {
      id: `p${p + 1}`, durationMs, page: p + 1, pages: chunks.length,
      source: `${levelLabel}·交际·${its[0].type}`, titleVi: script.titleVi || `Với ${levelLabel} bạn làm được:`,
      accent: LEVEL_ACCENT[level], total: items.length, doneBase: p * perPage,
      items: its.map((it) => ({ ...it, readAtMs: it.startMs - pageStart })),
    };
  });
  console.log(`  顺序节拍(读到哪勾哪) ${items.length}条/${chunks.length}页 总${(totalMs / 1000).toFixed(0)}s`);

  mkdirSync(dir, { recursive: true });
  const rangeLabel = `#${from + 1}-${to}`;
  writeFileSync(join(dir, "cover.json"), JSON.stringify({
    level: levelLabel, accent: LEVEL_ACCENT[level], kind: "Kỹ năng · 交际",
    hook: script.coverHook || `Với ${levelLabel} bạn làm được gì?`, range: rangeLabel, tag: "HSK · Tự học tiếng Trung", icon: "✅",
    samples: items.slice(0, 3).map((it) => ({ zh: it.text.length > 22 ? it.text.slice(0, 22) + "…" : it.text, vi: it.vi })),
  }, null, 2) + "\n");

  writeProgress({
    ROOT, sub: SUB, coverage, level, levelLabel, videoId, rows: items, rangeLabel, totalMs, pagesN: chunks.length,
    unitsCount: (lvl) => readTasks(ROOT, lvl).length,
    cols: [{ h: "类型", get: (r) => r.type }, { h: "任务句(原文)", get: (r) => r.text }, { h: "越南语", get: (r) => r.vi }],
  });

  console.log(`\nhsks-task ${videoId}: ${level} [${from}-${to}) ${items.length}条/${chunks.length}页 总${(totalMs / 1000).toFixed(0)}s`);
  return { meta: makeMeta({ settings, cfg, level, layout: "hsks-task" }), beats };
}
