import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const CircleMask: React.FC<{ durationInFrames: number; cx?: number; cy?: number; color?: string; opacity?: number }> = ({ durationInFrames, cx = 0.5, cy = 0.5, color = "#000", opacity = 0.55 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const maxR = Math.sqrt((W * cx) ** 2 + (H * cy) ** 2) * 1.5;
  const r = interpolate(frame, [0, durationInFrames * 0.75], [0, maxR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fade = interpolate(frame, [durationInFrames * 0.65, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <mask id="cm">
          <rect x={0} y={0} width={W} height={H} fill="white" />
          <circle cx={W * cx} cy={H * cy} r={r} fill="black" />
        </mask>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={color} mask="url(#cm)" opacity={fade * opacity} />
    </svg>
  );
};
