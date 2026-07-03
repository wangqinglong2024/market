import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const TrianglePop: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ffb3d1", count = 10, opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const cx = random(`tp-x${i}`) * W;
        const cy = random(`tp-y${i}`) * H;
        const life = ((t * (0.4 + random(`tp-l${i}`) * 0.5) + random(`tp-p${i}`)) % 1);
        const sz = 20 + random(`tp-s${i}`) * 30;
        const sc = sz * life;
        const rot = life * (120 + random(`tp-r${i}`) * 120);
        const op = Math.sin(life * Math.PI) * opacity;
        const h3 = sc * 0.866;
        return (
          <polygon key={i} points={`${cx},${cy - h3 * 0.67} ${cx - sc / 2},${cy + h3 * 0.33} ${cx + sc / 2},${cy + h3 * 0.33}`} fill={color} opacity={fade * op} transform={`rotate(${rot},${cx},${cy})`} />
        );
      })}
    </svg>
  );
};
