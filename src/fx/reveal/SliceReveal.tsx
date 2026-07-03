import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SliceReveal: React.FC<{ durationInFrames: number; slices?: number; color?: string; opacity?: number }> = ({ durationInFrames, slices = 8, color = "#1a1a2e", opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const fade = interpolate(frame, [durationInFrames * 0.7, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sw = W / slices;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: slices }, (_, i) => {
        const delay = i * (durationInFrames * 0.5 / slices);
        const drop = interpolate(frame, [delay, delay + durationInFrames * 0.3], [0, H], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const even = i % 2 === 0;
        return <rect key={i} x={i * sw} y={even ? -drop : drop - H} width={sw} height={H} fill={color} opacity={fade * opacity} />;
      })}
    </svg>
  );
};
