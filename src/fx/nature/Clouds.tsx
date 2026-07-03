import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Clouds: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#fff", count = 5, opacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 1, durationInFrames - fps * 0.8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="cl-blur"><feGaussianBlur stdDeviation="12" /></filter></defs>
      {Array.from({ length: count }, (_, i) => {
        const spd = 20 + random(`cl-s${i}`) * 30;
        const x0 = random(`cl-x${i}`) * W;
        const x = ((x0 + t * spd) % (W + 300)) - 150;
        const y = random(`cl-y${i}`) * H * 0.4;
        const w = 150 + random(`cl-w${i}`) * 200;
        const h = 50 + random(`cl-h${i}`) * 60;
        return (
          <g key={i} transform={`translate(${x},${y})`} opacity={fade * opacity} filter="url(#cl-blur)">
            <ellipse cx={0} cy={0} rx={w * 0.5} ry={h * 0.5} fill={color} />
            <ellipse cx={-w * 0.18} cy={-h * 0.2} rx={w * 0.3} ry={h * 0.45} fill={color} />
            <ellipse cx={w * 0.18} cy={-h * 0.15} rx={w * 0.28} ry={h * 0.4} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};
