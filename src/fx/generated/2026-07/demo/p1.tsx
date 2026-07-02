// 机制：宽幅柔光带缓缓扫过 — 极低透明度，如晨曦透过窗帘的隐约光感，不打扰病室宁静
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const fade = interpolate(frame, [0, fps * 1.0, durationInFrames - fps * 0.8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 宽光带缓慢横扫，极低速度、极低不透明度
  const cx = interpolate(frame, [0, durationInFrames * 1.2], [-W * 0.4, W * 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="p1soft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff8dc" stopOpacity="0" />
          <stop offset="35%" stopColor="#ffe8a0" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#fff5cc" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#fff8dc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${cx}, ${H / 2}) rotate(22)`}>
        <rect x={-W * 0.55} y={-H * 1.5} width={W * 1.1} height={H * 3}
          fill="url(#p1soft)" opacity={fade * 0.55} />
      </g>
    </svg>
  );
};
