import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const Vignette: React.FC<{ durationInFrames: number; color?: string; opacity?: number; pulse?: boolean }> = ({ durationInFrames, color = "#000", opacity = 0.45, pulse = false }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseOp = pulse ? 0.5 + Math.sin(t * 0.8 * Math.PI * 2) * 0.5 : 1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="vig" cx="50%" cy="50%" r="70%">
          <stop offset="30%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#vig)" opacity={fade * opacity * pulseOp} />
    </svg>
  );
};
