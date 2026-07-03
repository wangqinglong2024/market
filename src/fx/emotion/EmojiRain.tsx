import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
const EMOJIS = ["🌸", "💕", "✨", "🌺", "💖", "🌟", "🍀", "🦋"];
export const EmojiRain: React.FC<{ durationInFrames: number; emojis?: string[]; count?: number; opacity?: number }> = ({ durationInFrames, emojis = EMOJIS, count = 16, opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = random(`er-x${i}`) * W;
        const spd = 60 + random(`er-s${i}`) * 80;
        const yOff = random(`er-yo${i}`) * H;
        const y = ((yOff + t * spd) % (H + 40)) - 20;
        const sz = 20 + random(`er-sz${i}`) * 18;
        const emoji = emojis[Math.floor(random(`er-e${i}`) * emojis.length)];
        const rot = Math.sin(t * 1.5 + i) * 20;
        return (
          <text key={i} x={x} y={y} fontSize={sz} textAnchor="middle" opacity={fade * opacity} transform={`rotate(${rot},${x},${y})`}>{emoji}</text>
        );
      })}
    </svg>
  );
};
