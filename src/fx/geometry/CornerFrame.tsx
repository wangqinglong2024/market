// 四角装饰框线生长 — L形角线从四角同步向内延伸，相册/镜框感
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const CornerFrame: React.FC<{
  durationInFrames: number;
  color?: string;
  accentColor?: string;
  armRatio?: number;   // 臂长占短边比例，默认 0.2
  strokeWidth?: number;
  padding?: number;    // 距边缘像素，默认 24
}> = ({ durationInFrames, color = "#b71c1c", accentColor = "#e91e63", armRatio = 0.2, strokeWidth = 6, padding = 24 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const grow = interpolate(frame, [fps * 0.4, durationInFrames * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ARM = Math.min(W, H) * armRatio * grow;
  const P = padding;

  const corners = [
    { x: P,     y: P,     dx:  1, dy:  1 },
    { x: W - P, y: P,     dx: -1, dy:  1 },
    { x: P,     y: H - P, dx:  1, dy: -1 },
    { x: W - P, y: H - P, dx: -1, dy: -1 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} opacity={fade}>
      {corners.map((c, i) => (
        <g key={i}>
          <line x1={c.x} y1={c.y} x2={c.x + c.dx * ARM} y2={c.y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dy * ARM} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
          <circle cx={c.x} cy={c.y} r={strokeWidth * 1.4 * grow} fill={accentColor} style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }} />
        </g>
      ))}
    </svg>
  );
};
