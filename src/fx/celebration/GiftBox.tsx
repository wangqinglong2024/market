import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const GiftBox: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; ribbon?: string; opacity?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.5, color = "#ff6b9d", ribbon = "#ffe066", opacity = 0.7 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = Math.sin(t * 10) * 3 * (1 - Math.min(pop, 1));
  const x = W * cx, y = H * cy;
  const bw = 80 * pop, bh = 70 * pop;
  const lidOff = interpolate(frame, [fps * 0.4, fps * 0.6], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g transform={`translate(${x + shake},${y})`} opacity={fade * opacity}>
        <rect x={-bw / 2} y={-bh * 0.15} width={bw} height={bh} rx={4} fill={color} />
        <rect x={-bw / 2} y={-bh * 0.15 + lidOff} width={bw} height={bh * 0.25} rx={3} fill={color} opacity={0.8} />
        <rect x={-5} y={-bh * 0.15 + lidOff} width={10} height={bh + bh * 0.1} fill={ribbon} />
        <rect x={-bw / 2} y={bh * 0.1 + lidOff} width={bw} height={10} fill={ribbon} />
        <ellipse cx={-18} cy={-bh * 0.15 + lidOff - 8} rx={15} ry={10} fill="none" stroke={ribbon} strokeWidth={4} />
        <ellipse cx={18} cy={-bh * 0.15 + lidOff - 8} rx={15} ry={10} fill="none" stroke={ribbon} strokeWidth={4} />
      </g>
    </svg>
  );
};
