import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const ScatterWords: React.FC<{ durationInFrames: number; words?: string[]; color?: string; opacity?: number }> = ({ durationInFrames, words = ["真的", "太美了", "喜欢", "好棒", "爱了"], color = "#ff88cc", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {words.map((word, i) => {
        const delay = i * 0.15;
        const appear = interpolate(t - delay, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const tx0 = (0.1 + random(`sw2-x${i}`) * 0.8) * W;
        const ty0 = (0.15 + random(`sw2-y${i}`) * 0.6) * H;
        const bob = Math.sin(t * 1.5 + i * 1.2) * 8;
        const sz = 20 + random(`sw2-sz${i}`) * 20;
        const rot = (random(`sw2-r${i}`) - 0.5) * 30;
        return (
          <text key={i} x={tx0} y={ty0 + bob} fontSize={sz} textAnchor="middle" fill={color} opacity={fade * appear * opacity} fontFamily="system-ui" fontWeight="700" transform={`rotate(${rot},${tx0},${ty0})`}>{word}</text>
        );
      })}
    </svg>
  );
};
