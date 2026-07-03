import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const GoldFrame: React.FC<{ durationInFrames: number; thickness?: number; color?: string; opacity?: number }> = ({ durationInFrames, thickness = 18, color = "#c8a050", opacity = 0.8 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin(t * 0.8) * 0.03;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="gf-h" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B6914" /><stop offset="20%" stopColor={color} /><stop offset="50%" stopColor="#ffe680" /><stop offset="80%" stopColor={color} /><stop offset="100%" stopColor="#8B6914" /></linearGradient>
        <linearGradient id="gf-v" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8B6914" /><stop offset="20%" stopColor={color} /><stop offset="50%" stopColor="#ffe680" /><stop offset="80%" stopColor={color} /><stop offset="100%" stopColor="#8B6914" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={thickness * pulse} fill="url(#gf-h)" opacity={fade * opacity} />
      <rect x={0} y={H - thickness * pulse} width={W} height={thickness * pulse} fill="url(#gf-h)" opacity={fade * opacity} />
      <rect x={0} y={0} width={thickness * pulse} height={H} fill="url(#gf-v)" opacity={fade * opacity} />
      <rect x={W - thickness * pulse} y={0} width={thickness * pulse} height={H} fill="url(#gf-v)" opacity={fade * opacity} />
    </svg>
  );
};
