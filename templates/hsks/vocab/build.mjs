// 模板『hsks-vocab · HSK词汇卡』构建流水线。恒 12 秒高密度速览。
// ★系统化覆盖：不手挑词。按 /hsk/<level>/01_vocabulary.csv 的 sort_order 顺序，用覆盖账本 _coverage.json 推进游标，
//   自动取『该级别下一批 count 个未覆盖词』。幂等：重建同一 videoId 复用已记录区间，不再推进。
// 数据零编造：词/拼音/词性来自 CSV；越南语来自 vi-lexicon.json(缺则报错)。分页按密度算(见 GANGLING 节奏引擎)。
// 生产:script.json{level,count,titleVi?} → 取词+查越南语+每页配音(火山TTS) → manifest → 渲染层 src/layouts/hsks-vocab.tsx。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../../scripts/tts.mjs";

const SUB = "vocab";
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const tpl = (ROOT, ...p) => join(ROOT, "templates", "hsks", SUB, ...p);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 本级主题色(HSK1 暖橙 → HSK6 沉紫)。
const LEVEL_ACCENT = {
  HSK1: "#ff7a1a", HSK2: "#f7b500", HSK3: "#12b886", HSK4: "#2b7fff",
  HSK5: "#7048e8", HSK6: "#ae3ec9", "HSK7+": "#e8590c", "HSK7-9": "#e8590c",
};
// 目录名 → 对用户显示的级别名(HSK7+ 目录实为 7-9,对称命名;对外显示 HSK7-9)。
const LEVEL_LABEL = { "HSK7+": "HSK7-9" };

// 极简 CSV 解析(支持引号内逗号/换行)。
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch === "\r") { /* skip */ }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const cleanWord = (w) => w.replace(/\d+$/, "").trim(); // 去同形消歧数字(本1→本)

// 读某级别词表并按 sort_order 升序(build 与 进度表 复用)。
function readVocabSorted(ROOT, level) {
  const csvPath = join(ROOT, "hsk", level, "01_vocabulary.csv");
  return parseCsv(readFileSync(csvPath, "utf8"))
    .map((r) => ({ sort: Number(r.sort_order), word: r.word, py: r.pinyin, pos: r.part_of_speech }))
    .sort((a, b) => a.sort - b.sort);
}

