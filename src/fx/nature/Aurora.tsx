import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Aurora: React.FC<{ durationInFrames: number; color1?: string; color2?: string; opacity?: number }> = ({ durationInFrames, color1 = "#00ff88", color2 = "#8844ff", opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 1, durationInFrames - fps * 0.8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wave = (x: number, seed: number) => Math.sin(x * 0.008 + t * 0.4 + seed) * 60 + Math.sin(x * 0.005 - t * 0.3 + seed * 2) * 40;
  const bandH = H * 0.3;
  const bandY = H * 0.1;
  const points1 = Array.from({ length: 30 }, (_, i) => { const x = (i / 29) * W; return `${x},${bandY + wave(x, 0)}`; }).join(" ");
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="au" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={color1} stopOpacity="0.7" /><stop offset="50%" stopColor={color2} stopOpacity="0.7" /><stop offset="100%" stopColor={color1} stopOpacity="0.7" /></linearGradient>
        <filter id="au-blur"><feGaussianBlur stdDeviation="15" /></filter>
      </defs>
      <polygon points={`${points1} ${Array.from({ length: 30 }, (_, i) => { const x = ((29 - i) / 29) * W; return `${x},${bandY + wave(x, 2) + bandH}`; }).join(" ")}`} fill="url(#au)" opacity={fade * opacity} filter="url(#au-blur)" />
    </svg>
  );
};
