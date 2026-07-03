import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const FilmStrip: React.FC<{ durationInFrames: number; color?: string; opacity?: number; holeCount?: number }> = ({ durationInFrames, color = "#111", opacity = 0.85, holeCount = 8 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stripH = 60;
  const holeW = 24, holeH = 18;
  const spacing = W / holeCount;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={stripH} fill={color} opacity={fade * opacity} />
      <rect x={0} y={H - stripH} width={W} height={stripH} fill={color} opacity={fade * opacity} />
      {Array.from({ length: holeCount }, (_, i) => (
        <g key={i}>
          <rect x={i * spacing + (spacing - holeW) / 2} y={(stripH - holeH) / 2} width={holeW} height={holeH} fill="#fff" rx={3} opacity={fade * opacity * 0.9} />
          <rect x={i * spacing + (spacing - holeW) / 2} y={H - stripH + (stripH - holeH) / 2} width={holeW} height={holeH} fill="#fff" rx={3} opacity={fade * opacity * 0.9} />
        </g>
      ))}
    </svg>
  );
};
