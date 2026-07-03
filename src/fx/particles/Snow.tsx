import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Snow: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 40, color = "#fff", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`sw-x${i}`) * W;
        const spd = 40 + random(`sw-s${i}`) * 80;
        const sway = 15 + random(`sw-sw${i}`) * 25;
        const phase = random(`sw-p${i}`) * Math.PI * 2;
        const r = 2 + random(`sw-r${i}`) * 4;
        const yOff = random(`sw-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 20)) - 10;
        const x = x0 + Math.sin(t * 0.8 + phase) * sway;
        const op = 0.4 + random(`sw-op${i}`) * 0.6;
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={fade * op * opacity} />;
      })}
    </svg>
  );
};
