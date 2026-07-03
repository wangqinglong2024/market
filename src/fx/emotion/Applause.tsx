import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Applause: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ffe566", count = 20, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="ap-glow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + t * 0.3;
        const dist = 60 + random(`ap-d${i}`) * 120;
        const life = ((t * (0.5 + random(`ap-l${i}`) * 0.5) + random(`ap-p${i}`)) % 1);
        const x = W / 2 + Math.cos(angle) * dist * life * 2;
        const y = H / 2 + Math.sin(angle) * dist * life * 2;
        const sz = (3 + random(`ap-r${i}`) * 5) * (1 - life);
        const op = Math.sin(life * Math.PI) * opacity;
        return <circle key={i} cx={x} cy={y} r={sz} fill={color} opacity={fade * op} filter="url(#ap-glow)" />;
      })}
    </svg>
  );
};
