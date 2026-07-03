import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const GlowTitle: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; glowColor?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.1, fontSize = 48, color = "#fff", glowColor = "#ff88cc", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 6 + Math.sin(t * 1.2 * Math.PI * 2) * 3;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="gt-g">
          <feGaussianBlur stdDeviation={pulse} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={glowColor} opacity={fade * 0.7 * opacity} fontFamily="system-ui" fontWeight="800" filter="url(#gt-g)">{text}</text>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * opacity} fontFamily="system-ui" fontWeight="800">{text}</text>
    </svg>
  );
};
