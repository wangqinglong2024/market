// 版式 v2-3x4（2026-07-07）：3:4 画布 · 上半 3:2 横图连续运镜 · 下半单行三层字幕(拼音/中文/越南语)+逐字跳字。
// 场景共图：同 sceneId 连续拍共用一张图、一段运镜到底，字幕/配音逐拍切换。
import {
  AbsoluteFill, Audio, Easing, Img, interpolate, Sequence,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Beat, CharTiming, Manifest, LayoutModule } from "./types";
import { beatFrames, isHan, toRuby, FitLine, EffectsLayer, DEFAULT_MOTION, DEFAULT_CAP } from "./shared";

// 场景共图：把连续同 sceneId 的拍分成组，一组 = 一个连续画面（不换图不转场）
export const groupScenes = (beats: Beat[]): Beat[][] => {
  const groups: Beat[][] = [];
  for (const b of beats) {
    const last = groups[groups.length - 1];
    const key = b.sceneId ?? b.image;
    if (last && key === (last[0].sceneId ?? last[0].image)) last.push(b);
    else groups.push([b]);
  }
  return groups;
};

const CAP_V2 = {
  sizes: { pinyin: 46, zh: 92, local: 54 },
  gapPinyinZh: 16,
  gapZhLocal: 32,
  sidePad: 60,
  pinyinColumnGap: 12,
  opticalLift: 24,
  karaokeColor: "#d6336c",
};

// captions.pinyin 人工校正覆盖（空格分隔、音节数=汉字数才生效），否则 pinyin-pro 自动注音
function toRubyV2(zh: string, pinyinStr?: string): { c: string; py: string }[] {
  const auto = toRuby(zh);
  if (!pinyinStr) return auto;
  const sylls = pinyinStr.trim().split(/\s+/).map((s) => s.replace(/[,.!?;:，。！？；：、]/g, "")).filter(Boolean);
  const hanCount = auto.filter((p) => isHan(p.c)).length;
  if (sylls.length !== hanCount) return auto;
  let i = 0;
  return auto.map((p) => (isHan(p.c) ? { c: p.c, py: sylls[i++] } : p));
}

// 中文行逐字跳字：读到哪个字，哪个字弹起放大+点亮（字级时间戳驱动，transform 不占布局不推挤）
const KaraokeRow: React.FC<{
  zh: string; pinyinStr?: string; timings?: CharTiming[]; ms: number;
  cap: typeof CAP_V2 & { pinyinColor: string; zhColor: string };
  zhFamily: string; latinFamily: string; zhWeight: number;
}> = ({ zh, pinyinStr, timings, ms, cap, zhFamily, latinFamily, zhWeight }) => {
  const pairs = useMemo(() => toRubyV2(zh, pinyinStr), [zh, pinyinStr]);
  const { sizes, pinyinColumnGap, gapPinyinZh, karaokeColor } = cap;
  let hi = 0; // 汉字序号 → charTimings 对齐
  return (
    <>
      {pairs.map((p, idx) => {
        let k = 0;
        if (isHan(p.c)) {
          const t = timings?.[hi];
          hi += 1;
          if (t) {
            if (ms >= t.startMs && ms < t.endMs) k = Math.min(1, (ms - t.startMs) / 90);
            else if (ms >= t.endMs && ms < t.endMs + 90) k = Math.max(0, 1 - (ms - t.endMs) / 90);
          }
        }
        const e = Math.sin((k * Math.PI) / 2); // easeOut
        const hot = e > 0.01;
        return (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: idx < pairs.length - 1 ? pinyinColumnGap : 0,
              transform: `translateY(${-8 * e}px) scale(${1 + 0.2 * e})`,
              transformOrigin: "center bottom",
            }}
          >
            <span style={{ fontFamily: latinFamily, fontSize: sizes.pinyin, lineHeight: `${sizes.pinyin + 10}px`, height: sizes.pinyin + 10, fontWeight: 800, color: hot ? karaokeColor : cap.pinyinColor }}>
              {p.py}
            </span>
            <span style={{ fontFamily: zhFamily, fontSize: sizes.zh, lineHeight: 1.3, fontWeight: zhWeight, color: hot ? karaokeColor : cap.zhColor, whiteSpace: "pre", marginTop: gapPinyinZh - 10 }}>
              {p.c === " " ? " " : p.c}
            </span>
          </span>
        );
      })}
    </>
  );
};

