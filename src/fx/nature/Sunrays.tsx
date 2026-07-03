import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Sunrays: React.FC<{ durationInFrames: number; color?: string; cx?: number; cy?: number; rayCount?: number; opacity?: number }> = ({ durationInFrames, color = "#ffe87a", cx = 0.5, cy = 0.15, rayCount = 14, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = Math.sqrt(W * W + H * H);
  const rot = t * 6;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><linearGradient id="sr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.5" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <g transform={`rotate(${rot},${W * cx},${H * cy})`}>
        {Array.from({ length: rayCount }, (_, i) => {
          const a1 = (i / rayCount) * 360;
          const a2 = a1 + 360 / rayCount * 0.55;
          const toRad = (d: number) => (d * Math.PI) / 180;
          return <polygon key={i} points={`${W * cx},${H * cy} ${W * cx + Math.cos(toRad(a1)) * r},${H * cy + Math.sin(toRad(a1)) * r} ${W * cx + Math.cos(toRad(a2)) * r},${H * cy + Math.sin(toRad(a2)) * r}`} fill={color} opacity={fade * opacity * 0.6} />;
        })}
      </g>
    </svg>
  );
};
