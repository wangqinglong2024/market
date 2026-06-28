// TTS：优先火山引擎「开朗姐姐」，失败则回退 macOS 系统中文语音(say)
// 用法: node scripts/tts.mjs "<text>" <out.mp3 或 out.wav>
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const lines = readFileSync("api-key.txt", "utf8").split("\n").map((l) => l.trim());
// api-key.txt: 行5=APPID, 行7=AccessToken, 行9=SecretKey
const APPID = lines[4];
const TOKEN = lines[6];

export async function volcanoTTS(text, outPath) {
  const body = {
    app: { appid: APPID, token: TOKEN, cluster: "volcano_tts" },
    user: { uid: "demo" },
    audio: {
      voice_type: "zh_female_kailangjiejie_moon_bigtts",
      encoding: "mp3",
      speed_ratio: 1.0,
    },
    request: { reqid: randomUUID(), text, operation: "query" },
  };
  const res = await fetch("https://openspeech.bytedance.com/api/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer;${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.code !== 3000 || !data.data) {
    throw new Error(`volcano failed: ${data.code} ${data.message || JSON.stringify(data).slice(0,200)}`);
  }
  writeFileSync(outPath, Buffer.from(data.data, "base64"));
  return "volcano";
}

export function sayTTS(text, outPath) {
  // 输出 wav（Chromium 可播放）。中文音色优先 Tingting/Meijia
  const aiff = outPath.replace(/\.(mp3|wav)$/, ".aiff");
  execFileSync("say", ["-v", "Tingting", "-o", aiff, text]);
  execFileSync("afconvert", [aiff, outPath, "-d", "LEI16", "-f", "WAVE"]);
  return "say";
}

export function durationMs(path) {
  const out = execFileSync("afinfo", [path]).toString();
  const m = out.match(/estimated duration:\s*([0-9.]+)\s*sec/);
  return m ? Math.round(parseFloat(m[1]) * 1000) : 0;
}

// 合成：先火山，失败回退 say。返回 {engine, path, ms}
export async function synth(text, outBase) {
  try {
    const mp3 = outBase + ".mp3";
    await volcanoTTS(text, mp3);
    return { engine: "volcano", path: mp3, ms: durationMs(mp3) };
  } catch (e) {
    console.error("  volcano error -> fallback say:", e.message);
    const wav = outBase + ".wav";
    sayTTS(text, wav);
    return { engine: "say", path: wav, ms: durationMs(wav) };
  }
}

// CLI 测试
if (process.argv[1].endsWith("tts.mjs") && process.argv[2]) {
  const r = await synth(process.argv[2], process.argv[3] || "public/videos/demo/audio/_test");
  console.log(JSON.stringify(r));
}
