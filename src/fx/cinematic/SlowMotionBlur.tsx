import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const SlowMotionBlur: React.FC<{ durationInFrames: number; direction?: "h" | "v"; blur?: number; opacity?: number }> = ({ durationInFrames, direction = "h", blur = 15, opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stdX = direction === "h" ? blur : 0;
  const stdY = direction === "v" ? blur : 0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="smb"><feGaussianBlur in="SourceGraphic" stdDeviation={`${stdX} ${stdY}`} /></filter>
        <linearGradient id="smb-g" x1={direction === "h" ? "0%" : "50%"} y1={direction === "v" ? "0%" : "50%"} x2={direction === "h" ? "100%" : "50%"} y2={direction === "v" ? "100%" : "50%"}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#smb-g)" filter="url(#smb)" opacity={fade * opacity} />
    </svg>
  );
};
