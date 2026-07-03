import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Ripple: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number; speed?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.5, color = "#88aaff", opacity = 0.4, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bf = 0.015 + Math.sin(t * speed * 2) * 0.005;
  const scale = 20 + Math.sin(t * speed * 1.5) * 8;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="rpl">
          <feTurbulence type="turbulence" baseFrequency={`${bf} ${bf}`} numOctaves={2} seed={t * 0.3} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id="rpl-g" cx={`${cx * 100}%`} cy={`${cy * 100}%`} r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#rpl-g)" filter="url(#rpl)" opacity={fade * opacity} />
    </svg>
  );
};
