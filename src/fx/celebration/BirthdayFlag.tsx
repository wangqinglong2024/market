import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
const COLORS = ["#ff6b9d", "#ffeaa7", "#a29bfe", "#74b9ff", "#ff9f43", "#55efc4"];
export const BirthdayFlag: React.FC<{ durationInFrames: number; flagCount?: number; opacity?: number; y?: number }> = ({ durationInFrames, flagCount = 8, opacity = 0.7, y = 0.08 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = H * y;
  const spacing = W / (flagCount + 1);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={`M${spacing * 0.5},${cy} ${Array.from({ length: flagCount + 1 }, (_, i) => `L${spacing * (i + 0.5)},${cy}`).join(" ")}`} fill="none" stroke="#ccc" strokeWidth={1.5} opacity={fade * opacity * 0.5} />
      {Array.from({ length: flagCount }, (_, i) => {
        const x = spacing * (i + 1);
        const wave = Math.sin(t * 2.5 + i * 0.8) * 5;
        const color = COLORS[i % COLORS.length];
        const fw = 28, fh = 22;
        return (
          <polygon key={i} points={`${x - fw / 2},${cy + wave} ${x + fw / 2},${cy + wave} ${x},${cy + fh + wave}`} fill={color} opacity={fade * opacity} />
        );
      })}
    </svg>
  );
};
