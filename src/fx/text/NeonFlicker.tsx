import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const NeonFlicker: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.12, fontSize = 52, color = "#ff44aa", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flicker = (Math.sin(t * 7.3) > 0.95 || Math.sin(t * 13.7) > 0.97) ? 0.2 : 1;
  const glowSize = 8 + Math.sin(t * 2) * 3;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="nf-g">
          <feGaussianBlur stdDeviation={glowSize} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * flicker * 0.5 * opacity} fontFamily="system-ui" fontWeight="900" filter="url(#nf-g)">{text}</text>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * flicker * opacity} fontFamily="system-ui" fontWeight="900" stroke="#fff" strokeWidth={0.5}>{text}</text>
    </svg>
  );
};
