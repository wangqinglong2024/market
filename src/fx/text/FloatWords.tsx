import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const FloatWords: React.FC<{ durationInFrames: number; words?: string[]; color?: string; opacity?: number }> = ({ durationInFrames, words = ["爱", "美", "棒", "好", "赞"], color = "#ff88cc", opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: words.length * 2 }, (_, i) => {
        const word = words[i % words.length];
        const x = (0.1 + random(`fw-x${i}`) * 0.8) * W;
        const spd = 30 + random(`fw-s${i}`) * 40;
        const yOff = random(`fw-yo${i}`) * H;
        const y = H - ((yOff + t * spd) % (H + 40));
        const sz = 20 + random(`fw-sz${i}`) * 20;
        const op = 0.5 + random(`fw-op${i}`) * 0.5;
        return <text key={i} x={x} y={y} fontSize={sz} textAnchor="middle" fill={color} opacity={fade * op * opacity} fontFamily="system-ui" fontWeight="700">{word}</text>;
      })}
    </svg>
  );
};
