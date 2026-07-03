import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const FilmBurn: React.FC<{ durationInFrames: number; color?: string; opacity?: number }> = ({ durationInFrames, color = "#ff6622", opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seed = Math.floor(t * 8);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="fb"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} seed={seed} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="60" /><feGaussianBlur stdDeviation="2" /></filter>
        <radialGradient id="fb-g" cx="10%" cy="10%" r="60%"><stop offset="0%" stopColor={color} stopOpacity="0.9" /><stop offset="60%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#fb-g)" filter="url(#fb)" opacity={fade * opacity} />
    </svg>
  );
};
