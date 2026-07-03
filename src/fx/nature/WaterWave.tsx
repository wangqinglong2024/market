import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WaterWave: React.FC<{ durationInFrames: number; color?: string; waveCount?: number; opacity?: number; startY?: number }> = ({ durationInFrames, color = "#4499dd", waveCount = 4, opacity = 0.35, startY = 0.65 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const waves = Array.from({ length: waveCount }, (_, wi) => {
    const baseY = H * startY + wi * 25;
    const amp = 15 - wi * 2;
    const freq = 0.6 + wi * 0.15;
    const speed = 0.8 + wi * 0.2;
    const pts = Array.from({ length: 40 }, (_, i) => {
      const x = (i / 39) * W;
      const y = baseY + Math.sin(x * freq * 0.01 + t * speed * Math.PI * 2) * amp;
      return `${x},${y}`;
    });
    return `M0,${H} L${pts.join(" L")} L${W},${H} Z`;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {waves.map((d, i) => <path key={i} d={d} fill={color} opacity={fade * opacity * (1 - i * 0.15)} />)}
    </svg>
  );
};
