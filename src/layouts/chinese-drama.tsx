// 版式「chinese-drama」：中文情景剧·图文(越南受众)。
// 生产方式同 guoxue(每拍一段配音 + 每场景一张 AI 图),版面比例同 chinese-learn:
// 黑底 · 上方 1080x720 图(cover, 场景内连续运镜) · 下方 360 三行字幕(拼音/中文逐字卡拉OK + 越南语)。
// 场景共图:同 sceneId 连续拍共用一张图、一段运镜到底,字幕/配音逐拍切换。
import {
  AbsoluteFill, Audio, Easing, Img, interpolate, Sequence,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Beat, CharTiming, Manifest, LayoutModule, RenderBeat } from "./types";
import { beatFrames, isHan, toRuby, FitLine, EffectsLayer, DEFAULT_MOTION } from "./shared";

const DEF = {
  pinyinColor: "#7fd1c0", zhColor: "#ffffff", viColor: "#f5c518",
  karaokeColor: "#25f4ee", dimColor: "#565b63", bgColor: "#000000",
  sizes: { pinyin: 44, zh: 84, vi: 48 },
  gapPinyinZh: 8, gapZhLocal: 24, sidePad: 48, pinyinColumnGap: 10,
};

// 场景共图:连续同 sceneId 的拍分成一组(一张图不换、不转场)。
const groupScenes = (beats: Beat[]): Beat[][] => {
  const groups: Beat[][] = [];
  for (const b of beats) {
    const last = groups[groups.length - 1];
    const key = b.sceneId ?? b.image;
    if (last && key === (last[0].sceneId ?? last[0].image)) last.push(b);
    else groups.push([b]);
  }
  return groups;
};

// captions.pinyin 人工校正覆盖(空格分隔、音节数=汉字数才生效),否则 pinyin-pro 自动注音。
function toRubyOverride(zh: string, pinyinStr?: string): { c: string; py: string }[] {
  const auto = toRuby(zh);
  if (!pinyinStr) return auto;
  const sylls = pinyinStr.trim().split(/\s+/).map((s) => s.replace(/[,.!?;:，。！？；：、]/g, "")).filter(Boolean);
  const hanN = auto.filter((p) => isHan(p.c)).length;
  if (sylls.length !== hanN) return auto;
  let i = 0;
  return auto.map((p) => (isHan(p.c) ? { c: p.c, py: sylls[i++] } : p));
}

// 中文行逐字跳字:读到哪个字,拼音+汉字一起弹起放大+点亮(字级时间戳驱动,transform 不占布局)。
const KaraokeRow: React.FC<{
  zh: string; pinyinStr?: string; timings?: CharTiming[]; ms: number;
  sizes: { pinyin: number; zh: number }; columnGap: number; gapPinyinZh: number;
  pinyinColor: string; zhColor: string; karaokeColor: string; dimColor: string;
  zhFamily: string; latinFamily: string; zhWeight: number;
}> = ({ zh, pinyinStr, timings, ms, sizes, columnGap, gapPinyinZh, pinyinColor, zhColor, karaokeColor, dimColor, zhFamily, latinFamily, zhWeight }) => {
  const pairs = useMemo(() => toRubyOverride(zh, pinyinStr), [zh, pinyinStr]);
  let hi = 0;
  return (
    <>
      {pairs.map((p, idx) => {
        let k = 0, read = false;
        if (isHan(p.c)) {
          const t = timings?.[hi];
          hi += 1;
          if (t) {
            if (ms >= t.startMs && ms < t.endMs) k = Math.min(1, (ms - t.startMs) / 90);
            else if (ms >= t.endMs && ms < t.endMs + 90) k = Math.max(0, 1 - (ms - t.endMs) / 90);
            if (ms >= t.endMs) read = true;
          }
        }
        const e = Math.sin((k * Math.PI) / 2);
        const hot = e > 0.01;
        const pyCol = hot ? karaokeColor : pinyinColor;
        const zhCol = hot ? karaokeColor : read ? zhColor : dimColor;
        return (
          <span key={idx} style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center",
            marginRight: idx < pairs.length - 1 ? columnGap : 0,
            transform: `translateY(${-8 * e}px) scale(${1 + 0.2 * e})`, transformOrigin: "center bottom",
          }}>
            <span style={{ fontFamily: latinFamily, fontSize: sizes.pinyin, lineHeight: `${sizes.pinyin + 8}px`, height: sizes.pinyin + 8, fontWeight: 800, color: pyCol }}>{p.py}</span>
            <span style={{ fontFamily: zhFamily, fontSize: sizes.zh, lineHeight: 1.25, fontWeight: zhWeight, color: zhCol, whiteSpace: "pre", marginTop: gapPinyinZh }}>{p.c === " " ? " " : p.c}</span>
          </span>
        );
      })}
    </>
  );
};

