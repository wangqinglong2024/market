import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ThumbBounce: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 6, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.15 + i * 0.14) * W;
        const baseY = H * 0.85;
        const delay = i * 0.12;
        const bounce = Math.max(0, Math.sin((t - delay) * 2.5 * Math.PI * 2));
        const y = baseY - bounce * 40;
        const sz = 22 + bounce * 8;
        return <text key={i} x={x} y={y} fontSize={sz} textAnchor="middle" opacity={fade * (0.5 + bounce * 0.5) * opacity}>👍</text>;
      })}
    </svg>
  );
};
