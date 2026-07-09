// 版式 v1-legacy（旧 9:16）：1:1 方图合成到白底 9:16，上留白 + 方图 + 字幕带；逐行中越对照。
// 缺省/未知 layout 与改造前无 layout 字段的旧视频走这里，保持旧片渲染不变。
import {
  AbsoluteFill, Audio, Easing, Img, interpolate,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Beat, Manifest, LayoutModule } from "./types";
import { beatFrames, toRuby, FitLine, EffectsLayer, DEFAULT_MOTION, DEFAULT_CAP } from "./shared";

const SIDE_PAD = 52;
const PINYIN_COLUMN_GAP = 10;

const RubyRow: React.FC<{
  zh: string; pinyinColor: string; zhColor: string;
  zhFamily: string; latinFamily: string; zhWeight: number;
}> = ({ zh, pinyinColor, zhColor, zhFamily, latinFamily, zhWeight }) => {
  const pairs = useMemo(() => toRuby(zh), [zh]);
  return (
    <>
      {pairs.map((p, idx) => (
        <span
          key={idx}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            marginRight: idx < pairs.length - 1 ? PINYIN_COLUMN_GAP : 0,
          }}
        >
          <span style={{ fontFamily: latinFamily, fontSize: 42, lineHeight: "46px", fontWeight: 800, color: pinyinColor, height: 46 }}>{p.py}</span>
          <span style={{ fontFamily: zhFamily, fontSize: 67, lineHeight: "77px", fontWeight: zhWeight, color: zhColor, whiteSpace: "pre" }}>{p.c === " " ? " " : p.c}</span>
        </span>
      ))}
    </>
  );
};

const Scene: React.FC<{ beat: Beat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = beatFrames(beat, fps);

  const preset = (beat.motion && meta.motionPresets?.[beat.motion]) || DEFAULT_MOTION;
  const cap = { ...DEFAULT_CAP, ...meta.captions };
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latinFamily = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;
  const pageTurn = { fadeFrames: 10, captionRiseFrames: 14, captionRisePx: 22, ...meta.pageTurn };
  // 1:1 方图合成到白底 9:16：上留白 2/16 + 方图 9/16 + 字幕带 3/16 + 下留白 2/16
  const imgSize = meta.width;                       // 1:1，满宽正方
  const imgTop = Math.round((meta.height * 2) / 16 / 3); // 顶部留白整体上移
  const capTop = imgTop + imgSize;                  // 字幕带顶
  const capH = Math.round((meta.height * 3) / 16);  // 字幕带 3/16
  const local = beat.captions.local ?? beat.captions.vi ?? "";
  const maxW = meta.width - SIDE_PAD * 2;
  // 逐行中越对照：优先 captions.lines，否则退化为「整句中文 + 整句越南文」一对
  const pairs: { zh: string; vi: string }[] =
    beat.captions.lines?.length
      ? beat.captions.lines.map((l) => ({ zh: l.zh, vi: l.vi ?? "" }))
      : [{ zh: beat.captions.zh, vi: local }];

  const easing = preset.ease === "linear" ? Easing.linear : Easing.inOut(Easing.ease);
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing };
  const scale = interpolate(frame, [0, dur], preset.scale, clamp);
  const panX = interpolate(frame, [0, dur], preset.panX, clamp);
  const panY = interpolate(frame, [0, dur], preset.panY, clamp);
  const rot = preset.rotate ? interpolate(frame, [0, dur], preset.rotate, clamp) : 0;
  const driftX = Math.sin((frame / fps) * Math.PI * 2 * 0.16) * (preset.driftX ?? 0);
  const driftY = Math.cos((frame / fps) * Math.PI * 2 * 0.13) * (preset.driftY ?? 0);

  const imgScale = beat.imgScale ?? 1;

  const capRise = interpolate(frame, [0, pageTurn.captionRiseFrames], [pageTurn.captionRisePx, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor }}>
      {/* 方形画面：白底上、上留白 2/16、满宽 1:1 */}
      <div style={{ position: "absolute", top: imgTop, left: 0, width: imgSize, height: imgSize, overflow: "hidden" }}>
        <Img
          src={staticFile(beat.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center center",
            transform: `translate(${panX + driftX}px, ${panY + driftY}px) rotate(${rot}deg) scale(${scale * imgScale})`,
          }}
        />
        <EffectsLayer effects={beat.effects} durationInFrames={dur} />
      </div>

      {/* 字幕带：11/16 起、高 3/16，居中 */}
      <div
        style={{
          position: "absolute",
          top: capTop,
          left: 0,
          width: "100%",
          height: capH,
          transform: `translateY(${capRise}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {pairs.map((p, i) => (
          <div
            key={`pair-${i}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <FitLine maxWidth={maxW} depKey={`py-${beat.id}-${i}`}>
              <RubyRow zh={p.zh} pinyinColor={cap.pinyinColor} zhColor={cap.zhColor} zhFamily={zhFamily} latinFamily={latinFamily} zhWeight={zhWeight} />
            </FitLine>
            {p.vi ? (
              <FitLine maxWidth={maxW} depKey={`vi-${beat.id}-${i}`}>
                <span style={{ fontFamily: latinFamily, fontSize: 50, lineHeight: 1.1, color: cap.localColor, fontWeight: 800 }}>
                  {p.vi}
                </span>
              </FitLine>
            ) : null}
          </div>
        ))}
      </div>

      <Audio src={staticFile(beat.audio)} />
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "v1-legacy",
  segments: (beats) => beats.map((b) => [b]), // 每拍一段，段间按 beat.transitionIn 转场
  transitionOf: (seg) => seg[0].transitionIn,
  Segment: ({ beats, meta }) => <Scene beat={beats[0]} meta={meta} />,
};
