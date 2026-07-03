import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Fireworks: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 4, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const COLORS = ["#ffcc00", "#ff6699", "#66ccff", "#ff9944", "#cc66ff", "#44ffaa"];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="fw-g"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: count }, (_, fi) => {
        const interval = durationInFrames / count;
        const startFrame = fi * interval * 0.8;
        const localT = frame - startFrame;
        if (localT < 0) return null;
        const life = Math.min(localT / (fps * 0.8), 1);
        const cx = (0.15 + random(`fw-x${fi}`) * 0.7) * W;
        const cy = (0.1 + random(`fw-y${fi}`) * 0.45) * H;
        const color = COLORS[Math.floor(random(`fw-c${fi}`) * COLORS.length)];
        const sparks = 16;
        return (
          <g key={fi} filter="url(#fw-g)">
            {Array.from({ length: sparks }, (_, si) => {
              const angle = (si / sparks) * Math.PI * 2;
              const spd = (80 + random(`fw-sp${fi}-${si}`) * 60) * life;
              const x2 = cx + Math.cos(angle) * spd;
              const y2 = cy + Math.sin(angle) * spd + life * life * 30;
              const op = (1 - life) * opacity;
              return <line key={si} x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={2} opacity={fade * op} strokeLinecap="round" />;
            })}
          </g>
        );
      })}
    </svg>
  );
};
