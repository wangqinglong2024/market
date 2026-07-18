// 固定虚构 AI 女主 × AI 古装连续悬疑：9:16 全屏动态短剧版式。
//
// 设计原则：
// - 第一帧直接进入现代 AI 林晚动作，不显示片名、Logo 或课程徽标；
// - real-video / ai-video 使用 @remotion/media，画面始终铺满 1080×1920；
// - 所有人物说中文，字幕固定为拼音＋中文＋越南文三行；无词卡、讲解或教学组件；
// - 所有动画均由 Remotion 帧时间驱动，不使用 CSS animation / transition；
// - 一个 layout segment 包含整条时间线，镜头之间硬切，不被全局转场吃掉时长。
import {Audio as MediaAudio, Video as MediaVideo} from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {DEFAULT_FONTS, stackCss} from "../fonts";
import type {LayoutModule, Manifest, RenderBeat} from "./types";

type DramaUtterance = {
  speakerId: string;
  mode: string;
  pinyin: string;
  textZh: string;
  subtitleVi: string;
  startOffsetMs: number;
  estimatedDurationMs: number;
};

type DramaOverlay = {
  type: "impact" | "flash" | "none";
  startMs: number;
  durationMs: number;
};

type MediaWindow = {
  sourceStartMs?: number;
  sourceEndMs?: number;
  playbackRate?: number;
  objectPosition?: string;
  scale?: number;
};

type DramaAudio = {
  dialogueAsset?: string;
  sfx?: string[];
  sfxAssets?: string[];
  originalClipAudio?: boolean;
};

type DramaBeat = RenderBeat & {
  sceneId?: string;
  role?: string;
  sourceType: "real-video" | "ai-video" | "remotion" | "still-fallback";
  asset?: string;
  fallbackAsset?: string;
  mediaWindow?: MediaWindow;
  motionPreset?: "locked" | "micro-push" | "impact-push" | "panic-shake" | "evidence-tilt";
  utterances?: DramaUtterance[];
  overlays?: DramaOverlay[];
  audio?: DramaAudio;
};

const isPlayableAsset = (value?: string): value is string =>
  Boolean(value && /\.(mp4|mov|webm|m4v)$/i.test(value));

const isAudioAsset = (value: string): boolean => /\.(mp3|wav|m4a|aac|ogg)$/i.test(value);

const msToFrames = (ms: number, fps: number) => Math.max(0, Math.round((ms / 1000) * fps));

const getFontFamilies = (meta: Manifest["meta"]) => {
  const fonts = {...DEFAULT_FONTS, ...(meta.fonts || {})};
  return {
    zh: stackCss(fonts.zhStack),
    latin: stackCss(fonts.latinStack),
    zhWeight: fonts.zhWeight ?? 700,
  };
};

const ImpactLayer: React.FC<{overlays: DramaOverlay[]}> = ({overlays}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const impact = overlays.find((item) => item.type === "impact" && ms >= item.startMs && ms < item.startMs + item.durationMs);
  if (!impact) return null;
  const local = ms - impact.startMs;
  const opacity = interpolate(local, [0, Math.max(50, impact.durationMs * 0.32), impact.durationMs], [0, 0.88, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.95) 0%, rgba(169,0,0,0.82) 38%, rgba(0,0,0,0) 76%)",
        mixBlendMode: "screen",
        opacity,
      }}
    />
  );
};

