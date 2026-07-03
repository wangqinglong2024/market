import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DrunkZoom: React.FC<{ durationInFrames: number; intensity?: number; opacity?: number }> = ({ durationInFrames, intensity = 0.06, opacity = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = 1 + Math.sin(t * 1.5) * intensity;
  const dx = Math.sin(t * 0.9) * W * 0.015;
  const dy = Math.cos(t * 1.1) * H * 0.01;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: fade * opacity, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: `-${H * 0.05}px -${W * 0.05}px`, transform: `scale(${zoom}) translate(${dx}px, ${dy}px)`, backdropFilter: "blur(0.5px)", width: `${W * 1.1}px`, height: `${H * 1.1}px` }} />
    </div>
  );
};
