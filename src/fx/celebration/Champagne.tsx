import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Champagne: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 40, color = "#ffeeaa", opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = (0.3 + random(`ch-x${i}`) * 0.4) * W;
        const spd = 50 + random(`ch-s${i}`) * 80;
        const sway = 15 + random(`ch-sw${i}`) * 20;
        const yOff = random(`ch-yo${i}`) * H;
        const y = H - ((yOff + t * spd) % (H + 20));
        const x = x0 + Math.sin(t * 1.5 + i * 0.8) * sway;
        const r = 1.5 + random(`ch-r${i}`) * 3;
        const op = 0.4 + random(`ch-op${i}`) * 0.6;
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={fade * op * opacity} />;
      })}
    </svg>
  );
};
