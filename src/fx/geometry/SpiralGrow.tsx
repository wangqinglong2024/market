import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SpiralGrow: React.FC<{ durationInFrames: number; color?: string; turns?: number; opacity?: number }> = ({ durationInFrames, color = "#c4a0ff", turns = 4, opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxR = Math.min(W, H) * 0.4;
  const steps = 200;
  const points = Array.from({ length: Math.ceil(steps * progress) }, (_, i) => {
    const a = (i / steps) * turns * Math.PI * 2 + t * 0.5;
    const r = (i / steps) * maxR;
    return `${i === 0 ? "M" : "L"}${W / 2 + Math.cos(a) * r},${H / 2 + Math.sin(a) * r}`;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={points.join(" ")} fill="none" stroke={color} strokeWidth={2} opacity={fade * opacity} />
    </svg>
  );
};
