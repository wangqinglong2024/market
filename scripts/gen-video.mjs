// 出视频：fal.ai kling image-to-video（I2V）。国外请求走 Clash 代理，不设直连兜底。
// ★关键设计：
//  · 人物特征代入 = 输入关键帧(image_url)，prompt 只写运动，不重描外观（见 prompts/video.tpl.md）。
//  · generate_audio=false 关原声，成片用自己的 TTS，渲染层静音播放。
//  · 花钱铁律：出问题不自动重试；结果异常抛错，等用户同意再调（/base/04）。
// 视频是异步任务：用 fal queue 提交 → 轮询 status → 取 response → 下载 mp4。
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
// ★代理端口固定 7897(Clash Verge/mihomo，用户 2026-07-18 锁定，永久默认)。
const PROXY = process.env.FAL_PROXY || "http://127.0.0.1:7897";

const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

// ── 尺寸铁律：最终交付固定 3:2；kling 只认 16:9，故「喂图前裁 16:9 → 收片后裁 3:2」──────
// 用户 2026-07-18 锁：我不管 kling 规则，最终呈现给用户的比例固定。用 remotion 自带 ffmpeg
// (无系统 ffmpeg 依赖)。裁切是本地无成本操作，不触发 fal 花钱铁律。
const FFDIR = "node_modules/@remotion/compositor-darwin-arm64";
const FFENV = { ...process.env, DYLD_LIBRARY_PATH: FFDIR };
const ffBin = join(FFDIR, "ffmpeg");
const ffprobeBin = join(FFDIR, "ffprobe");
const parseAspect = (a) => { const [w, h] = String(a).split(":").map(Number); return w / h; };

function probeWH(p) {
  const r = spawnSync(ffprobeBin, ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", p], { env: FFENV, encoding: "utf8" });
  const m = (r.stdout || "").trim().match(/(\d+)x(\d+)/);
  if (!m) throw new Error(`ffprobe 读不到尺寸: ${p} (${(r.stderr || "").slice(0, 120)})`);
  return { w: +m[1], h: +m[2] };
}
// 居中裁到目标比例(targetAspect=w/h)。图片输出 png；视频 libx264 重编码(去音轨)。
function cropToAspect(inPath, outPath, targetAspect, { video = false } = {}) {
  if (!existsSync(ffBin)) throw new Error(`缺 ffmpeg(${ffBin})，无法裁到固定比例；不能交付非标准尺寸`);
  const { w, h } = probeWH(inPath);
  const cur = w / h;
  const even = (n) => Math.max(2, Math.floor(n / 2) * 2);
  let cw = w, ch = h;
  if (cur > targetAspect) cw = even(h * targetAspect);   // 太宽→裁两边
  else ch = even(w / targetAspect);                       // 太高→裁上下
  const x = Math.floor((w - cw) / 2), y = Math.floor((h - ch) / 2);
  const vf = `crop=${cw}:${ch}:${x}:${y}`;
  const args = video
    ? ["-y", "-loglevel", "error", "-i", inPath, "-an", "-vf", vf,
       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "veryfast", outPath]
    : ["-y", "-loglevel", "error", "-i", inPath, "-vf", vf, outPath];
  const r = spawnSync(ffBin, args, { env: FFENV, encoding: "utf8" });
  if (r.status !== 0 || !existsSync(outPath)) throw new Error(`ffmpeg 裁切失败(${inPath}→${targetAspect}): ${(r.stderr || "").slice(0, 200)}`);
  return outPath;
}

function curl(args) {
  return execFileSync("curl", ["-s", "-m", "300", "-x", PROXY, ...args], { maxBuffer: 200 * 1024 * 1024 });
}
// 成片下载(fal CDN)：Clash 偶尔瞬断，单次 curl 会失败 → 白烧一次 kling(任务已完成计费)。
// 故仿 gen-image：node fetch(直连/不走代理,OpenSSL)多次重试,再回退 curl 代理。下载不计费,重试不违反花钱铁律。
async function downloadVideo(url) {
  for (let i = 0; i < 6; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 60000);
    try {
      const r = await fetch(url, { signal: ac.signal });
      if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length > 50000) return b; }
    } catch (_) { /* 重试 */ } finally { clearTimeout(t); }
  }
  try { const b = curl([url]); if (b.length > 50000) return b; } catch (_) { /* 落到抛错 */ }
  throw new Error(`成片下载失败(6次 fetch + curl 代理都没成)：${url}`);
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
  aspectRatio = "16:9", finalAspect = null,
  negativePrompt = "text, subtitles, watermark, logo, border, extra person, face swap, deformed",
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

  // ★finalAspect 设了(如 3:2)：喂图前把关键帧居中裁成 kling 比例(16:9)，避免 kling 加黑边/自裁失控。
  let klingImagePath = keyframePath;
  const tmpCropIn = join(tmpdir(), `fal-vid-kf-${randomUUID()}.png`);
  if (finalAspect) klingImagePath = cropToAspect(keyframePath, tmpCropIn, parseAspect(aspectRatio));

  const payload = {
    prompt,
    image_url: dataUri(klingImagePath),   // ★人物特征代入(已裁到 kling 比例)
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
  const buf = await downloadVideo(url);
  if (buf.length < 50000) throw new Error(`kling 返回异常小视频(${buf.length}B)，疑似出错；未重试，先报用户`);

  // ★收片后把 kling 的 16:9 居中裁成最终固定比例(finalAspect=3:2)，两边裁掉 → 全片尺寸统一。
  if (finalAspect) {
    const tmpRaw = join(tmpdir(), `fal-vid-raw-${randomUUID()}.mp4`);
    writeFileSync(tmpRaw, buf);
    try {
      cropToAspect(tmpRaw, outPath, parseAspect(finalAspect), { video: true });
    } finally {
      try { unlinkSync(tmpRaw); } catch (_) {}
      try { unlinkSync(tmpCropIn); } catch (_) {}
    }
  } else {
    writeFileSync(outPath, buf);
  }
  return { path: outPath, cached: false, seconds: dur, usd: +(dur * VIDEO_USD_PER_SEC).toFixed(3) };
}
