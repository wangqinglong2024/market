// 四角柔光晕染呼吸 — 四角暖光错相位缓缓明灭，舞台追光/温暖包围感
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const CornerBloom: React.FC<{
  durationInFrames: number;
  color?: string;
  opacity?: number;     // 峰值透明度，默认 0.32
  breatheHz?: number;   // 呼吸频率 Hz，默认 0.65
}> = ({ durationInFrames, color = "#ffd700", opacity = 0.32, breatheHz = 0.65 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const corners = [
    { cx: "0%",   cy: "0%",   phase: 0 },
    { cx: "100%", cy: "0%",   phase: Math.PI * 0.5 },
    { cx: "0%",   cy: "100%", phase: Math.PI },
    { cx: "100%", cy: "100%", phase: Math.PI * 1.5 },
  ];

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        {corners.map((c, i) => (
          <radialGradient key={i} id={`cb${i}`} cx={c.cx} cy={c.cy} r="55%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {corners.map((c, i) => {
        const br = 0.5 + Math.sin(t * breatheHz * Math.PI * 2 + c.phase) * 0.5;
        return <rect key={i} x={0} y={0} width={W} height={H} fill={`url(#cb${i})`} opacity={fade * opacity * br} />;
      })}
    </svg>
  );
};
