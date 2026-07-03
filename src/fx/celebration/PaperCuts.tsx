import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43", "#55efc4"];
export const PaperCuts: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 25, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`pc-x${i}`) * W;
        const spd = 70 + random(`pc-s${i}`) * 90;
        const yOff = random(`pc-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 40)) - 20;
        const x = x0 + Math.sin(t * 1.5 + i * 0.9) * 25;
        const rot = t * (100 + random(`pc-r${i}`) * 200) + i * 45;
        const w = 12 + random(`pc-w${i}`) * 16;
        const h = 6 + random(`pc-h${i}`) * 8;
        const color = COLORS[Math.floor(random(`pc-c${i}`) * COLORS.length)];
        return <rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} fill={color} opacity={fade * 0.85 * opacity} transform={`rotate(${rot},${x},${y})`} rx={1} />;
      })}
    </svg>
  );
};
