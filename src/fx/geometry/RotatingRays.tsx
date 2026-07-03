import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const RotatingRays: React.FC<{ durationInFrames: number; rayCount?: number; color?: string; opacity?: number; rpm?: number }> = ({ durationInFrames, rayCount = 12, color = "#fff5cc", opacity = 0.3, rpm = 4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rot = (t * rpm * 360) % 360;
  const r = Math.sqrt(W * W + H * H);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g transform={`rotate(${rot},${W / 2},${H / 2})`}>
        {Array.from({ length: rayCount }, (_, i) => {
          const a = (i / rayCount) * 360;
          const a2 = a + 360 / rayCount * 0.4;
          const toRad = (d: number) => (d * Math.PI) / 180;
          return (
            <polygon key={i} points={`${W / 2},${H / 2} ${W / 2 + Math.cos(toRad(a)) * r},${H / 2 + Math.sin(toRad(a)) * r} ${W / 2 + Math.cos(toRad(a2)) * r},${H / 2 + Math.sin(toRad(a2)) * r}`} fill={color} opacity={fade * opacity} />
          );
        })}
      </g>
    </svg>
  );
};
