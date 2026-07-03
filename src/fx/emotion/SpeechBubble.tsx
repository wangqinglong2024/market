import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SpeechBubble: React.FC<{ durationInFrames: number; text?: string; x?: number; y?: number; color?: string; opacity?: number }> = ({ durationInFrames, text = "♥", x = 0.5, y = 0.35, color = "#ff8fa3", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(t * 1.2 * Math.PI * 2) * 6;
  const cx = W * x;
  const cy = H * y + bob;
  const bw = 140, bh = 65, br = 20;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g opacity={fade * opacity}>
        <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={br} fill={color} />
        <polygon points={`${cx - 15},${cy + bh / 2} ${cx + 15},${cy + bh / 2} ${cx},${cy + bh / 2 + 20}`} fill={color} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={28} fill="#fff">{text}</text>
      </g>
    </svg>
  );
};