// ★进度系统(人读、可跨会话审计)：每条视频落一份明细 progress/<videoId>.md(用了哪些词原文+sort位置)，
// 并从 _coverage.json 重生成总进度表 progress/PROGRESS.md(各级已覆盖/总数/下一条起点 + 逐条词表)。
function writeProgress({ ROOT, coverage, levelLabel, videoId, picked, words, chunks, totalMs, rangeLabel }) {
  const progDir = join(ROOT, "templates", "hsks", "vocab", "progress");
  mkdirSync(progDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const LABEL = { "HSK7+": "HSK7-9" };
  const pageOf = (i) => { let acc = 0; for (let p = 0; p < chunks.length; p++) { acc += chunks[p].length; if (i < acc) return p + 1; } return chunks.length; };

  // 1) 本条明细
  let md = `# ${videoId} — ${levelLabel} · 词汇 · No.${rangeLabel}\n\n`;
  md += `- 级别: ${levelLabel}\n- 取词范围(sort_order): ${rangeLabel}（共 ${picked.length} 词）\n`;
  md += `- 页数: ${chunks.length} · 时长: ${(totalMs / 1000).toFixed(0)}s · 状态: built · 更新: ${today}\n\n`;
  md += `| # | sort | 词(原文) | 拼音 | 词性 | 越南语 | 页 |\n|---|---|---|---|---|---|---|\n`;
  picked.forEach((v, i) => { md += `| ${i + 1} | ${v.sort} | ${v.word} | ${v.py} | ${(v.pos || "").trim() || "—"} | ${words[i].vi} | ${pageOf(i)} |\n`; });
  writeFileSync(join(progDir, `${videoId}.md`), md);

  // 2) 总进度表(从账本重生成)
  const cache = {};
  const getV = (lvl) => (cache[lvl] ||= readVocabSorted(ROOT, lvl));
  const levels = Object.keys(coverage);
  let out = `# hsks-vocab 进度表（自动生成 · 勿手改）\n\n> 每建一条视频自动更新；真源 = \`_coverage.json\`，本表为人读视图。逐条精确到用了哪些词(原文)及其 sort_order 位置——跨会话可准确接续。\n\n## 总览\n\n| 级别 | 已覆盖 | 总词数 | 进度 | 下一条起点 |\n|---|---|---|---|---|\n`;
  for (const lvl of levels) {
    const arr = getV(lvl), cov = coverage[lvl];
    const pct = ((cov.cursor / arr.length) * 100).toFixed(1);
    const next = cov.cursor < arr.length ? `No.${arr[cov.cursor].sort}` : "✅ 全部完成";
    out += `| ${LABEL[lvl] || lvl} | ${cov.cursor} | ${arr.length} | ${pct}% | ${next} |\n`;
  }
  out += `\n## 明细（逐条 · 用了哪些词）\n`;
  for (const lvl of levels) {
    const arr = getV(lvl), cov = coverage[lvl];
    out += `\n### ${LABEL[lvl] || lvl}\n\n| 视频 | No.范围 | 词数 | 词(原文) |\n|---|---|---|---|\n`;
    for (const b of [...cov.batches].sort((a, z) => a.from - z.from)) {
      const slice = arr.slice(b.from, b.to);
      const range = slice.length ? `${slice[0].sort}–${slice[slice.length - 1].sort}` : "—";
      out += `| ${b.videoId} | ${range} | ${slice.length} | ${slice.map((x) => x.word).join(" ")} |\n`;
    }
  }
  writeFileSync(join(progDir, "PROGRESS.md"), out);
}

export async function build({ videoId, dir, ROOT, settings, rel }) {
  const script = readJson(join(dir, "script.json"));
  const level = script.level;
  if (!LEVEL_ACCENT[level]) throw new Error(`未知级别 level="${level}"(HSK1..HSK6/HSK7-9)`);
  const cfg = settings.vocab;
  const perPage = cfg.perPage;
  const count = script.count ?? cfg.defaultCount;
  const maxCount = perPage * 6, minCount = perPage * 3;
  if (count < minCount || count > maxCount) throw new Error(`count=${count} 越界(应在 ${minCount}..${maxCount},以落 3..6 页)`);

  // 1) 读该级别词表(按 sort_order)。
  const vocab = readVocabSorted(ROOT, level);

  // 2) 覆盖账本：取『下一批未覆盖』；幂等复用同 videoId 区间。
  const covPath = tpl(ROOT, "_coverage.json");
  const coverage = existsSync(covPath) ? readJson(covPath) : {};
  const lvCov = coverage[level] || (coverage[level] = { cursor: 0, batches: [] });
  let batch = lvCov.batches.find((b) => b.videoId === videoId);
  if (!batch) {
    const from = lvCov.cursor;
    const to = Math.min(from + count, vocab.length);
    if (from >= vocab.length) throw new Error(`${level} 词汇已全部覆盖(共 ${vocab.length})，无更多可取`);
    batch = { videoId, from, to };
    lvCov.batches.push(batch);
    lvCov.cursor = to;
    writeFileSync(covPath, JSON.stringify(coverage, null, 2) + "\n");
  }
  const picked = vocab.slice(batch.from, batch.to);

  // 3) 越南语释义(vi-lexicon,缺则报错)。
  const lex = readJson(tpl(ROOT, "vi-lexicon.json"));
  const missing = [];
  const words = picked.map((v) => {
    const c = cleanWord(v.word);
    const vi = lex[c] ?? lex[v.word];
    if (!vi) missing.push(c);
    return { c, py: v.py, pos: v.pos, vi: vi || "" };
  });
  if (missing.length) throw new Error(`vi-lexicon.json 缺越南语释义(请补后重跑)：${missing.join("、")}`);

  // 4) 分页(仅决定版面密度)：pages=clamp(ceil(n/perPage),3,6)，每页 ≤ perPage 词。
  const n = words.length;
  const pages = clamp(Math.ceil(n / perPage), 3, 6);
  const chunks = [];
  const per = Math.ceil(n / pages);
  for (let i = 0; i < n; i += per) chunks.push(words.slice(i, i + per));

  // 5) ★逐词配音(可复用词库) + 等距节拍：每词一个等长 slot，词间停顿 = 组(页)间停顿，全程完全均分。
  //    slot = 等距节拍(≥最长词音频+gap)；总时长向上取整偶数秒后回算 slot；每词 readAtMs = 页内 局部序×slot。
  const voice = script.voice || cfg.audio.voice;
  const speed = script.speed ?? cfg.audio.speed ?? 1.0;
  const gapMs = cfg.gapMs ?? 240;
  const libDir = join(ROOT, "public", "library", "tts-vocab");
  mkdirSync(libDir, { recursive: true });
  const wordHex = (w) => "w-" + Array.from(w).map((c) => c.codePointAt(0).toString(16)).join("-");
  const rangeLabel = `${picked[0].sort}-${picked[picked.length - 1].sort}`;
  const levelLabel = LEVEL_LABEL[level] || level;

  let wordMax = 0;
  for (const w of words) {
    const hex = wordHex(w.c);
    const a = await synth(w.c, join(libDir, `${hex}.mp3`), { voice, speed });
    w.audio = `library/tts-vocab/${hex}.mp3`;
    w.audioMs = Math.round(a.ms);
    wordMax = Math.max(wordMax, w.audioMs);
    console.log(`  ${w.c} ${w.py} ${a.cached ? "cached" : a.audioMs || Math.round(a.ms) + "ms"}`);
  }
  const minSlot = wordMax + gapMs;
  const rawTotal = n * minSlot;
  if (rawTotal > 24000) throw new Error(`总时长 ${(rawTotal / 1000).toFixed(1)}s 超 24s 上限：请减小 count(当前 ${n} 词)或调快 speed`);
  const totalMs = Math.ceil(rawTotal / 2000) * 2000; // 偶数秒(ms)
  const slotMs = totalMs / n;                         // 等距节拍(≥minSlot,不重叠)

  const beats = [];
  let g = 0; // 全局词序
  for (let p = 0; p < chunks.length; p++) {
    const pg = chunks[p];
    const pageStart = Math.round(g * slotMs);
    const pageEnd = Math.round((g + pg.length) * slotMs);
    const pw = pg.map((w, li) => ({ ...w, readAtMs: Math.round((g + li) * slotMs) - pageStart }));
    beats.push({
      id: `p${p + 1}`, durationMs: pageEnd - pageStart, page: p + 1, pages: chunks.length,
      source: `${levelLabel}·词汇·No.${rangeLabel}`,
      titleVi: script.titleVi || `Từ vựng ${levelLabel}`,
      accent: LEVEL_ACCENT[level], words: pw,
    });
    g += pg.length;
  }
  console.log(`  等距节拍 slot=${Math.round(slotMs)}ms × ${n}词 = ${(totalMs / 1000).toFixed(0)}s (词间=组间停顿,均分)`);
  mkdirSync(dir, { recursive: true });

  // ★每条视频自动落 cover.json(封面数据驱动)：级别/主题色/越南语钩子/范围/前3示例词。渲染合成 cover-hsks-vocab。
  writeFileSync(join(dir, "cover.json"), JSON.stringify({
    level: levelLabel, accent: LEVEL_ACCENT[level], titleVi: "Từ vựng · 词汇",
    hook: script.coverHook || `${n} từ vựng ${levelLabel}`, range: `No.${rangeLabel}`,
    tag: "HSK · Tự học tiếng Trung",
    words: words.slice(0, 3).map((w) => ({ c: w.c, py: w.py, pos: w.pos, vi: w.vi })),
  }, null, 2) + "\n");

  // 进度表(人读、可跨会话审计)：本条明细 + 重生成总进度表。
  writeProgress({ ROOT, coverage, levelLabel, videoId, picked, words, chunks, totalMs, rangeLabel });

  const manifest = {
    meta: {
      fps: settings.meta.fps, width: settings.meta.width, height: settings.meta.height,
      layout: "hsks-vocab",
      theme: { accent: LEVEL_ACCENT[level] },
      sidePad: cfg.sidePad ?? 96,
      ...(settings.fonts && { fonts: settings.fonts }),
      ...(cfg.badge && { badge: cfg.badge }),
      // 引导框(LearnBadge)居中于顶部 [0, region.top] 区间：设大 region.top 使其落在 12% 安全带内(不贴顶越界)。
      ...(cfg.badge && { source: { region: { top: cfg.badgeRegionTop ?? 320 } } }),
      ...(cfg.bgm && { bgm: cfg.bgm }),
    },
    beats,
  };

  console.log(`\nhsks-vocab ${videoId}: ${level} 第[${batch.from}-${batch.to}) 批, ${n}词/${chunks.length}页, 总${(totalMs / 1000).toFixed(0)}s(偶数秒·音频驱动同步)`);
  return manifest;
}
