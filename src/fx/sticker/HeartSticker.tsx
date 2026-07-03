import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ff6b9d", "#ff44aa", "#ff88cc", "#ffaadd", "#ff3366"];
export const HeartSticker: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 8, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.05 + random(`hs-x${i}`) * 0.9) * W;
        const y = (0.05 + random(`hs-y${i}`) * 0.85) * H;
        const sz = 18 + random(`hs-sz${i}`) * 22;
        const bob = Math.sin(t * (1 + random(`hs-f${i}`) * 0.5) + i * 1.3) * 8;
        const rot = (random(`hs-r${i}`) - 0.5) * 30;
        const color = COLORS[Math.floor(random(`hs-c${i}`) * COLORS.length)];
        const pulse = 1 + Math.sin(t * 2 + i) * 0.08;
        const hs = sz * pulse;
        const heartPath = `M0,${-hs * 0.35} C${-hs * 0.5},${-hs * 0.8} ${-hs},${-hs * 0.2} 0,${hs * 0.4} C${hs},${-hs * 0.2} ${hs * 0.5},${-hs * 0.8} 0,${-hs * 0.35}`;
        return (
          <path key={i} d={heartPath} fill={color} opacity={fade * opacity} transform={`translate(${x},${y + bob}) rotate(${rot})`} />
        );
      })}
    </svg>
  );
};
