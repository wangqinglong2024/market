import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SplitTone: React.FC<{ durationInFrames: number; shadowColor?: string; highlightColor?: string; opacity?: number }> = ({ durationInFrames, shadowColor = "#1a0a3e", highlightColor = "#fff5cc", opacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="st" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={highlightColor} stopOpacity="0.6" />
          <stop offset="50%" stopColor="#888" stopOpacity="0" />
          <stop offset="100%" stopColor={shadowColor} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#st)" opacity={fade * opacity} style={{ mixBlendMode: "color" }} />
    </svg>
  );
};
