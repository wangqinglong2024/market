import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const RoundedVignette: React.FC<{ durationInFrames: number; color?: string; opacity?: number; radius?: number }> = ({ durationInFrames, color = "#000", opacity = 0.5, radius = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.95 + Math.sin(t * 0.4) * 0.05;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="rv" cx="50%" cy="50%" r={`${radius * 100 * breathe}%`}>
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="70%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#rv)" opacity={fade * opacity} />
    </svg>
  );
};
