// 版式 toast-3：基于模板一(图文 3:4)的商务敬酒语教学。
// 上半 3:2 图文模板场景，下半字幕区；朗读规则按本模板：越南语段读越南语，正文三句只读中文。
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { CharTiming, LayoutModule, Manifest, RenderBeat } from "./types";
import { FitLine, DEFAULT_CAP, isHan, toRuby } from "./shared";

type ToastBeat = {
  id: string;
  role: "intro" | "phrase" | "outro";
  image: string;
  audio: string;
  durationMs: number;
  audioDelayMs?: number;
  vi: string;
  zh?: string;
  pinyin?: string;
  charTimings?: CharTiming[] | null;
};

const CAP = {
  sizes: { pinyin: 46, zh: 92, local: 44 },
  gapPinyinZh: 16,
  gapZhLocal: 28,
  sidePad: 60,
  pinyinColumnGap: 12,
  opticalLift: 24,
  karaokeColor: "#d6336c",
};

const msToFrames = (ms: number, fps: number) => Math.max(1, Math.round((ms / 1000) * fps));

function toRubyCorrected(zh: string, pinyinStr?: string): { c: string; py: string }[] {
  const auto = toRuby(zh);
  if (!pinyinStr) return auto;
  const sylls = pinyinStr.trim().split(/\s+/).map((s) => s.replace(/[,.!?;:，。！？；：、]/g, "")).filter(Boolean);
  const hanCount = auto.filter((p) => isHan(p.c)).length;
  if (sylls.length !== hanCount) return auto;
  let i = 0;
  return auto.map((p) => (isHan(p.c) ? { c: p.c, py: sylls[i++] } : p));
}

const KaraokeRow: React.FC<{
  zh: string;
  pinyinStr?: string;
  timings?: CharTiming[] | null;
  ms: number;
  audioDelayMs: number;
  cap: typeof CAP & { pinyinColor: string; zhColor: string };
  zhFamily: string;
  latinFamily: string;
  zhWeight: number;
}> = ({ zh, pinyinStr, timings, ms, audioDelayMs, cap, zhFamily, latinFamily, zhWeight }) => {
  const pairs = useMemo(() => toRubyCorrected(zh, pinyinStr), [zh, pinyinStr]);
  let hi = 0;
  return (
    <>
      {pairs.map((p, idx) => {
        let k = 0;
        if (isHan(p.c)) {
          const t = timings?.[hi];
          hi += 1;
          if (t) {
            const start = audioDelayMs + t.startMs;
            const end = audioDelayMs + t.endMs;
            if (ms >= start && ms < end) k = Math.min(1, (ms - start) / 90);
            else if (ms >= end && ms < end + 90) k = Math.max(0, 1 - (ms - end) / 90);
          }
        }
        const e = Math.sin((k * Math.PI) / 2);
        const hot = e > 0.01;
        return (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: idx < pairs.length - 1 ? cap.pinyinColumnGap : 0,
              transform: `translateY(${-8 * e}px) scale(${1 + 0.2 * e})`,
              transformOrigin: "center bottom",
            }}
          >
            <span style={{ fontFamily: latinFamily, fontSize: cap.sizes.pinyin, lineHeight: `${cap.sizes.pinyin + 10}px`, height: cap.sizes.pinyin + 10, fontWeight: 800, color: hot ? cap.karaokeColor : cap.pinyinColor }}>
              {p.py}
            </span>
            <span style={{ fontFamily: zhFamily, fontSize: cap.sizes.zh, lineHeight: 1.3, fontWeight: zhWeight, color: hot ? cap.karaokeColor : cap.zhColor, whiteSpace: "pre", marginTop: cap.gapPinyinZh - 10 }}>
              {p.c === " " ? " " : p.c}
            </span>
          </span>
        );
      })}
    </>
  );
};

const ToastSegment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const beat = beats[0] as unknown as ToastBeat;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const image = beat.image || "videos/2026/07/07/beigong-sheying/images/s2-banquet.png";
  const capColors = { ...DEFAULT_CAP, ...meta.captions };
  const cap = {
    ...CAP,
    ...(meta.captions || {}),
    sizes: { ...CAP.sizes, ...(meta.captions?.sizes || {}) },
    pinyinColor: capColors.pinyinColor,
    zhColor: capColors.zhColor,
  };
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latinFamily = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;
  const maxW = meta.width - cap.sidePad * 2;

  // 模板一图文比例：上半 3:2 横图，下半字幕区。
  const imgH = Math.round(meta.height / 2);
  const imgTop = Math.round(meta.height * 0.06);
  const capTop = imgTop + imgH;
  const capH = meta.height - capTop;
  const capGap = Math.round(meta.height * 0.04);

  const zoom = interpolate(frame, [0, Math.max(1, msToFrames(beat.durationMs, fps))], [1.02, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const capIn = interpolate(frame, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capRise = interpolate(frame, [0, 8], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const audioDelayMs = beat.audioDelayMs ?? 0;

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor ?? "#ffffff" }}>
      <div style={{ position: "absolute", top: imgTop, left: 0, width: meta.width, height: imgH, overflow: "hidden", backgroundColor: "#ffffff" }}>
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            transform: `scale(${zoom})`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: capTop,
          left: 0,
          width: "100%",
          height: capH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: capGap,
          gap: beat.role === "phrase" ? cap.gapZhLocal : 0,
          transform: `translateY(${-cap.opticalLift + capRise}px)`,
          opacity: capIn,
        }}
      >
        {beat.role === "phrase" ? (
          <>
            <FitLine maxWidth={maxW} depKey={`zh-${beat.id}`}>
              <KaraokeRow
                zh={beat.zh ?? ""}
                pinyinStr={beat.pinyin}
                timings={beat.charTimings}
                ms={ms}
                audioDelayMs={audioDelayMs}
                cap={cap}
                zhFamily={zhFamily}
                latinFamily={latinFamily}
                zhWeight={zhWeight}
              />
            </FitLine>
            <FitLine maxWidth={maxW} depKey={`vi-${beat.id}`}>
              <span style={{ fontFamily: latinFamily, fontSize: cap.sizes.local, lineHeight: 1.2, color: capColors.localColor, fontWeight: 800 }}>
                {beat.vi}
              </span>
            </FitLine>
          </>
        ) : (
          <div style={{ width: maxW, height: "100%", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40 }}>
            <span style={{ fontFamily: latinFamily, fontSize: 58, lineHeight: 1.2, color: capColors.localColor, fontWeight: 900, textAlign: "center" }}>
              {beat.vi}
            </span>
          </div>
        )}
      </div>

      <Sequence from={msToFrames(audioDelayMs, fps)} layout="none">
        <Audio src={staticFile(beat.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "toast-3",
  segments: (beats) => beats.map((b) => [b]),
  transitionOf: () => "fade",
  Segment: ToastSegment,
};
