// 出图：fal.ai。国外请求强制走 Clash 7890，不设直连兜底。
// 模型路由：flux-text=纯文字出图；flux=单参考图编辑；nano-pro=多参考图编辑。
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
// fal.ai 属于国外服务：必须经本机 Clash VPN，禁止直连兜底。
// ★代理端口固定 7897(Clash Verge/mihomo，用户 2026-07-18 锁定，永久默认)。
const PROXY = process.env.FAL_PROXY || "http://127.0.0.1:7897";

const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

function curlPost(url, reqFile) {
  const args = [
    "-s", "-m", "180", "-x", PROXY,
    "-X", "POST", url,
    "-H", `Authorization: Key ${KEY}`,
    "-H", "Content-Type: application/json",
    "--data", `@${reqFile}`,
  ];
  return execFileSync("curl", args, { maxBuffer: 50 * 1024 * 1024 });
}

// fal 结果图在 CDN 主机 fal.media：Windows curl 走 schannel 无法完成该主机的 TLS 握手(exit 35)，
// 改用 node fetch(OpenSSL)直连下载(直连可达、flaky 故多次重试)；实在不行再回退 curl 代理。
// 下载不是计费调用，此修复不违反 fal 花钱铁律。
async function downloadImage(url) {
  for (let i = 0; i < 6; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
    try {
      const r = await fetch(url, { signal: ac.signal });
      if (r.ok) {
        const b = Buffer.from(await r.arrayBuffer());
        if (b.length > 0) return b;
      }
    } catch (_) { /* 重试 */ } finally { clearTimeout(t); }
  }
  // 回退：curl 代理(部分环境 schannel 可用)
  return execFileSync("curl", ["-s", "-m", "90", "-x", PROXY, url], { maxBuffer: 50 * 1024 * 1024 });
}

export const MODEL_USD = { "flux-text": 0.06, flux: 0.04, "nano-pro": 0.15, "nano-edit": 0.15, "nano-t2i": 0.15 };
export const autoModel = (refCount) => (refCount === 0 ? "flux-text" : refCount >= 2 ? "nano-pro" : "flux");

// { outPath, prompt, refPaths[], settings, model } -> { path, cached, model }
export async function genImage({ outPath, prompt, refPaths = [], settings, model }) {
  if (existsSync(outPath)) return { path: outPath, cached: true, model };

  const refCount = refPaths.length;
  const modelKey = model || autoModel(refCount);

  const KNOWN = ["flux-text", "flux", "nano-pro", "nano-edit", "nano-t2i"];
  if (!KNOWN.includes(modelKey)) {
    throw new Error(`未知 model: "${modelKey}"。只允许 ${KNOWN.join(" / ")}。`);
  }
  if (modelKey === "flux-text" && refCount !== 0) {
    throw new Error(`flux-text 禁止参考图：${outPath} 收到 ${refCount} 张。`);
  }
  if (modelKey === "nano-t2i" && refCount !== 0) {
    throw new Error(`nano-t2i(文生图) 禁止参考图：${outPath} 收到 ${refCount} 张。`);
  }
  if (modelKey === "nano-edit" && refCount < 1) {
    throw new Error(`nano-edit 必须≥1张参考图：${outPath} 收到 ${refCount} 张。`);
  }
  if (modelKey === "nano-pro" && refCount < 2) {
    throw new Error(`nano-pro 只能用于多角色(≥2)：${outPath} 只有 ${refCount} 张参考图，必须用 flux。（严禁对单人/空镜用贵的 nano-pro）`);
  }
  if (modelKey === "flux" && refCount !== 1) {
    throw new Error(`flux 必须恰好 1 张参考图：${outPath} 有 ${refCount} 张。单角色喂定妆图，空镜喂风格锚图；≥2 人请用 nano-pro。`);
  }

  let endpoint, payload;
  if (modelKey === "flux-text") {
    endpoint = "fal-ai/flux-pro/v1.1-ultra";
    payload = {
      prompt,
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
      enable_safety_checker: false,
      safety_tolerance: "6",
    };
  } else if (modelKey === "nano-t2i") {
    // nano-banana-pro 文生图（首次出人物/无参考）
    endpoint = "fal-ai/nano-banana-pro";
    payload = { prompt, num_images: 1, output_format: "png", aspect_ratio: settings.image.aspectRatio };
  } else if (modelKey === "nano-edit") {
    // nano-banana-pro/edit：喂 1+ 张参考图(角色定妆图保脸/风格锚)，场景由 prompt 现写
    endpoint = "fal-ai/nano-banana-pro/edit";
    payload = { prompt, image_urls: refPaths.map(dataUri), num_images: 1, output_format: "png", aspect_ratio: settings.image.aspectRatio };
  } else if (modelKey === "nano-pro") {
    endpoint = "fal-ai/nano-banana-pro/edit";
    payload = {
      prompt,
      image_urls: refPaths.map(dataUri),
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
    };
  } else {
    // flux：kontext 喂 1 张参考图（角色定妆图 或 空镜风格锚图）
    endpoint = "fal-ai/flux-pro/kontext";
    payload = {
      prompt,
      image_url: dataUri(refPaths[0]),
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
      enable_safety_checker: false, // 手绘卡通场景被误判 nsfw → 黑图；用此参数关掉
    };
  }

  const reqFile = join(tmpdir(), `fal-req-${randomUUID()}.json`);
  writeFileSync(reqFile, JSON.stringify(payload));

  try {
    const raw = curlPost(`https://fal.run/${endpoint}`, reqFile);
    const data = JSON.parse(raw.toString());
    const url = data?.images?.[0]?.url;
    if (!url) {
      throw new Error(`fal response missing image url: ${JSON.stringify(data).slice(0, 150)}`);
    }
    const imgBuf = await downloadImage(url);
    // 黑图检测：fal safety filter 触发时 HTTP 200 但返回约 10372 字节全黑 PNG，不报错。
    // 按 plan，发现模型结果异常时直接报错，等待用户同意后才重调。
    if (imgBuf.length < 20000) {
      throw new Error(`black/tiny image detected (${imgBuf.length}B, nsfw filter?): ${outPath}`);
    }
    writeFileSync(outPath, imgBuf);
    return { path: outPath, cached: false, model: modelKey };
  } finally {
    try { unlinkSync(reqFile); } catch (_) {}
  }
}