const FlashLayer: React.FC<{overlays: DramaOverlay[]}> = ({overlays}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const flash = overlays.find((item) => item.type === "flash" && ms >= item.startMs && ms < item.startMs + item.durationMs);
  if (!flash) return null;
  const local = ms - flash.startMs;
  const opacity = interpolate(local, [0, Math.max(30, flash.durationMs * 0.2), flash.durationMs], [0, 0.82, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{backgroundColor: "#fff7e6", mixBlendMode: "screen", opacity}} />;
};

const CaptionLayer: React.FC<{beat: DramaBeat; meta: Manifest["meta"]}> = ({beat, meta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {zh, latin, zhWeight} = getFontFamilies(meta);
  const ms = (frame / fps) * 1000;
  const utterance = beat.utterances?.find(
    (item) => ms >= item.startOffsetMs && ms < item.startOffsetMs + item.estimatedDurationMs,
  );
  if (!utterance) return null;

  const cfg = meta.dramaV2?.captions;
  const local = ms - utterance.startOffsetMs;
  const enter = interpolate(local, [0, Math.min(100, utterance.estimatedDurationMs * 0.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const maxWidth = meta.width - (cfg?.safeLeft ?? 80) - (cfg?.safeRight ?? 180);
  const pinyinSize = cfg?.pinyinSize ?? 38;
  const zhSize = cfg?.zhSize ?? 56;
  const viSize = cfg?.viSize ?? 46;

  return (
    <div
      style={{
        position: "absolute",
        left: cfg?.safeLeft ?? 80,
        right: cfg?.safeRight ?? 180,
        bottom: cfg?.safeBottom ?? 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity: enter,
        translate: `0 ${(1 - enter) * 18}px`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth,
          fontFamily: latin,
          fontSize: pinyinSize,
          lineHeight: 1.08,
          fontWeight: 800,
          color: cfg?.pinyinColor ?? "#ffe8a3",
          letterSpacing: 1.2,
          textShadow: `0 3px 12px ${cfg?.shadowColor ?? "rgba(0,0,0,0.98)"}`,
        }}
      >
        {utterance.pinyin}
      </div>
      <div
        style={{
          maxWidth,
          fontFamily: zh,
          fontSize: zhSize,
          lineHeight: 1.08,
          fontWeight: zhWeight,
          color: cfg?.zhColor ?? "#ffffff",
          WebkitTextStroke: "1px rgba(0,0,0,0.72)",
          textShadow: "0 3px 2px rgba(0,0,0,0.98), 0 7px 20px rgba(0,0,0,0.96)",
        }}
      >
        {utterance.textZh}
      </div>
      <div
        style={{
          maxWidth,
          fontFamily: latin,
          fontSize: viSize,
          lineHeight: 1.16,
          fontWeight: 800,
          color: cfg?.viColor ?? "#ffe66d",
          WebkitTextStroke: "1px rgba(0,0,0,0.72)",
          textShadow: "0 3px 2px rgba(0,0,0,0.98), 0 7px 20px rgba(0,0,0,0.96)",
        }}
      >
        {utterance.subtitleVi}
      </div>
    </div>
  );
};

const MovingPicture: React.FC<{beat: DramaBeat}> = ({beat}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const window = beat.mediaWindow ?? {};
  const isVideo = beat.sourceType === "real-video" || beat.sourceType === "ai-video" || beat.sourceType === "remotion";
  const asset = beat.asset;
  const fallback = beat.fallbackAsset;
  const scale = window.scale ?? 1.035;
  const durationFrames = Math.max(1, msToFrames(beat.durationMs, fps));
  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const preset = beat.motionPreset;
  const extraScale = preset === "locked" ? 0 : preset === "micro-push" ? 0.052 : preset === "impact-push" ? 0.035 : 0.018;
  const translateX = preset === "evidence-tilt" ? interpolate(progress, [0, 1], [-10, 10]) : preset === "panic-shake" ? Math.sin(frame * 2.4) * 5 : 0;
  const translateY = preset === "micro-push" ? interpolate(progress, [0, 1], [8, -12]) : preset === "panic-shake" ? Math.sin(frame * 1.7) * 3 : 0;
  const rotation = preset === "evidence-tilt" ? interpolate(progress, [0, 1], [-0.35, 0.35]) : 0;
  const pictureScale = scale + progress * extraScale;
  const pictureTranslate = `${translateX}px ${translateY}px`;
  const pictureRotate = `${rotation}deg`;

  if (isVideo && isPlayableAsset(asset)) {
    const trimBefore = window.sourceStartMs ? msToFrames(window.sourceStartMs, fps) : undefined;
    const trimAfter = window.sourceEndMs ? msToFrames(window.sourceEndMs, fps) : undefined;
    return (
      <MediaVideo
        src={staticFile(asset)}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        playbackRate={window.playbackRate ?? 1}
        muted={!beat.audio?.originalClipAudio}
        volume={beat.audio?.originalClipAudio ? 1 : 0}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: window.objectPosition ?? "50% 50%",
          scale: pictureScale,
          translate: pictureTranslate,
          rotate: pictureRotate,
        }}
      />
    );
  }

  if (fallback || asset) {
    return (
      <Img
        src={staticFile((fallback || asset) as string)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: window.objectPosition ?? "50% 50%",
          scale: pictureScale,
          translate: pictureTranslate,
          rotate: pictureRotate,
        }}
      />
    );
  }

  return <AbsoluteFill style={{background: "radial-gradient(circle at 50% 42%, #42131b, #08080b 64%, #000)"}} />;
};

const Shot: React.FC<{beat: DramaBeat; meta: Manifest["meta"]}> = ({beat, meta}) => {
  const overlays = beat.overlays ?? [];
  const dialogueAsset = beat.audio?.originalClipAudio ? undefined : beat.audio?.dialogueAsset;
  const sfxAssets = beat.audio?.sfxAssets ?? beat.audio?.sfx?.filter(isAudioAsset) ?? [];

  return (
    <AbsoluteFill style={{backgroundColor: "#050507", overflow: "hidden"}}>
      <MovingPicture beat={beat} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.12) 58%, rgba(0,0,0,0.82) 100%)",
        }}
      />
      <ImpactLayer overlays={overlays} />
      <FlashLayer overlays={overlays} />
      <CaptionLayer beat={beat} meta={meta} />
      {dialogueAsset && isAudioAsset(dialogueAsset) ? <MediaAudio src={staticFile(dialogueAsset)} /> : null}
      {sfxAssets.map((asset) => (
        <MediaAudio key={asset} src={staticFile(asset)} volume={0.82} />
      ))}
    </AbsoluteFill>
  );
};

const Segment: LayoutModule["Segment"] = ({beats, meta}) => {
  const {fps} = useVideoConfig();
  const list = beats as DramaBeat[];
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: "#050507"}}>
      {list.map((beat) => {
        const durationInFrames = Math.max(1, msToFrames(beat.durationMs, fps));
        const start = from;
        from += durationInFrames;
        return (
          <Sequence key={beat.id} from={start} durationInFrames={durationInFrames} premountFor={Math.min(15, start)}>
            <Shot beat={beat} meta={meta} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "chinese-drama-v2",
  segments: (beats) => (beats.length ? [beats] : []),
  transitionOf: () => undefined,
  Segment,
};
