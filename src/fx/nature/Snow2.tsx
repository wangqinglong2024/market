import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Snow2: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 50, color = "#e8f4ff", opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="s2-blur"><feGaussianBlur stdDeviation="1" /></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`s2-x${i}`) * W;
        const spd = 30 + random(`s2-s${i}`) * 50;
        const sway = 20 + random(`s2-sw${i}`) * 30;
        const yOff = random(`s2-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 20)) - 10;
        const x = x0 + Math.sin(t * 0.6 + random(`s2-ph${i}`) * 6) * sway;
        const r = 3 + random(`s2-r${i}`) * 6;
        const isFlake = random(`s2-type${i}`) > 0.5;
        return isFlake
          ? <circle key={i} cx={x} cy={y} r={r * 0.6} fill={color} opacity={fade * 0.8 * opacity} filter="url(#s2-blur)" />
          : <text key={i} x={x} y={y} fontSize={r * 2.5} textAnchor="middle" opacity={fade * 0.7 * opacity} fill={color}>❄</text>;
      })}
    </svg>
  );
};
