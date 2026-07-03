import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Rain: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number; heavy?: boolean }> = ({ durationInFrames, count = 80, color = "#a8c8ff", opacity = 0.4, heavy = false }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const angle = heavy ? 20 : 10;
  const rad = (angle * Math.PI) / 180;
  const speedMult = heavy ? 1.5 : 1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`rn-x${i}`) * (W + 100) - 50;
        const spd = (300 + random(`rn-s${i}`) * 300) * speedMult;
        const yOff = random(`rn-yo${i}`) * H;
        const progress = ((yOff + t * spd) % (H + 20)) / (H + 20);
        const y1 = progress * H - 10;
        const len = heavy ? 20 + random(`rn-l${i}`) * 25 : 12 + random(`rn-l${i}`) * 15;
        const x1 = x0 + Math.sin(rad) * y1;
        const x2 = x1 - Math.sin(rad) * len;
        const y2 = y1 - Math.cos(rad) * len;
        const sw = heavy ? 1.5 : 1;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} opacity={fade * (0.5 + random(`rn-op${i}`) * 0.5) * opacity} />;
      })}
    </svg>
  );
};
