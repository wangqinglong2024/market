import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Letterbox: React.FC<{ durationInFrames: number; barRatio?: number; color?: string; opacity?: number }> = ({ durationInFrames, barRatio = 0.1, color = "#000", opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const open = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const close = interpolate(frame, [durationInFrames - fps * 0.5, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barH = H * barRatio * Math.min(open, close);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={barH} fill={color} opacity={opacity} />
      <rect x={0} y={H - barH} width={W} height={barH} fill={color} opacity={opacity} />
    </svg>
  );
};
