// 跨平台音频时长（纯 JS，无需 ffmpeg/ffprobe）。
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";

export async function audioDurationMs(path) {
  const { slowDurationInSeconds } = await parseMedia({
    src: path,
    reader: nodeReader,
    acknowledgeRemotionLicense: true,
    fields: { slowDurationInSeconds: true },
  });
  return Math.round(slowDurationInSeconds * 1000);
}
