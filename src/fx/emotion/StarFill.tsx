import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
function star(cx: number, cy: number, r1: number, r2: number, pts: number) {
  const pts2 = pts * 2;
  return Array.from({ length: pts2 }, (_, i) => {
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    return `${i === 0 ? "M" : "L"}${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(" ") + " Z";
}
export const StarFill: React.FC<{ durationInFrames: number; color?: string; count?: number; opacity?: number }> = ({ durationInFrames, color = "#ffe066", count = 12, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.1 + random(`sf-x${i}`) * 0.8) * W;
        const y = (0.05 + random(`sf-y${i}`) * 0.85) * H;
        const life = ((t * (0.3 + random(`sf-l${i}`) * 0.5) + random(`sf-p${i}`)) % 1);
        const sz = (10 + random(`sf-sz${i}`) * 20) * Math.sin(life * Math.PI);
        const rot = life * 360 * (random(`sf-r${i}`) > 0.5 ? 1 : -1);
        const op = Math.sin(life * Math.PI) * opacity;
        return <path key={i} d={star(x, y, sz, sz * 0.4, 5)} fill={color} opacity={fade * op} transform={`rotate(${rot},${x},${y})`} />;
      })}
    </svg>
  );
};
