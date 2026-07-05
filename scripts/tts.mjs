// TTS：火山引擎「开朗姐姐」。全部 HTTP 走 curl + 代理 7897（Node fetch 不走代理）。
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

export async function volcanoTTS(text, outPath, { voice = DEFAULT_VOICE, speed = 1.0 } = {}) {
  const body = {
    app: { appid: APPID, token: TOKEN, cluster: "volcano_tts" },
    user: { uid: "market" },
    audio: { voice_type: voice, encoding: "mp3", speed_ratio: speed },
    request: { reqid: randomUUID(), text, operation: "query" },
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
  } finally {
    try { unlinkSync(reqFile); } catch (_) {}
  }
  return outPath;
}

export async function synth(text, outPath, opts = {}) {
  const cached = existsSync(outPath);
  if (!cached) await volcanoTTS(text, outPath, opts);
  return { path: outPath, ms: await audioDurationMs(outPath), cached };
}

if (process.argv[1] && process.argv[1].endsWith("tts.mjs") && process.argv[2]) {
  const r = await synth(process.argv[2], process.argv[3] || "public/_tts-test.mp3");
  console.log(JSON.stringify(r));
}
