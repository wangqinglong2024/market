import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
} from "remotion";
import { TransitionSeries, linearTiming, type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";
import { pinyin } from "pinyin-pro";
import { DEFAULT_FONTS, stackCss, loadFonts, type FontsMeta } from "./fonts";
// ─── 特效库（已精简为固定 4 个，用户 2026-07-03 锁定）─────────────────────────
import { ComicPops } from "./fx/emotion/ComicPops";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { ScorePop } from "./fx/emotion/ScorePop";
import { ZoomBlur } from "./fx/distortion/ZoomBlur";

// ─── 数据类型 ─────────────────────────────────────────────────────────────────
type Motion = {
  scale: [number, number];
  panX: [number, number];
  panY: [number, number];
  driftX?: number;
  driftY?: number;
  rotate?: [number, number];
  ease?: "inOut" | "linear";
};

// Effect 支持所有可能参数（[key: string]: any 结尾允许任意扩展）
type Effect = {
  type: string;
  // 通用
  count?: number;
  intensity?: number;
  color?: string;
  color1?: string;
  color2?: string;
  opacity?: number;
  // 位置
  originX?: number;
  originY?: number;
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  startY?: number;
  // 文字
  text?: string;
  fontSize?: number;
  words?: string[];
  emojis?: string[];
  // 颜色扩展
  accentColor?: string;
  glowColor?: string;
  bgColor?: string;
  textColor?: string;
  shadowColor?: string;
  highlightColor?: string;
  baseColor?: string;
  ribbon?: string;
  // 动效参数
  bpm?: number;
  period?: number;
  interval?: number;
  every?: number;
  rate?: number;
  rpm?: number;
  turns?: number;
  // 形状/结构
  shape?: "star" | "heart" | "mix";
  variant?: "bokeh" | "stars";
  mode?: "burst" | "rain";
  direction?: "left" | "right" | "up" | "down" | "h" | "v";
  axis?: "h" | "v";
  angleDeg?: number;
  sides?: number;
  slices?: number;
  strokes?: number;
  petals?: number;
  rayCount?: number;
  rings?: number;
  cols?: number;
  rows?: number;
  lines?: number;
  waveCount?: number;
  flagCount?: number;
  // 尺寸
  radius?: number;
  size?: number;
  thickness?: number;
  gap?: number;
  depth?: number;
  dotSize?: number;
  barRatio?: number;
  amplitude?: number;
  maxBlur?: number;
  pixelSize?: number;
  // 其他
  heavy?: boolean;
  pulse?: boolean;
  scanlines?: boolean;
  flashes?: number;
  strikes?: number;
  spotCount?: number;
  starCount?: number;
  holeCount?: number;
  bottomPad?: number;
  phase?: number;
  density?: number;
  layers?: number;
  // 路径等
  tokens?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paths?: any[];
  seed?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// 字级时间戳（火山 TTS with_timestamp，2026-07-07）：驱动中文逐字跳字
type CharTiming = { ch: string; startMs: number; endMs: number };

type Beat = {
  id: string;
  // v2：场景共图分组——同 sceneId 连续拍共用一张图、不换图不转场（2026-07-07）
  sceneId?: string;
  image: string;
  audio: string;
  durationMs: number;
  motion?: string;
  transitionIn?: "fade" | "slide-left" | "slide-up" | "wipe";
  effects?: Effect[];
  // 单人物图缩小系数：flux 老把人画满整框，渲染层按此缩小，让单人和双人同框里的人一样大
  imgScale?: number;
  charTimings?: CharTiming[];
  captions: {
    pinyin: string;
    zh: string;
    local?: string;
    vi?: string;
    // 逐行中越对照：每个元素一行，越南文直接排在对应中文下方
    lines?: { zh: string; vi?: string }[];
  };
};

// v2 字幕排版参数（config/settings.json.captions 全量透传，缺项用 CAP_V2 默认）
type CaptionCfg = {
  pinyinColor: string; zhColor: string; localColor: string; bgColor: string;
  sizes?: { pinyin: number; zh: number; local: number };
  gapPinyinZh?: number; gapZhLocal?: number; sidePad?: number;
  pinyinColumnGap?: number; opticalLift?: number; karaokeColor?: string;
};

type Manifest = {
  meta: {
    fps: number;
    width: number;
    height: number;
    // "v2-3x4"（2026-07-07 改版）：3:4 画布，上半 3:2 横图、下半单行三层字幕+逐字跳字。
    // 旧视频 manifest 无此字段 → 走旧 9:16 版式，互不影响。
    layout?: string;
    bandTopRatio?: number;
    transitionFrames?: number;
    motionPresets?: Record<string, Motion>;
    pageTurn?: { fadeFrames: number; captionRiseFrames: number; captionRisePx: number };
    captions?: CaptionCfg;
    // 全片固定古风背景音乐（用户 2026-07-05 锁定）：整片低音量循环，盖在旁白之下
    bgm?: { src: string; volume?: number };
    // 字幕字体配置（用户 2026-07-05）：换字体只改 config，见 src/fonts.ts
    fonts?: FontsMeta;
  };
  beats: Beat[];
};

export type VideoProps = { videoId: string; shard: string; manifest: Manifest | null };

const DEFAULT_MOTION: Motion = { scale: [1.03, 1.1], panX: [0, 0], panY: [0, 0], driftX: 8, driftY: 6, ease: "inOut" };
const DEFAULT_CAP = { pinyinColor: "#a58e5c", zhColor: "#20242b", localColor: "#d6336c", bgColor: "#fdfcf7" };
const SIDE_PAD = 52;
const PINYIN_COLUMN_GAP = 10;

const manifestPath = (shard: string, id: string) => `videos/${shard}/${id}/manifest.json`;
const beatFrames = (b: Beat, fps: number) => Math.max(1, Math.round((b.durationMs / 1000) * fps));

// v2 场景共图：把连续同 sceneId 的拍分成组，一组 = 一个连续画面（不换图不转场）
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

export const calcVideoMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const res = await fetch(staticFile(manifestPath(props.shard, props.videoId)));
  const manifest: Manifest = await res.json();
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const sum = manifest.beats.reduce((a, b) => a + beatFrames(b, fps), 0);
  // v2：转场只发生在场景边界，重叠按场景组数算；旧版按拍数
  const segments = manifest.meta.layout === "v2-3x4" ? groupScenes(manifest.beats).length : manifest.beats.length;
  const overlap = Math.max(0, segments - 1) * trans;
  return {
    durationInFrames: Math.max(1, sum - overlap),
    fps,
    width: manifest.meta.width,
    height: manifest.meta.height,
    props: { ...props, manifest },
  };
};

const isHan = (c: string) => /[㐀-鿿]/.test(c);

function toRuby(zh: string): { c: string; py: string }[] {
  const sylls = pinyin(zh, { toneType: "symbol", type: "array", nonZh: "removed" });
  let i = 0;
  return Array.from(zh).map((c) => (isHan(c) ? { c, py: sylls[i++] ?? "" } : { c, py: "" }));
}

const FitLine: React.FC<{ maxWidth: number; depKey: string; children: React.ReactNode }> = ({
  maxWidth, depKey, children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [handle] = useState(() => delayRender(`fit-${depKey}`));
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      const w = el.scrollWidth;
      setScale(w > maxWidth ? maxWidth / w : 1);
    }
    continueRender(handle);
  }, [depKey, maxWidth, handle]);
  return (
    <div style={{ width: maxWidth, display: "flex", justifyContent: "center" }}>
      <div ref={ref} style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "flex-end", transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
};

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
          <span style={{ fontFamily: zhFamily, fontSize: 67, lineHeight: "77px", fontWeight: zhWeight, color: zhColor, whiteSpace: "pre" }}>{p.c === " " ? " " : p.c}</span>
        </span>
      ))}
    </>
  );
};

