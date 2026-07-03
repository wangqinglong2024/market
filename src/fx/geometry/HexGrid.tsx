import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const HexGrid: React.FC<{ durationInFrames: number; color?: string; opacity?: number; cols?: number }> = ({ durationInFrames, color = "#88ccff", opacity = 0.2, cols = 8 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hexW = W / cols;
  const hexH = hexW * 0.866;
  const rows = Math.ceil(H / hexH) + 1;
  const hexPath = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return `${i === 0 ? "M" : "L"}${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ") + " Z";
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols + 1 }, (_, col) => {
          const ox = col % 2 === 0 ? 0 : hexW / 2;
          const cx = col * hexW + ox;
          const cy = row * hexH;
          const wave = Math.sin(t * 1.5 + col * 0.5 + row * 0.8) * 0.5 + 0.5;
          return <path key={`${row}-${col}`} d={hexPath(cx, cy, hexW * 0.47)} fill="none" stroke={color} strokeWidth={1} opacity={fade * opacity * wave} />;
        })
      )}
    </svg>
  );
};
