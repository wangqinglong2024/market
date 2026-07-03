import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const DirtyLens: React.FC<{ durationInFrames: number; spotCount?: number; color?: string; opacity?: number }> = ({ durationInFrames, spotCount = 8, color = "#88aacc", opacity = 0.2 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="dl-f"><feGaussianBlur stdDeviation="12" /></filter></defs>
      {Array.from({ length: spotCount }, (_, i) => {
        const x = random(`dl-x${i}`) * W;
        const y = random(`dl-y${i}`) * H;
        const r = 20 + random(`dl-r${i}`) * 50;
        const breathe = 0.9 + Math.sin(t * (0.5 + random(`dl-f${i}`) * 0.5) + i) * 0.1;
        return <circle key={i} cx={x} cy={y} r={r * breathe} fill={color} opacity={fade * opacity * (0.5 + random(`dl-op${i}`) * 0.5)} filter="url(#dl-f)" />;
      })}
    </svg>
  );
};
