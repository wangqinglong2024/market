// 模板「chinese-learn」构建流水线。两种模式(看视频目录里有没有 clips.json):
//
//  A) 整片模式(无 clips.json):source.mp4 → 抽音频 → ASR → 逐词字幕,整片重排。
//  B) 混剪模式(有 clips.json):从原集选片段拼 ≤60s。
//     - type=zh:原片段[startMs,endMs](=ASR整句区间),原音 + 中文逐词卡拉OK + 拼音 + 越南语翻译。
//     - type=narration:原片空档(gapStartMs 起,时长=越南语 TTS 时长),叠越南语解说音轨、压低原声。
//     规则(重写,见 authoring.md 第二节「剪辑设计准则」,由 base/00-底层规律 驱动):
//     原声(中文对白)为主体、是学习内容;越南语解说是"钩子+桥梁+悬念引擎",按职责出现(开场抛缺口/
//     桥接跳剪/慢段续钩/点破难点),落在无对白空档、不踩原声——配比是职责的结果,不是固定百分比。
//     clips 数组顺序即成片顺序(可不按原片时间,支持冷开场)。ffmpeg 剪出各段→拼成 source.mp4,
//     字幕时间戳重映射到混剪时间线。
//
// 火山「录音文件识别大模型」极速版做字幕;火山 TTS(越南语音色)做解说配音。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pinyin } from "pinyin-pro";
import { recognizeFlash } from "../../scripts/asr.mjs";
import { synth } from "../../scripts/tts.mjs";
import { audioDurationMs } from "../../scripts/lib/media.mjs";

// 越南语解说音色默认值（可被 template.json → audio.viVoice 覆盖）。
// 默认用 vi_female_ruan（有声书/角色扮演，叙事表现力强，适合电影解说；用户 2026-07-13 定）。
const VI_VOICE_DEFAULT = "vi_female_ruan_uranus_bigtts";
const isHan = (c) => /[㐀-鿿]/.test(c);
const isWin = process.platform === "win32";
// Windows 的 .bin/remotion 是无扩展名 sh 脚本，execFileSync 无法直接 spawn(ENOENT)；用 remotion.cmd + shell。
const remotionBin = () => join(process.cwd(), "node_modules", ".bin", isWin ? "remotion.cmd" : "remotion");
const ffmpeg = (args) => {
  const bin = existsSync(remotionBin()) ? remotionBin() : "npx";
  const pre = bin === "npx" ? ["remotion", "ffmpeg"] : ["ffmpeg"];
  // ⚠️ shell:true 下参数不再自动转义——源文件/输出路径必须 ASCII、无空格(见 base/04-成本与铁律 五)。
  execFileSync(bin, [...pre, ...args], { stdio: "ignore", shell: isWin });
};

