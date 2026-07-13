// 版式「chinese-learn」：中文学习字幕片。上原视频(cover 裁切)、下三行字幕(拼音/中文/越南语)。
// 每个标点一张卡(中文字体大);三行都逐词卡拉OK(中文/拼音走真实时间戳,越南语按卡时长均匀);
// 解说段同样三行、音频读越南语并压低原声。特效:每 clip 白闪+变焦冲击转场、每卡上滑淡入、ken-burns 推近。
// 单段版式(整片一条时间线)。
import React from "react";
import {
  AbsoluteFill, OffthreadVideo, Audio, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, interpolate,
} from "remotion";
import type { LayoutModule, Manifest, RenderBeat, KaraWord } from "./types";
import { FitLine } from "./shared";
import { stackCss } from "../fonts";

type LearnBeat = RenderBeat & {
  kind?: "zh" | "narration";
  startMs: number; endMs: number;
  vi?: string; words?: KaraWord[];
  narrationAudio?: string; flash?: boolean;
};

const DEF = {
  pinyinColor: "#7fd1c0", zhColor: "#ffffff", viColor: "#f5c518",
  karaokeColor: "#25f4ee", dimColor: "#565b63", bgColor: "#000000",
  sizes: { pinyin: 46, zh: 100, vi: 46 }, lineGap: 18, sidePad: 40,
  duck: 0.06, narrationVolume: 1.35,
};

// 越南语按卡时长均匀切词(语序≠中文,无法逐字锁死,故均匀铺满本卡);去掉行尾标点。
const evenWords = (text: string, s: number, e: number): KaraWord[] => {
  const parts = (text || "").replace(/[，。！？；、,.!?;：]+$/u, "").split(/\s+/).filter(Boolean);
  const span = (e - s) / Math.max(1, parts.length);
  return parts.map((p, i) => ({ zh: p, py: p, startMs: s + i * span, endMs: s + (i + 1) * span }));
};

// 单词:未读/朗读中/已读三态。只变色(朗读中加轻微光晕),不跳动(用户 2026-07-12)。
const Word: React.FC<{
  text: string; w: KaraWord; currentMs: number; fontSize: number;
  fontFamily: string; weight: number; dim: string; active: string; read: string;
}> = ({ text, w, currentMs, fontSize, fontFamily, weight, dim, active, read }) => {
  const isActive = currentMs >= w.startMs && currentMs < w.endMs;
  const isRead = currentMs >= w.endMs;
  return (
    <span style={{
      display: "inline-block", color: isActive ? active : isRead ? read : dim, fontFamily, fontSize, fontWeight: weight,
      textShadow: isActive ? `0 0 20px ${active}66` : "none",
    }}>{text}</span>
  );
};

const Line: React.FC<{
  words: KaraWord[]; pick: (w: KaraWord) => string; currentMs: number; fontSize: number;
  fontFamily: string; weight: number; gap: number; maxWidth: number; depKey: string;
  dim: string; active: string; read: string;
}> = ({ words, pick, currentMs, fontSize, fontFamily, weight, gap, maxWidth, depKey, dim, active, read }) => (
  <FitLine maxWidth={maxWidth} depKey={depKey}>
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap }}>
      {words.map((w, i) => (
        <Word key={i} text={pick(w)} w={w} currentMs={currentMs} fontSize={fontSize}
          fontFamily={fontFamily} weight={weight} dim={dim} active={active} read={read} />
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
  const duck = cap.duck ?? DEF.duck;
  const narrVol = cap.narrationVolume ?? DEF.narrationVolume;
  const maxWidth = meta.width - 2 * sidePad;

  const zhFamily = stackCss(meta.fonts?.zhStack);
  const zhWeight = meta.fonts?.zhWeight ?? 700;
  const latinFamily = stackCss(meta.fonts?.latinStack);

  const list = beats as LearnBeat[];
  const active = list.find((b) => currentMs >= b.startMs && currentMs < b.endMs) ?? list[list.length - 1];
  const narrBeats = list.filter((b) => b.kind === "narration" && b.narrationAudio);

  // 特效:解说段压低原声;每 clip 白闪 + 变焦冲击;每段 ken-burns 推近;每卡上滑淡入。
  const inNarr = (ms: number) => narrBeats.some((b) => ms >= b.startMs && ms < b.endMs);
  const videoVolume = (f: number) => (inNarr((f / fps) * 1000) ? duck : 1);
  const localMs = active ? currentMs - active.startMs : 0;
  const kb = active ? interpolate(currentMs, [active.startMs, active.endMs], [1.05, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const punch = active?.flash ? interpolate(localMs, [0, 340], [0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const flashOpacity = active?.flash ? interpolate(localMs, [0, 200], [0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const cardRise = interpolate(localMs, [0, 220], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardFade = interpolate(localMs, [0, 200], [0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const words = active?.words ?? [];

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor ?? DEF.bgColor }}>
      {/* 上方原视频:cover 裁切 + ken-burns + 变焦冲击 + 白闪转场 */}
      {src?.video ? (
        <div style={{ position: "absolute", top: region.top, left: 0, width: meta.width, height: region.height, overflow: "hidden" }}>
          <OffthreadVideo src={staticFile(src.video)} volume={videoVolume}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY * 100}%`, transform: `scale(${kb + punch})` }} />
          {flashOpacity > 0 ? <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} /> : null}
        </div>
      ) : null}

      {/* 越南语解说音轨:各 narration 段在其时间窗播放(音量提高,原声已压低) */}
      {narrBeats.map((b) => (
        <Sequence key={b.id} from={Math.round((b.startMs / 1000) * fps)} durationInFrames={Math.max(1, Math.round((b.durationMs / 1000) * fps))}>
          <Audio src={staticFile(b.narrationAudio as string)} volume={narrVol} />
        </Sequence>
      ))}

      {/* 下方字幕区:三行(拼音/中文/越南语),整卡上滑淡入 */}
      <div style={{ position: "absolute", top: sub.top, left: 0, width: meta.width, height: sub.height,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: lineGap,
        transform: `translateY(${cardRise}px)`, opacity: cardFade }}>
        {words.length ? (
          <>
            <Line words={words} pick={(w) => w.py} currentMs={currentMs} fontSize={sizePy} fontFamily={latinFamily}
              weight={600} gap={16} maxWidth={maxWidth} depKey={`py-${active.id}`} dim={dim} active={karaoke} read={pinyinColor} />
            <Line words={words} pick={(w) => w.zh} currentMs={currentMs} fontSize={sizeZh} fontFamily={zhFamily}
              weight={zhWeight} gap={4} maxWidth={maxWidth} depKey={`zh-${active.id}`} dim={dim} active={karaoke} read={zhColor} />
            {active?.vi ? (
              <Line words={evenWords(active.vi, active.startMs, active.endMs)} pick={(w) => w.zh} currentMs={currentMs} fontSize={sizeVi}
                fontFamily={latinFamily} weight={600} gap={10} maxWidth={maxWidth} depKey={`vi-${active.id}`} dim={dim} active={karaoke} read={viColor} />
            ) : null}
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "chinese-learn",
  segments: (beats) => [beats],
  transitionOf: () => "fade",
  Segment,
};
