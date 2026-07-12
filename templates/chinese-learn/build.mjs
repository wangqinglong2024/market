// 模板「chinese-learn」构建流水线:输入一个无字幕中文视频 → 输出学习版字幕片 manifest。
//   1) 从 source.mp4 抽音频(Remotion 内置 ffmpeg)
//   2) 火山「录音文件识别大模型」极速版 → 逐字时间戳(缓存 asr.json)
//   3) Intl.Segmenter 中文分词 → 逐词卡拉OK单元(拼音由 pinyin-pro 生成)
//   4) 越南语:读同目录 vi.json(每句一条,与识别句同序);缺则留空(渲染两行)
//   5) 拼成 beats 铺满整条时间线(含句间静音),交 chinese-learn 版式渲染
// 产物目录: public/videos/<shard>/<id>/  需预先放好 source.mp4。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pinyin } from "pinyin-pro";
import { recognizeFlash } from "../../scripts/asr.mjs";
import { audioDurationMs } from "../../scripts/lib/media.mjs";

const require = createRequire(import.meta.url);
const isHan = (c) => /[㐀-鿿]/.test(c);

// 抽音频并转码 16kHz 单声道 mp3(火山 ASR 友好)。Remotion 的 extractAudio 只 remux 不转码,
// AAC→mp3 会失败;内置 ffmpeg 二进制又依赖 Remotion 包装设的动态库路径(直接调会 SIGABRT),
// 故走 `remotion ffmpeg`(libmp3lame 转码,CLI 会正确设置库路径)。
function extractAudioMp3(srcVideo, audioPath) {
  const remotionBin = join(process.cwd(), "node_modules", ".bin", "remotion");
  const bin = existsSync(remotionBin) ? remotionBin : "npx";
  const pre = bin === "npx" ? ["remotion"] : [];
  const args = ["ffmpeg", "-y", "-i", srcVideo, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "libmp3lame", "-q:a", "5", audioPath];
  execFileSync(bin, [...pre, ...args], { stdio: "ignore" });
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

// 一句 → 逐词卡拉OK单元:分词后按汉字数从逐字时间戳里取窗口,标点粘到前一词显示上。
function toKaraWords(utt) {
  const chars = flattenChars(utt.words);
  const segs = [...new Intl.Segmenter("zh", { granularity: "word" }).segment(utt.text || "")];
  const words = [];
  let ci = 0;
  for (const s of segs) {
    const han = Array.from(s.segment).filter(isHan);
    if (s.isWordLike && han.length) {
      const slice = chars.slice(ci, ci + han.length);
      ci += han.length;
      if (!slice.length) continue;
      words.push({
        zh: s.segment,
        py: pinyin(s.segment, { toneType: "symbol", type: "array", nonZh: "removed" }).join(" "),
        startMs: slice[0].startMs,
        endMs: slice[slice.length - 1].endMs,
      });
    } else if (words.length) {
      words[words.length - 1].zh += s.segment; // 标点/空格/非汉字 → 粘到前一词
    }
  }
  return words;
}

export async function build({ videoId, dir, settings, rel, ensure }) {
  // 1) 定位源视频
  const srcVideo = join(dir, "source.mp4");
  if (!existsSync(srcVideo)) {
    throw new Error(`缺少源视频: ${srcVideo}(把无字幕视频放到该路径,命名 source.mp4)`);
  }

  // 2) 抽音频(缓存)
  const audioPath = ensure(join(dir, "audio.mp3"));
  if (!existsSync(audioPath)) {
    console.log("  抽音频 → audio.mp3(16kHz 单声道)");
    extractAudioMp3(srcVideo, audioPath);
  }

  const totalMs = await audioDurationMs(srcVideo);

  // 3) ASR(缓存 asr.json)
  const asrPath = join(dir, "asr.json");
  let asr;
  if (existsSync(asrPath)) {
    asr = JSON.parse(readFileSync(asrPath, "utf8"));
    console.log(`  复用 asr.json(${asr.utterances.length} 句)`);
  } else {
    console.log("  火山 ASR 识别中…");
    asr = await recognizeFlash(audioPath);
    writeFileSync(asrPath, JSON.stringify(asr, null, 2));
    console.log(`  识别完成:${asr.utterances.length} 句`);
  }

  // 4) 越南语侧车(vi.json:字符串数组,与识别句同序)
  const viPath = join(dir, "vi.json");
  const viList = existsSync(viPath) ? JSON.parse(readFileSync(viPath, "utf8")) : [];
  if (!viList.length) {
    console.log("  ⚠️ 无 vi.json → 越南语行留空。识别到的句子(供翻译后写入 vi.json):");
    asr.utterances.forEach((u, i) => console.log(`     [${i}] ${u.text}`));
  }

  // 5) 拼 beats,铺满 [0, totalMs](句间静音并入前句,首句前补空白拍)
  const utts = [...asr.utterances].sort((a, b) => a.startMs - b.startMs);
  const beats = [];
  if (utts.length && utts[0].startMs > 0) {
    beats.push({ id: "gap-0", startMs: 0, endMs: utts[0].startMs, durationMs: utts[0].startMs, words: [] });
  }
  utts.forEach((u, i) => {
    const startMs = u.startMs;
    const endMs = i < utts.length - 1 ? utts[i + 1].startMs : totalMs;
    beats.push({
      id: `u-${i}`,
      startMs,
      endMs,
      durationMs: Math.max(1, endMs - startMs),
      vi: viList[i] || "",
      words: toKaraWords(u),
    });
  });
  if (!beats.length) {
    beats.push({ id: "empty", startMs: 0, endMs: totalMs, durationMs: Math.max(1, totalMs), words: [] });
  }

  // 6) 组装 manifest.meta(来自 template.json 深合并全局 settings)
  const meta = {
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

  return { meta, beats };
}
