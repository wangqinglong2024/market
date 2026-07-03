import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Fog: React.FC<{ durationInFrames: number; color?: string; opacity?: number; density?: number }> = ({ durationInFrames, color = "#ddeeff", opacity = 0.35, density = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 1.2, durationInFrames - fps * 0.8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bf = 0.003 * density;
  const seed = t * 0.05;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="fog-f"><feTurbulence type="fractalNoise" baseFrequency={`${bf} ${bf * 0.5}`} numOctaves={3} seed={seed} result="n" /><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2 -0.5" in="n" result="c" /><feComposite in="SourceGraphic" in2="c" operator="in" /></filter>
        <linearGradient id="fog-g" x1="0%" y1="60%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0" /><stop offset="100%" stopColor={color} stopOpacity="1" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={color} filter="url(#fog-f)" opacity={fade * opacity} />
      <rect x={0} y={H * 0.5} width={W} height={H * 0.5} fill="url(#fog-g)" opacity={fade * opacity * 0.6} />
    </svg>
  );
};
