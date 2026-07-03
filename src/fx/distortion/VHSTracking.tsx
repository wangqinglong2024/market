import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
export const VHSTracking: React.FC<{ durationInFrames: number; opacity?: number }> = ({ durationInFrames, opacity = 0.4 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.4, durationInFrames - fps * 0.3, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const trackY = (Math.sin(t * 0.8) * 0.4 + 0.5) * H;
  const scanlineGap = 4;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <pattern id="vhs-sl" x={0} y={0} width={W} height={scanlineGap} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={W} height={1} fill="#000" opacity={0.15} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#vhs-sl)" opacity={fade * opacity * 0.6} />
      <rect x={0} y={trackY - 6} width={W} height={14} fill="#fff" opacity={fade * opacity * 0.3} />
      <rect x={0} y={trackY + 8} width={W} height={5} fill="#0044ff" opacity={fade * opacity * 0.2} />
    </svg>
  );
};
