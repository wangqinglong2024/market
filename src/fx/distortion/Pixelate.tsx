import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Pixelate: React.FC<{ durationInFrames: number; pixelSize?: number; color?: string; opacity?: number }> = ({ durationInFrames, pixelSize = 24, color = "#224488", opacity = 0.2 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cols = Math.ceil(W / pixelSize);
  const rows = Math.ceil(H / pixelSize);
  const seed = Math.floor(t * 8);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="px-f"><feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves={1} seed={seed} result="n" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const noise = Math.sin(c * 1.7 + r * 2.3 + seed * 3.1) * 0.5 + 0.5;
          if (noise < 0.7) return null;
          return <rect key={`${r}-${c}`} x={c * pixelSize} y={r * pixelSize} width={pixelSize} height={pixelSize} fill={color} opacity={fade * noise * opacity} />;
        })
      )}
    </svg>
  );
};
