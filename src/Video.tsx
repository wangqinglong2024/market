import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
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
import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { pinyin } from "pinyin-pro";
import { FONT_LATIN, FONT_ZH } from "./fonts";
import { Sparkles } from "./fx/Sparkles";
import { LightLeak } from "./fx/LightLeak";
import { Confetti } from "./fx/Confetti";
import { ThreeParticles } from "./fx/ThreeParticles";

// ---- 数据类型：完全由 manifest 驱动，渲染层不含业务内容 ----
type Motion = {
  scale: [number, number];
  panX: [number, number];
  panY: [number, number];
  driftX?: number;
  driftY?: number;
  rotate?: [number, number];
  ease?: "inOut" | "linear";
};

type Effect = {
  type: "sparkle" | "lightLeak" | "confetti" | "three";
  count?: number;
  intensity?: number;
  color?: string;
  variant?: "bokeh" | "stars";
  originX?: number;
  originY?: number;
};

type Beat = {
  id: string;
  image: string;
  audio: string;
  durationMs: number;
  motion?: string; // 运镜预设名，见 meta.motionPresets
  transitionIn?: "fade" | "slide-left" | "slide-up" | "wipe";
  effects?: Effect[];
  captions: { pinyin: string; zh: string; local?: string; vi?: string };
};

type Manifest = {
  meta: {
    fps: number;
    width: number;
    height: number;
    bandTopRatio?: number;
    transitionFrames?: number;
    motionPresets?: Record<string, Motion>;
    pageTurn?: { fadeFrames: number; captionRiseFrames: number; captionRisePx: number };
    captions?: { pinyinColor: string; zhColor: string; localColor: string; bgColor: string };
  };
  beats: Beat[];
};

export type VideoProps = { videoId: string; shard: string; manifest: Manifest | null };

const DEFAULT_MOTION: Motion = { scale: [1.03, 1.1], panX: [0, 0], panY: [0, 0], driftX: 8, driftY: 6, ease: "inOut" };
const DEFAULT_CAP = { pinyinColor: "#a58e5c", zhColor: "#20242b", localColor: "#d6336c", bgColor: "#fdfcf7" };
const SIDE_PAD = 52;

const manifestPath = (shard: string, id: string) => `videos/${shard}/${id}/manifest.json`;
const beatFrames = (b: Beat, fps: number) => Math.max(1, Math.round((b.durationMs / 1000) * fps));

// 时长/画幅由 manifest 决定，一个组件服务所有视频。总时长扣除转场重叠帧。
export const calcVideoMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const res = await fetch(staticFile(manifestPath(props.shard, props.videoId)));
  const manifest: Manifest = await res.json();
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const sum = manifest.beats.reduce((a, b) => a + beatFrames(b, fps), 0);
  const overlap = Math.max(0, manifest.beats.length - 1) * trans;
  return {
    durationInFrames: Math.max(1, sum - overlap),
    fps,
    width: manifest.meta.width,
    height: manifest.meta.height,
    props: { ...props, manifest },
  };
};

const isHan = (c: string) => /[㐀-鿿]/.test(c);

// 汉字↔拼音一一对应（整句注音保证多音字准确，再按字对齐）
function toRuby(zh: string): { c: string; py: string }[] {
  const sylls = pinyin(zh, { toneType: "symbol", type: "array", nonZh: "removed" });
  let i = 0;
  return Array.from(zh).map((c) => (isHan(c) ? { c, py: sylls[i++] ?? "" } : { c, py: "" }));
}

