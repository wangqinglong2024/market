import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const CrownFloat: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number; size?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.08, color = "#ffd700", opacity = 0.8, size = 55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(t * 1.8) * 6;
  const x = W * cx, y = H * cy + bob;
  const s = size;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="crf-g"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g transform={`translate(${x},${y})`} opacity={fade * opacity} filter="url(#crf-g)">
        <path d={`M${-s * 0.65},${s * 0.15} L${-s * 0.65},${-s * 0.1} L${-s * 0.35},${-s * 0.5} L0,${-s * 0.1} L${s * 0.35},${-s * 0.5} L${s * 0.65},${-s * 0.1} L${s * 0.65},${s * 0.15} Z`} fill={color} />
        <circle cx={-s * 0.35} cy={-s * 0.55} r={s * 0.1} fill="#ff6b9d" />
        <circle cx={0} cy={-s * 0.15} r={s * 0.1} fill="#74b9ff" />
        <circle cx={s * 0.35} cy={-s * 0.55} r={s * 0.1} fill="#55efc4" />
      </g>
    </svg>
  );
};
