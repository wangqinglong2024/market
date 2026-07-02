// 机制：柔光角落晕染呼吸 — 四角暖金柔光缓缓明灭，像舞台追光打在全家团聚的瞬间
// 与 p1(扫光平移) 不同：四点固定、做 opacity 呼吸而非位移
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;

  const fade = interpolate(frame, [0, fps * 0.6, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 四角柔光各自错相位呼吸，营造温暖包围感
  const corners = [
    { cx: "0%",   cy: "0%",   phase: 0 },
    { cx: "100%", cy: "0%",   phase: Math.PI * 0.5 },
    { cx: "0%",   cy: "100%", phase: Math.PI },
    { cx: "100%", cy: "100%", phase: Math.PI * 1.5 },
  ];

  // 中央暖晕：随呼吸缓缓明亮
  const centerBreath = 0.5 + Math.sin(t * 0.7 * Math.PI * 2) * 0.5;
  const centerOp = fade * (0.08 + centerBreath * 0.12);

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        {corners.map((c, i) => (
          <radialGradient key={i} id={`p7cg${i}`} cx={c.cx} cy={c.cy} r="55%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id="p7center" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fff9e6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff9e6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 四角柔光各自呼吸 */}
      {corners.map((c, i) => {
        const breath = 0.5 + Math.sin(t * 0.65 * Math.PI * 2 + c.phase) * 0.5;
        const op = fade * (0.15 + breath * 0.2);
        return <rect key={i} x={0} y={0} width={W} height={H}
          fill={`url(#p7cg${i})`} opacity={op} />;
      })}
      {/* 中央轻暖晕 */}
      <rect x={0} y={0} width={W} height={H} fill="url(#p7center)" opacity={centerOp} />
    </svg>
  );
};
