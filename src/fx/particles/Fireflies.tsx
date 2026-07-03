import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Fireflies: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 20, color = "#aaff66", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="ff-glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const cx = random(`ff-cx${i}`) * W;
        const cy = random(`ff-cy${i}`) * H * 0.8 + H * 0.1;
        const dx = Math.sin(t * (0.4 + random(`ff-fx${i}`) * 0.6) + i * 1.3) * 60;
        const dy = Math.cos(t * (0.3 + random(`ff-fy${i}`) * 0.5) + i * 0.9) * 40;
        const blink = Math.pow(Math.max(0, Math.sin(t * (1.5 + random(`ff-b${i}`)) + i * 2.1)), 3);
        return <circle key={i} cx={cx + dx} cy={cy + dy} r={3 + random(`ff-r${i}`) * 3} fill={color} opacity={fade * blink * opacity} filter="url(#ff-glow)" />;
      })}
    </svg>
  );
};
