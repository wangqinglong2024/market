// 全帧色调心跳脉冲 — 整帧叠加半透明暖色，随心跳节律律动，情感高潮渲染
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const ColorPulse: React.FC<{
  durationInFrames: number;
  color?: string;       // 主色，默认金色
  accentColor?: string; // 辅色（谐波），默认玫瑰红
  bpm?: number;         // 心跳每分钟，默认 51
  opacity?: number;     // 脉冲峰值不透明度，默认 0.18
}> = ({ durationInFrames, color = "#ffd700", accentColor = "#e91e63", bpm = 51, opacity = 0.18 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const hz = bpm / 60;

  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const b1 = Math.max(0, Math.sin(t * hz * Math.PI * 2));
  const b2 = Math.max(0, Math.sin(t * hz * 2 * Math.PI * 2)) * 0.35;
  const pulse = (b1 + b2) / 1.35;

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={H} fill={color} opacity={fade * (opacity * 0.4 + pulse * opacity)} />
      <rect x={0} y={0} width={W} height={H} fill={accentColor} opacity={fade * (opacity * 0.15 + pulse * opacity * 0.4)} />
    </svg>
  );
};
