import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DotBorder: React.FC<{ durationInFrames: number; color?: string; dotSize?: number; gap?: number; opacity?: number }> = ({ durationInFrames, color = "#ff88cc", dotSize = 6, gap = 16, opacity = 0.65 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const margin = 14;
  const dotsH = Math.floor((W - margin * 2) / gap);
  const dotsV = Math.floor((H - margin * 2) / gap);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: dotsH }, (_, i) => {
        const x = margin + i * gap;
        const wave = Math.sin(t * 2 + i * 0.4) * 0.5 + 0.5;
        return [
          <circle key={`t-${i}`} cx={x} cy={margin} r={dotSize * (0.5 + wave * 0.5)} fill={color} opacity={fade * wave * opacity} />,
          <circle key={`b-${i}`} cx={x} cy={H - margin} r={dotSize * (0.5 + wave * 0.5)} fill={color} opacity={fade * wave * opacity} />,
        ];
      })}
      {Array.from({ length: dotsV }, (_, i) => {
        const y = margin + i * gap;
        const wave = Math.sin(t * 2 + i * 0.4) * 0.5 + 0.5;
        return [
          <circle key={`l-${i}`} cx={margin} cy={y} r={dotSize * (0.5 + wave * 0.5)} fill={color} opacity={fade * wave * opacity} />,
          <circle key={`r-${i}`} cx={W - margin} cy={y} r={dotSize * (0.5 + wave * 0.5)} fill={color} opacity={fade * wave * opacity} />,
        ];
      })}
    </svg>
  );
};
