import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Bubble: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 12, color = "#aaddff", opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = (0.1 + random(`bub-x${i}`) * 0.8) * W;
        const spd = 40 + random(`bub-s${i}`) * 50;
        const yOff = random(`bub-yo${i}`) * H;
        const y = H - ((yOff + t * spd) % (H + 60));
        const sway = Math.sin(t * 0.8 + i * 1.2) * 20;
        const r = 8 + random(`bub-r${i}`) * 20;
        const life = ((yOff + t * spd) % (H + 60)) / (H + 60);
        const op = life < 0.9 ? 0.7 : (1 - (life - 0.9) / 0.1) * 0.7;
        return (
          <g key={i} opacity={fade * op * opacity}>
            <circle cx={x0 + sway} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.5} />
            <circle cx={x0 + sway - r * 0.3} cy={y - r * 0.3} r={r * 0.15} fill="#fff" opacity={0.6} />
          </g>
        );
      })}
    </svg>
  );
};
