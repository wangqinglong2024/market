import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const TypeOn: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 36, color = "#fff", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const chars = Math.floor(interpolate(frame, [0, fps * 1.5], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fade = interpolate(frame, [durationInFrames - fps * 0.4, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursor = frame % (fps * 0.5) < fps * 0.25 ? "|" : "";
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * opacity} fontFamily="system-ui" fontWeight="600">{text.slice(0, chars)}{cursor}</text>
    </svg>
  );
};
