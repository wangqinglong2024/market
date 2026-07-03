import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const BowRibbon: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number; size?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.08, color = "#ff6b9d", opacity = 0.7, size = 60 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(t * 2) * 5;
  const x = W * cx, y = H * cy + bob;
  const s = size;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g opacity={fade * opacity}>
        <path d={`M${x},${y} C${x - s * 1.5},${y - s * 0.8} ${x - s * 0.4},${y + s * 0.6} ${x},${y}`} fill={color} opacity={0.9} />
        <path d={`M${x},${y} C${x + s * 1.5},${y - s * 0.8} ${x + s * 0.4},${y + s * 0.6} ${x},${y}`} fill={color} opacity={0.9} />
        <path d={`M${x},${y} C${x - s * 1.3},${y + s * 0.5} ${x - s * 0.3},${y - s * 0.5} ${x},${y}`} fill={color} opacity={0.7} />
        <path d={`M${x},${y} C${x + s * 1.3},${y + s * 0.5} ${x + s * 0.3},${y - s * 0.5} ${x},${y}`} fill={color} opacity={0.7} />
        <circle cx={x} cy={y} r={s * 0.15} fill={color} />
        <line x1={x - s * 0.4} y1={y + s * 0.15} x2={x - s * 0.6} y2={y + s * 0.7} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        <line x1={x + s * 0.4} y1={y + s * 0.15} x2={x + s * 0.6} y2={y + s * 0.7} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      </g>
    </svg>
  );
};
