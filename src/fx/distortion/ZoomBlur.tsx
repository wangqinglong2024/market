import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const ZoomBlur: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number; rings?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.5, color = "#fff", opacity = 0.3, rings = 5 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const maxR = Math.sqrt(W * W + H * H) / 2;
  const speed = t * 0.5 % 1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: rings }, (_, i) => {
        const progress = (speed + i / rings) % 1;
        const r = progress * maxR;
        const op = (1 - progress) * opacity;
        return <circle key={i} cx={W * cx} cy={H * cy} r={r} fill="none" stroke={color} strokeWidth={3} opacity={fade * op} />;
      })}
    </svg>
  );
};
