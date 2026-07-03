import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const SHAPES = ["circle", "rect", "triangle"] as const;
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43", "#55efc4", "#fd79a8", "#6c5ce7"];
export const Confetti2: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 50, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`cf2-x${i}`) * W;
        const spd = 80 + random(`cf2-s${i}`) * 120;
        const yOff = random(`cf2-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 30)) - 15;
        const sway = Math.sin(t * (1 + random(`cf2-f${i}`)) + i * 0.7) * 30;
        const x = x0 + sway;
        const rot = t * (150 + random(`cf2-r${i}`) * 250) + i * 30;
        const sz = 6 + random(`cf2-sz${i}`) * 9;
        const color = COLORS[Math.floor(random(`cf2-c${i}`) * COLORS.length)];
        const shape = SHAPES[Math.floor(random(`cf2-sh${i}`) * SHAPES.length)];
        if (shape === "circle") return <circle key={i} cx={x} cy={y} r={sz * 0.5} fill={color} opacity={fade * 0.9 * opacity} />;
        if (shape === "triangle") return <polygon key={i} points={`${x},${y - sz * 0.6} ${x - sz * 0.5},${y + sz * 0.4} ${x + sz * 0.5},${y + sz * 0.4}`} fill={color} opacity={fade * 0.9 * opacity} transform={`rotate(${rot},${x},${y})`} />;
        return <rect key={i} x={x - sz * 0.5} y={y - sz * 0.3} width={sz} height={sz * 0.6} fill={color} opacity={fade * 0.9 * opacity} transform={`rotate(${rot},${x},${y})`} rx={1} />;
      })}
    </svg>
  );
};
