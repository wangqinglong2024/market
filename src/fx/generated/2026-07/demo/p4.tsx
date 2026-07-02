// 机制：浮动散景光球 — 大而柔软的模糊光斑缓缓漂移，如烛光晕染的守护氛围
// 与 p5(尖锐扩张圆环)、p1(移动光带) 本质不同：这是静态大圆 + blur，只做微小位移
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;

  const fade = interpolate(frame, [0, fps * 0.8, durationInFrames - fps * 0.7, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const orbs = [
    { bx: W * 0.18, by: H * 0.22, r: 110, color: "#ffd54f", phase: 0 },
    { bx: W * 0.78, by: H * 0.3,  r: 95,  color: "#ffb74d", phase: 1.8 },
    { bx: W * 0.5,  by: H * 0.52, r: 130, color: "#ffe082", phase: 3.5 },
    { bx: W * 0.12, by: H * 0.55, r: 80,  color: "#ffd54f", phase: 5.1 },
    { bx: W * 0.88, by: H * 0.5,  r: 75,  color: "#ffcc80", phase: 2.6 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="p4bokeh">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      {orbs.map((o, i) => {
        const dx = Math.sin(t * 0.18 * Math.PI * 2 + o.phase) * 18;
        const dy = Math.cos(t * 0.14 * Math.PI * 2 + o.phase) * 14;
        const breathe = 0.5 + Math.sin(t * 0.25 * Math.PI * 2 + o.phase) * 0.5;
        const op = fade * (0.18 + breathe * 0.2);
        return (
          <circle key={i}
            cx={o.bx + dx} cy={o.by + dy} r={o.r}
            fill={o.color} opacity={op}
            filter="url(#p4bokeh)"
          />
        );
      })}
    </svg>
  );
};
