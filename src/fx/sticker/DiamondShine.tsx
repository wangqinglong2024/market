import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const DiamondShine: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 8, color = "#cceeff", opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="ds-g"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.05 + random(`ds-x${i}`) * 0.9) * W;
        const y = (0.05 + random(`ds-y${i}`) * 0.85) * H;
        const sz = 10 + random(`ds-sz${i}`) * 16;
        const life = ((t * (0.4 + random(`ds-l${i}`) * 0.4) + random(`ds-p${i}`)) % 1);
        const sc = Math.sin(life * Math.PI);
        const rot = life * 180;
        const op = sc * opacity;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${rot}) scale(${sc})`} opacity={fade * op} filter="url(#ds-g)">
            <polygon points={`0,${-sz} ${sz * 0.5},0 0,${sz * 0.7} ${-sz * 0.5},0`} fill={color} />
            <polygon points={`0,${-sz * 0.3} ${sz * 0.15},0 0,${sz * 0.2} ${-sz * 0.15},0`} fill="#fff" opacity={0.7} />
            <line x1={-sz * 0.15} y1={sz * 0.1} x2={sz * 0.15} y2={-sz * 0.1} stroke="#fff" strokeWidth={1} opacity={0.5} />
          </g>
        );
      })}
    </svg>
  );
};
