// 机制：SVG feTurbulence 噪波纹理 — 底部暖色热气扰动，像炉火上蒸腾的温度感
// 禁止游戏化视觉；这是家庭剧，特效只做氛围辅助
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const Effect: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();

  const fade = interpolate(frame, [0, fps * 0.7, durationInFrames - fps * 0.5, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 噪波 seed 缓慢推移，产生热浪流动感
  const seed = (frame * 0.18) % 100;
  const baseFreq = 0.012 + Math.sin(frame * 0.04) * 0.003;

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id="p2heat" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="turbulence" baseFrequency={`${baseFreq} ${baseFreq * 0.4}`}
            numOctaves={3} seed={seed} result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
        {/* 底部暖色渐变遮罩 */}
        <linearGradient id="p2warmGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff8c42" stopOpacity="0.38" />
          <stop offset="55%" stopColor="#ffd166" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 热气纹理层：只盖下半部分，暗示炉火热度 */}
      <rect x={0} y={H * 0.35} width={W} height={H * 0.65}
        fill="url(#p2warmGrad)" opacity={fade * 0.9} />
      {/* 噪波扰动叠加，极低透明度，只做微妙质感 */}
      <rect x={0} y={H * 0.45} width={W} height={H * 0.55}
        fill="#ffb347" filter="url(#p2heat)" opacity={fade * 0.08} />
    </svg>
  );
};
