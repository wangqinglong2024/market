import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const PixelDissolve: React.FC<{ durationInFrames: number; color?: string; pixelSize?: number; opacity?: number }> = ({ durationInFrames, color = "#1a0a2e", pixelSize = 30, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.65, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cols = Math.ceil(W / pixelSize);
  const rows = Math.ceil(H / pixelSize);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const threshold = random(`pd-${r}-${c}`);
          const vis = progress < threshold ? 1 : 0;
          return vis > 0 ? <rect key={`${r}-${c}`} x={c * pixelSize} y={r * pixelSize} width={pixelSize} height={pixelSize} fill={color} opacity={fade * opacity} /> : null;
        })
      )}
    </svg>
  );
};
