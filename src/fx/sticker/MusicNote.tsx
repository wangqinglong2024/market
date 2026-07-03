import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const MusicNote: React.FC<{ durationInFrames: number; count?: number; color?: string; opacity?: number }> = ({ durationInFrames, count = 8, color = "#aa66ff", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const NOTES = ["♪", "♫", "♩", "♬"];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x0 = random(`mn-x${i}`) * W;
        const spd = 35 + random(`mn-s${i}`) * 45;
        const yOff = random(`mn-yo${i}`) * H;
        const y = H - ((yOff + t * spd) % (H + 40));
        const sway = Math.sin(t * 1.5 + i * 0.9) * 25;
        const sz = 22 + random(`mn-sz${i}`) * 20;
        const note = NOTES[Math.floor(random(`mn-n${i}`) * NOTES.length)];
        const rot = Math.sin(t + i) * 15;
        return (
          <text key={i} x={x0 + sway} y={y} fontSize={sz} fill={color} textAnchor="middle" opacity={fade * (0.6 + random(`mn-op${i}`) * 0.4) * opacity} transform={`rotate(${rot},${x0 + sway},${y})`}>{note}</text>
        );
      })}
    </svg>
  );
};
