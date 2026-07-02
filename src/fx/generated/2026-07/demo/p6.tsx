// 机制：全帧色调心跳脉冲 — 金色暖光极轻微地随心跳律动，妈妈感动落泪的情感共鸣
// 极克制：单层最高 opacity 0.18，只做氛围渲染，不改变画面可读性
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;

  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 双频心跳，0.85 Hz + 谐波
  const b1 = Math.max(0, Math.sin(t * 0.85 * Math.PI * 2));
  const b2 = Math.max(0, Math.sin(t * 1.7 * Math.PI * 2)) * 0.35;
  const pulse = (b1 + b2) / 1.35;

  const goldOp = fade * (0.05 + pulse * 0.13);   // 最高 0.18
  const roseOp = fade * (0.02 + pulse * 0.07);   // 最高 0.09

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="p6ctr" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fff9e6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff9e6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#ffd700" opacity={goldOp} />
      <rect x={0} y={0} width={W} height={H} fill="#e91e63" opacity={roseOp} />
      {/* 中央轻晕：让情感焦点更柔和 */}
      <rect x={0} y={0} width={W} height={H} fill="url(#p6ctr)"
        opacity={fade * (0.06 + pulse * 0.1)} />
    </svg>
  );
};
