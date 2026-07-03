import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ShadowStack: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; shadowColor?: string; opacity?: number; layers?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 44, color = "#fff", shadowColor = "#ff44aa", opacity = 0.9, layers = 4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = 3 + Math.sin(t * 2) * 1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: layers }, (_, i) => (
        <text key={i} x={W * x + (layers - i) * shift} y={H * y + (layers - i) * shift} textAnchor="middle" fontSize={fontSize} fill={shadowColor} opacity={fade * (i / layers) * 0.5 * opacity} fontFamily="system-ui" fontWeight="900">{text}</text>
      ))}
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * opacity} fontFamily="system-ui" fontWeight="900">{text}</text>
    </svg>
  );
};
