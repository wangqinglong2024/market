import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WarpWave: React.FC<{ durationInFrames: number; color?: string; opacity?: number; amplitude?: number }> = ({ durationInFrames, color = "#fff", opacity = 0.35, amplitude = 15 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bf = 0.006 + Math.sin(t * 0.7) * 0.002;
  const scale = amplitude + Math.sin(t * 1.3) * amplitude * 0.3;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="ww">
          <feTurbulence type="turbulence" baseFrequency={`${bf} ${bf * 2}`} numOctaves={2} seed={t * 0.15} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={scale} xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={color} filter="url(#ww)" opacity={fade * opacity * 0.15} />
    </svg>
  );
};