const SceneDrama: React.FC<{ beats: Beat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durs = beats.map((b) => beatFrames(b, fps));
  const total = durs.reduce((a, b) => a + b, 0);
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
  let ai = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) ai = i;
  const active = beats[ai];
  const localFrame = frame - starts[ai];
  const ms = (localFrame / fps) * 1000;

  const cap = meta.captions ?? ({} as NonNullable<Manifest["meta"]["captions"]>);
  const sizes = { ...DEF.sizes, ...(cap.sizes || {}) };
  const pinyinColor = cap.pinyinColor ?? DEF.pinyinColor;
  const zhColor = cap.zhColor ?? DEF.zhColor;
  const viColor = cap.viColor ?? cap.localColor ?? DEF.viColor;
  const karaokeColor = cap.karaokeColor ?? DEF.karaokeColor;
  const dimColor = cap.dimColor ?? DEF.dimColor;
  const sidePad = cap.sidePad ?? DEF.sidePad;
  const columnGap = cap.pinyinColumnGap ?? DEF.pinyinColumnGap;
  const gapPinyinZh = cap.gapPinyinZh ?? DEF.gapPinyinZh;
  const gapZhLocal = cap.gapZhLocal ?? DEF.gapZhLocal;

  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latinFamily = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;

  const region = meta.source?.region ?? { top: 120, height: 720 };
  const focusY = meta.source?.focusY ?? 0.5;
  const sub = meta.subtitle ?? { top: 960, height: 360 };
  const maxW = meta.width - sidePad * 2;

  // 场景内连续运镜(多拍共图不重启),插值区间=场景总帧数。
  const first = beats[0];
  const preset = (first.motion && meta.motionPresets?.[first.motion]) || DEFAULT_MOTION;
  const easing = preset.ease === "linear" ? Easing.linear : Easing.inOut(Easing.ease);
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing };
  const scale = interpolate(frame, [0, total], preset.scale, clamp);
  const panX = interpolate(frame, [0, total], preset.panX, clamp);
  const panY = interpolate(frame, [0, total], preset.panY, clamp);
  const rot = preset.rotate ? interpolate(frame, [0, total], preset.rotate, clamp) : 0;
  const driftX = Math.sin((frame / fps) * Math.PI * 2 * 0.16) * (preset.driftX ?? 0);
  const driftY = Math.cos((frame / fps) * Math.PI * 2 * 0.13) * (preset.driftY ?? 0);

  // 每句字幕入场:快速淡入+轻微上浮。
  const capIn = interpolate(localFrame, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capRise = interpolate(localFrame, [0, 8], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vi = active.captions.local ?? active.captions.vi ?? "";

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor ?? DEF.bgColor }}>
      {/* 上方 1080x720 图:cover,场景内连续运镜 */}
      <div style={{ position: "absolute", top: region.top, left: 0, width: meta.width, height: region.height, overflow: "hidden" }}>
        <Img src={staticFile(first.image)} style={{
          width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY * 100}%`,
          transform: `translate(${panX + driftX}px, ${panY + driftY}px) rotate(${rot}deg) scale(${scale})`,
        }} />
        {beats.map((b, i) => b.effects?.length ? (
          <Sequence key={`fx-${b.id}`} from={starts[i]} durationInFrames={durs[i]} layout="none">
            <EffectsLayer effects={b.effects} durationInFrames={durs[i]} />
          </Sequence>
        ) : null)}
      </div>

      {/* 下方字幕区:拼音+中文逐字卡拉OK,越南语一行。整卡上滑淡入。 */}
      <div style={{
        position: "absolute", top: sub.top, left: 0, width: meta.width, height: sub.height,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: gapZhLocal,
        transform: `translateY(${capRise}px)`, opacity: capIn,
      }}>
        <FitLine maxWidth={maxW} depKey={`zh-${active.id}`}>
          <KaraokeRow zh={active.captions.zh} pinyinStr={active.captions.pinyin} timings={active.charTimings} ms={ms}
            sizes={sizes} columnGap={columnGap} gapPinyinZh={gapPinyinZh}
            pinyinColor={pinyinColor} zhColor={zhColor} karaokeColor={karaokeColor} dimColor={dimColor}
            zhFamily={zhFamily} latinFamily={latinFamily} zhWeight={zhWeight} />
        </FitLine>
        {vi ? (
          <FitLine maxWidth={maxW} depKey={`vi-${active.id}`}>
            <span style={{ fontFamily: latinFamily, fontSize: sizes.vi, lineHeight: 1.2, color: viColor, fontWeight: 800 }}>{vi}</span>
          </FitLine>
        ) : null}
      </div>

      {/* 配音:每拍在自己时间窗播放 */}
      {beats.map((b, i) => (
        <Sequence key={`au-${b.id}`} from={starts[i]} durationInFrames={durs[i]} layout="none">
          <Audio src={staticFile(b.audio)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "chinese-drama",
  segments: (beats: RenderBeat[]) => groupScenes(beats as unknown as Beat[]) as unknown as RenderBeat[][],
  transitionOf: (seg) => (seg[0] as unknown as Beat).transitionIn,
  Segment: ({ beats, meta }) => <SceneDrama beats={beats as unknown as Beat[]} meta={meta} />,
};
