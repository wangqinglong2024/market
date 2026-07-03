import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const FlowerSticker: React.FC<{ durationInFrames: number; count?: number; color?: string; centerColor?: string; opacity?: number }> = ({ durationInFrames, count = 6, color = "#ff88cc", centerColor = "#ffee66", opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const Flower = ({ cx, cy, r, rot }: { cx: number; cy: number; r: number; rot: number }) => (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * r * 0.55} cy={Math.sin(a) * r * 0.55} rx={r * 0.45} ry={r * 0.3} fill={color} transform={`rotate(${a * 180 / Math.PI + 90},${Math.cos(a) * r * 0.55},${Math.sin(a) * r * 0.55})`} />;
      })}
      <circle cx={0} cy={0} r={r * 0.28} fill={centerColor} />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.05 + random(`fls-x${i}`) * 0.9) * W;
        const y = (0.05 + random(`fls-y${i}`) * 0.85) * H;
        const r = 18 + random(`fls-r${i}`) * 22;
        const rot = Math.sin(t * 0.6 + i) * 15 + random(`fls-ro${i}`) * 360;
        return <g key={i} opacity={fade * opacity}><Flower cx={x} cy={y} r={r} rot={rot} /></g>;
      })}
    </svg>
  );
};
