import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
const RAINBOW = ["#ff4444", "#ff8800", "#ffee00", "#44cc44", "#4488ff", "#8844ff"];
export const RainbowArc: React.FC<{ durationInFrames: number; cx?: number; cy?: number; r?: number; opacity?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.65, r = 0.35, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = interpolate(frame, [0, fps * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const baseR = Math.min(W, H) * r;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {RAINBOW.map((color, i) => {
        const ri = baseR - i * 12;
        const endAngle = -Math.PI * grow;
        const x1 = W * cx + ri * Math.cos(-Math.PI), y1 = H * cy + ri * Math.sin(-Math.PI);
        const x2 = W * cx + ri * Math.cos(endAngle), y2 = H * cy + ri * Math.sin(endAngle);
        const large = grow > 0.5 ? 1 : 0;
        return <path key={i} d={`M${x1},${y1} A${ri},${ri} 0 ${large},0 ${x2},${y2}`} fill="none" stroke={color} strokeWidth={10} opacity={fade * opacity} strokeLinecap="round" />;
      })}
    </svg>
  );
};
