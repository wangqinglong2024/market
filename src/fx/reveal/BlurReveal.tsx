import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const BlurReveal: React.FC<{ durationInFrames: number; maxBlur?: number; color?: string; opacity?: number }> = ({ durationInFrames, maxBlur = 20, color = "#fff", opacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blur = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.5, durationInFrames], [maxBlur, 0, 0, maxBlur], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, fps * 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - fps * 0.4, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backdropFilter: `blur(${blur}px)`, opacity: Math.min(fadeIn, fadeOut) * opacity, backgroundColor: "transparent" }} />
  );
};
