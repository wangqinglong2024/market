import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const WaveText: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 38, color = "#fff", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chars = text.split("");
  const charW = fontSize * 0.6;
  const totalW = chars.length * charW;
  const startX = W * x - totalW / 2;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {chars.map((ch, i) => {
        const waveY = Math.sin(t * 2.5 + i * 0.5) * 8;
        return (
          <text key={i} x={startX + i * charW + charW / 2} y={H * y + waveY} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * opacity} fontFamily="system-ui" fontWeight="700">{ch}</text>
        );
      })}
    </svg>
  );
};
