import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WatermarkPulse: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.92, y = 0.05, fontSize = 22, color = "#fff", opacity = 0.35 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 0.8 + Math.sin(t * 1.5) * 0.2;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <text x={W * x} y={H * y} textAnchor="end" fontSize={fontSize} fill={color} opacity={fade * pulse * opacity} fontFamily="system-ui" fontWeight="500">{text}</text>
    </svg>
  );
};
