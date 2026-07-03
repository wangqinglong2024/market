import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const IrisReveal: React.FC<{ durationInFrames: number; sides?: number; color?: string; opacity?: number }> = ({ durationInFrames, sides = 6, color = "#2a1a3e", opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const open = interpolate(frame, [0, durationInFrames * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.7, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxR = Math.sqrt(W * W + H * H) / 2;
  const cx = W / 2, cy = H / 2;
  const petals = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2;
    const a2 = ((i + 1) / sides) * Math.PI * 2;
    const inR = maxR * (1 - open);
    const x1 = cx + Math.cos(a) * maxR, y1 = cy + Math.sin(a) * maxR;
    const x2 = cx + Math.cos(a2) * maxR, y2 = cy + Math.sin(a2) * maxR;
    const ix = cx + Math.cos((a + a2) / 2) * inR, iy = cy + Math.sin((a + a2) / 2) * inR;
    return `M${cx},${cy} L${x1},${y1} L${ix},${iy} L${x2},${y2} Z`;
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {petals.map((d, i) => <path key={i} d={d} fill={color} opacity={fade * opacity} />)}
    </svg>
  );
};
