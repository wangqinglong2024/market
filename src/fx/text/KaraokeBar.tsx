import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const KaraokeBar: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; baseColor?: string; highlightColor?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 38, baseColor = "#ccc", highlightColor = "#ffe566", opacity = 0.95 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const progress = interpolate(frame, [fps * 0.2, durationInFrames - fps * 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textW = text.length * fontSize * 0.57;
  const tx = W * x;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <clipPath id="kk-clip"><rect x={tx - textW / 2} y={H * y - fontSize} width={textW * progress} height={fontSize * 1.3} /></clipPath>
      </defs>
      <text x={tx} y={H * y} textAnchor="middle" fontSize={fontSize} fill={baseColor} opacity={fade * opacity} fontFamily="system-ui" fontWeight="700">{text}</text>
      <text x={tx} y={H * y} textAnchor="middle" fontSize={fontSize} fill={highlightColor} opacity={fade * opacity} fontFamily="system-ui" fontWeight="700" clipPath="url(#kk-clip)">{text}</text>
    </svg>
  );
};
