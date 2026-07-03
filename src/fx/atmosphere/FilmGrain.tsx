import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const FilmGrain: React.FC<{ durationInFrames: number; opacity?: number }> = ({ durationInFrames, opacity = 0.12 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seed = frame * 0.7;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="fg"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed={seed} result="n" /><feColorMatrix type="saturate" values="0" in="n" result="g" /><feBlend in="SourceGraphic" in2="g" mode="multiply" /></filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#888" filter="url(#fg)" opacity={fade * opacity} />
    </svg>
  );
};
