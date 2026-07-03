// SVG 路径渐进描绘 — 线条被逐笔画出，手绘/书写感
// 使用方：传入 paths 数组，每条路径有 d/color/delay(0~1)
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export type PathSpec = {
  d: string;
  color?: string;
  delay?: number;   // 开始描绘时间偏移(0~1)，默认 0
  strokeWidth?: number;
};

export const PathDraw: React.FC<{
  durationInFrames: number;
  paths: PathSpec[];
  opacity?: number;
}> = ({ durationInFrames, paths, opacity = 0.75 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const draw = interpolate(frame, [fps * 0.4, durationInFrames - fps * 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} opacity={fade * opacity}>
      {paths.map((p, i) => {
        const delay = p.delay ?? 0;
        const prog = Math.max(0, Math.min(1, (draw - delay) / (1 - delay)));
        return (
          <path key={i} d={p.d} fill="none"
            stroke={p.color ?? "#c0392b"} strokeWidth={p.strokeWidth ?? 4}
            strokeLinecap="round" pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - prog}
            style={{ filter: `drop-shadow(0 0 4px ${p.color ?? "#c0392b"}88)` }}
          />
        );
      })}
    </svg>
  );
};
