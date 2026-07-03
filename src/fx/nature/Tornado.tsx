import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Tornado: React.FC<{ durationInFrames: number; cx?: number; color?: string; opacity?: number }> = ({ durationInFrames, cx = 0.5, color = "#aaccdd", opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rings = 14;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rings }, (_, i) => {
        const progress = i / (rings - 1);
        const y = H * 0.1 + progress * H * 0.75;
        const rx = 10 + progress * 110;
        const ry = 8 + progress * 15;
        const twist = t * 3 - progress * 2;
        const dashLen = rx * 0.4;
        const op = (0.3 + progress * 0.7) * opacity;
        return (
          <ellipse key={i} cx={W * cx + Math.sin(twist) * 5} cy={y} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={`${dashLen} ${dashLen}`} opacity={fade * op} />
        );
      })}
    </svg>
  );
};
