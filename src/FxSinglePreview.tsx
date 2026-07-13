/**
 * 单效果预览组件 — Root.tsx 为每个效果注册独立 Composition
 * id 格式: fx-<category>-<EffectName>
 * 特效库开放可扩展：新增特效组件后在此登记即可单独预览（不是固定集合）。
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
// ── emotion ──────────────────────────────────────────────────────────────────
import { ComicPops } from "./fx/emotion/ComicPops";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { ScorePop } from "./fx/emotion/ScorePop";
// ── distortion ───────────────────────────────────────────────────────────────
import { ZoomBlur } from "./fx/distortion/ZoomBlur";

export type FxSinglePreviewProps = {
  category: string;
  name: string;
  bgColor?: string;
};

type RenderFn = (d: number) => React.ReactNode;

// 每个 key = "category/EffectName"，值 = 渲染函数
const EFFECT_MAP: Record<string, RenderFn> = {
  "emotion/ComicPops": (d) => <ComicPops key="e" durationInFrames={d} seed="prev" words={["哇", "太美了", "♥", "棒"]} />,
  "emotion/EmojiRain": (d) => <EmojiRain key="e" durationInFrames={d} count={16} opacity={0.55} />,
  "emotion/ScorePop": (d) => <ScorePop key="e" durationInFrames={d} count={5} />,
  "distortion/ZoomBlur": (d) => <ZoomBlur key="e" durationInFrames={d} cx={0.5} cy={0.5} color="#fff" rings={5} opacity={0.3} />,
};

const BG_COLORS: Record<string, string> = {
  emotion: "#3a0a2a",
  distortion: "#0a0a1a",
};

export const FxSinglePreview: React.FC<FxSinglePreviewProps> = ({ category, name, bgColor }) => {
  const { durationInFrames, width, height } = useVideoConfig();
  const key = `${category}/${name}`;
  const renderFn = EFFECT_MAP[key];
  const bg = bgColor ?? BG_COLORS[category] ?? "#1a1a2e";

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {/* 淡网格辅助线 */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={height * i / 10} x2={width} y2={height * i / 10} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`} x1={width * i / 6} y1={0} x2={width * i / 6} y2={height} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      {/* 效果名称标签 */}
      <div style={{ position: "absolute", top: 24, left: 24, background: "rgba(0,0,0,0.65)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 22, fontFamily: "monospace", zIndex: 999, lineHeight: 1.4 }}>
        <span style={{ color: "#888", fontSize: 16 }}>{category}/</span><br />
        {name}
      </div>
      {renderFn ? renderFn(durationInFrames) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f66", fontSize: 32 }}>
          未找到: {key}
        </div>
      )}
    </AbsoluteFill>
  );
};
