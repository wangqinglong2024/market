// 火山引擎「录音文件识别大模型」客户端。极速版(flash):单次同步、内联音频、免公网托管。
// 走 curl + 代理 7897(和 tts.mjs 一致,Node fetch 不走代理)。
// 凭证从 api-key.txt 的「豆包ASR」段读(default 应用,与 TTS 的 9026810357 是两个不同应用)。
// 返回逐字时间戳:result.utterances[].words[] 每词(中文为逐字)带 start_time/end_time 毫秒。
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROXY = "http://127.0.0.1:7897";
const FLASH_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash";
const RESOURCE_ID = "volc.bigasr.auc_turbo"; // 极速版

// 从 api-key.txt 的「豆包ASR」段落解析 { appid, token }。
// 段格式:  豆包ASR...  / APP ID / <appid> / Access Token / <token> / Secret Key / <secret>
export function loadAsrCreds(root = process.cwd()) {
  const lines = readFileSync(join(root, "api-key.txt"), "utf8").split("\n").map((l) => l.trim());
  const start = lines.findIndex((l) => /ASR/i.test(l));
  if (start < 0) throw new Error("api-key.txt 缺少「豆包ASR」凭证段");
  const seg = lines.slice(start);
  const after = (label) => {
    const i = seg.findIndex((l) => l === label);
    return i >= 0 ? seg[i + 1] : undefined;
  };
  const appid = after("APP ID");
  const token = after("Access Token");
  if (!appid || !token) throw new Error("api-key.txt 的 ASR 段缺 APP ID / Access Token");
  return { appid, token };
}

// 识别本地音频文件(极速版,内联 base64)。format 例:"mp3" | "wav"。
// 返回 { text, utterances: [{ text, startMs, endMs, words: [{ text, startMs, endMs }] }] }。
export async function recognizeFlash(audioPath, { format = "mp3", root = process.cwd(), enableItn = false } = {}) {
  const { appid, token } = loadAsrCreds(root);
  const reqId = randomUUID();
  const body = {
    user: { uid: "market" },
    audio: { data: readFileSync(audioPath).toString("base64"), format },
    request: {
      model_name: "bigmodel",
      enable_punc: true,      // 自动标点 → 便于切句/切字幕卡
      enable_itn: enableItn,  // 默认关:保留口语汉字形态(如"二零二六"不转"2026")
      show_utterances: true,  // 返回逐句 + 逐词时间戳
    },
  };
  const reqFile = join(tmpdir(), `asr-${reqId}.json`);
  writeFileSync(reqFile, JSON.stringify(body));
  const args = [
    "-s", "-m", "120", "-x", PROXY, "-D", "-",
    "-X", "POST", FLASH_URL,
    "-H", `X-Api-App-Key: ${appid}`,
    "-H", `X-Api-Access-Key: ${token}`,
    "-H", `X-Api-Resource-Id: ${RESOURCE_ID}`,
    "-H", `X-Api-Request-Id: ${reqId}`,
    "-H", "X-Api-Sequence: -1",
    "-H", "Content-Type: application/json",
    "--data", `@${reqFile}`,
  ];
  const raw = execFileSync("curl", args, { maxBuffer: 64 * 1024 * 1024 }).toString();
  const status = (raw.match(/x-api-status-code:\s*(\S+)/i) || [])[1];
  const msg = (raw.match(/x-api-message:\s*(.+)/i) || [])[1];
  if (status !== "20000000") {
    throw new Error(`火山 ASR 失败: status=${status} msg=${(msg || "").trim()}`);
  }
  const data = JSON.parse(raw.split("\r\n\r\n").pop());
  const utts = (data?.result?.utterances || []).map((u) => ({
    text: u.text,
    startMs: u.start_time,
    endMs: u.end_time,
    words: (u.words || []).map((w) => ({ text: w.text, startMs: w.start_time, endMs: w.end_time })),
  }));
  return { text: data?.result?.text ?? "", utterances: utts };
}

// CLI:node scripts/asr.mjs <audioPath> → 打印识别结果 JSON。
if (process.argv[1] && process.argv[1].endsWith("asr.mjs") && process.argv[2]) {
  const r = await recognizeFlash(process.argv[2]);
  console.log(JSON.stringify(r, null, 2));
}
