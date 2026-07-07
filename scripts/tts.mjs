// TTS：火山引擎「开朗姐姐」。全部 HTTP 走 curl + 代理 7897（Node fetch 不走代理）。
// 2026-07-07：请求带 with_timestamp:1，响应 addition.frontend.words[] 给每字起止毫秒 → charTimings，
// 驱动渲染层逐字跳字（卡拉OK）。时间戳缓存为 <out>.timings.json，与 mp3 一起命中才算缓存。
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
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

export async function synth(text, outPath, opts = {}) {
  const tp = timingsPath(outPath);
  const cached = existsSync(outPath) && existsSync(tp);
  if (!cached) await volcanoTTS(text, outPath, opts);
  const charTimings = existsSync(tp) ? JSON.parse(readFileSync(tp, "utf8")) : null;
  return { path: outPath, ms: await audioDurationMs(outPath), cached, charTimings };
}

if (process.argv[1] && process.argv[1].endsWith("tts.mjs") && process.argv[2]) {
  const r = await synth(process.argv[2], process.argv[3] || "public/_tts-test.mp3");
  console.log(JSON.stringify(r));
}
