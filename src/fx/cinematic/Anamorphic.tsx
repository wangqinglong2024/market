import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Anamorphic: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.4, color = "#88ccff", opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin(t * 0.8 * Math.PI * 2) * 0.15;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="ana-blur"><feGaussianBlur stdDeviation={`${30 * pulse} 1`} /></filter>
        <radialGradient id="ana-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={color} stopOpacity="0.9" /><stop offset="100%" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={W * cx} cy={H * cy} rx={W * 0.6 * pulse} ry={4 * pulse} fill={color} opacity={fade * opacity * 0.7} filter="url(#ana-blur)" />
      <ellipse cx={W * cx} cy={H * cy} rx={W * 0.9 * pulse} ry={2 * pulse} fill={color} opacity={fade * opacity * 0.4} filter="url(#ana-blur)" />
    </svg>
  );
};
