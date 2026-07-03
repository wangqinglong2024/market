import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const CherryBlossom: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 15, color = "#ffb7c5", opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const Petal = ({ cx, cy, sz, rot }: { cx: number; cy: number; sz: number; rot: number }) => (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        const px = Math.cos(a) * sz * 0.5;
        const py = Math.sin(a) * sz * 0.5;
        return <ellipse key={i} cx={px} cy={py} rx={sz * 0.32} ry={sz * 0.22} fill={color} transform={`rotate(${a * 180 / Math.PI + 90},${px},${py})`} />;
      })}
      <circle cx={0} cy={0} r={sz * 0.12} fill="#ffe0e0" />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`cb-x${i}`) * W;
        const spd = 40 + random(`cb-s${i}`) * 50;
        const sway = 30 + random(`cb-sw${i}`) * 40;
        const yOff = random(`cb-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 40)) - 20;
        const x = x0 + Math.sin(t * 0.9 + random(`cb-ph${i}`) * 6) * sway;
        const sz = 14 + random(`cb-sz${i}`) * 16;
        const rot = t * (60 + random(`cb-r${i}`) * 90) + i * 30;
        return <g key={i} opacity={fade * opacity}><Petal cx={x} cy={y} sz={sz} rot={rot} /></g>;
      })}
    </svg>
  );
};
