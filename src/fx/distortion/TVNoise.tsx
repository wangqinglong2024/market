import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const TVNoise: React.FC<{ durationInFrames: number; opacity?: number; scanlines?: boolean }> = ({ durationInFrames, opacity = 0.25, scanlines = true }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.3, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seed = frame * 2.1;
  const trackY = (Math.sin(t * 0.5) * 0.3 + 0.5) * H;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="tvn"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} seed={seed} result="n" /><feColorMatrix type="saturate" values="0" in="n" result="g" /><feBlend in="SourceGraphic" in2="g" mode="screen" /></filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#888" filter="url(#tvn)" opacity={fade * opacity * 0.5} />
      {scanlines && <rect x={0} y={trackY - 3} width={W} height={8} fill="#fff" opacity={fade * opacity * 0.3} />}
    </svg>
  );
};
