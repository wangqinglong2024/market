import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const NightBloom: React.FC<{ durationInFrames: number; starCount?: number; opacity?: number }> = ({ durationInFrames, starCount = 30, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="nb" cx="50%" cy="20%" r="70%"><stop offset="0%" stopColor="#1a1a4e" stopOpacity="0" /><stop offset="100%" stopColor="#0d0d2b" stopOpacity="0.55" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#nb)" opacity={fade * opacity} />
      {Array.from({ length: starCount }, (_, i) => {
        const x = random(`nb-x${i}`) * W;
        const y = random(`nb-y${i}`) * H * 0.6;
        const r = 0.8 + random(`nb-r${i}`) * 2;
        const twinkle = 0.3 + Math.sin(t * (1 + random(`nb-f${i}`)) * Math.PI * 2 + i) * 0.7;
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={fade * twinkle * 0.8} style={{ filter: "drop-shadow(0 0 3px #adf)" }} />;
      })}
    </svg>
  );
};
