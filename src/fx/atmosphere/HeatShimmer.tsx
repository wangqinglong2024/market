import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const HeatShimmer: React.FC<{ durationInFrames: number; color?: string; startY?: number; opacity?: number }> = ({ durationInFrames, color = "#ff8c42", startY = 0.45, opacity = 0.28 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seed = t * 0.2;
  const bf = 0.012 + Math.sin(t * 1.4) * 0.003;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="hsg" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="60%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="hsh"><feTurbulence type="turbulence" baseFrequency={`${bf} ${bf * 0.3}`} numOctaves={2} seed={seed} result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="8" xChannelSelector="R" yChannelSelector="G" /></filter>
      </defs>
      <rect x={0} y={H * startY} width={W} height={H * (1 - startY)} fill="url(#hsg)" opacity={fade * opacity} />
      <rect x={0} y={H * startY} width={W} height={H * (1 - startY)} fill={color} filter="url(#hsh)" opacity={fade * 0.05} />
    </svg>
  );
};
