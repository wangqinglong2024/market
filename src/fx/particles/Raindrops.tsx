import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Raindrops: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number; angle?: number }> = ({ durationInFrames, count = 60, color = "#aaccff", opacity = 0.35, angle = 15 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) * H;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`rd-x${i}`) * (W + dx) - dx / 2;
        const spd = 400 + random(`rd-s${i}`) * 300;
        const yOff = random(`rd-yo${i}`) * H;
        const progress = ((yOff + t * spd) % (H + 20)) / (H + 20);
        const y1 = progress * H - 10;
        const len = 12 + random(`rd-l${i}`) * 18;
        const x1 = x0 + Math.sin(rad) * y1;
        const x2 = x1 - Math.sin(rad) * len;
        const y2 = y1 - Math.cos(rad) * len;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} opacity={fade * 0.8 * opacity} />;
      })}
    </svg>
  );
};
