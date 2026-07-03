// 同心波纹扩张 — 从指定点向外扩散的圆环，涟漪/传递感
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const RippleRings: React.FC<{
  durationInFrames: number;
  originX?: number;   // 0~1，默认 0.5
  originY?: number;   // 0~1，默认 0.5
  period?: number;    // 每隔几秒出一圈，默认 1.1
  color?: string;
  opacity?: number;   // 峰值，默认 0.45
}> = ({ durationInFrames, originX = 0.5, originY = 0.5, period = 1.1, color = "#f48fb1", opacity = 0.45 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const totalSec = durationInFrames / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ox = W * originX;
  const oy = H * originY;
  const maxR = Math.hypot(W, H) * 0.5;
  const N = Math.ceil(totalSec / period) + 3;
  const COLORS = [color, "#ffb74d", "#e57373", "#fff176", "#80cbc4"];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: N }, (_, i) => {
        const age = t - i * period;
        if (age < 0 || age > period * 2) return null;
        const life = age / (period * 2);
        const r  = interpolate(life, [0, 1], [4, maxR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const op = fade * interpolate(life, [0, 0.06, 0.6, 1], [0, opacity, opacity * 0.25, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const sw = interpolate(life, [0, 1], [4, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <circle key={i} cx={ox} cy={oy} r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={sw} opacity={op} />;
      })}
    </svg>
  );
};
