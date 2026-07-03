import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const CakeSparkle: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.65, color = "#ffe566", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const CANDLES = 5;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="csk-g"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: CANDLES }, (_, ci) => {
        const candleX = W * cx + (ci - 2) * 40;
        const candleY = H * cy;
        return Array.from({ length: 8 }, (_, si) => {
          const life = ((t * (0.8 + random(`csk-l${ci}-${si}`)) + random(`csk-p${ci}-${si}`)) % 1);
          const angle = (si / 8) * Math.PI * 2;
          const dist = 15 + life * 40;
          const x = candleX + Math.cos(angle) * dist;
          const y = candleY - life * 60;
          const r = 2.5 * (1 - life);
          const op = Math.sin(life * Math.PI) * opacity;
          return <circle key={`${ci}-${si}`} cx={x} cy={y} r={r} fill={color} opacity={fade * op} filter="url(#csk-g)" />;
        });
      })}
    </svg>
  );
};
