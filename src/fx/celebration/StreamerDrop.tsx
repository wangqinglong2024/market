import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43", "#55efc4", "#fd79a8"];
export const StreamerDrop: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 10, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.05 + i / count * 0.9 + random(`st-rx${i}`) * 0.05) * W;
        const color = COLORS[i % COLORS.length];
        const len = 80 + random(`st-l${i}`) * 120;
        const speed = 0.4 + random(`st-s${i}`) * 0.4;
        const progress = Math.min(t * speed, 1);
        const pts = Array.from({ length: 12 }, (_, j) => {
          const py = H * 0.02 + (j / 11) * len * progress;
          const px = x + Math.sin(t * 2 + j * 0.8 + i) * (10 + j * 2);
          return `${px},${py}`;
        });
        return <polyline key={i} points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.5 + random(`st-sw${i}`) * 2} opacity={fade * progress * opacity} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
};
