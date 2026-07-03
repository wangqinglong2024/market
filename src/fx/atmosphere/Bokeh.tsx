// 浮动散景光球 — 大而柔软的模糊光斑漂移，烛光/背景虚化氛围
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";

export const Bokeh: React.FC<{
  durationInFrames: number;
  count?: number;
  color?: string;
  blurRadius?: number;  // feGaussianBlur stdDeviation，默认 28
  opacity?: number;     // 峰值透明度，默认 0.35
  seed?: string;
}> = ({ durationInFrames, count = 5, color = "#ffd54f", blurRadius = 28, opacity = 0.35, seed = "bk" }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="bkBlur"><feGaussianBlur stdDeviation={blurRadius} /></filter>
      </defs>
      {Array.from({ length: count }, (_, i) => {
        const bx = random(`${seed}x${i}`) * W;
        const by = random(`${seed}y${i}`) * H * 0.85;
        const r  = 70 + random(`${seed}r${i}`) * 100;
        const ph = random(`${seed}p${i}`) * Math.PI * 2;
        const dx = Math.sin(t * 0.18 * Math.PI * 2 + ph) * 20;
        const dy = Math.cos(t * 0.14 * Math.PI * 2 + ph) * 15;
        const br = 0.5 + Math.sin(t * 0.25 * Math.PI * 2 + ph) * 0.5;
        const op = fade * (opacity * 0.5 + br * opacity * 0.5);
        return <circle key={i} cx={bx + dx} cy={by + dy} r={r} fill={color} opacity={op} filter="url(#bkBlur)" />;
      })}
    </svg>
  );
};
