import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const FadeRays: React.FC<{ durationInFrames: number; rayCount?: number; color?: string; opacity?: number }> = ({ durationInFrames, rayCount = 16, color = "#fff8e7", opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const r = Math.sqrt(W * W + H * H);
  const rot = t * 8;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="fr" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={color} stopOpacity="0.6" /><stop offset="100%" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      <g transform={`rotate(${rot},${W / 2},${H / 2})`}>
        {Array.from({ length: rayCount }, (_, i) => {
          const a = (i / rayCount) * 360;
          const a2 = a + 360 / rayCount * 0.5;
          const toRad = (d: number) => (d * Math.PI) / 180;
          return <polygon key={i} points={`${W / 2},${H / 2} ${W / 2 + Math.cos(toRad(a)) * r},${H / 2 + Math.sin(toRad(a)) * r} ${W / 2 + Math.cos(toRad(a2)) * r},${H / 2 + Math.sin(toRad(a2)) * r}`} fill={color} opacity={fade * opacity * 0.6} />;
        })}
      </g>
      <rect x={0} y={0} width={W} height={H} fill="url(#fr)" opacity={fade * opacity * 0.5} />
    </svg>
  );
};
