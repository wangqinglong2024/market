import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SweepReveal: React.FC<{ durationInFrames: number; direction?: "left" | "right" | "up" | "down"; color?: string; opacity?: number }> = ({ durationInFrames, direction = "left", color = "#fff", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const p = interpolate(frame, [0, durationInFrames * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let clipPath = "";
  if (direction === "left") clipPath = `M0,0 L${W * p},0 L${W * p},${H} L0,${H} Z`;
  else if (direction === "right") clipPath = `M${W},0 L${W - W * p},0 L${W - W * p},${H} L${W},${H} Z`;
  else if (direction === "up") clipPath = `M0,0 L${W},0 L${W},${H * p} L0,${H * p} Z`;
  else clipPath = `M0,${H} L${W},${H} L${W},${H - H * p} L0,${H - H * p} Z`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={clipPath} fill={color} opacity={fade * opacity} />
    </svg>
  );
};
