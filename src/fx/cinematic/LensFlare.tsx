import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const LensFlare: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number }> = ({ durationInFrames, cx = 0.2, cy = 0.15, color = "#fff8cc", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = W * cx, y = H * cy;
  const pulse = 0.85 + Math.sin(t * 1.5 * Math.PI * 2) * 0.15;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="lf-c" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={color} stopOpacity="0.9" /><stop offset="40%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></radialGradient>
        <filter id="lf-g"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <circle cx={x} cy={y} r={120 * pulse} fill="url(#lf-c)" opacity={fade * opacity} />
      <circle cx={x} cy={y} r={30 * pulse} fill={color} opacity={fade * opacity * 0.8} filter="url(#lf-g)" />
      <line x1={x - 180} y1={y} x2={x + 180} y2={y} stroke={color} strokeWidth={1.5} opacity={fade * opacity * 0.3} />
      <line x1={x} y1={y - 120} x2={x} y2={y + 120} stroke={color} strokeWidth={1} opacity={fade * opacity * 0.2} />
      {[0.3, 0.55, 0.75].map((r, i) => <circle key={i} cx={x + (W / 2 - x) * r * 2} cy={y + (H / 2 - y) * r * 2} r={(12 - i * 3) * pulse} fill={color} opacity={fade * opacity * (0.4 - i * 0.1)} />)}
    </svg>
  );
};
