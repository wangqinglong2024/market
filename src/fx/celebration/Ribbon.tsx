import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43"];
export const Ribbon: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 8, opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`rb-x${i}`) * W;
        const spd = 60 + random(`rb-s${i}`) * 80;
        const yOff = random(`rb-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 80)) - 40;
        const color = COLORS[Math.floor(random(`rb-c${i}`) * COLORS.length)];
        const wave = Math.sin(t * 2 + i * 1.2) * 30;
        const len = 60 + random(`rb-l${i}`) * 60;
        const cp = `M${x0},${y} Q${x0 + wave},${y + len * 0.33} ${x0 - wave * 0.5},${y + len * 0.66} T${x0 + wave * 0.3},${y + len}`;
        return <path key={i} d={cp} fill="none" stroke={color} strokeWidth={3 + random(`rb-sw${i}`) * 3} opacity={fade * 0.9 * opacity} strokeLinecap="round" />;
      })}
    </svg>
  );
};
