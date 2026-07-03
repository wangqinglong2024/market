import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const DiamondBurst: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ffe4f0", count = 8, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const life = ((t * 0.5 + random(`db-p${i}`)) % 1);
        const dist = life * (80 + random(`db-d${i}`) * 100);
        const x = W / 2 + Math.cos(angle) * dist;
        const y = H / 2 + Math.sin(angle) * dist;
        const sz = 15 * (1 - life * 0.6);
        const op = Math.sin(life * Math.PI) * opacity;
        const rot = life * 180;
        return (
          <rect key={i} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} fill={color} opacity={fade * op} transform={`rotate(${rot + angle * 180 / Math.PI},${x},${y})`} />
        );
      })}
    </svg>
  );
};
