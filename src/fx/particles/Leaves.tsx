import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const Leaves: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 18, color = "#88cc44", opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`lv-x${i}`) * W;
        const spd = 50 + random(`lv-s${i}`) * 70;
        const sway = 40 + random(`lv-sw${i}`) * 60;
        const yOff = random(`lv-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 40)) - 20;
        const x = x0 + Math.sin(t * 1.2 + i * 0.7) * sway;
        const rot = t * (120 + random(`lv-r${i}`) * 180) + i * 30;
        const sz = 8 + random(`lv-sz${i}`) * 14;
        return (
          <ellipse key={i} cx={x} cy={y} rx={sz} ry={sz * 0.5} fill={color} opacity={fade * 0.8 * opacity}
            transform={`rotate(${rot},${x},${y})`} />
        );
      })}
    </svg>
  );
};
