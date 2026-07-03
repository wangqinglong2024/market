import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Shake: React.FC<{ durationInFrames: number; intensity?: number; color?: string; opacity?: number }> = ({ durationInFrames, intensity = 12, color = "#fff", opacity = 0.15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dx = Math.sin(t * 18) * intensity * Math.sin(t * 7);
  const dy = Math.cos(t * 16) * intensity * 0.5 * Math.sin(t * 9);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", transform: `translate(${dx}px, ${dy}px)`, opacity: fade * opacity, backgroundColor: color }} />
  );
};
