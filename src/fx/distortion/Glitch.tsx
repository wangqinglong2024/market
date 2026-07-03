import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Glitch: React.FC<{ durationInFrames: number; intensity?: number; opacity?: number; rate?: number }> = ({ durationInFrames, intensity = 20, opacity = 0.55, rate = 3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const active = Math.sin(t * rate * Math.PI * 2 + Math.sin(t * 11)) > 0.6;
  const slices = 6;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {active && Array.from({ length: slices }, (_, i) => {
        const y = random(`gl-y${i}-${Math.floor(t * 12)}`) * H;
        const sh = (random(`gl-sh${i}-${Math.floor(t * 12)}`) * intensity * 2) - intensity;
        const h = 4 + random(`gl-h${i}`) * 20;
        const color = random(`gl-c${i}`) > 0.5 ? "#ff000044" : "#0000ff44";
        return <rect key={i} x={sh} y={y} width={W} height={h} fill={color} opacity={fade * opacity} />;
      })}
    </svg>
  );
};
