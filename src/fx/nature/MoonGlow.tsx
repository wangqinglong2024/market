import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const MoonGlow: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number; phase?: number }> = ({ durationInFrames, cx = 0.82, cy = 0.12, color = "#e8f0ff", opacity = 0.5, phase = 0.75 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 1, durationInFrames - fps * 0.8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 1 + Math.sin(t * 0.3 * Math.PI * 2) * 0.05;
  const r = 35 * breathe;
  const glowR = 80 * breathe;
  const x = W * cx, y = H * cy;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={color} stopOpacity="0.5" /><stop offset="100%" stopColor={color} stopOpacity="0" /></radialGradient>
        <filter id="mg-blur"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      <circle cx={x} cy={y} r={glowR} fill="url(#mg)" opacity={fade * opacity} />
      <circle cx={x} cy={y} r={r} fill={color} opacity={fade * 0.9 * opacity} filter="url(#mg-blur)" />
      <circle cx={x} cy={y} r={r * 0.85} fill={color} opacity={fade * opacity} />
      <circle cx={x + r * (phase - 0.5) * 1.8} cy={y} r={r * 0.82} fill="#1a1a3e" opacity={fade * Math.max(0, phase < 1 ? 1 : 0) * opacity * 2} />
    </svg>
  );
};
