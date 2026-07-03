import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Thunder: React.FC<{ durationInFrames: number; color?: string; opacity?: number; strikes?: number }> = ({ durationInFrames, color = "#c8e8ff", opacity = 0.55, strikes = 3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="th-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: strikes }, (_, i) => {
        const interval = durationInFrames / (strikes + 1);
        const strikeFrame = (i + 1) * interval;
        const localT = frame - strikeFrame;
        if (localT < 0 || localT > fps * 0.25) return null;
        const flash = interpolate(localT, [0, fps * 0.05, fps * 0.25], [1, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const x = (0.2 + random(`th-x${i}`) * 0.6) * W;
        const segs = 6;
        let points = `${x},0`;
        for (let s = 0; s < segs; s++) {
          const px = x + (random(`th-px${i}-${s}`) - 0.5) * 80;
          const py = ((s + 1) / segs) * H;
          points += ` ${px},${py}`;
        }
        return <polyline key={i} points={points} fill="none" stroke={color} strokeWidth={3} opacity={fade * flash * opacity} filter="url(#th-glow)" />;
      })}
    </svg>
  );
};
