import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const PolaroidFrame: React.FC<{ durationInFrames: number; color?: string; bottomPad?: number; opacity?: number }> = ({ durationInFrames, color = "#fff", bottomPad = 70, opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pad = 16;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={pad} fill={color} opacity={fade * opacity} />
      <rect x={0} y={H - bottomPad} width={W} height={bottomPad} fill={color} opacity={fade * opacity} />
      <rect x={0} y={0} width={pad} height={H} fill={color} opacity={fade * opacity} />
      <rect x={W - pad} y={0} width={pad} height={H} fill={color} opacity={fade * opacity} />
    </svg>
  );
};
