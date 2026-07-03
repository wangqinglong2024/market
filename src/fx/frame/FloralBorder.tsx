import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const FloralBorder: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ff88cc", count = 20, opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const positions = Array.from({ length: count }, (_, i) => {
    const side = Math.floor(i / (count / 4));
    const frac = (i % (count / 4)) / (count / 4);
    if (side === 0) return { x: frac * W, y: 30 + random(`fb-r${i}`) * 20 };
    if (side === 1) return { x: W - 30 - random(`fb-r${i}`) * 20, y: frac * H };
    if (side === 2) return { x: W - frac * W, y: H - 30 - random(`fb-r${i}`) * 20 };
    return { x: 30 + random(`fb-r${i}`) * 20, y: H - frac * H };
  });
  const Flower = ({ x, y, sz, rot }: { x: number; y: number; sz: number; rot: number }) => (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * sz * 0.5} cy={Math.sin(a) * sz * 0.5} rx={sz * 0.4} ry={sz * 0.25} fill={color} transform={`rotate(${a * 180 / Math.PI + 90},${Math.cos(a) * sz * 0.5},${Math.sin(a) * sz * 0.5})`} />;
      })}
      <circle cx={0} cy={0} r={sz * 0.2} fill="#fff5cc" />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {positions.map((pos, i) => {
        const sz = 12 + random(`fb-sz${i}`) * 12;
        const bob = Math.sin(t * 1.2 + i * 0.4) * 3;
        const rot = random(`fb-rot${i}`) * 360;
        return <g key={i} opacity={fade * opacity}><Flower x={pos.x} y={pos.y + bob} sz={sz} rot={rot} /></g>;
      })}
    </svg>
  );
};
