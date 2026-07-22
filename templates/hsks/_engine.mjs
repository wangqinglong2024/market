// hsks 家族·共享构建引擎(5 个子模板复用)。守 templates/hsks/GANGLING.md。
// 职责：CSV 解析 / 级别主题色 / 覆盖账本(系统化推进·幂等) / 逐项等距节拍(偶数秒≤24s) / 分页节拍 / 自动进度表。
// 各子模板 build.mjs 只负责：把 CSV 变成"知识项数组"、查 vi-lexicon、决定分页与展示字段、TTS，其余全交本引擎。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// 级别主题色(HSK1 暖橙 → HSK6 沉紫 → HSK7-9 深橙)。全家族一致。
export const LEVEL_ACCENT = {
  HSK1: "#ff7a1a", HSK2: "#f7b500", HSK3: "#12b886", HSK4: "#2b7fff",
  HSK5: "#7048e8", HSK6: "#ae3ec9", "HSK7+": "#e8590c", "HSK7-9": "#e8590c",
};
// 目录名 HSK7+ 对外显示为 HSK7-9。
export const LEVEL_LABEL = { "HSK7+": "HSK7-9" };

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const cleanWord = (w) => (w || "").replace(/\d+$/, "").trim(); // 去同形消歧数字(本1→本)

