import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Stretch: React.FC<{ durationInFrames: number; color?: string; opacity?: number; direction?: "h" | "v" }> = ({ durationInFrames, color = "#fff", opacity = 0.25, direction = "h" }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bf = direction === "h" ? `0.2 0.002` : `0.002 0.2`;
  const scale = 25 + Math.sin(t * 2) * 10;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="str">
          <feTurbulence type="turbulence" baseFrequency={bf} numOctaves={1} seed={t * 0.1} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={color} filter="url(#str)" opacity={fade * opacity * 0.1} />
    </svg>
  );
};
