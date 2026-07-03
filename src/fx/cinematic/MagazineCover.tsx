import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const MagazineCover: React.FC<{ durationInFrames: number; color?: string; thickness?: number; opacity?: number }> = ({ durationInFrames, color = "#c8a050", thickness = 12, opacity = 0.7 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const slide = interpolate(frame, [0, fps * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames - fps * 0.5, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W * slide} height={thickness} fill={color} opacity={fade * opacity} />
      <rect x={W - W * slide} y={H - thickness} width={W * slide} height={thickness} fill={color} opacity={fade * opacity} />
      <rect x={0} y={0} width={thickness} height={H * slide} fill={color} opacity={fade * opacity} />
      <rect x={W - thickness} y={H - H * slide} width={thickness} height={H * slide} fill={color} opacity={fade * opacity} />
    </svg>
  );
};
