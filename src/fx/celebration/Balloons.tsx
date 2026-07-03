import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ff9f43", "#ffeaa7", "#a29bfe", "#74b9ff", "#55efc4", "#fd79a8"];
export const Balloons: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 8, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = (0.05 + random(`bl-x${i}`) * 0.9) * W;
        const spd = 40 + random(`bl-s${i}`) * 40;
        const yOff = (0.3 + random(`bl-yo${i}`) * 0.7) * H;
        const y = H - ((yOff + t * spd) % (H * 1.1));
        const sway = Math.sin(t * (0.6 + random(`bl-sw${i}`) * 0.6) + i * 1.5) * 20;
        const x = x0 + sway;
        const rx = 18 + random(`bl-r${i}`) * 14;
        const ry = rx * 1.2;
        const color = COLORS[Math.floor(random(`bl-c${i}`) * COLORS.length)];
        return (
          <g key={i} opacity={fade * opacity}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={color} />
            <ellipse cx={x - rx * 0.25} cy={y - ry * 0.3} rx={rx * 0.2} ry={ry * 0.15} fill="#fff" opacity={0.4} />
            <line x1={x} y1={y + ry} x2={x + sway * 0.3} y2={y + ry + 30} stroke={color} strokeWidth={1} opacity={0.7} />
          </g>
        );
      })}
    </svg>
  );
};
