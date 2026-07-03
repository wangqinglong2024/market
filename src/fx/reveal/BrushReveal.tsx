import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const BrushReveal: React.FC<{ durationInFrames: number; color?: string; opacity?: number; strokes?: number }> = ({ durationInFrames, color = "#ffe0ee", opacity = 0.7, strokes = 5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const fade = interpolate(frame, [durationInFrames * 0.7, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sh = H / strokes;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: strokes }, (_, i) => {
        const delay = i * (durationInFrames * 0.5 / strokes);
        const p = interpolate(frame, [delay, delay + durationInFrames * 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y = i * sh;
        const wobble = 8;
        const even = i % 2 === 0;
        const x1 = even ? 0 : W;
        const x2 = even ? W * p : W - W * p;
        return (
          <path key={i} d={`M${x1},${y} C${x1 + 50},${y - wobble} ${x2 - 50},${y + wobble} ${x2},${y} L${x2},${y + sh} C${x2 - 50},${y + sh + wobble} ${x1 + 50},${y + sh - wobble} ${x1},${y + sh} Z`} fill={color} opacity={fade * p * opacity} />
        );
      })}
    </svg>
  );
};
