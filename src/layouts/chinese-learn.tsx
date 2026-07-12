// 版式「chinese-learn」：中文学习字幕片。上方原视频(cover 裁切)、下方三行卡拉OK字幕
// (拼音 / 中文 / 越南语),按 currentMs 逐词高亮跳动。用于给无字幕的中文视频重排学习版。
// 单段版式:整片一条连续时间线(segments 返回 [allBeats]),原视频铺满全程、字幕按帧切换。
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { LayoutModule, Manifest, RenderBeat, KaraWord } from "./types";
import { FitLine } from "./shared";
import { stackCss } from "../fonts";

type LearnBeat = RenderBeat & {
  startMs: number;
  endMs: number;
  vi?: string;
  words?: KaraWord[];
};

const DEF = {
  pinyinColor: "#7fd1c0",
  zhColor: "#ffffff",
  viColor: "#f5c518",
  karaokeColor: "#25f4ee",
  dimColor: "#565b63",
  readColor: "#ffffff",
  bgColor: "#000000",
  sizes: { pinyin: 34, zh: 66, vi: 38 },
  lineGap: 20,
  sidePad: 44,
};

// 单个词：按当前时间取「未读/朗读中/已读」三态；朗读中的词放大跳起。
const Word: React.FC<{
  text: string;
  w: KaraWord;
  currentMs: number;
  fontSize: number;
  fontFamily: string;
  weight: number;
  dim: string;
  active: string;
  read: string;
}> = ({ text, w, currentMs, fontSize, fontFamily, weight, dim, active, read }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isActive = currentMs >= w.startMs && currentMs < w.endMs;
  const isRead = currentMs >= w.endMs;
  const startFrame = Math.round((w.startMs / 1000) * fps);
  const pop = isActive
    ? spring({ frame: frame - startFrame, fps, config: { damping: 14, mass: 0.6, stiffness: 170 } })
    : 0;
  const color = isActive ? active : isRead ? read : dim;
  const scale = 1 + 0.16 * pop;
  return (
    <span
      style={{
        display: "inline-block",
        color,
        fontFamily,
        fontSize,
        fontWeight: weight,
        transform: `translateY(${-6 * pop}px) scale(${scale})`,
        transformOrigin: "center bottom",
        textShadow: isActive ? `0 0 18px ${active}66` : "none",
        transition: "none",
      }}
    >
      {text}
    </span>
  );
};

const Line: React.FC<{
  words: KaraWord[];
  pick: (w: KaraWord) => string; // 该行显示文本(拼音 or 中文)
  currentMs: number;
  fontSize: number;
  fontFamily: string;
  weight: number;
  gap: number;
  maxWidth: number;
  depKey: string;
  dim: string;
  active: string;
  read: string;
}> = ({ words, pick, currentMs, fontSize, fontFamily, weight, gap, maxWidth, depKey, dim, active, read }) => (
  <FitLine maxWidth={maxWidth} depKey={depKey}>
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap }}>
      {words.map((w, i) => (
        <Word
          key={i}
          text={pick(w)}
          w={w}
          currentMs={currentMs}
          fontSize={fontSize}
          fontFamily={fontFamily}
          weight={weight}
          dim={dim}
          active={active}
          read={read}
        />
      ))}
    </span>
  </FitLine>
);

const Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const src = meta.source;
  const region = src?.region ?? { top: 120, height: 720 };
  const focusY = src?.focusY ?? 0.5;
  const sub = meta.subtitle ?? { top: 960, height: 360 };
  const cap = meta.captions ?? ({} as NonNullable<Manifest["meta"]["captions"]>);

  const pinyinColor = cap.pinyinColor ?? DEF.pinyinColor;
  const zhColor = cap.zhColor ?? DEF.zhColor;
  const viColor = cap.viColor ?? DEF.viColor;
  const karaoke = cap.karaokeColor ?? DEF.karaokeColor;
  const dim = cap.dimColor ?? DEF.dimColor;
  const sizePy = cap.sizes?.pinyin ?? DEF.sizes.pinyin;
  const sizeZh = cap.sizes?.zh ?? DEF.sizes.zh;
  const sizeVi = cap.sizes?.vi ?? DEF.sizes.vi;
  const lineGap = cap.lineGap ?? DEF.lineGap;
  const sidePad = cap.sidePad ?? DEF.sidePad;
  const maxWidth = meta.width - 2 * sidePad;

  const zhFamily = stackCss(meta.fonts?.zhStack);
  const zhWeight = meta.fonts?.zhWeight ?? 700;
  const latinFamily = stackCss(meta.fonts?.latinStack);

  const list = beats as LearnBeat[];
  const active =
    list.find((b) => currentMs >= b.startMs && currentMs < b.endMs) ?? list[list.length - 1];
  const words = active?.words ?? [];
  const hasCaption = words.length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor ?? DEF.bgColor }}>
      {/* 上方原视频：cover 裁切进 region，可用 focusY 调纵向焦点 */}
      {src?.video ? (
        <div style={{ position: "absolute", top: region.top, left: 0, width: meta.width, height: region.height, overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(src.video)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY * 100}%` }}
          />
        </div>
      ) : null}

      {/* 下方字幕区：三行卡拉OK */}
      <div
        style={{
          position: "absolute",
          top: sub.top,
          left: 0,
          width: meta.width,
          height: sub.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: lineGap,
        }}
      >
        {hasCaption ? (
          <>
            <Line
              words={words} pick={(w) => w.py} currentMs={currentMs}
              fontSize={sizePy} fontFamily={latinFamily} weight={600} gap={16}
              maxWidth={maxWidth} depKey={`py-${active.id}`}
              dim={dim} active={karaoke} read={pinyinColor}
            />
            <Line
              words={words} pick={(w) => w.zh} currentMs={currentMs}
              fontSize={sizeZh} fontFamily={zhFamily} weight={zhWeight} gap={4}
              maxWidth={maxWidth} depKey={`zh-${active.id}`}
              dim={dim} active={karaoke} read={zhColor}
            />
            {active.vi ? (
              <FitLine maxWidth={maxWidth} depKey={`vi-${active.id}`}>
                <span style={{ color: viColor, fontFamily: latinFamily, fontSize: sizeVi, fontWeight: 500 }}>
                  {active.vi}
                </span>
              </FitLine>
            ) : null}
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "chinese-learn",
  // 单段:整片一条时间线,原视频铺满全程,不切段不转场。
  segments: (beats) => [beats],
  transitionOf: () => "fade",
  Segment,
};
