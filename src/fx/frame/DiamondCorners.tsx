import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DiamondCorners: React.FC<{ durationInFrames: number; color?: string; size?: number; opacity?: number }> = ({ durationInFrames, color = "#c8a050", size = 40, opacity = 0.8 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin(t * 1.5) * 0.08;
  const s = size * pulse;
  const corners = [[0, 0], [W, 0], [0, H], [W, H]];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {corners.map(([x, y], i) => {
        const sx = x === 0 ? 1 : -1;
        const sy = y === 0 ? 1 : -1;
        return (
          <g key={i} opacity={fade * opacity}>
            <polygon points={`${x},${y + sy * s * 0.5} ${x + sx * s * 0.25},${y} ${x + sx * s * 0.5},${y + sy * s * 0.25} ${x},${y + sy * s * 0.5}`} fill={color} />
            <circle cx={x + sx * s * 0.15} cy={y + sy * s * 0.15} r={s * 0.1} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};
