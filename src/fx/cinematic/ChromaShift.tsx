import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ChromaShift: React.FC<{ durationInFrames: number; intensity?: number; opacity?: number }> = ({ durationInFrames, intensity = 8, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = Math.sin(t * 3) * intensity;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="cs-r"><feOffset dx={shift} dy={0} /><feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id="cs-b"><feOffset dx={-shift} dy={0} /><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#fff" filter="url(#cs-r)" opacity={fade * opacity * 0.3} style={{ mixBlendMode: "screen" }} />
      <rect x={0} y={0} width={W} height={H} fill="#fff" filter="url(#cs-b)" opacity={fade * opacity * 0.3} style={{ mixBlendMode: "screen" }} />
    </svg>
  );
};