// 单行不换行 + 超宽等比缩小贴合（渲染确定性：量宽后 continueRender）
const FitLine: React.FC<{ maxWidth: number; depKey: string; children: React.ReactNode }> = ({
  maxWidth,
  depKey,
  children,
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
      <div
        ref={ref}
        style={{
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "flex-end",
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const RubyRow: React.FC<{ zh: string; pinyinColor: string; zhColor: string }> = ({ zh, pinyinColor, zhColor }) => {
  const pairs = useMemo(() => toRuby(zh), [zh]);
  return (
    <>
      {pairs.map((p, idx) => (
        <span key={idx} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_LATIN, fontSize: 32, lineHeight: "36px", fontWeight: 800, color: pinyinColor, height: 36 }}>
            {p.py}
          </span>
          <span style={{ fontFamily: FONT_ZH, fontSize: 60, lineHeight: "70px", color: zhColor, whiteSpace: "pre" }}>
            {p.c === " " ? " " : p.c}
          </span>
        </span>
      ))}
    </>
  );
};

const EffectsLayer: React.FC<{ effects?: Effect[]; imgW: number; imgH: number }> = ({ effects, imgW, imgH }) => {
  if (!effects?.length) return null;
  return (
    <>
      {effects.map((fx, i) => {
        switch (fx.type) {
          case "sparkle":
            return <Sparkles key={i} count={fx.count ?? 40} color={fx.color ?? "#fff3b0"} seed={`spk-${i}`} />;
          case "lightLeak":
            return <LightLeak key={i} intensity={fx.intensity ?? 0.4} />;
          case "confetti":
            return <Confetti key={i} count={fx.count ?? 60} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.4} seed={`cf-${i}`} />;
          case "three":
            return <ThreeParticles key={i} width={imgW} height={imgH} variant={fx.variant ?? "bokeh"} seed={`tp-${i}`} />;
          default:
            return null;
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
  const pageTurn = { fadeFrames: 10, captionRiseFrames: 14, captionRisePx: 22, ...meta.pageTurn };
  const bandTop = Math.round(meta.height * (meta.bandTopRatio ?? 0.6927));
  const local = beat.captions.local ?? beat.captions.vi ?? "";
  const maxW = meta.width - SIDE_PAD * 2;

  const easing = preset.ease === "linear" ? Easing.linear : Easing.inOut(Easing.ease);
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing };
  const scale = interpolate(frame, [0, dur], preset.scale, clamp);
  const panX = interpolate(frame, [0, dur], preset.panX, clamp);
  const panY = interpolate(frame, [0, dur], preset.panY, clamp);
  const rot = preset.rotate ? interpolate(frame, [0, dur], preset.rotate, clamp) : 0;
  const driftX = Math.sin((frame / fps) * Math.PI * 2 * 0.16) * (preset.driftX ?? 0);
  const driftY = Math.cos((frame / fps) * Math.PI * 2 * 0.13) * (preset.driftY ?? 0);

  const capRise = interpolate(frame, [0, pageTurn.captionRiseFrames], [pageTurn.captionRisePx, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cap.bgColor }}>
      {/* 图片区：只占上方，overflow 裁掉多余，绝不进入字幕带；特效叠在图上、随图裁切 */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: bandTop, overflow: "hidden" }}>
        <Img
          src={staticFile(beat.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            transform: `translate(${panX + driftX}px, ${panY + driftY}px) rotate(${rot}deg) scale(${scale})`,
          }}
        />
        <EffectsLayer effects={beat.effects} imgW={meta.width} imgH={bandTop} />
      </div>

      {/* 字幕带：纯色，文字处没有画面 */}
      <div
        style={{
          position: "absolute",
          top: bandTop,
          left: 0,
          width: "100%",
          height: meta.height - bandTop,
          backgroundColor: cap.bgColor,
        }}
      />
      {/* 顶部一条极窄渐变，衔接图片和字幕带 */}
      <div
        style={{
          position: "absolute",
          top: bandTop - 40,
          left: 0,
          width: "100%",
          height: 40,
          background: `linear-gradient(rgba(0,0,0,0), ${cap.bgColor})`,
        }}
      />

      {/* 字幕内容：三行一律不换行，超宽自动缩小 */}
      <div
        style={{
          position: "absolute",
          top: bandTop,
          left: 0,
          width: "100%",
          bottom: 0,
          transform: `translateY(${capRise}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <FitLine maxWidth={maxW} depKey={`py-${beat.id}`}>
          <RubyRow zh={beat.captions.zh} pinyinColor={cap.pinyinColor} zhColor={cap.zhColor} />
        </FitLine>
        {local ? (
          <FitLine maxWidth={maxW} depKey={`vi-${beat.id}`}>
            <span style={{ fontFamily: FONT_LATIN, fontSize: 52, lineHeight: 1.1, color: cap.localColor, fontWeight: 800 }}>
              {local}
            </span>
          </FitLine>
        ) : null}
      </div>

      <Audio src={staticFile(beat.audio)} />
    </AbsoluteFill>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentationFor = (name?: Beat["transitionIn"]): TransitionPresentation<any> => {
  switch (name) {
    case "slide-left":
      return slide({ direction: "from-right" });
    case "slide-up":
      return slide({ direction: "from-bottom" });
    case "wipe":
      return wipe({ direction: "from-left" });
    default:
      return fade();
  }
};

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  if (!manifest) return <AbsoluteFill style={{ backgroundColor: "#fdfcf7" }} />;
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const bg = manifest.meta.captions?.bgColor ?? "#fdfcf7";

  const children: React.ReactNode[] = [];
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

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
