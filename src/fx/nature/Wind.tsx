import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Wind: React.FC<{ durationInFrames: number; color?: string; lines?: number; opacity?: number }> = ({ durationInFrames, color = "#aaddff", lines = 12, opacity = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: lines }, (_, i) => {
        const y = random(`wd-y${i}`) * H;
        const spd = 200 + random(`wd-s${i}`) * 300;
        const len = 60 + random(`wd-l${i}`) * 120;
        const x = ((random(`wd-x${i}`) * W + t * spd) % (W + len)) - len;
        const curve = random(`wd-c${i}`) * 20 - 10;
        const op = 0.4 + random(`wd-op${i}`) * 0.6;
        const sw = 0.5 + random(`wd-sw${i}`) * 1.5;
        return <path key={i} d={`M${x},${y} Q${x + len / 2},${y + curve} ${x + len},${y}`} fill="none" stroke={color} strokeWidth={sw} opacity={fade * op * opacity} strokeLinecap="round" />;
      })}
    </svg>
  );
};