// ─── v2（2026-07-07 改版）：3:4 画布 · 上半 3:2 横图 · 下半单行三层字幕 · 逐字跳字 ───
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
  let hi = 0; // 汉字序号 → charTimings 对齐（tts 只产汉字时间戳，顺序一致）
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

  // 版式：上半 1080×720 放 3:2 横图，下半 720 字幕区（plan/03，2026-07-07 锁定）
  // 2026-07-08 调整：图不再贴死顶部、字幕不再沉在下半区正中——图整体下移 imgTop，
  // 字幕块锚在图片正下方 capGap 处，上下留白更均衡。
  const imgH = Math.round(meta.height / 2);
  const imgTop = Math.round(meta.height * 0.06);  // ≈86px 顶部留白
  const capGap = Math.round(meta.height * 0.04);  // ≈58px 图与字幕的间距
  const capTop = imgTop + imgH;
  const capH = meta.height - capTop;
  const maxW = meta.width - cap.sidePad * 2;

  // 每句字幕入场：快速淡入+轻微上浮（别抢戏）
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

      {/* 下半：单行三层字幕（拼音/中文/越南语），一屏只显示当前这句，逐字跳字 */}
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

// ─── EffectsLayer：调度所有特效类型 ───────────────────────────────────────────
const EffectsLayer: React.FC<{ effects?: Effect[]; durationInFrames: number }> = ({
  effects, durationInFrames,
}) => {
  if (!effects?.length) return null;
  return (
    <>
      {effects.map((fx, i) => {
        const d = durationInFrames;
        const k = i;
        switch (fx.type) {
          // ── 固定 4 特效（用户 2026-07-03 锁定，其余已删）────────────────────
          case "comicPops":  return <ComicPops key={k} durationInFrames={d} seed={`cp-${k}`} words={fx.words} />;
          case "emojiRain":  return <EmojiRain key={k} durationInFrames={d} emojis={fx.emojis} count={fx.count ?? 16} opacity={fx.opacity ?? 0.55} />;
          case "scorePop":   return <ScorePop key={k} durationInFrames={d} count={fx.count} interval={fx.interval ?? 0.62} tokens={fx.tokens} seed={`sp-${k}`} />;
          case "zoomBlur":   return <ZoomBlur key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.3} rings={fx.rings ?? 5} />;
          default:                  return null;
        }
      })}
    </>
  );
};

