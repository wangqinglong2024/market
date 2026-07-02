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

// { outPath, prompt, refPaths[], settings } -> { path, cached }
export async function genImage({ outPath, prompt, refPaths = [], settings }) {
  if (existsSync(outPath)) return { path: outPath, cached: true };

  const refCount = refPaths.length;
  let model, payload;

  if (refCount === 1) {
    model = "fal-ai/flux-pro/kontext";
    payload = {
      prompt,
      image_url: dataUri(refPaths[0]),
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
      enable_safety_checker: false, // 手绘卡通场景被误判 nsfw → 黑图；用此参数关掉
    };
  } else if (refCount >= 2) {
    model = "fal-ai/nano-banana-pro/edit";
    payload = {
      prompt,
      image_urls: refPaths.map(dataUri),
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
    };
  } else {
    model = "fal-ai/nano-banana";
    payload = {
      prompt,
      num_images: 1,
      output_format: "png",
      aspect_ratio: settings.image.aspectRatio,
    };
  }

  const reqFile = join(tmpdir(), `fal-req-${randomUUID()}.json`);
  writeFileSync(reqFile, JSON.stringify(payload));

  const maxRetries = settings.image.maxRetries ?? 3;
  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const raw = curlPost(`https://fal.run/${model}`, reqFile);
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
        return { path: outPath, cached: false };
      } catch (e) {
        console.log(`  attempt ${attempt + 1}/${maxRetries} error:`, e.message?.slice(0, 120));
      }
    }
    throw new Error(`image gen permanently failed after ${maxRetries} attempts: ${outPath}`);
  } finally {
    try { unlinkSync(reqFile); } catch (_) {}
  }
}
