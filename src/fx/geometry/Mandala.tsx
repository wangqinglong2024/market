import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Mandala: React.FC<{ durationInFrames: number; petals?: number; color?: string; opacity?: number }> = ({ durationInFrames, petals = 8, color = "#d4a0ff", opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.9, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rot = t * 15;
  const r1 = 80 + Math.sin(t * 0.7) * 20;
  const r2 = 160 + Math.sin(t * 0.5 + 1) * 30;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g transform={`translate(${W / 2},${H / 2}) rotate(${rot})`} opacity={fade * opacity}>
        {Array.from({ length: petals }, (_, i) => {
          const a = (i / petals) * 360;
          return (
            <g key={i} transform={`rotate(${a})`}>
              <ellipse cx={0} cy={-(r1 + r2) / 2} rx={r1 * 0.3} ry={(r2 - r1) / 2} fill={color} />
              <circle cx={0} cy={-r1} r={12} fill={color} opacity={0.6} />
            </g>
          );
        })}
        <circle cx={0} cy={0} r={30} fill={color} opacity={0.3} />
        <circle cx={0} cy={0} r={15} fill={color} opacity={0.5} />
      </g>
    </svg>
  );
};
