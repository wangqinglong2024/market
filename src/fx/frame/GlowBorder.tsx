import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const GlowBorder: React.FC<{ durationInFrames: number; color?: string; thickness?: number; opacity?: number }> = ({ durationInFrames, color = "#ff88cc", thickness = 20, opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 0.7 + Math.sin(t * 1.5 * Math.PI * 2) * 0.3;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="gb-glow"><feGaussianBlur stdDeviation={thickness * 0.6} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect x={thickness / 2} y={thickness / 2} width={W - thickness} height={H - thickness} fill="none" stroke={color} strokeWidth={thickness * 0.5} opacity={fade * pulse * opacity * 0.5} filter="url(#gb-glow)" />
      <rect x={thickness / 2} y={thickness / 2} width={W - thickness} height={H - thickness} fill="none" stroke={color} strokeWidth={2} opacity={fade * pulse * opacity * 0.8} />
    </svg>
  );
};
