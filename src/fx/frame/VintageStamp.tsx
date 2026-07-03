import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const VintageStamp: React.FC<{ durationInFrames: number; color?: string; teeth?: number; opacity?: number }> = ({ durationInFrames, color = "#d4a030", teeth = 30, opacity = 0.7 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const perimeter = 2 * (W + H);
  const toothSize = perimeter / teeth;
  const margin = 12;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const d = i * toothSize;
    const isOdd = i % 2;
    const inward = isOdd ? 8 : 0;
    if (d < W) pts.push(`${d},${margin + inward}`);
    else if (d < W + H) pts.push(`${W - margin - inward},${d - W}`);
    else if (d < 2 * W + H) pts.push(`${2 * W + H - d},${H - margin - inward}`);
    else pts.push(`${margin + inward},${perimeter - d}`);
  }
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <polygon points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.5} opacity={fade * opacity} />
      <rect x={margin + 8} y={margin + 8} width={W - (margin + 8) * 2} height={H - (margin + 8) * 2} fill="none" stroke={color} strokeWidth={1} opacity={fade * opacity * 0.5} />
    </svg>
  );
};
