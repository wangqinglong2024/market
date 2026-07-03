/**
 * 特效库快速预览 — Remotion Studio 中可直接播放，不需要完整视频
 * Root.tsx 每个大类注册一个 Composition：id = fx-<category>
 * 特效库已精简为固定 4 个（用户 2026-07-03 锁定）。
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
// emotion
import { ComicPops } from "./fx/emotion/ComicPops";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { ScorePop } from "./fx/emotion/ScorePop";
// distortion
import { ZoomBlur } from "./fx/distortion/ZoomBlur";

export type FxPreviewProps = {
  category: string;
  bgColor?: string;
};

const CATEGORY_FX: Record<string, (d: number) => React.ReactNode[]> = {
  emotion: (d) => [
    <ComicPops key="e1" durationInFrames={d} seed="prev" words={["哇", "太美了", "♥", "棒"]} />,
    <EmojiRain key="e2" durationInFrames={d} count={12} opacity={0.5} />,
    <ScorePop key="e3" durationInFrames={d} count={5} />,
  ],
  distortion: (d) => [
    <ZoomBlur key="d1" durationInFrames={d} cx={0.5} cy={0.5} color="#fff" rings={5} opacity={0.3} />,
  ],
};

const BG_COLORS: Record<string, string> = {
  emotion: "#3a0a2a",
  distortion: "#0a0a1a",
};

export const FxPreview: React.FC<FxPreviewProps> = ({ category, bgColor }) => {
  const { durationInFrames, width, height } = useVideoConfig();
  const fxFn = CATEGORY_FX[category];
  const bg = bgColor ?? BG_COLORS[category] ?? "#1a1a2e";

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={height * i / 10} x2={width} y2={height * i / 10} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`} x1={width * i / 6} y1={0} x2={width * i / 6} y2={height} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <div style={{ position: "absolute", top: 24, left: 24, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 24, fontFamily: "monospace", zIndex: 999 }}>
        fx/{category}
      </div>
      {fxFn ? fxFn(durationInFrames) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>
          未知类目: {category}
        </div>
      )}
    </AbsoluteFill>
  );
};