// 极简 CSV 解析(支持引号内逗号/换行)。
export function parseCsv(text) {
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

export const readCsv = (ROOT, level, file) => parseCsv(readFileSync(join(ROOT, "hsk", level, file), "utf8"));

// 覆盖账本：取『该级别下一批 count 个未覆盖单元』；幂等复用同 videoId 区间。
// units = 有序的知识单元数组(词/语法点/话题组/任务句/字)。返回 {from,to,coverage,lvCov}。
export function takeBatch({ ROOT, sub, level, videoId, unitsLen, count }) {
  const covPath = join(ROOT, "templates", "hsks", sub, "_coverage.json");
  const coverage = existsSync(covPath) ? JSON.parse(readFileSync(covPath, "utf8")) : {};
  const lvCov = coverage[level] || (coverage[level] = { cursor: 0, batches: [] });
  let batch = lvCov.batches.find((b) => b.videoId === videoId);
  if (!batch) {
    const from = lvCov.cursor;
    if (from >= unitsLen) throw new Error(`${level} ${sub} 已全部覆盖(共 ${unitsLen})，无更多可取`);
    const to = Math.min(from + count, unitsLen);
    batch = { videoId, from, to };
    lvCov.batches.push(batch);
    lvCov.cursor = to;
    mkdirSync(join(ROOT, "templates", "hsks", sub), { recursive: true });
    writeFileSync(covPath, JSON.stringify(coverage, null, 2) + "\n");
  }
  return { from: batch.from, to: batch.to, coverage, lvCov, covPath };
}

// 逐项等距节拍：给定项数 n、最长项音频、gap → 每项等长 slot；总时长向上取整偶数秒(≤24s),回算 slot 保均匀。
export function pace({ n, maxAudioMs, gapMs, maxMs = 24000 }) {
  const minSlot = maxAudioMs + gapMs;
  const rawTotal = n * minSlot;
  if (rawTotal > maxMs) throw new Error(`总时长 ${(rawTotal / 1000).toFixed(1)}s 超 ${maxMs / 1000}s 上限：减 count(当前 ${n} 项)或提 speed`);
  const totalMs = Math.ceil(rawTotal / 2000) * 2000; // 偶数秒
  const slotMs = totalMs / n;                         // 等距节拍(≥minSlot)
  return { slotMs, totalMs };
}

// 分页节拍：chunks=已分好的页(每页项数组)，slotMs=等距节拍。为每项标 readAtMs(页内局部)、每页算 durationMs。
// pageFields(pageIndex, pageItems, pages) 返回该页附加字段(source/titleVi/accent 等)。返回 beats 数组。
export function makeBeats({ chunks, slotMs, pageFields }) {
  const beats = [];
  let g = 0; // 全局项序
  const pages = chunks.length;
  for (let p = 0; p < pages; p++) {
    const items = chunks[p];
    const pageStart = Math.round(g * slotMs);
    const pageEnd = Math.round((g + items.length) * slotMs);
    const withRead = items.map((it, li) => ({ ...it, readAtMs: Math.round((g + li) * slotMs) - pageStart }));
    beats.push({ id: `p${p + 1}`, durationMs: pageEnd - pageStart, page: p + 1, pages, items: withRead, ...pageFields(p, items, pages) });
    g += items.length;
  }
  return beats;
}

// 均匀分页(vocab/hanzi 用)：n 项 → clamp(ceil(n/perPage),3,6) 页，每页尽量均。
export function evenChunks(items, perPage) {
  const n = items.length;
  const pages = clamp(Math.ceil(n / perPage), 3, 6);
  const per = Math.ceil(n / pages);
  const chunks = [];
  for (let i = 0; i < n; i += per) chunks.push(items.slice(i, i + per));
  return chunks;
}

// 通用进度表(人读·可跨会话审计)：progress/<videoId>.md(本条明细) + PROGRESS.md(账本重生成总览)。
// rows = 本条用到的知识单元(已含展示字段);cols=[{h,get}] 定义明细表列;unitsCount(level)=该级总单元数。
export function writeProgress({ ROOT, sub, coverage, level, levelLabel, videoId, rows, cols, rangeLabel, totalMs, pagesN, unitsCount }) {
  const progDir = join(ROOT, "templates", "hsks", sub, "progress");
  mkdirSync(progDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  // 1) 本条明细
  const heads = ["#", ...cols.map((c) => c.h)];
  let md = `# ${videoId} — ${levelLabel} · ${sub} · ${rangeLabel}\n\n`;
  md += `- 级别: ${levelLabel} · 范围: ${rangeLabel}（共 ${rows.length} 项）· 页数: ${pagesN} · 时长: ${(totalMs / 1000).toFixed(0)}s · 状态: built · 更新: ${today}\n\n`;
  md += `| ${heads.join(" | ")} |\n| ${heads.map(() => "---").join(" | ")} |\n`;
  rows.forEach((r, i) => { md += `| ${[i + 1, ...cols.map((c) => String(c.get(r)).replace(/\n/g, " "))].join(" | ")} |\n`; });
  writeFileSync(join(progDir, `${videoId}.md`), md);

  // 2) 总进度表(从账本重生成)
  let out = `# hsks-${sub} 进度表（自动生成 · 勿手改）\n\n> 真源=\`_coverage.json\`。逐条精确到取哪一批·跨会话可接续。\n\n## 总览\n\n| 级别 | 已覆盖 | 总数 | 进度 | 下一条起点 |\n|---|---|---|---|---|\n`;
  for (const lvl of Object.keys(coverage)) {
    const cov = coverage[lvl];
    const total = unitsCount(lvl);
    const pct = total ? ((cov.cursor / total) * 100).toFixed(1) : "0.0";
    out += `| ${LEVEL_LABEL[lvl] || lvl} | ${cov.cursor} | ${total} | ${pct}% | ${cov.cursor < total ? `#${cov.cursor + 1}` : "✅ 完成"} |\n`;
  }
  out += `\n## 明细（逐条）\n`;
  for (const lvl of Object.keys(coverage)) {
    out += `\n### ${LEVEL_LABEL[lvl] || lvl}\n\n| 视频 | 单元区间 | 数量 |\n|---|---|---|\n`;
    for (const b of [...coverage[lvl].batches].sort((a, z) => a.from - z.from)) {
      out += `| ${b.videoId} | [${b.from + 1}, ${b.to}] | ${b.to - b.from} |\n`;
    }
  }
  writeFileSync(join(progDir, "PROGRESS.md"), out);
}

// ★同一视频禁止两张相同 SVG(用户 2026-07-23)：检测 items 里图标签名重复。
// sigOf(item)→签名字符串(null=天然唯一,跳过);nameOf(item)→报错时显示名。mode: "throw"(词/字/语法/话题卡,每项须独立图) | "warn"(task 技能类可复用但提示)。
export function assertDistinctIcons(items, sigOf, nameOf, { label = "图标", mode = "throw" } = {}) {
  const seen = new Map();
  for (const it of items) {
    const sig = sigOf(it);
    if (sig == null) continue;
    (seen.get(sig) || seen.set(sig, []).get(sig)).push(it);
  }
  const dups = [...seen.values()].filter((arr) => arr.length > 1);
  if (!dups.length) return;
  const msg = `同一视频出现相同${label}(违反『同视频 SVG 禁止相同』)：\n` + dups.map((arr) => `  · ${arr.map(nameOf).join(" ＝ ")}`).join("\n") + `\n请给其中之一换用不同抽象表达/专属图。`;
  if (mode === "warn") console.warn("⚠️ " + msg);
  else throw new Error(msg);
}

// 组装 manifest.meta(全家族一致)。
export function makeMeta({ settings, cfg, level, layout }) {
  return {
    fps: settings.meta.fps, width: settings.meta.width, height: settings.meta.height,
    layout,
    theme: { accent: LEVEL_ACCENT[level] },
    sidePad: cfg.sidePad ?? 130,
    ...(settings.fonts && { fonts: settings.fonts }),
    ...(cfg.badge && { badge: cfg.badge }),
    ...(cfg.badge && { source: { region: { top: cfg.badgeRegionTop ?? 320 } } }),
    ...(cfg.bgm && { bgm: cfg.bgm }),
  };
}