function extractAudioMp3(srcVideo, audioPath) {
  ffmpeg(["-y", "-i", srcVideo, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-q:a", "5", audioPath]);
}

// ASR 逐词(中文多为逐字)→ 扁平逐「汉字」时间戳;多字词按字数均分,标点丢弃。
function flattenChars(words) {
  const out = [];
  for (const w of words || []) {
    const chars = Array.from(w.text || "").filter(isHan);
    if (!chars.length) continue;
    const span = (w.endMs - w.startMs) / chars.length;
    chars.forEach((ch, i) =>
      out.push({ ch, startMs: Math.round(w.startMs + i * span), endMs: Math.round(w.startMs + (i + 1) * span) }),
    );
  }
  return out;
}

// 一句 → 逐词卡拉OK单元:分词后按汉字数取时间窗口,标点粘到前一词显示上。
function toKaraWords(text, words) {
  const chars = flattenChars(words);
  const segs = [...new Intl.Segmenter("zh", { granularity: "word" }).segment(text || "")];
  const out = [];
  let ci = 0;
  for (const s of segs) {
    const han = Array.from(s.segment).filter(isHan);
    if (s.isWordLike && han.length) {
      const slice = chars.slice(ci, ci + han.length);
      ci += han.length;
      if (!slice.length) continue;
      out.push({
        zh: s.segment,
        py: pinyin(s.segment, { toneType: "symbol", type: "array", nonZh: "removed" }).join(" "),
        startMs: slice[0].startMs,
        endMs: slice[slice.length - 1].endMs,
      });
    } else if (out.length) {
      out[out.length - 1].zh += s.segment;
    }
  }
  return out;
}

const PUNCT = /[，。！？；、,.!?;：]/;
const INTERJ = new Set(["哦", "啊", "嗯", "呀", "哎", "好", "吧", "呢", "唉", "喔", "噢", "呐", "嘿", "哈"]);

// 去掉每张卡结尾的标点(用户 2026-07-12):只删末尾,句中不动。
const stripTail = (words) => {
  if (words.length) words[words.length - 1].zh = words[words.length - 1].zh.replace(/[，。！？；、,.!?;：]+$/u, "");
  return words;
};

// 均匀逐字(解说无 ASR 时间戳时用):把中文均分到 [startMs,endMs]。
function evenChars(text, startMs, endMs) {
  const hans = Array.from(text || "").filter(isHan);
  const span = (endMs - startMs) / Math.max(1, hans.length);
  return hans.map((ch, i) => ({ text: ch, startMs: Math.round(startMs + i * span), endMs: Math.round(startMs + (i + 1) * span) }));
}

// 按标点把整句切成多张卡,每卡带自己的逐词时间(取自传入的已重映射 words);丢弃句尾单字语气词。
function splitClauses(text, words) {
  const chars = flattenChars(words);
  const clauses = [];
  let cur = "";
  for (const ch of text || "") { cur += ch; if (PUNCT.test(ch)) { clauses.push(cur); cur = ""; } }
  if (cur.trim()) clauses.push(cur);
  const out = [];
  let ci = 0;
  for (const clause of clauses) {
    const han = Array.from(clause).filter(isHan);
    const slice = chars.slice(ci, ci + han.length);
    ci += han.length;
    if (!slice.length) continue;
    if (han.length <= 1 && INTERJ.has(han.join(""))) continue;
    const kw = toKaraWords(clause, slice.map((s) => ({ text: s.ch, startMs: s.startMs, endMs: s.endMs })));
    if (kw.length) out.push({ zh: clause, words: stripTail(kw) });
  }
  return out;
}

function metaFrom(settings, rel) {
  return {
    fps: settings.meta.fps,
    width: settings.meta.width,
    height: settings.meta.height,
    layout: settings.layout,
    captions: settings.captions,
    fonts: settings.fonts,
    source: {
      video: rel("source.mp4"),
      region: settings.source?.region ?? { top: 120, height: 720 },
      focusY: settings.source?.focusY ?? 0.5,
    },
    subtitle: settings.subtitle ?? { top: 960, height: 360 },
  };
}

// ── 混剪模式 ────────────────────────────────────────────────────────────────
async function buildMashup({ dir, ROOT, settings, rel, ensure }) {
  const spec = JSON.parse(readFileSync(join(dir, "clips.json"), "utf8"));
  const original = join(ROOT, spec.source);
  if (!existsSync(original)) throw new Error(`混剪源不存在: ${original}`);
  const transcript = JSON.parse(readFileSync(join(dir, "work", "transcript.json"), "utf8"));
  const findUtt = (startMs) =>
    transcript.utterances.find((u) => Math.abs(u.startMs - startMs) <= 120) ||
    transcript.utterances.find((u) => u.startMs <= startMs && u.endMs >= startMs);

  // 越南语解说音色/语速：template.json → audio.viVoice / audio.viSpeed 覆盖默认
  const viVoice = settings.audio?.viVoice ?? VI_VOICE_DEFAULT;
  const viSpeed = settings.audio?.viSpeed ?? 1.0;

  // 1) 先给 narration 生成越南语 TTS,拿到时长以确定各段时长
  const clips = [];
  for (let i = 0; i < spec.clips.length; i++) {
    const c = spec.clips[i];
    if (c.type === "narration") {
      const audioAbs = ensure(join(dir, "work", `narr-${i}.mp3`));
      // 已有 mp3 则直接取时长,避免重复计费(越南语音色不产时间戳,synth 的缓存判定命不中)
      const ms = existsSync(audioAbs)
        ? await audioDurationMs(audioAbs)
        : (await synth(c.vi, audioAbs, { voice: viVoice, speed: viSpeed })).ms;
      const durMs = ms + 350; // 尾部留白
      clips.push({ ...c, i, startMs: c.gapStartMs, endMs: c.gapStartMs + durMs, durMs, narrationAudioRel: rel("work", `narr-${i}.mp3`), ttsMs: ms });
    } else {
      clips.push({ ...c, i, durMs: c.endMs - c.startMs });
    }
  }

  // 2) ffmpeg 逐段剪(快+准两级 seek + 统一编码),再 concat 成 source.mp4
  const partPaths = [];
  const { width, height } = settings.meta;
  clips.forEach((c, k) => {
    const part = ensure(join(dir, "work", `part-${k}.mp4`));
    const startSec = c.startMs / 1000;
    const durSec = c.durMs / 1000;
    const pre = Math.max(0, startSec - 3);
    const post = startSec - pre;
    // 注意:Remotion 内置 ffmpeg 关掉了大多数滤镜(只留 scale 等),故用 -r 输出帧率、不用 fps/setsar 滤镜。
    ffmpeg([
      "-y", "-ss", pre.toFixed(3), "-i", original, "-ss", post.toFixed(3), "-t", durSec.toFixed(3),
      "-vf", "scale=1920:1080", "-r", "24", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-ar", "44100", "-ac", "2", part,
    ]);
    partPaths.push(part);
  });
  const listFile = ensure(join(dir, "work", "concat.txt"));
  writeFileSync(listFile, partPaths.map((p) => `file '${p}'`).join("\n") + "\n");
  ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", ensure(join(dir, "source.mp4"))]);

  // 3) 拼 beats。zh 段按标点切成多张卡(每卡=一小句,中文逐词真实时间);
  //    narration 段一张卡(中文均匀卡拉OK + 越南语行 + 越南语解说音轨)。三行格式一致。
  const beats = [];
  let offset = 0;
  clips.forEach((c, k) => {
    const dur = c.durMs;
    if (c.type === "zh") {
      const u = findUtt(c.startMs);
      const rw = (u?.words || []).map((w) => ({ text: w.text, startMs: w.startMs - c.startMs + offset, endMs: w.endMs - c.startMs + offset }));
      const clauses = splitClauses(u?.text || "", rw);
      const viC = c.viClauses || [];
      clauses.forEach((cl, i) => {
        const s = i === 0 ? offset : cl.words[0].startMs;
        const e = i < clauses.length - 1 ? clauses[i + 1].words[0].startMs : offset + dur;
        beats.push({ id: `zh-${k}-${i}`, kind: "zh", startMs: s, endMs: e, durationMs: Math.max(1, e - s), words: cl.words, vi: viC[i] || "", flash: i === 0 });
      });
    } else {
      beats.push({
        id: `nar-${k}`, kind: "narration", startMs: offset, endMs: offset + dur, durationMs: Math.max(1, dur),
        words: stripTail(toKaraWords(c.zh || "", evenChars(c.zh || "", offset, offset + dur))), vi: c.vi || "",
        narrationAudio: c.narrationAudioRel, flash: true,
      });
    }
    offset += dur;
  });

  // 4) 成本记账(ASR 已在预处理跑过,这里据全片音频时长核算,不重复计费)
  const fullSec = await audioDurationMs(join(dir, "work", "full-audio.mp3")).then((ms) => ms / 1000).catch(() => 0);
  const rate = 1.5; // 元/小时(大模型录音文件识别估值;精确以时长包单价为准)
  const cost = {
    asrModel: "火山 录音文件识别大模型-极速版(volc.bigasr.auc)",
    asrAudioSeconds: Math.round(fullSec),
    asrHours: +(fullSec / 3600).toFixed(3),
    estCNY: +((fullSec / 3600) * rate).toFixed(3),
    rateAssumedCNYPerHour: rate,
    ttsNarrations: clips.filter((c) => c.type === "narration").length,
    ttsNote: "越南语解说走火山 TTS(按字符计费,几条解说成本可忽略)",
  };
  writeFileSync(join(dir, "work", "cost.json"), JSON.stringify(cost, null, 2));
  console.log(`  💰 语音成本:ASR ${cost.asrAudioSeconds}s ≈ ¥${cost.estCNY}(按¥${rate}/小时估) + ${cost.ttsNarrations}条越南语TTS`);

  const totalMs = offset;
  console.log(`  混剪完成:${beats.length} 段, 总时长 ${(totalMs / 1000).toFixed(1)}s`);
  return { meta: metaFrom(settings, rel), beats };
}

// ── 整片模式 ────────────────────────────────────────────────────────────────
async function buildWhole({ dir, settings, rel, ensure }) {
  const srcVideo = join(dir, "source.mp4");
  if (!existsSync(srcVideo)) throw new Error(`缺少源视频: ${srcVideo}(把无字幕视频放到该路径,命名 source.mp4)`);
  const audioPath = ensure(join(dir, "audio.mp3"));
  if (!existsSync(audioPath)) { console.log("  抽音频 → audio.mp3(16kHz 单声道)"); extractAudioMp3(srcVideo, audioPath); }
  const totalMs = await audioDurationMs(srcVideo);

  const asrPath = join(dir, "asr.json");
  let asr;
  if (existsSync(asrPath)) { asr = JSON.parse(readFileSync(asrPath, "utf8")); console.log(`  复用 asr.json(${asr.utterances.length} 句)`); }
  else { console.log("  火山 ASR 识别中…"); asr = await recognizeFlash(audioPath); writeFileSync(asrPath, JSON.stringify(asr, null, 2)); }

  const viPath = join(dir, "vi.json");
  const viList = existsSync(viPath) ? JSON.parse(readFileSync(viPath, "utf8")) : [];
  if (!viList.length) { console.log("  ⚠️ 无 vi.json → 越南语行留空。识别句:"); asr.utterances.forEach((u, i) => console.log(`     [${i}] ${u.text}`)); }

  const utts = [...asr.utterances].sort((a, b) => a.startMs - b.startMs);
  const beats = [];
  if (utts.length && utts[0].startMs > 0) beats.push({ id: "gap-0", kind: "zh", startMs: 0, endMs: utts[0].startMs, durationMs: utts[0].startMs, words: [] });
  utts.forEach((u, i) => {
    const startMs = u.startMs;
    const endMs = i < utts.length - 1 ? utts[i + 1].startMs : totalMs;
    beats.push({ id: `u-${i}`, kind: "zh", startMs, endMs, durationMs: Math.max(1, endMs - startMs), vi: viList[i] || "", words: stripTail(toKaraWords(u.text, u.words)) });
  });
  if (!beats.length) beats.push({ id: "empty", kind: "zh", startMs: 0, endMs: totalMs, durationMs: Math.max(1, totalMs), words: [] });
  return { meta: metaFrom(settings, rel), beats };
}

export async function build(ctx) {
  const mashup = existsSync(join(ctx.dir, "clips.json"));
  console.log(`  模式: ${mashup ? "混剪(clips.json)" : "整片"}`);
  return mashup ? buildMashup(ctx) : buildWhole(ctx);
}
