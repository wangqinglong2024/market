import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const HeartBurst: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ff6b9d", count = 14, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + random(`hb-a${i}`);
        const life = ((t * 0.6 + random(`hb-p${i}`)) % 1);
        const dist = life * (120 + random(`hb-d${i}`) * 80);
        const x = W / 2 + Math.cos(angle) * dist;
        const y = H / 2 + Math.sin(angle) * dist;
        const sz = (8 + random(`hb-sz${i}`) * 10) * (1 - life * 0.4);
        const op = Math.sin(life * Math.PI) * opacity;
        const heartPath = `M0,-${sz * 0.5} C-${sz * 0.5},-${sz} -${sz},-${sz * 0.3} 0,${sz * 0.4} C${sz},-${sz * 0.3} ${sz * 0.5},-${sz} 0,-${sz * 0.5}`;
        return <path key={i} d={heartPath} fill={color} opacity={fade * op} transform={`translate(${x},${y})`} />;
      })}
    </svg>
  );
};