// 一个场景 = 连续同 sceneId 的拍：一张图连续运镜到底，字幕/配音逐拍切换
const SceneV2: React.FC<{ beats: Beat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
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

  const first = beats[0];
  const preset = (first.motion && meta.motionPresets?.[first.motion]) || DEFAULT_MOTION;
  const capColors = { ...DEFAULT_CAP, ...meta.captions };
  const cap = {
    ...CAP_V2,
    ...(meta.captions || {}),
    sizes: { ...CAP_V2.sizes, ...(meta.captions?.sizes || {}) },
    pinyinColor: capColors.pinyinColor,
    zhColor: capColors.zhColor,
  };
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latinFamily = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;

  // 运镜贯穿整个场景（多拍共图不重启），插值区间 = 场景总帧数
  const easing = preset.ease === "linear" ? Easing.linear : Easing.inOut(Easing.ease);
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing };
  const scale = interpolate(frame, [0, total], preset.scale, clamp);
  const panX = interpolate(frame, [0, total], preset.panX, clamp);
  const panY = interpolate(frame, [0, total], preset.panY, clamp);
  const rot = preset.rotate ? interpolate(frame, [0, total], preset.rotate, clamp) : 0;
  const driftX = Math.sin((frame / fps) * Math.PI * 2 * 0.16) * (preset.driftX ?? 0);
  const driftY = Math.cos((frame / fps) * Math.PI * 2 * 0.13) * (preset.driftY ?? 0);
  const imgScale = first.imgScale ?? 1;

  // 版式：上半放 3:2 横图，下半字幕区。图整体下移 imgTop，字幕块锚在图片正下方 capGap 处。
  const imgH = Math.round(meta.height / 2);
  const imgTop = Math.round(meta.height * 0.06);  // ≈86px 顶部留白
  const capGap = Math.round(meta.height * 0.04);  // ≈58px 图与字幕的间距
  const capTop = imgTop + imgH;
  const capH = meta.height - capTop;
  const maxW = meta.width - cap.sidePad * 2;

  // 每句字幕入场：快速淡入+轻微上浮
  const capIn = interpolate(localFrame, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capRise = interpolate(localFrame, [0, 8], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const local = active.captions.local ?? active.captions.vi ?? "";

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor ?? "#ffffff" }}>
      {/* 上半：3:2 横图，场景内连续运镜 */}
      <div style={{ position: "absolute", top: imgTop, left: 0, width: meta.width, height: imgH, overflow: "hidden" }}>
        <Img
          src={staticFile(first.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            transform: `translate(${panX + driftX}px, ${panY + driftY}px) rotate(${rot}deg) scale(${scale * imgScale})`,
          }}
        />
        {beats.map((b, i) =>
          b.effects?.length ? (
            <Sequence key={`fx-${b.id}`} from={starts[i]} durationInFrames={durs[i]} layout="none">
              <EffectsLayer effects={b.effects} durationInFrames={durs[i]} />
            </Sequence>
          ) : null,
        )}
      </div>

      {/* 下半：单行三层字幕，一屏只显示当前这句，逐字跳字 */}
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
          gap: cap.gapZhLocal,
          transform: `translateY(${-cap.opticalLift + capRise}px)`,
          opacity: capIn,
        }}
      >
        <FitLine maxWidth={maxW} depKey={`zh-${active.id}`}>
          <KaraokeRow
            zh={active.captions.zh}
            pinyinStr={active.captions.pinyin}
            timings={active.charTimings}
            ms={ms}
            cap={cap}
            zhFamily={zhFamily}
            latinFamily={latinFamily}
            zhWeight={zhWeight}
          />
        </FitLine>
        {local ? (
          <FitLine maxWidth={maxW} depKey={`vi-${active.id}`}>
            <span style={{ fontFamily: latinFamily, fontSize: cap.sizes.local, lineHeight: 1.2, color: capColors.localColor, fontWeight: 800 }}>
              {local}
            </span>
          </FitLine>
        ) : null}
      </div>

      {/* 配音：每拍在自己的时间窗内播放 */}
      {beats.map((b, i) => (
        <Sequence key={`au-${b.id}`} from={starts[i]} durationInFrames={durs[i]} layout="none">
          <Audio src={staticFile(b.audio)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "v2-3x4",
  segments: groupScenes,
  transitionOf: (seg) => seg[0].transitionIn,
  Segment: SceneV2,
};
