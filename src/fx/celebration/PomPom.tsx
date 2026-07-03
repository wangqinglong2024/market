import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43"];
export const PomPom: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 3, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="pp-blur"><feGaussianBlur stdDeviation="2" /></filter></defs>
      {Array.from({ length: count }, (_, pi) => {
        const cx = (0.15 + pi * 0.35) * W;
        const cy = H * (0.75 + random(`pp-y${pi}`) * 0.15);
        const bounce = Math.abs(Math.sin(t * 3 + pi * 1.1)) * 20;
        const color = COLORS[pi % COLORS.length];
        const THREADS = 16;
        return (
          <g key={pi} opacity={fade * opacity}>
            {Array.from({ length: THREADS }, (_, ti) => {
              const angle = (ti / THREADS) * Math.PI * 2;
              const sway = Math.sin(t * 5 + ti * 0.5 + pi) * 0.2;
              const r = 25 + random(`pp-r${pi}-${ti}`) * 20;
              return (
                <line key={ti} x1={cx} y1={cy - bounce} x2={cx + Math.cos(angle + sway) * r} y2={cy - bounce + Math.sin(angle + sway) * r * 0.6} stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
