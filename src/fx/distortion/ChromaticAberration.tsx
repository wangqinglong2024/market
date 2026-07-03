import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ChromaticAberration: React.FC<{ durationInFrames: number; intensity?: number; opacity?: number }> = ({ durationInFrames, intensity = 6, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = intensity + Math.sin(t * 2) * intensity * 0.4;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="ca-r"><feOffset dx={shift} dy={0} /></filter>
        <filter id="ca-g"><feOffset dx={0} dy={shift * 0.3} /></filter>
        <filter id="ca-b"><feOffset dx={-shift} dy={0} /></filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#f00" filter="url(#ca-r)" opacity={fade * opacity * 0.15} style={{ mixBlendMode: "screen" }} />
      <rect x={0} y={0} width={W} height={H} fill="#0f0" filter="url(#ca-g)" opacity={fade * opacity * 0.1} style={{ mixBlendMode: "screen" }} />
      <rect x={0} y={0} width={W} height={H} fill="#00f" filter="url(#ca-b)" opacity={fade * opacity * 0.15} style={{ mixBlendMode: "screen" }} />
    </svg>
  );
};
