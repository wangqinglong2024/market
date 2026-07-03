import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const COLORS = ["#ffe566", "#ff8844", "#ff6b9d", "#a29bfe", "#74b9ff"];
function star5(cx: number, cy: number, r1: number, r2: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * Math.PI / 180;
    const r = i % 2 === 0 ? r1 : r2;
    return `${i === 0 ? "M" : "L"}${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(" ") + " Z";
}
export const StarSticker: React.FC<{ durationInFrames: number; count?: number; opacity?: number }> = ({ durationInFrames, count = 10, opacity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.6, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = (0.03 + random(`ss-x${i}`) * 0.94) * W;
        const y = (0.03 + random(`ss-y${i}`) * 0.9) * H;
        const r1 = 12 + random(`ss-r${i}`) * 18;
        const r2 = r1 * 0.4;
        const color = COLORS[Math.floor(random(`ss-c${i}`) * COLORS.length)];
        const pulse = 1 + Math.sin(t * (1 + random(`ss-f${i}`) * 0.5) + i) * 0.12;
        const rot = t * (20 + random(`ss-rot${i}`) * 30) * (random(`ss-dir${i}`) > 0.5 ? 1 : -1);
        return <path key={i} d={star5(x, y, r1 * pulse, r2 * pulse)} fill={color} opacity={fade * opacity} transform={`rotate(${rot},${x},${y})`} />;
      })}
    </svg>
  );
};
