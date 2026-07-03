import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DiagonalWipe: React.FC<{ durationInFrames: number; color?: string; opacity?: number }> = ({ durationInFrames, color = "#ffe0f0", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const offset = (W + H) * p;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <polygon points={`0,0 ${Math.min(offset, W)},0 0,${Math.min(offset, H)}`} fill={color} opacity={fade * opacity} />
    </svg>
  );
};
