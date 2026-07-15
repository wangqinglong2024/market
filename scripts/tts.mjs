// TTS：火山引擎「开朗姐姐」。全部 HTTP 走 curl + 代理 7897（Node fetch 不走代理）。
// 2026-07-07：请求带 with_timestamp:1，响应 addition.frontend.words[] 给每字起止毫秒 → charTimings，
// 驱动渲染层逐字跳字（卡拉OK）。时间戳缓存为 <out>.timings.json。
// 2026-07-15：缓存按「文本+音色+语速」哈希（<out>.ttsmeta.json）判定——改音色/改词必重合成，都没改才命中。
import { readFileSync, writeFileSync, existsSync, unlinkSync, renameSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { audioDurationMs } from "./lib/media.mjs";

const lines = readFileSync("api-key.txt", "utf8").split("\n").map((l) => l.trim());
const APPID = lines[4];
const TOKEN = lines[6];
const DEFAULT_VOICE = "zh_female_kailangjiejie_moon_bigtts";
const PROXY = "http://127.0.0.1:7897";
const TTS_URL = "https://openspeech.bytedance.com/api/v1/tts";

const isHan = (c) => /[㐀-鿿]/.test(c);
const timingsPath = (outPath) => outPath.replace(/\.mp3$/, ".timings.json");

function postTTS(reqFile, { useProxy }) {
  const args = ["-s", "-m", "30"];
  if (useProxy) args.push("-x", PROXY);
  args.push(
    "-X", "POST", TTS_URL,
    "-H", `Authorization: Bearer;${TOKEN}`,
    "-H", "Content-Type: application/json",
    "--data", `@${reqFile}`,
  );
  return execFileSync("curl", args, { maxBuffer: 20 * 1024 * 1024 });
}

// addition.frontend.words[] → 逐汉字 {ch,startMs,endMs}。
// 标点挂在前一个字上（如「新，」），剥掉只留汉字；一个 word 含多个汉字时均分区间。
function extractCharTimings(frontend) {
  const words = frontend?.words;
  if (!Array.isArray(words)) return null;
  const out = [];
  for (const w of words) {
    const chars = Array.from(w.word || "").filter(isHan);
    if (!chars.length) continue;
    const span = (w.end_time - w.start_time) / chars.length;
    chars.forEach((c, i) => out.push({
      ch: c,
      startMs: Math.round(w.start_time + i * span),
      endMs: Math.round(w.start_time + (i + 1) * span),
    }));
  }
  return out.length ? out : null;
}

export async function volcanoTTS(text, outPath, { voice = DEFAULT_VOICE, speed = 1.0 } = {}) {
  const body = {
    app: { appid: APPID, token: TOKEN, cluster: "volcano_tts" },
    user: { uid: "market" },
    audio: { voice_type: voice, encoding: "mp3", speed_ratio: speed },
    request: { reqid: randomUUID(), text, operation: "query", with_timestamp: 1 },
  };
  const reqFile = join(tmpdir(), `tts-req-${randomUUID()}.json`);
  writeFileSync(reqFile, JSON.stringify(body));
  try {
    let raw;
    try {
      raw = postTTS(reqFile, { useProxy: true });
    } catch (err) {
      console.warn(`tts proxy failed, retrying direct: status=${err.status ?? "unknown"}`);
      raw = postTTS(reqFile, { useProxy: false });
    }
    const data = JSON.parse(raw.toString());
    if (data.code !== 3000 || !data.data) {
      throw new Error(`volcano failed: ${data.code} ${data.message || JSON.stringify(data).slice(0, 200)}`);
    }
    writeFileSync(outPath, Buffer.from(data.data, "base64"));
    // 字级时间戳：addition.frontend 是 JSON 字符串
    let charTimings = null;
    try {
      const fe = typeof data.addition?.frontend === "string"
        ? JSON.parse(data.addition.frontend)
        : data.addition?.frontend;
      charTimings = extractCharTimings(fe);
    } catch (_) { /* 无时间戳则退化为整句（渲染层兜底估算） */ }
    if (charTimings) writeFileSync(timingsPath(outPath), JSON.stringify(charTimings));
    else console.warn(`  ⚠️ 该音色未返回字级时间戳: ${outPath}`);
  } finally {
    try { unlinkSync(reqFile); } catch (_) {}
  }
  return outPath;
}

const metaPath = (outPath) => outPath.replace(/\.mp3$/, ".ttsmeta.json");

// ── 响度归一(用户 2026-07-15) ─────────────────────────────────────────────
// 不同音色出厂响度差很大(实测:中文≈-15~-18 LUFS,越南语≈-21~-23)→合成后一律增益归一
// 到 TARGET_LUFS(对齐中文配音),同片混音才不忽大忽小。纯增益(volume)不动态压缩,不伤音质;
// 真峰值封顶 -1dBTP 防削波。ffmpeg 用 remotion 自带精简版(有 loudnorm/volume/libmp3lame)。
const TARGET_LUFS = -18.0; // 所有音色纯增益可达的最大公共响度(傲娇霸总/温柔小雅峰值高,再响必削波)
const FFDIR = "node_modules/@remotion/compositor-darwin-arm64";
const FFENV = { ...process.env, DYLD_LIBRARY_PATH: FFDIR };
const ffBin = join(FFDIR, "ffmpeg");
function measureLoudness(p) {
  const r = spawnSync(ffBin, ["-hide_banner", "-nostats", "-i", p, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
    { env: FFENV, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const i = r.stderr?.match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
  const tp = r.stderr?.match(/"input_tp"\s*:\s*"(-?[\d.]+)"/);
  return i ? { lufs: parseFloat(i[1]), tp: tp ? parseFloat(tp[1]) : -99 } : null;
}
function normalizeLoudness(outPath) {
  if (!existsSync(ffBin)) return; // 无 ffmpeg 环境:跳过(不阻塞合成)
  const m = measureLoudness(outPath);
  if (!m) return;
  const need = TARGET_LUFS - m.lufs;
  if (Math.abs(need) < 0.5) return; // 差半分贝以内不折腾
  // 纯增益最透明(loudnorm 对 1-2s 短句测不准,弃用);真峰值允许顶到 -0.1dBTP 防削波。
  const gain = Math.min(need, -0.1 - m.tp);
  if (Math.abs(gain) < 0.3) return;
  const af = `volume=${gain.toFixed(2)}dB`;
  const tmp = outPath + ".norm.mp3";
  const r = spawnSync(ffBin, ["-y", "-loglevel", "error", "-i", outPath, "-af", af, "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "160k", tmp],
    { env: FFENV, encoding: "utf8" });
  if (r.status === 0 && existsSync(tmp)) renameSync(tmp, outPath);
  else { try { unlinkSync(tmp); } catch (_) {} console.warn(`  ⚠️ 响度归一失败(保留原音频): ${outPath}`); }
}

export async function synth(text, outPath, opts = {}) {
  const tp = timingsPath(outPath);
  const mp = metaPath(outPath);
  const key = createHash("sha1")
    .update(JSON.stringify({ text, voice: opts.voice ?? DEFAULT_VOICE, speed: opts.speed ?? 1.0, norm: `${TARGET_LUFS}v4` }))
    .digest("hex");
  let cached = false;
  if (existsSync(outPath) && existsSync(mp)) {
    try { cached = JSON.parse(readFileSync(mp, "utf8")).key === key; } catch (_) { /* 坏 meta 当未命中 */ }
  }
  if (!cached) {
    try { unlinkSync(tp); } catch (_) {} // 旧音色/旧文本的时间戳作废
    await volcanoTTS(text, outPath, opts);
    normalizeLoudness(outPath); // 响度归一到 TARGET_LUFS(纯增益,不改时长/时间戳)
    writeFileSync(mp, JSON.stringify({ key }));
  }
  const charTimings = existsSync(tp) ? JSON.parse(readFileSync(tp, "utf8")) : null;
  return { path: outPath, ms: await audioDurationMs(outPath), cached, charTimings };
}

if (process.argv[1] && process.argv[1].endsWith("tts.mjs") && process.argv[2]) {
  const r = await synth(process.argv[2], process.argv[3] || "public/_tts-test.mp3");
  console.log(JSON.stringify(r));
}
