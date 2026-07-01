// TTS：火山引擎「开朗姐姐」（中文旁白，跨平台，仅 HTTP）。
// 时长探测用 @remotion/media-parser（不再依赖 macOS 的 afinfo/say）。
// 用法: node scripts/tts.mjs "<text>" <out.mp3>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { audioDurationMs } from "./lib/media.mjs";

const lines = readFileSync("api-key.txt", "utf8").split("\n").map((l) => l.trim());
// api-key.txt: 行5=APPID, 行7=AccessToken
const APPID = lines[4];
const TOKEN = lines[6];
const DEFAULT_VOICE = "zh_female_kailangjiejie_moon_bigtts"; // 开朗姐姐

export async function volcanoTTS(text, outPath, { voice = DEFAULT_VOICE, speed = 1.0 } = {}) {
  const body = {
    app: { appid: APPID, token: TOKEN, cluster: "volcano_tts" },
    user: { uid: "market" },
    audio: { voice_type: voice, encoding: "mp3", speed_ratio: speed },
    request: { reqid: randomUUID(), text, operation: "query" },
  };
  const res = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer;${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.code !== 3000 || !data.data) {
    throw new Error(`volcano failed: ${data.code} ${data.message || JSON.stringify(data).slice(0, 200)}`);
  }
  writeFileSync(outPath, Buffer.from(data.data, "base64"));
  return outPath;
}

// 合成（命中缓存则跳过），返回 { path, ms, cached }
export async function synth(text, outPath, opts = {}) {
  const cached = existsSync(outPath);
  if (!cached) await volcanoTTS(text, outPath, opts);
  return { path: outPath, ms: await audioDurationMs(outPath), cached };
}

// CLI
if (process.argv[1] && process.argv[1].endsWith("tts.mjs") && process.argv[2]) {
  const r = await synth(process.argv[2], process.argv[3] || "public/_tts-test.mp3");
  console.log(JSON.stringify(r));
}
