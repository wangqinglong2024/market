// 宽幅柔光带斜向平移 — 如晨光透窗、舞台追光扫过
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const SweepBeam: React.FC<{
  durationInFrames: number;
  color?: string;
  angleDeg?: number;    // 倾斜角度，默认 22
  widthRatio?: number;  // 光带宽度占帧宽比例，默认 0.9
  opacity?: number;     // 峰值透明度，默认 0.38
}> = ({ durationInFrames, color = "#fff5cc", angleDeg = 22, widthRatio = 0.9, opacity = 0.38 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cx = interpolate(frame, [0, durationInFrames * 1.15], [-W * 0.5, W * 1.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bw = W * widthRatio;

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="swBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="35%" stopColor={color} stopOpacity={opacity * 0.7} />
          <stop offset="55%" stopColor={color} stopOpacity={opacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${cx}, ${H / 2}) rotate(${angleDeg})`}>
        <rect x={-bw / 2} y={-H * 1.5} width={bw} height={H * 3} fill="url(#swBeam)" opacity={fade} />
      </g>
    </svg>
  );
};
