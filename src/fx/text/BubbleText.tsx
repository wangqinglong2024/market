import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const BubbleText: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; bgColor?: string; textColor?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 32, bgColor = "#ff6b9d", textColor = "#fff", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = interpolate(frame, [0, fps * 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(t * 1.5) * 4;
  const textW = text.length * fontSize * 0.57;
  const padX = 24, padY = 14;
  const bw = textW + padX * 2, bh = fontSize + padY * 2;
  const bx = W * x - bw / 2, by = H * y - fontSize - padY + bob;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g transform={`scale(${pop})`} style={{ transformOrigin: `${W * x}px ${H * y}px` }} opacity={fade * opacity}>
        <rect x={bx} y={by} width={bw} height={bh} rx={bh / 2} fill={bgColor} />
        <polygon points={`${W * x - 12},${by + bh} ${W * x + 12},${by + bh} ${W * x},${by + bh + 16}`} fill={bgColor} />
        <text x={W * x} y={H * y + bob - padY + fontSize * 0.1} textAnchor="middle" fontSize={fontSize} fill={textColor} fontFamily="system-ui" fontWeight="700">{text}</text>
      </g>
    </svg>
  );
};
