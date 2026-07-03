import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const DoubleLine: React.FC<{ durationInFrames: number; color?: string; opacity?: number; gap?: number; thickness?: number }> = ({ durationInFrames, color = "#c8a050", opacity = 0.7, gap = 8, thickness = 3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = interpolate(frame, [0, fps * 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const margin = 20;
  const paths = [
    [margin, margin, W - margin, margin],
    [W - margin, margin, W - margin, H - margin],
    [W - margin, H - margin, margin, H - margin],
    [margin, H - margin, margin, margin],
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {[0, gap + thickness].map((offset, oi) =>
        paths.map(([x1, y1, x2, y2], li) => {
          const nx = x1 < x2 ? 0 : (x1 > x2 ? 0 : (y1 < y2 ? 1 : -1));
          const ny = y1 < y2 ? 0 : (y1 > y2 ? 0 : (x1 < x2 ? -1 : 1));
          const off = oi === 0 ? 0 : (offset);
          return (
            <line key={`${oi}-${li}`} x1={(x1 as number) + ny * off} y1={(y1 as number) + nx * off} x2={(x2 as number) * grow + (x1 as number) * (1 - grow) + ny * off} y2={(y2 as number) * grow + (y1 as number) * (1 - grow) + nx * off} stroke={color} strokeWidth={thickness} opacity={fade * opacity} />
          );
        })
      )}
    </svg>
  );
};
