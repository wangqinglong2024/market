// 机制：SVG 细藤路径渐进描绘 — 淡淡的花枝从角落悄悄生长，如妹妹手写的温柔
// 线条细、透明度低，只在边缘装饰，不盖主画面
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const draw = interpolate(frame, [fps * 0.5, durationInFrames - fps * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 两条细藤从左下角和右上角延伸，保持在边缘区域
  const vines = [
    { d: `M ${W*0.0},${H*0.72} C ${W*0.08},${H*0.52} ${W*0.2},${H*0.6} ${W*0.28},${H*0.38} S ${W*0.38},${H*0.18} ${W*0.48},${H*0.22}`, color: "#a5683a", delay: 0 },
    { d: `M ${W},${H*0.18} C ${W*0.88},${H*0.28} ${W*0.78},${H*0.16} ${W*0.68},${H*0.32} S ${W*0.6},${H*0.48} ${W*0.52},${H*0.42}`, color: "#6b8c3a", delay: 0.28 },
  ];
  const buds = [
    { x: W*0.28, y: H*0.38, t: 0.32, c: "#e91e63", r: 7 },
    { x: W*0.48, y: H*0.22, t: 0.58, c: "#ff9800", r: 6 },
    { x: W*0.68, y: H*0.32, t: 0.68, c: "#9c27b0", r: 6 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} opacity={fade * 0.7}>
      {vines.map((v, i) => {
        const p = Math.max(0, Math.min(1, (draw - v.delay) / (1 - v.delay)));
        return (
          <path key={i} d={v.d} fill="none" stroke={v.color} strokeWidth={3}
            strokeLinecap="round" pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - p}
            opacity={0.65}
            style={{ filter: `drop-shadow(0 0 3px ${v.color}66)` }} />
        );
      })}
      {buds.map((b, i) => {
        const s = draw >= b.t ? Math.min((draw - b.t) / 0.12, 1) : 0;
        return <circle key={i} cx={b.x} cy={b.y} r={b.r * s} fill={b.c}
          opacity={s * 0.75} style={{ filter: `drop-shadow(0 0 4px ${b.c}88)` }} />;
      })}
    </svg>
  );
};
