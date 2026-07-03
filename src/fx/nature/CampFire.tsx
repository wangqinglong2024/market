import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const CampFire: React.FC<{ durationInFrames: number; cx?: number; cy?: number; opacity?: number; size?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.75, opacity = 0.5, size = 60 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = W * cx, y = H * cy;
  const flickerH = size + Math.sin(t * 8) * size * 0.15 + Math.sin(t * 13) * size * 0.08;
  const flickerW = size * 0.5 + Math.sin(t * 6) * size * 0.06;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="cf-glow" cx="50%" cy="80%" r="50%"><stop offset="0%" stopColor="#ffaa00" stopOpacity="0.6" /><stop offset="100%" stopColor="#ff4400" stopOpacity="0" /></radialGradient>
        <filter id="cf-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx={x} cy={y + 10} rx={size * 0.9} ry={size * 0.3} fill="#ff6600" opacity={fade * opacity * 0.5} filter="url(#cf-blur)" />
      <ellipse cx={x} cy={y - flickerH * 0.3} rx={flickerW * 0.6} ry={flickerH * 0.6} fill="#ffaa00" opacity={fade * opacity * 0.7} />
      <ellipse cx={x} cy={y - flickerH * 0.15} rx={flickerW} ry={flickerH * 0.4} fill="#ff6600" opacity={fade * opacity} />
      <ellipse cx={x} cy={y - flickerH * 0.1} rx={flickerW * 1.1} ry={flickerH * 0.2} fill="#ff3300" opacity={fade * opacity} />
      <ellipse cx={x} cy={y + 5} rx={size * 1.8} ry={size * 0.4} fill="url(#cf-glow)" opacity={fade * opacity * 0.8} />
    </svg>
  );
};
