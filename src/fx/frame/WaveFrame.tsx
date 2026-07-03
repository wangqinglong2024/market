import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WaveFrame: React.FC<{ durationInFrames: number; color?: string; opacity?: number; depth?: number }> = ({ durationInFrames, color = "#aaddff", opacity = 0.55, depth = 30 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const steps = 40;
  const topPts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = (i / steps) * W;
    const y = depth * 0.5 + Math.sin(x * 0.02 + t * 2) * depth * 0.5;
    return `${x},${y}`;
  });
  const botPts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = ((steps - i) / steps) * W;
    const y = H - depth * 0.5 - Math.sin(x * 0.02 - t * 2) * depth * 0.5;
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={`M0,0 L${topPts.join(" L")} L${W},0 Z`} fill={color} opacity={fade * opacity} />
      <path d={`M${W},${H} L${botPts.join(" L")} L0,${H} Z`} fill={color} opacity={fade * opacity} />
    </svg>
  );
};
