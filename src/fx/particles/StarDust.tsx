import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const StarDust: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 50, color = "#ffee88", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = random(`sd-x${i}`) * W;
        const y = random(`sd-y${i}`) * H;
        const r = 0.5 + random(`sd-r${i}`) * 2.5;
        const life = (t * (0.4 + random(`sd-l${i}`) * 0.8) + random(`sd-p${i}`)) % 1;
        const op = Math.sin(life * Math.PI);
        const drift = Math.sin(t * 0.5 + i) * 15;
        return <circle key={i} cx={x + drift} cy={y - life * 40} r={r} fill={color} opacity={fade * op * opacity} />;
      })}
    </svg>
  );
};
