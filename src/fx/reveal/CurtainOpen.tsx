import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const CurtainOpen: React.FC<{ durationInFrames: number; color?: string; opacity?: number }> = ({ durationInFrames, color = "#c8506a", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const open = interpolate(frame, [0, durationInFrames * 0.65], [0, W / 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.7, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="cl" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0.6" /></linearGradient>
        <linearGradient id="cr" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0.6" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W / 2 - open} height={H} fill="url(#cl)" opacity={fade * opacity} />
      <rect x={W / 2 + open} y={0} width={W / 2 - open} height={H} fill="url(#cr)" opacity={fade * opacity} />
    </svg>
  );
};
