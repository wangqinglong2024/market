import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WarmGlow: React.FC<{ durationInFrames: number; color?: string; cx?: number; cy?: number; opacity?: number }> = ({ durationInFrames, color = "#ffb347", cx = 0.5, cy = 0.42, opacity = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.85 + Math.sin(t * 0.5 * Math.PI * 2) * 0.15;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="wg" cx={`${cx * 100}%`} cy={`${cy * 100}%`} r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#wg)" opacity={fade * opacity * breathe} />
    </svg>
  );
};