const Scene: React.FC<{ beat: Beat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = beatFrames(beat, fps);

  const preset = (beat.motion && meta.motionPresets?.[beat.motion]) || DEFAULT_MOTION;
  const cap = { ...DEFAULT_CAP, ...meta.captions };
  // 字体来自 config（manifest.meta.fonts），缺项用默认兜底：中文用 zhStack(可加粗)，拼音/越南语用 latinStack
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latinFamily = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;
  const pageTurn = { fadeFrames: 10, captionRiseFrames: 14, captionRisePx: 22, ...meta.pageTurn };
  // 1:1 方图合成到白底 9:16：上留白 2/16 + 方图 9/16 + 字幕带 3/16 + 下留白 2/16（用户 2026-07-03 锁定）
  const imgSize = meta.width;                       // 1:1，满宽正方（= 9/16 高）
  const imgTop = Math.round((meta.height * 2) / 16 / 3); // 顶部留白 = 原 2/16 减去 2/3（≈0.67/16），整体上移，空白挪到底部
  const capTop = imgTop + imgSize;                  // 字幕带顶 = 11/16
  const capH = Math.round((meta.height * 3) / 16);  // 字幕带 3/16
  const local = beat.captions.local ?? beat.captions.vi ?? "";
  const maxW = meta.width - SIDE_PAD * 2;
  // 逐行中越对照：优先用 captions.lines（每行 zh + 对应 vi），
  // 没有 lines 时退化为「整句中文 + 整句越南文」一对。越南文永远紧贴其对应中文下方。
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

  const imgScale = beat.imgScale ?? 1; // 单人物缩小，让人物不再画满整框（见 build.mjs）

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentationFor = (name?: Beat["transitionIn"]): TransitionPresentation<any> => {
  switch (name) {
    case "slide-left": return slide({ direction: "from-right" });
    case "slide-up":   return slide({ direction: "from-bottom" });
    case "wipe":       return wipe({ direction: "from-left" });
    default:           return fade();
  }
};

// 按 manifest.meta.fonts 幂等加载字体（含用户在 config 换的新字体）；渲染前用 delayRender 等字体就绪
const FontLoader: React.FC<{ fonts?: FontsMeta }> = ({ fonts }) => {
  const [h] = useState(() => delayRender("manifest-fonts"));
  useEffect(() => {
    loadFonts(fonts ?? {}).finally(() => continueRender(h));
  }, [h, fonts]);
  return null;
};

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  if (!manifest) return <AbsoluteFill style={{ backgroundColor: "#fdfcf7" }} />;
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const bg = manifest.meta.captions?.bgColor ?? "#fdfcf7";
  const isV2 = manifest.meta.layout === "v2-3x4";

  const children: React.ReactNode[] = [];
  if (isV2) {
    // v2：转场只在场景边界；场景内多拍共图连续运镜，字幕/配音逐拍切换（SceneV2）
    groupScenes(manifest.beats).forEach((scene, i) => {
      const sceneDur = scene.reduce((a, b) => a + beatFrames(b, fps), 0);
      if (i > 0) {
        children.push(
          <TransitionSeries.Transition
            key={`t-${scene[0].id}`}
            presentation={presentationFor(scene[0].transitionIn)}
            timing={linearTiming({ durationInFrames: trans })}
          />,
        );
      }
      children.push(
        <TransitionSeries.Sequence key={`s-${scene[0].id}`} durationInFrames={sceneDur}>
          <SceneV2 beats={scene} meta={manifest.meta} />
        </TransitionSeries.Sequence>,
      );
    });
  } else {
    manifest.beats.forEach((beat, i) => {
      if (i > 0) {
        children.push(
          <TransitionSeries.Transition
            key={`t-${beat.id}`}
            presentation={presentationFor(beat.transitionIn)}
            timing={linearTiming({ durationInFrames: trans })}
          />,
        );
      }
      children.push(
        <TransitionSeries.Sequence key={beat.id} durationInFrames={beatFrames(beat, fps)}>
          <Scene beat={beat} meta={manifest.meta} />
        </TransitionSeries.Sequence>,
      );
    });
  }

  const bgm = manifest.meta.bgm;

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <FontLoader fonts={manifest.meta.fonts} />
      <TransitionSeries>{children}</TransitionSeries>
      {/* 全片固定古风背景音乐：低音量循环，垫在旁白之下（用户 2026-07-05 锁定） */}
      {bgm?.src ? <Audio src={staticFile(bgm.src)} volume={() => bgm.volume ?? 0.08} loop /> : null}
    </AbsoluteFill>
  );
};
