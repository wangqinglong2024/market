import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ScaleReveal: React.FC<{ durationInFrames: number; color?: string; opacity?: number }> = ({ durationInFrames, color = "#fff", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const scale = interpolate(frame, [0, fps * 0.6], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: W, height: H, backgroundColor: color, transform: `scale(${scale})`, opacity: fade * opacity, transformOrigin: "center" }} />
    </div>
  );
};
