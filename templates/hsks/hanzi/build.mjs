// 模板『hsks-hanzi · HSK部件识字』构建流水线。守 GANGLING.md + 家族引擎 _engine.mjs。
// ★与 hsk-ziyuan(字源演变)区分;★与 vocab 区分(用户 2026-07-23):排版更密(每页 9 字,比词多)、独立瓷砖风、字→图记忆联想。保留单字朗读配音。
// 系统化覆盖:02_hanzi.csv 行序(认读优先),_coverage.json 推进。幂等。零编造:字来自 CSV;拼音 pinyin-pro;字义 vi-lexicon;部件 components.json;联想图 ASSOC。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pinyin } from "pinyin-pro";
import { synth } from "../../../scripts/tts.mjs";
import { LEVEL_ACCENT, LEVEL_LABEL, readCsv, takeBatch, pace, makeBeats, writeProgress, makeMeta, assertDistinctIcons } from "../_engine.mjs";

const SUB = "hanzi";
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const COMP_VI = { "一": "nét ngang", "丨": "nét sổ", "丿": "nét phẩy", "乙": "nét cong móc", "人": "bộ Nhân (người)" };
// 字→图记忆联想插画 id(hsks-art)。抽象字用抽象联想(方向/数量/概念),绝不写该字本身。
const ASSOC = {
  "一": "num1", "七": "num7", "三": "num3", "上": "up", "下": "down", "不": "no", "东": "east-sun", "两": "pair",
  "个": "one-item", "中": "center", "么": "question", "九": "num9", "也": "also", "习": "feather", "书": "book", "买": "shopping", "了": "done", "事": "affair",
};

const readChars = (ROOT, level) => readCsv(ROOT, level, "02_hanzi.csv")
  .map((r) => ({ ch: (r.character || "").trim(), kind: (r.hanzi_type_name || "").trim() })).filter((x) => x.ch);

export async function build({ videoId, dir, ROOT, settings }) {
  const script = readJson(join(dir, "script.json"));
  const level = script.level;
  if (!LEVEL_ACCENT[level]) throw new Error(`未知级别 level="${level}"`);
  const cfg = settings.hanzi;
  const perPage = cfg.perPage; // 9(比 vocab 的 6 密)
  const count = script.count ?? cfg.defaultCount;

  const chars = readChars(ROOT, level);
  const { from, to, coverage } = takeBatch({ ROOT, sub: SUB, level, videoId, unitsLen: chars.length, count });
  const picked = chars.slice(from, to);

  const lex = readJson(join(ROOT, "templates", "hsks", SUB, "vi-lexicon.json"));
  const comps = readJson(join(ROOT, "templates", "hsks", SUB, "components.json"));
  const missVi = [], missComp = [];
  const items = picked.map((x) => {
    const vi = lex[x.ch]; if (!vi) missVi.push(x.ch);
    const comp = comps[x.ch]; if (!comp) missComp.push(x.ch);
    return { ch: x.ch, kind: x.kind, py: pinyin(x.ch, { toneType: "symbol" }), vi: vi || "", comp: comp || "", compVi: COMP_VI[comp] || "", icon: ASSOC[x.ch] || "concept", read: x.ch };
  });
  if (missVi.length || missComp.length) throw new Error(`补齐后重跑：\n  vi-lexicon 缺: ${missVi.join("、") || "—"}\n  components 缺: ${missComp.join("、") || "—"}`);
  assertDistinctIcons(items, (it) => it.icon === "concept" ? null : it.icon, (it) => it.ch, { label: "联想图" });

  // 保留单字朗读(复用 vocab 词库缓存) + 等距节拍。
  const voice = script.voice || cfg.audio.voice;
  const speed = script.speed ?? cfg.audio.speed ?? 1.0;
  const gapMs = cfg.gapMs ?? 240;
  const libDir = join(ROOT, "public", "library", "tts-vocab");
  mkdirSync(libDir, { recursive: true });
  const hex = (w) => "w-" + Array.from(w).map((c) => c.codePointAt(0).toString(16)).join("-");
  let maxAudio = 0;
  for (const it of items) {
    const h = hex(it.ch);
    const a = await synth(it.ch, join(libDir, `${h}.mp3`), { voice, speed });
    it.audio = `library/tts-vocab/${h}.mp3`; it.audioMs = Math.round(a.ms);
    maxAudio = Math.max(maxAudio, it.audioMs);
    console.log(`  ${it.ch} ${it.py} [${it.comp}/${it.icon}] ${a.cached ? "cached" : it.audioMs + "ms"}`);
  }
  const { slotMs, totalMs } = pace({ n: items.length, maxAudioMs: maxAudio, gapMs });

  const levelLabel = LEVEL_LABEL[level] || level;
  // 密集分页:直接按 perPage 切(不走 evenChunks 的最少3页均分,保证每页字数=perPage)。
  const chunks = [];
  for (let i = 0; i < items.length; i += perPage) chunks.push(items.slice(i, i + perPage));
  const kindLabel = picked[0]?.kind || "识字";
  const beats = makeBeats({
    chunks, slotMs,
    pageFields: () => ({ source: `${levelLabel}·汉字·${kindLabel}`, titleVi: script.titleVi || `Chữ Hán ${levelLabel}`, accent: LEVEL_ACCENT[level] }),
  });
  console.log(`  等距节拍 slot=${Math.round(slotMs)}ms × ${items.length}字/${chunks.length}页(每页${perPage}) = ${(totalMs / 1000).toFixed(0)}s`);

  mkdirSync(dir, { recursive: true });
  const rangeLabel = `#${from + 1}-${to}`;
  writeFileSync(join(dir, "cover.json"), JSON.stringify({
    level: levelLabel, accent: LEVEL_ACCENT[level], kind: "Chữ Hán · 部件识字",
    hook: script.coverHook || `${items.length} chữ Hán ${levelLabel}`, range: rangeLabel, tag: "HSK · Tự học tiếng Trung", icon: "🀄",
    samples: items.slice(0, 3).map((it) => ({ zh: `${it.ch}  ${it.py}`, vi: it.vi })),
  }, null, 2) + "\n");

  writeProgress({
    ROOT, sub: SUB, coverage, level, levelLabel, videoId, rows: items, rangeLabel, totalMs, pagesN: chunks.length,
    unitsCount: (lvl) => readChars(ROOT, lvl).length,
    cols: [{ h: "字", get: (r) => r.ch }, { h: "拼音", get: (r) => r.py }, { h: "部件", get: (r) => r.comp }, { h: "联想图", get: (r) => r.icon }, { h: "越南语", get: (r) => r.vi }],
  });

  console.log(`\nhsks-hanzi ${videoId}: ${level} [${from}-${to}) ${items.length}字/${chunks.length}页 总${(totalMs / 1000).toFixed(0)}s`);
  return { meta: makeMeta({ settings, cfg, level, layout: "hsks-hanzi" }), beats };
}
