import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DualLight: React.FC<{ durationInFrames: number; color1?: string; color2?: string; opacity?: number }> = ({ durationInFrames, color1 = "#ffe566", color2 = "#a8edff", opacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p1 = 0.5 + Math.sin(t * 0.3 * Math.PI * 2) * 0.5;
  const p2 = 0.5 + Math.sin(t * 0.3 * Math.PI * 2 + Math.PI) * 0.5;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="dl1" cx="0%" cy="0%" r="65%"><stop offset="0%" stopColor={color1} stopOpacity="0.6" /><stop offset="100%" stopColor={color1} stopOpacity="0" /></radialGradient>
        <radialGradient id="dl2" cx="100%" cy="100%" r="65%"><stop offset="0%" stopColor={color2} stopOpacity="0.6" /><stop offset="100%" stopColor={color2} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#dl1)" opacity={fade * opacity * p1} />
      <rect x={0} y={0} width={W} height={H} fill="url(#dl2)" opacity={fade * opacity * p2} />
    </svg>
  );
};
