import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const OldFilm: React.FC<{ durationInFrames: number; opacity?: number }> = ({ durationInFrames, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scratch = (Math.sin(t * 17) > 0.92) ? 1 : 0;
  const scratchX = (Math.sin(t * 31) * 0.5 + 0.5) * W;
  const grainSeed = frame * 1.3;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="of-grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={4} seed={grainSeed} result="n" /><feColorMatrix type="saturate" values="0" in="n" result="g" /><feBlend in="SourceGraphic" in2="g" mode="multiply" /></filter>
        <radialGradient id="of-vig" cx="50%" cy="50%" r="70%"><stop offset="30%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#5c3a00" stopOpacity="0.7" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#c8a055" filter="url(#of-grain)" opacity={fade * opacity * 0.5} style={{ mixBlendMode: "multiply" }} />
      <rect x={0} y={0} width={W} height={H} fill="url(#of-vig)" opacity={fade * opacity * 0.6} />
      {scratch > 0 && <rect x={scratchX} y={0} width={2} height={H} fill="#fff" opacity={fade * 0.4} />}
    </svg>
  );
};
