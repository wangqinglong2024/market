// 机制：同心波纹从固定点扩张 — 从小狗所在位置向外漾开，陪伴的温柔一圈圈传递
// 极克制：细线、低透明度，不遮挡主画面
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const totalSec = durationInFrames / fps;

  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ox = W * 0.5;
  const oy = H * 0.62;
  const maxR = Math.hypot(W, H) * 0.46;
  const period = 1.2;
  const N = Math.ceil(totalSec / period) + 2;
  const COLORS = ["#f8bbd0", "#ffe0b2", "#f48fb1", "#ffcc80"];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: N }, (_, i) => {
        const age = t - i * period;
        if (age < 0 || age > period * 2) return null;
        const life = age / (period * 2);
        const r = interpolate(life, [0, 1], [4, maxR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const op = fade * interpolate(life, [0, 0.06, 0.6, 1], [0, 0.45, 0.12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const sw = interpolate(life, [0, 1], [3.5, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <circle key={i} cx={ox} cy={oy} r={r} fill="none"
          stroke={COLORS[i % COLORS.length]} strokeWidth={sw} opacity={op} />;
      })}
      <circle cx={ox} cy={oy} r={5} fill="#f48fb1" opacity={fade * 0.6} />
    </svg>
  );
};
