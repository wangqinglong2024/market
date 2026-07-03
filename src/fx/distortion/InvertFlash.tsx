import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const InvertFlash: React.FC<{ durationInFrames: number; opacity?: number; flashes?: number }> = ({ durationInFrames, opacity = 0.3, flashes = 3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Array.from({ length: flashes }, (_, i) => {
    const center = ((i + 0.5) / flashes) * (durationInFrames / fps);
    const dist = Math.abs(t - center);
    return Math.exp(-dist * dist * 20);
  }).reduce((a, b) => Math.max(a, b), 0);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={H} fill="#fff" opacity={fade * pulse * opacity} style={{ mixBlendMode: "difference" }} />
    </svg>
  );
};
