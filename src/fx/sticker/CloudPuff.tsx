import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const CloudPuff: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 4, color = "#fff", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const Cloud = ({ cx, cy, scale }: { cx: number; cy: number; scale: number }) => (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={40} ry={25} fill={color} />
      <ellipse cx={-20} cy={-12} rx={22} ry={18} fill={color} />
      <ellipse cx={15} cy={-14} rx={20} ry={17} fill={color} />
      <ellipse cx={35} cy={-5} rx={15} ry={12} fill={color} />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.05 + random(`cp-x${i}`) * 0.85) * W;
        const y = (0.05 + random(`cp-y${i}`) * 0.3) * H;
        const sc = 0.5 + random(`cp-sc${i}`) * 0.8;
        const drift = Math.sin(t * 0.4 + i * 1.5) * 15;
        return <g key={i} opacity={fade * 0.7 * opacity}><Cloud cx={x + drift} cy={y} scale={sc} /></g>;
      })}
    </svg>
  );
};
