// 出图：fal.ai。fal 调用全部走 curl + 代理（Node fetch 直连会超时）。
// 模型路由：单角色 → flux-pro/kontext（$0.04）；多角色 → nano-banana-pro/edit（$0.15）；
//          无角色 → nano-banana 文生图（仅锁画风）。
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const PROXY = "http://127.0.0.1:7897";

const dataUri = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

function curlPost(url, reqFile) {
  return execSync(
    `curl -s -m 180 -x ${PROXY} -X POST "${url}" ` +
    `-H "Authorization: Key ${KEY}" -H "Content-Type: application/json" ` +
    `--data @${reqFile}`,
    { maxBuffer: 50 * 1024 * 1024 }
  );
}

function curlGet(url) {
  return execSync(`curl -s -m 90 -x ${PROXY} "${url}"`, { maxBuffer: 50 * 1024 * 1024 });
}

// 只有两个模型（用户 2026-07-03 锁定）：
//   flux     = flux-pro/kontext，喂 1 张参考图。单角色→喂该角色定妆图；空镜→喂风格锚图(只借画风)。
//              严禁 nano-banana / flux-dev 文生图（无锚会画风漂移）。
//   nano-pro = 且仅当 ≥2 个角色同框。
export const MODEL_USD = { flux: 0.04, "nano-pro": 0.15 };
// 按参考图数得出“应当”用的模型：≥2=nano-pro，否则 flux。
export const autoModel = (refCount) => (refCount >= 2 ? "nano-pro" : "flux");

// { outPath, prompt, refPaths[], settings, model } -> { path, cached, model }
export async function genImage({ outPath, prompt, refPaths = [], settings, model }) {
  if (existsSync(outPath)) return { path: outPath, cached: true, model };

  const refCount = refPaths.length;
  const modelKey = model || autoModel(refCount);

  // ★ 强制护栏（用户硬规矩）：只允许 flux / nano-pro；flux 必须恰好 1 张参考图(角色定妆或风格锚)；nano-pro 仅限 ≥2。
  if (modelKey !== "flux" && modelKey !== "nano-pro") {
    throw new Error(`未知 model: "${modelKey}"。只允许 "flux"(0或1人) / "nano-pro"(≥2人)。禁用 nano-banana / flux-dev 文生图。`);
  }
  if (modelKey === "nano-pro" && refCount < 2) {
    throw new Error(`nano-pro 只能用于多角色(≥2)：${outPath} 只有 ${refCount} 张参考图，必须用 flux。（严禁对单人/空镜用贵的 nano-pro）`);
  }
  if (modelKey === "flux" && refCount !== 1) {
    throw new Error(`flux 必须恰好 1 张参考图：${outPath} 有 ${refCount} 张。单角色喂定妆图，空镜喂风格锚图；≥2 人请用 nano-pro。`);
  }

  let endpoint, payload;
  if (modelKey === "nano-pro") {
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

  const maxRetries = settings.image.maxRetries ?? 3;
  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const raw = curlPost(`https://fal.run/${endpoint}`, reqFile);
        const data = JSON.parse(raw.toString());
        const url = data?.images?.[0]?.url;
        if (!url) {
          console.log(`  image gen failed (try ${attempt + 1}/${maxRetries})`, JSON.stringify(data).slice(0, 150));
          continue;
        }
        const imgBuf = curlGet(url);
        // 黑图检测：fal safety filter 触发时 HTTP 200 但返回约 10372 字节全黑 PNG，不报错
        if (imgBuf.length < 20000) {
          console.log(`  black/tiny image detected (${imgBuf.length}B, nsfw filter?), retrying…`);
          continue;
        }
        writeFileSync(outPath, imgBuf);
        return { path: outPath, cached: false, model: modelKey };
      } catch (e) {
        console.log(`  attempt ${attempt + 1}/${maxRetries} error:`, e.message?.slice(0, 120));
      }
    }
    throw new Error(`image gen permanently failed after ${maxRetries} attempts: ${outPath}`);
  } finally {
    try { unlinkSync(reqFile); } catch (_) {}
  }
}
