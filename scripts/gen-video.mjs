// 出视频：fal.ai kling image-to-video（I2V）。国外请求走 Clash 代理，不设直连兜底。
// ★关键设计：
//  · 人物特征代入 = 输入关键帧(image_url)，prompt 只写运动，不重描外观（见 prompts/video.tpl.md）。
//  · generate_audio=false 关原声，成片用自己的 TTS，渲染层静音播放。
//  · 花钱铁律：出问题不自动重试；结果异常抛错，等用户同意再调（/base/04）。
// 视频是异步任务：用 fal queue 提交 → 轮询 status → 取 response → 下载 mp4。
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
// ★代理端口固定 7897(Clash Verge/mihomo，用户 2026-07-18 锁定，永久默认)。
const PROXY = process.env.FAL_PROXY || "http://127.0.0.1:7897";

const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

function curl(args) {
  return execFileSync("curl", ["-s", "-m", "300", "-x", PROXY, ...args], { maxBuffer: 200 * 1024 * 1024 });
}
function curlJson(args) {
  const raw = curl(args);
  try { return JSON.parse(raw.toString()); }
  catch { throw new Error(`fal 非法响应: ${raw.toString().slice(0, 200)}`); }
}

export const VIDEO_USD_PER_SEC = 0.084; // kling v3 standard，快照 2026-07-18

// { outPath, keyframePath, motionPrompt, camera, durationSec, aspectRatio, negativePrompt, settings }
//   -> { path, cached, seconds, usd }
export async function genVideo({
  outPath, keyframePath, motionPrompt, camera = "", durationSec = 4,
  aspectRatio = "3:2", negativePrompt = "text, subtitles, watermark, logo, border, extra person, face swap, deformed",
  settings, model,
}) {
  if (existsSync(outPath) && statSync(outPath).size > 50000) {
    return { path: outPath, cached: true, seconds: durationSec, usd: 0 };
  }
  if (!existsSync(keyframePath)) throw new Error(`gen-video: 关键帧不存在 ${keyframePath}（I2V 必须先出关键帧）`);
  if (!motionPrompt || !motionPrompt.trim()) throw new Error(`gen-video: motionPrompt 为空（视频 prompt 只写运动，见 video.tpl.md）`);

  const endpoint = model || settings?.video?.primaryModel || "fal-ai/kling-video/v3/standard/image-to-video";
  const dur = Math.max(3, Math.min(5, Math.round(durationSec)));
  const prompt = camera ? `${motionPrompt}\nCamera: ${camera}` : motionPrompt;

  const payload = {
    prompt,
    image_url: dataUri(keyframePath),   // ★人物特征代入
    duration: String(dur),
    generate_audio: false,               // ★关原声
    aspect_ratio: aspectRatio,
    negative_prompt: negativePrompt,
  };
  const reqFile = join(tmpdir(), `fal-vid-${randomUUID()}.json`);
  writeFileSync(reqFile, JSON.stringify(payload));

  // 1) 提交到队列
  const submit = curlJson([
    "-X", "POST", `https://queue.fal.run/${endpoint}`,
    "-H", `Authorization: Key ${KEY}`, "-H", "Content-Type: application/json",
    "--data", `@${reqFile}`,
  ]);
  const statusUrl = submit.status_url;
  const responseUrl = submit.response_url;
  if (!statusUrl || !responseUrl) throw new Error(`fal 提交失败: ${JSON.stringify(submit).slice(0, 200)}`);

  // 2) 轮询（视频通常 30s~3min）
  let done = false;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = curlJson(["-H", `Authorization: Key ${KEY}`, statusUrl]);
    if (st.status === "COMPLETED") { done = true; break; }
    if (st.status === "FAILED" || st.error) throw new Error(`kling 任务失败: ${JSON.stringify(st).slice(0, 200)}`);
  }
  if (!done) throw new Error("kling 任务超时（>5min），未自动重试，请人工确认后再调");

  // 3) 取结果 + 下载
  const res = curlJson(["-H", `Authorization: Key ${KEY}`, responseUrl]);
  const url = res?.video?.url || res?.videos?.[0]?.url;
  if (!url) throw new Error(`kling 响应缺 video url: ${JSON.stringify(res).slice(0, 200)}`);
  const buf = curl([url]);
  if (buf.length < 50000) throw new Error(`kling 返回异常小视频(${buf.length}B)，疑似出错；未重试，先报用户`);
  writeFileSync(outPath, buf);
  return { path: outPath, cached: false, seconds: dur, usd: +(dur * VIDEO_USD_PER_SEC).toFixed(3) };
}
