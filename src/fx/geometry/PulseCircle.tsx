import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const PulseCircle: React.FC<{ durationInFrames: number; color?: string; cx?: number; cy?: number; rings?: number; opacity?: number }> = ({ durationInFrames, color = "#ff9dd6", cx = 0.5, cy = 0.5, rings = 4, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxR = Math.min(W, H) * 0.45;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rings }, (_, i) => {
        const phase = (t * 0.7 - i * 0.25) % 1;
        const r = phase * maxR;
        const op = (1 - phase) * opacity;
        return <circle key={i} cx={W * cx} cy={H * cy} r={r} fill="none" stroke={color} strokeWidth={2 - phase * 1.5} opacity={fade * op} />;
      })}
    </svg>
  );
};
