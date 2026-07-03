import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const PawPrint: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 6, color = "#ff88cc", opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const Paw = ({ cx, cy, sz, rot }: { cx: number; cy: number; sz: number; rot: number }) => (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={sz * 0.5} ry={sz * 0.42} fill={color} />
      <ellipse cx={-sz * 0.45} cy={-sz * 0.52} rx={sz * 0.22} ry={sz * 0.2} fill={color} />
      <ellipse cx={sz * 0.45} cy={-sz * 0.52} rx={sz * 0.22} ry={sz * 0.2} fill={color} />
      <ellipse cx={0} cy={-sz * 0.62} rx={sz * 0.2} ry={sz * 0.18} fill={color} />
    </g>
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.1 + random(`pp2-x${i}`) * 0.8) * W;
        const y = (0.1 + random(`pp2-y${i}`) * 0.8) * H;
        const sz = 18 + random(`pp2-sz${i}`) * 20;
        const bob = Math.sin(t * 1.5 + i) * 5;
        const rot = (random(`pp2-r${i}`) - 0.5) * 40;
        return <g key={i} opacity={fade * opacity}><Paw cx={x} cy={y + bob} sz={sz} rot={rot} /></g>;
      })}
    </svg>
  );
};
