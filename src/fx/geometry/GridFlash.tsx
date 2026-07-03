import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const GridFlash: React.FC<{ durationInFrames: number; color?: string; cols?: number; rows?: number; opacity?: number }> = ({ durationInFrames, color = "#88ffcc", cols = 6, rows = 9, opacity = 0.25 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cw = W / cols;
  const ch = H / rows;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const wave = Math.sin(t * 3 + c * 0.8 + r * 0.6 + random(`gf-${r}-${c}`) * 3);
          const op = Math.max(0, wave) * opacity;
          return <rect key={`${r}-${c}`} x={c * cw} y={r * ch} width={cw - 1} height={ch - 1} fill={color} opacity={fade * op} />;
        })
      )}
    </svg>
  );
};
