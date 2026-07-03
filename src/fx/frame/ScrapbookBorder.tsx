import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ScrapbookBorder: React.FC<{ durationInFrames: number; color?: string; accent?: string; opacity?: number }> = ({ durationInFrames, color = "#ffe0ee", accent = "#ff88cc", opacity = 0.8 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const border = 28;
  const zigZag = (x1: number, y1: number, x2: number, y2: number, horiz: boolean, teeth: number) => {
    const pts = [x1, y1];
    for (let i = 1; i <= teeth; i++) {
      const frac = i / teeth;
      const mid = frac - 0.5 / teeth;
      const dir = i % 2 === 0 ? 1 : -1;
      if (horiz) {
        pts.push(x1 + (x2 - x1) * (mid - 0.5 / teeth), y1 + dir * 8);
        pts.push(x1 + (x2 - x1) * mid, y1);
      } else {
        pts.push(x1 + dir * 8, y1 + (y2 - y1) * (mid - 0.5 / teeth));
        pts.push(x1, y1 + (y2 - y1) * mid);
      }
    }
    pts.push(x2, y2);
    return pts.join(",");
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <rect x={0} y={0} width={W} height={border} fill={color} opacity={fade * opacity} />
      <rect x={0} y={H - border} width={W} height={border} fill={color} opacity={fade * opacity} />
      <rect x={0} y={0} width={border} height={H} fill={color} opacity={fade * opacity} />
      <rect x={W - border} y={0} width={border} height={H} fill={color} opacity={fade * opacity} />
      <polyline points={zigZag(border, border, W - border, border, true, 20)} fill="none" stroke={accent} strokeWidth={2} opacity={fade * opacity * 0.6} />
      <polyline points={zigZag(border, H - border, W - border, H - border, true, 20)} fill="none" stroke={accent} strokeWidth={2} opacity={fade * opacity * 0.6} />
    </svg>
  );
};
