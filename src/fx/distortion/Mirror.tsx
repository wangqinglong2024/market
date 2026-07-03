import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Mirror: React.FC<{ durationInFrames: number; axis?: "h" | "v"; color?: string; opacity?: number }> = ({ durationInFrames, axis = "h", color = "#ffffff", opacity = 0.3 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="mir-g" x1={axis === "h" ? "0%" : "50%"} y1={axis === "v" ? "0%" : "50%"} x2={axis === "h" ? "100%" : "50%"} y2={axis === "v" ? "100%" : "50%"}>
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="49%" stopColor={color} stopOpacity="0" />
          <stop offset="51%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <line x1={axis === "h" ? W / 2 : 0} y1={axis === "v" ? H / 2 : 0} x2={axis === "h" ? W / 2 : W} y2={axis === "v" ? H / 2 : H} stroke={color} strokeWidth={1.5} opacity={fade * opacity * 0.5} />
      <rect x={0} y={0} width={W} height={H} fill="url(#mir-g)" opacity={fade * opacity} />
    </svg>
  );
};
