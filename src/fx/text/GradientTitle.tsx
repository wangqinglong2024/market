import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const GradientTitle: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color1?: string; color2?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.1, fontSize = 52, color1 = "#ff6b9d", color2 = "#ffeaa7", opacity = 0.95 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shift = (Math.sin(t * 0.5) * 0.5 + 0.5) * 100;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="grt" x1={`${shift}%`} y1="0%" x2={`${shift + 100}%`} y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color1} />
          <stop offset="50%" stopColor={color2} />
          <stop offset="100%" stopColor={color1} />
        </linearGradient>
      </defs>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill="url(#grt)" opacity={fade * opacity} fontFamily="system-ui" fontWeight="900">{text}</text>
    </svg>
  );
};
