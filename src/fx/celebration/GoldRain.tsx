import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const GoldRain: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 35, color = "#ffd700", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="gr-g"><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const x = random(`gr-x${i}`) * W;
        const spd = 80 + random(`gr-s${i}`) * 100;
        const yOff = random(`gr-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 30)) - 15;
        const rot = t * (200 + random(`gr-r${i}`) * 300) + i * 30;
        const sz = 6 + random(`gr-sz${i}`) * 8;
        const isStar = random(`gr-type${i}`) > 0.5;
        return isStar
          ? <polygon key={i} points={`${x},${y - sz} ${x + sz * 0.3},${y - sz * 0.3} ${x + sz},${y - sz * 0.3} ${x + sz * 0.5},${y + sz * 0.2} ${x + sz * 0.6},${y + sz} ${x},${y + sz * 0.5} ${x - sz * 0.6},${y + sz} ${x - sz * 0.5},${y + sz * 0.2} ${x - sz},${y - sz * 0.3} ${x - sz * 0.3},${y - sz * 0.3}`} fill={color} opacity={fade * 0.9 * opacity} transform={`rotate(${rot},${x},${y})`} filter="url(#gr-g)" />
          : <rect key={i} x={x - sz / 2} y={y - sz * 0.3} width={sz} height={sz * 0.6} fill={color} opacity={fade * 0.9 * opacity} transform={`rotate(${rot},${x},${y})`} rx={1} />;
      })}
    </svg>
  );
};
