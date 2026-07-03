import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const FlickerCut: React.FC<{ durationInFrames: number; color?: string; opacity?: number; rate?: number }> = ({ durationInFrames, color = "#fff", opacity = 0.4, rate = 3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flicker = Math.pow(Math.max(0, Math.sin(t * rate * Math.PI * 2 + Math.sin(t * 7))), 4);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={H} fill={color} opacity={fade * flicker * opacity} />
    </svg>
  );
};
