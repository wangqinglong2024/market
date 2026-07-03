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
// ─── atmosphere ───────────────────────────────────────────────────────────────
import { LightLeak } from "./fx/atmosphere/LightLeak";
import { BackdropParallax } from "./fx/atmosphere/BackdropParallax";
import { SweepBeam } from "./fx/atmosphere/SweepBeam";
import { Bokeh } from "./fx/atmosphere/Bokeh";
import { ColorPulse } from "./fx/atmosphere/ColorPulse";
import { CornerBloom } from "./fx/atmosphere/CornerBloom";
import { FilmGrain } from "./fx/atmosphere/FilmGrain";
import { Vignette } from "./fx/atmosphere/Vignette";
import { WarmGlow } from "./fx/atmosphere/WarmGlow";
import { HeatShimmer } from "./fx/atmosphere/HeatShimmer";
import { DualLight } from "./fx/atmosphere/DualLight";
import { NightBloom } from "./fx/atmosphere/NightBloom";
// ─── particles ────────────────────────────────────────────────────────────────
import { Sparkles } from "./fx/particles/Sparkles";
import { Sakura } from "./fx/particles/Sakura";
import { Confetti } from "./fx/particles/Confetti";
import { Bubbles } from "./fx/particles/Bubbles";
import { ShootingStars } from "./fx/particles/ShootingStars";
import { Butterflies } from "./fx/particles/Butterflies";
import { ThreeParticles } from "./fx/particles/ThreeParticles";
import { Snow } from "./fx/particles/Snow";
import { Fireflies } from "./fx/particles/Fireflies";
import { Leaves } from "./fx/particles/Leaves";
import { StarDust } from "./fx/particles/StarDust";
import { Raindrops } from "./fx/particles/Raindrops";
// ─── geometry ─────────────────────────────────────────────────────────────────
import { StarBurst } from "./fx/geometry/StarBurst";
import { FocusLines } from "./fx/geometry/FocusLines";
import { RippleRings } from "./fx/geometry/RippleRings";
import { CornerFrame } from "./fx/geometry/CornerFrame";
import { RotatingRays } from "./fx/geometry/RotatingRays";
import { Mandala } from "./fx/geometry/Mandala";
import { HexGrid } from "./fx/geometry/HexGrid";
import { PulseCircle } from "./fx/geometry/PulseCircle";
import { DiamondBurst } from "./fx/geometry/DiamondBurst";
import { SpiralGrow } from "./fx/geometry/SpiralGrow";
import { GridFlash } from "./fx/geometry/GridFlash";
import { TrianglePop } from "./fx/geometry/TrianglePop";
// ─── reveal ───────────────────────────────────────────────────────────────────
import { PathDraw } from "./fx/reveal/PathDraw";
import { SweepReveal } from "./fx/reveal/SweepReveal";
import { CircleMask } from "./fx/reveal/CircleMask";
import { DiagonalWipe } from "./fx/reveal/DiagonalWipe";
import { BlurReveal } from "./fx/reveal/BlurReveal";
import { IrisReveal } from "./fx/reveal/IrisReveal";
import { SliceReveal } from "./fx/reveal/SliceReveal";
import { CurtainOpen } from "./fx/reveal/CurtainOpen";
import { FadeRays } from "./fx/reveal/FadeRays";
import { PixelDissolve } from "./fx/reveal/PixelDissolve";
import { ScaleReveal } from "./fx/reveal/ScaleReveal";
import { BrushReveal } from "./fx/reveal/BrushReveal";
// ─── emotion ──────────────────────────────────────────────────────────────────
import { Emotes } from "./fx/emotion/Emotes";
import { FloatingIcons } from "./fx/emotion/FloatingIcons";
import { ScorePop } from "./fx/emotion/ScorePop";
import { LevelBanner } from "./fx/emotion/LevelBanner";
import { CoinFountain } from "./fx/emotion/CoinFountain";
import { ComicPops } from "./fx/emotion/ComicPops";
import { HeartBurst } from "./fx/emotion/HeartBurst";
import { SpeechBubble } from "./fx/emotion/SpeechBubble";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { StarFill } from "./fx/emotion/StarFill";
import { ThumbBounce } from "./fx/emotion/ThumbBounce";
import { Applause } from "./fx/emotion/Applause";
// ─── nature ───────────────────────────────────────────────────────────────────
import { Rain } from "./fx/nature/Rain";
import { Snow2 } from "./fx/nature/Snow2";
import { Thunder } from "./fx/nature/Thunder";
import { Clouds } from "./fx/nature/Clouds";
import { Wind } from "./fx/nature/Wind";
import { WaterWave } from "./fx/nature/WaterWave";
import { Sunrays } from "./fx/nature/Sunrays";
import { Aurora } from "./fx/nature/Aurora";
import { Fog } from "./fx/nature/Fog";
import { CampFire } from "./fx/nature/CampFire";
import { MoonGlow } from "./fx/nature/MoonGlow";
import { Tornado } from "./fx/nature/Tornado";
// ─── cinematic ────────────────────────────────────────────────────────────────
import { Letterbox } from "./fx/cinematic/Letterbox";
import { FilmBurn } from "./fx/cinematic/FilmBurn";
import { LensFlare } from "./fx/cinematic/LensFlare";
import { ChromaShift } from "./fx/cinematic/ChromaShift";
import { OldFilm } from "./fx/cinematic/OldFilm";
import { Anamorphic } from "./fx/cinematic/Anamorphic";
import { SplitTone } from "./fx/cinematic/SplitTone";
import { FlickerCut } from "./fx/cinematic/FlickerCut";
import { DrunkZoom } from "./fx/cinematic/DrunkZoom";
import { DirtyLens } from "./fx/cinematic/DirtyLens";
import { MagazineCover } from "./fx/cinematic/MagazineCover";
import { SlowMotionBlur } from "./fx/cinematic/SlowMotionBlur";
// ─── celebration ──────────────────────────────────────────────────────────────
import { Fireworks } from "./fx/celebration/Fireworks";
import { Balloons } from "./fx/celebration/Balloons";
import { GoldRain } from "./fx/celebration/GoldRain";
import { Ribbon } from "./fx/celebration/Ribbon";
import { Champagne } from "./fx/celebration/Champagne";
import { BirthdayFlag } from "./fx/celebration/BirthdayFlag";
import { StreamerDrop } from "./fx/celebration/StreamerDrop";
import { CakeSparkle } from "./fx/celebration/CakeSparkle";
import { PomPom } from "./fx/celebration/PomPom";
import { GiftBox } from "./fx/celebration/GiftBox";
import { PaperCuts } from "./fx/celebration/PaperCuts";
import { Confetti2 } from "./fx/celebration/Confetti2";
// ─── text ─────────────────────────────────────────────────────────────────────
import { TypeOn } from "./fx/text/TypeOn";
import { WaveText } from "./fx/text/WaveText";
import { GlowTitle } from "./fx/text/GlowTitle";
import { FloatWords } from "./fx/text/FloatWords";
import { NeonFlicker } from "./fx/text/NeonFlicker";
import { GradientTitle } from "./fx/text/GradientTitle";
import { SparkleText } from "./fx/text/SparkleText";
import { KaraokeBar } from "./fx/text/KaraokeBar";
import { ScatterWords } from "./fx/text/ScatterWords";
import { ShadowStack } from "./fx/text/ShadowStack";
import { BubbleText } from "./fx/text/BubbleText";
import { WatermarkPulse } from "./fx/text/WatermarkPulse";
// ─── sticker ──────────────────────────────────────────────────────────────────
import { RainbowArc } from "./fx/sticker/RainbowArc";
import { FlowerSticker } from "./fx/sticker/FlowerSticker";
import { CloudPuff } from "./fx/sticker/CloudPuff";
import { HeartSticker } from "./fx/sticker/HeartSticker";
import { BowRibbon } from "./fx/sticker/BowRibbon";
import { CrownFloat } from "./fx/sticker/CrownFloat";
import { StarSticker } from "./fx/sticker/StarSticker";
import { PawPrint } from "./fx/sticker/PawPrint";
import { MusicNote } from "./fx/sticker/MusicNote";
import { DiamondShine } from "./fx/sticker/DiamondShine";
import { Bubble } from "./fx/sticker/Bubble";
import { CherryBlossom } from "./fx/sticker/CherryBlossom";
// ─── distortion ───────────────────────────────────────────────────────────────
import { Glitch } from "./fx/distortion/Glitch";
import { TVNoise } from "./fx/distortion/TVNoise";
import { Ripple } from "./fx/distortion/Ripple";
import { WarpWave } from "./fx/distortion/WarpWave";
import { VHSTracking } from "./fx/distortion/VHSTracking";
import { Pixelate } from "./fx/distortion/Pixelate";
import { InvertFlash } from "./fx/distortion/InvertFlash";
import { Mirror } from "./fx/distortion/Mirror";
import { Stretch } from "./fx/distortion/Stretch";
import { ZoomBlur } from "./fx/distortion/ZoomBlur";
import { Shake } from "./fx/distortion/Shake";
import { ChromaticAberration } from "./fx/distortion/ChromaticAberration";
// ─── frame ────────────────────────────────────────────────────────────────────
import { GoldFrame } from "./fx/frame/GoldFrame";
import { FloralBorder } from "./fx/frame/FloralBorder";
import { PolaroidFrame } from "./fx/frame/PolaroidFrame";
import { FilmStrip } from "./fx/frame/FilmStrip";
import { RoundedVignette } from "./fx/frame/RoundedVignette";
import { ScrapbookBorder } from "./fx/frame/ScrapbookBorder";
import { WaveFrame } from "./fx/frame/WaveFrame";
import { DoubleLine } from "./fx/frame/DoubleLine";
import { DiamondCorners } from "./fx/frame/DiamondCorners";
import { VintageStamp } from "./fx/frame/VintageStamp";
import { DotBorder } from "./fx/frame/DotBorder";
import { GlowBorder } from "./fx/frame/GlowBorder";

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
  paths?: any[];
  seed?: string;
  [key: string]: any;
};

type Beat = {
  id: string;
  image: string;
  audio: string;
  durationMs: number;
  motion?: string;
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

const RubyRow: React.FC<{ zh: string; pinyinColor: string; zhColor: string }> = ({ zh, pinyinColor, zhColor }) => {
  const pairs = useMemo(() => toRuby(zh), [zh]);
  return (
    <>
      {pairs.map((p, idx) => (
        <span key={idx} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_LATIN, fontSize: 32, lineHeight: "36px", fontWeight: 800, color: pinyinColor, height: 36 }}>{p.py}</span>
          <span style={{ fontFamily: FONT_ZH, fontSize: 60, lineHeight: "70px", color: zhColor, whiteSpace: "pre" }}>{p.c === " " ? " " : p.c}</span>
        </span>
      ))}
    </>
  );
};

// ─── EffectsLayer：调度所有特效类型 ───────────────────────────────────────────
const EffectsLayer: React.FC<{ effects?: Effect[]; imgW: number; imgH: number; durationInFrames: number }> = ({
  effects, imgW, imgH, durationInFrames,
}) => {
  if (!effects?.length) return null;
  return (
    <>
      {effects.map((fx, i) => {
        const d = durationInFrames;
        const k = i;
        switch (fx.type) {
          // ── atmosphere ──────────────────────────────────────────────────────
          case "lightLeak":         return <LightLeak key={k} intensity={fx.intensity ?? 0.4} />;
          case "backdropParallax":  return <BackdropParallax key={k} seed={`bp-${k}`} />;
          case "sweepBeam":         return <SweepBeam key={k} durationInFrames={d} color={fx.color ?? "#fff5cc"} angleDeg={fx.angleDeg ?? 22} opacity={fx.opacity ?? 0.38} />;
          case "bokeh":             return <Bokeh key={k} durationInFrames={d} count={fx.count ?? 5} color={fx.color ?? "#ffd54f"} opacity={fx.opacity ?? 0.35} seed={`bk-${k}`} />;
          case "colorPulse":        return <ColorPulse key={k} durationInFrames={d} color={fx.color ?? "#ffd700"} accentColor={fx.accentColor ?? "#e91e63"} bpm={fx.bpm ?? 51} opacity={fx.opacity ?? 0.18} />;
          case "cornerBloom":       return <CornerBloom key={k} durationInFrames={d} color={fx.color ?? "#ffd700"} opacity={fx.opacity ?? 0.32} />;
          case "filmGrain":         return <FilmGrain key={k} durationInFrames={d} opacity={fx.opacity ?? 0.12} />;
          case "vignette":          return <Vignette key={k} durationInFrames={d} color={fx.color ?? "#000"} opacity={fx.opacity ?? 0.45} pulse={fx.pulse ?? false} />;
          case "warmGlow":          return <WarmGlow key={k} durationInFrames={d} color={fx.color ?? "#ffb347"} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.42} opacity={fx.opacity ?? 0.35} />;
          case "heatShimmer":       return <HeatShimmer key={k} durationInFrames={d} color={fx.color ?? "#ff8c42"} startY={fx.startY ?? 0.45} opacity={fx.opacity ?? 0.28} />;
          case "dualLight":         return <DualLight key={k} durationInFrames={d} color1={fx.color1 ?? "#ffe566"} color2={fx.color2 ?? "#a8edff"} opacity={fx.opacity ?? 0.3} />;
          case "nightBloom":        return <NightBloom key={k} durationInFrames={d} starCount={fx.starCount ?? 30} opacity={fx.opacity ?? 0.55} />;
          // ── particles ───────────────────────────────────────────────────────
          case "sparkle":           return <Sparkles key={k} count={fx.count ?? 40} color={fx.color ?? "#fff3b0"} seed={`spk-${k}`} />;
          case "sakura":            return <Sakura key={k} count={fx.count ?? 26} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.4} seed={`sk-${k}`} />;
          case "confetti":          return <Confetti key={k} count={fx.count ?? 60} mode={fx.mode ?? "burst"} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.4} seed={`cf-${k}`} />;
          case "bubbles":           return <Bubbles key={k} count={fx.count ?? 18} seed={`bb-${k}`} />;
          case "shootingStars":     return <ShootingStars key={k} durationInFrames={d} every={fx.every ?? 0.7} angleDeg={fx.angleDeg ?? 28} seed={`ss-${k}`} />;
          case "butterflies":       return <Butterflies key={k} count={fx.count ?? 7} seed={`bf-${k}`} />;
          case "three":             return <ThreeParticles key={k} width={imgW} height={imgH} variant={fx.variant ?? "bokeh"} seed={`tp-${k}`} />;
          case "snow":              return <Snow key={k} durationInFrames={d} count={fx.count ?? 40} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.55} />;
          case "fireflies":         return <Fireflies key={k} durationInFrames={d} count={fx.count ?? 20} color={fx.color ?? "#aaff66"} opacity={fx.opacity ?? 0.55} />;
          case "leaves":            return <Leaves key={k} durationInFrames={d} count={fx.count ?? 18} color={fx.color ?? "#88cc44"} opacity={fx.opacity ?? 0.5} />;
          case "starDust":          return <StarDust key={k} durationInFrames={d} count={fx.count ?? 50} color={fx.color ?? "#ffee88"} opacity={fx.opacity ?? 0.55} />;
          case "raindrops":         return <Raindrops key={k} durationInFrames={d} count={fx.count ?? 60} color={fx.color ?? "#aaccff"} opacity={fx.opacity ?? 0.35} angle={fx.angleDeg ?? 15} />;
          // ── geometry ────────────────────────────────────────────────────────
          case "starBurst":         return <StarBurst key={k} durationInFrames={d} count={fx.count ?? 18} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.36} period={fx.period ?? 1.4} radius={fx.radius ?? 440} seed={`sb-${k}`} />;
          case "focusLines":        return <FocusLines key={k} count={fx.count ?? 60} intensity={fx.intensity ?? 0.16} color={fx.color ?? "40,36,32"} centerX={fx.originX ?? 0.5} centerY={fx.originY ?? 0.42} seed={`fl-${k}`} />;
          case "rippleRings":       return <RippleRings key={k} durationInFrames={d} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.5} period={fx.period ?? 1.1} color={fx.color ?? "#f48fb1"} opacity={fx.opacity ?? 0.45} />;
          case "cornerFrame":       return <CornerFrame key={k} durationInFrames={d} color={fx.color ?? "#b71c1c"} accentColor={fx.accentColor ?? "#e91e63"} />;
          case "rotatingRays":      return <RotatingRays key={k} durationInFrames={d} rayCount={fx.rayCount ?? 12} color={fx.color ?? "#fff5cc"} opacity={fx.opacity ?? 0.3} rpm={fx.rpm ?? 4} />;
          case "mandala":           return <Mandala key={k} durationInFrames={d} petals={fx.petals ?? 8} color={fx.color ?? "#d4a0ff"} opacity={fx.opacity ?? 0.4} />;
          case "hexGrid":           return <HexGrid key={k} durationInFrames={d} color={fx.color ?? "#88ccff"} opacity={fx.opacity ?? 0.2} cols={fx.cols ?? 8} />;
          case "pulseCircle":       return <PulseCircle key={k} durationInFrames={d} color={fx.color ?? "#ff9dd6"} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} rings={fx.rings ?? 4} opacity={fx.opacity ?? 0.45} />;
          case "diamondBurst":      return <DiamondBurst key={k} durationInFrames={d} color={fx.color ?? "#ffe4f0"} count={fx.count ?? 8} opacity={fx.opacity ?? 0.45} />;
          case "spiralGrow":        return <SpiralGrow key={k} durationInFrames={d} color={fx.color ?? "#c4a0ff"} turns={fx.turns ?? 4} opacity={fx.opacity ?? 0.4} />;
          case "gridFlash":         return <GridFlash key={k} durationInFrames={d} color={fx.color ?? "#88ffcc"} cols={fx.cols ?? 6} rows={fx.rows ?? 9} opacity={fx.opacity ?? 0.25} />;
          case "trianglePop":       return <TrianglePop key={k} durationInFrames={d} color={fx.color ?? "#ffb3d1"} count={fx.count ?? 10} opacity={fx.opacity ?? 0.45} />;
          // ── reveal ──────────────────────────────────────────────────────────
          case "pathDraw":          return <PathDraw key={k} durationInFrames={d} paths={fx.paths ?? []} opacity={fx.opacity ?? 0.75} />;
          case "sweepReveal":       return <SweepReveal key={k} durationInFrames={d} direction={fx.direction as any ?? "left"} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.55} />;
          case "circleMask":        return <CircleMask key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#000"} opacity={fx.opacity ?? 0.55} />;
          case "diagonalWipe":      return <DiagonalWipe key={k} durationInFrames={d} color={fx.color ?? "#ffe0f0"} opacity={fx.opacity ?? 0.55} />;
          case "blurReveal":        return <BlurReveal key={k} durationInFrames={d} maxBlur={fx.maxBlur ?? 20} opacity={fx.opacity ?? 0.3} />;
          case "irisReveal":        return <IrisReveal key={k} durationInFrames={d} sides={fx.sides ?? 6} color={fx.color ?? "#2a1a3e"} opacity={fx.opacity ?? 1} />;
          case "sliceReveal":       return <SliceReveal key={k} durationInFrames={d} slices={fx.slices ?? 8} color={fx.color ?? "#1a1a2e"} opacity={fx.opacity ?? 1} />;
          case "curtainOpen":       return <CurtainOpen key={k} durationInFrames={d} color={fx.color ?? "#c8506a"} opacity={fx.opacity ?? 0.9} />;
          case "fadeRays":          return <FadeRays key={k} durationInFrames={d} rayCount={fx.rayCount ?? 16} color={fx.color ?? "#fff8e7"} opacity={fx.opacity ?? 0.45} />;
          case "pixelDissolve":     return <PixelDissolve key={k} durationInFrames={d} color={fx.color ?? "#1a0a2e"} pixelSize={fx.pixelSize ?? 30} opacity={fx.opacity ?? 1} />;
          case "scaleReveal":       return <ScaleReveal key={k} durationInFrames={d} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.55} />;
          case "brushReveal":       return <BrushReveal key={k} durationInFrames={d} color={fx.color ?? "#ffe0ee"} opacity={fx.opacity ?? 0.7} strokes={fx.strokes ?? 5} />;
          // ── emotion ─────────────────────────────────────────────────────────
          case "emotes":            return <Emotes key={k} count={fx.count ?? 12} seed={`em-${k}`} />;
          case "floatingIcons":     return <FloatingIcons key={k} count={fx.count ?? 16} shape={fx.shape ?? "star"} seed={`fi-${k}`} />;
          case "scorePop":          return <ScorePop key={k} durationInFrames={d} count={fx.count} interval={fx.interval ?? 0.62} tokens={fx.tokens} seed={`sp-${k}`} />;
          case "levelBanner":       return <LevelBanner key={k} text={fx.text ?? "GIỎI QUÁ!"} seed={`lb-${k}`} />;
          case "coinFountain":      return <CoinFountain key={k} durationInFrames={d} originX={fx.originX ?? 0.5} originY={fx.originY ?? 0.52} every={fx.every ?? 0.11} seed={`coin-${k}`} />;
          case "comicPops":         return <ComicPops key={k} durationInFrames={d} seed={`cp-${k}`} />;
          case "heartBurst":        return <HeartBurst key={k} durationInFrames={d} color={fx.color ?? "#ff6b9d"} count={fx.count ?? 14} opacity={fx.opacity ?? 0.55} />;
          case "speechBubble":      return <SpeechBubble key={k} durationInFrames={d} text={fx.text ?? "♥"} x={fx.x ?? 0.5} y={fx.y ?? 0.35} color={fx.color ?? "#ff8fa3"} opacity={fx.opacity ?? 0.55} />;
          case "emojiRain":         return <EmojiRain key={k} durationInFrames={d} emojis={fx.emojis} count={fx.count ?? 16} opacity={fx.opacity ?? 0.55} />;
          case "starFill":          return <StarFill key={k} durationInFrames={d} color={fx.color ?? "#ffe066"} count={fx.count ?? 12} opacity={fx.opacity ?? 0.55} />;
          case "thumbBounce":       return <ThumbBounce key={k} durationInFrames={d} count={fx.count ?? 6} opacity={fx.opacity ?? 0.55} />;
          case "applause":          return <Applause key={k} durationInFrames={d} color={fx.color ?? "#ffe566"} count={fx.count ?? 20} opacity={fx.opacity ?? 0.55} />;
          // ── nature ──────────────────────────────────────────────────────────
          case "rain":              return <Rain key={k} durationInFrames={d} count={fx.count ?? 80} color={fx.color ?? "#a8c8ff"} opacity={fx.opacity ?? 0.4} heavy={fx.heavy ?? false} />;
          case "snow2":             return <Snow2 key={k} durationInFrames={d} count={fx.count ?? 50} color={fx.color ?? "#e8f4ff"} opacity={fx.opacity ?? 0.5} />;
          case "thunder":           return <Thunder key={k} durationInFrames={d} color={fx.color ?? "#c8e8ff"} opacity={fx.opacity ?? 0.55} strikes={fx.strikes ?? 3} />;
          case "clouds":            return <Clouds key={k} durationInFrames={d} color={fx.color ?? "#fff"} count={fx.count ?? 5} opacity={fx.opacity ?? 0.3} />;
          case "wind":              return <Wind key={k} durationInFrames={d} color={fx.color ?? "#aaddff"} lines={fx.lines ?? 12} opacity={fx.opacity ?? 0.35} />;
          case "waterWave":         return <WaterWave key={k} durationInFrames={d} color={fx.color ?? "#4499dd"} waveCount={fx.waveCount ?? 4} opacity={fx.opacity ?? 0.35} startY={fx.startY ?? 0.65} />;
          case "sunrays":           return <Sunrays key={k} durationInFrames={d} color={fx.color ?? "#ffe87a"} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.15} rayCount={fx.rayCount ?? 14} opacity={fx.opacity ?? 0.45} />;
          case "aurora":            return <Aurora key={k} durationInFrames={d} color1={fx.color1 ?? "#00ff88"} color2={fx.color2 ?? "#8844ff"} opacity={fx.opacity ?? 0.4} />;
          case "fog":               return <Fog key={k} durationInFrames={d} color={fx.color ?? "#ddeeff"} opacity={fx.opacity ?? 0.35} density={fx.density ?? 1} />;
          case "campFire":          return <CampFire key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.75} opacity={fx.opacity ?? 0.5} size={fx.size ?? 60} />;
          case "moonGlow":          return <MoonGlow key={k} durationInFrames={d} cx={fx.cx ?? 0.82} cy={fx.cy ?? 0.12} color={fx.color ?? "#e8f0ff"} opacity={fx.opacity ?? 0.5} phase={fx.phase ?? 0.75} />;
          case "tornado":           return <Tornado key={k} durationInFrames={d} cx={fx.cx ?? 0.5} color={fx.color ?? "#aaccdd"} opacity={fx.opacity ?? 0.4} />;
          // ── cinematic ───────────────────────────────────────────────────────
          case "letterbox":         return <Letterbox key={k} durationInFrames={d} barRatio={fx.barRatio ?? 0.1} color={fx.color ?? "#000"} opacity={fx.opacity ?? 1} />;
          case "filmBurn":          return <FilmBurn key={k} durationInFrames={d} color={fx.color ?? "#ff6622"} opacity={fx.opacity ?? 0.45} />;
          case "lensFlare":         return <LensFlare key={k} durationInFrames={d} cx={fx.cx ?? 0.2} cy={fx.cy ?? 0.15} color={fx.color ?? "#fff8cc"} opacity={fx.opacity ?? 0.55} />;
          case "chromaShift":       return <ChromaShift key={k} durationInFrames={d} intensity={fx.intensity ?? 8} opacity={fx.opacity ?? 0.55} />;
          case "oldFilm":           return <OldFilm key={k} durationInFrames={d} opacity={fx.opacity ?? 0.45} />;
          case "anamorphic":        return <Anamorphic key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.4} color={fx.color ?? "#88ccff"} opacity={fx.opacity ?? 0.45} />;
          case "splitTone":         return <SplitTone key={k} durationInFrames={d} shadowColor={fx.shadowColor ?? "#1a0a3e"} highlightColor={fx.highlightColor ?? "#fff5cc"} opacity={fx.opacity ?? 0.3} />;
          case "flickerCut":        return <FlickerCut key={k} durationInFrames={d} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.4} rate={fx.rate ?? 3} />;
          case "drunkZoom":         return <DrunkZoom key={k} durationInFrames={d} intensity={fx.intensity ?? 0.06} opacity={fx.opacity ?? 0.35} />;
          case "dirtyLens":         return <DirtyLens key={k} durationInFrames={d} spotCount={fx.spotCount ?? 8} color={fx.color ?? "#88aacc"} opacity={fx.opacity ?? 0.2} />;
          case "magazineCover":     return <MagazineCover key={k} durationInFrames={d} color={fx.color ?? "#c8a050"} thickness={fx.thickness ?? 12} opacity={fx.opacity ?? 0.7} />;
          case "slowMotionBlur":    return <SlowMotionBlur key={k} durationInFrames={d} direction={fx.direction as any ?? "h"} blur={fx.intensity ?? 15} opacity={fx.opacity ?? 0.4} />;
          // ── celebration ─────────────────────────────────────────────────────
          case "fireworks":         return <Fireworks key={k} durationInFrames={d} count={fx.count ?? 4} opacity={fx.opacity ?? 0.55} />;
          case "balloons":          return <Balloons key={k} durationInFrames={d} count={fx.count ?? 8} opacity={fx.opacity ?? 0.55} />;
          case "goldRain":          return <GoldRain key={k} durationInFrames={d} count={fx.count ?? 35} color={fx.color ?? "#ffd700"} opacity={fx.opacity ?? 0.55} />;
          case "ribbon":            return <Ribbon key={k} durationInFrames={d} count={fx.count ?? 8} opacity={fx.opacity ?? 0.5} />;
          case "champagne":         return <Champagne key={k} durationInFrames={d} count={fx.count ?? 40} color={fx.color ?? "#ffeeaa"} opacity={fx.opacity ?? 0.5} />;
          case "birthdayFlag":      return <BirthdayFlag key={k} durationInFrames={d} flagCount={fx.flagCount ?? 8} opacity={fx.opacity ?? 0.7} y={fx.y ?? 0.08} />;
          case "streamerDrop":      return <StreamerDrop key={k} durationInFrames={d} count={fx.count ?? 10} opacity={fx.opacity ?? 0.55} />;
          case "cakeSparkle":       return <CakeSparkle key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.65} color={fx.color ?? "#ffe566"} opacity={fx.opacity ?? 0.55} />;
          case "pomPom":            return <PomPom key={k} durationInFrames={d} count={fx.count ?? 3} opacity={fx.opacity ?? 0.55} />;
          case "giftBox":           return <GiftBox key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#ff6b9d"} ribbon={fx.ribbon ?? "#ffe066"} opacity={fx.opacity ?? 0.7} />;
          case "paperCuts":         return <PaperCuts key={k} durationInFrames={d} count={fx.count ?? 25} opacity={fx.opacity ?? 0.55} />;
          case "confetti2":         return <Confetti2 key={k} durationInFrames={d} count={fx.count ?? 50} opacity={fx.opacity ?? 0.55} />;
          // ── text ────────────────────────────────────────────────────────────
          case "typeOn":            return <TypeOn key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 36} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.9} />;
          case "waveText":          return <WaveText key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 38} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.9} />;
          case "glowTitle":         return <GlowTitle key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.1} fontSize={fx.fontSize ?? 48} color={fx.color ?? "#fff"} glowColor={fx.glowColor ?? "#ff88cc"} opacity={fx.opacity ?? 0.9} />;
          case "floatWords":        return <FloatWords key={k} durationInFrames={d} words={fx.words} color={fx.color ?? "#ff88cc"} opacity={fx.opacity ?? 0.5} />;
          case "neonFlicker":       return <NeonFlicker key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.12} fontSize={fx.fontSize ?? 52} color={fx.color ?? "#ff44aa"} opacity={fx.opacity ?? 0.9} />;
          case "gradientTitle":     return <GradientTitle key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.1} fontSize={fx.fontSize ?? 52} color1={fx.color1 ?? "#ff6b9d"} color2={fx.color2 ?? "#ffeaa7"} opacity={fx.opacity ?? 0.95} />;
          case "sparkleText":       return <SparkleText key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 38} color={fx.color ?? "#fff"} sparkleColor={fx.accentColor ?? "#ffe566"} opacity={fx.opacity ?? 0.9} />;
          case "karaokeBar":        return <KaraokeBar key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 38} baseColor={fx.baseColor ?? "#ccc"} highlightColor={fx.highlightColor ?? "#ffe566"} opacity={fx.opacity ?? 0.95} />;
          case "scatterWords":      return <ScatterWords key={k} durationInFrames={d} words={fx.words} color={fx.color ?? "#ff88cc"} opacity={fx.opacity ?? 0.55} />;
          case "shadowStack":       return <ShadowStack key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 44} color={fx.color ?? "#fff"} shadowColor={fx.shadowColor ?? "#ff44aa"} opacity={fx.opacity ?? 0.9} layers={fx.layers ?? 4} />;
          case "bubbleText":        return <BubbleText key={k} durationInFrames={d} text={fx.text ?? "..."} x={fx.x ?? 0.5} y={fx.y ?? 0.88} fontSize={fx.fontSize ?? 32} bgColor={fx.bgColor ?? "#ff6b9d"} textColor={fx.textColor ?? "#fff"} opacity={fx.opacity ?? 0.9} />;
          case "watermarkPulse":    return <WatermarkPulse key={k} durationInFrames={d} text={fx.text ?? "@品牌"} x={fx.x ?? 0.92} y={fx.y ?? 0.05} fontSize={fx.fontSize ?? 22} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.35} />;
          // ── sticker ─────────────────────────────────────────────────────────
          case "rainbowArc":        return <RainbowArc key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.65} r={fx.radius ?? 0.35} opacity={fx.opacity ?? 0.55} />;
          case "flowerSticker":     return <FlowerSticker key={k} durationInFrames={d} count={fx.count ?? 6} color={fx.color ?? "#ff88cc"} opacity={fx.opacity ?? 0.6} />;
          case "cloudPuff":         return <CloudPuff key={k} durationInFrames={d} count={fx.count ?? 4} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.55} />;
          case "heartSticker":      return <HeartSticker key={k} durationInFrames={d} count={fx.count ?? 8} opacity={fx.opacity ?? 0.55} />;
          case "bowRibbon":         return <BowRibbon key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.08} color={fx.color ?? "#ff6b9d"} opacity={fx.opacity ?? 0.7} size={fx.size ?? 60} />;
          case "crownFloat":        return <CrownFloat key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.08} color={fx.color ?? "#ffd700"} opacity={fx.opacity ?? 0.8} size={fx.size ?? 55} />;
          case "starSticker":       return <StarSticker key={k} durationInFrames={d} count={fx.count ?? 10} opacity={fx.opacity ?? 0.6} />;
          case "pawPrint":          return <PawPrint key={k} durationInFrames={d} count={fx.count ?? 6} color={fx.color ?? "#ff88cc"} opacity={fx.opacity ?? 0.5} />;
          case "musicNote":         return <MusicNote key={k} durationInFrames={d} count={fx.count ?? 8} color={fx.color ?? "#aa66ff"} opacity={fx.opacity ?? 0.55} />;
          case "diamondShine":      return <DiamondShine key={k} durationInFrames={d} count={fx.count ?? 8} color={fx.color ?? "#cceeff"} opacity={fx.opacity ?? 0.6} />;
          case "bubble":            return <Bubble key={k} durationInFrames={d} count={fx.count ?? 12} color={fx.color ?? "#aaddff"} opacity={fx.opacity ?? 0.45} />;
          case "cherryBlossom":     return <CherryBlossom key={k} durationInFrames={d} count={fx.count ?? 15} color={fx.color ?? "#ffb7c5"} opacity={fx.opacity ?? 0.6} />;
          // ── distortion ──────────────────────────────────────────────────────
          case "glitch":            return <Glitch key={k} durationInFrames={d} intensity={fx.intensity ?? 20} opacity={fx.opacity ?? 0.55} rate={fx.rate ?? 3} />;
          case "tvNoise":           return <TVNoise key={k} durationInFrames={d} opacity={fx.opacity ?? 0.25} scanlines={fx.scanlines ?? true} />;
          case "ripple":            return <Ripple key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#88aaff"} opacity={fx.opacity ?? 0.4} speed={fx.rate ?? 1} />;
          case "warpWave":          return <WarpWave key={k} durationInFrames={d} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.35} amplitude={fx.amplitude ?? 15} />;
          case "vhsTracking":       return <VHSTracking key={k} durationInFrames={d} opacity={fx.opacity ?? 0.4} />;
          case "pixelate":          return <Pixelate key={k} durationInFrames={d} pixelSize={fx.pixelSize ?? 24} color={fx.color ?? "#224488"} opacity={fx.opacity ?? 0.2} />;
          case "invertFlash":       return <InvertFlash key={k} durationInFrames={d} opacity={fx.opacity ?? 0.3} flashes={fx.flashes ?? 3} />;
          case "mirror":            return <Mirror key={k} durationInFrames={d} axis={fx.axis ?? "h"} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.3} />;
          case "stretch":           return <Stretch key={k} durationInFrames={d} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.25} direction={fx.direction as any ?? "h"} />;
          case "zoomBlur":          return <ZoomBlur key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.3} rings={fx.rings ?? 5} />;
          case "shake":             return <Shake key={k} durationInFrames={d} intensity={fx.intensity ?? 12} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.15} />;
          case "chromaticAberration": return <ChromaticAberration key={k} durationInFrames={d} intensity={fx.intensity ?? 6} opacity={fx.opacity ?? 0.45} />;
          // ── frame ───────────────────────────────────────────────────────────
          case "goldFrame":         return <GoldFrame key={k} durationInFrames={d} thickness={fx.thickness ?? 18} color={fx.color ?? "#c8a050"} opacity={fx.opacity ?? 0.8} />;
          case "floralBorder":      return <FloralBorder key={k} durationInFrames={d} color={fx.color ?? "#ff88cc"} count={fx.count ?? 20} opacity={fx.opacity ?? 0.6} />;
          case "polaroidFrame":     return <PolaroidFrame key={k} durationInFrames={d} color={fx.color ?? "#fff"} bottomPad={fx.bottomPad ?? 70} opacity={fx.opacity ?? 0.9} />;
          case "filmStrip":         return <FilmStrip key={k} durationInFrames={d} color={fx.color ?? "#111"} opacity={fx.opacity ?? 0.85} holeCount={fx.holeCount ?? 8} />;
          case "roundedVignette":   return <RoundedVignette key={k} durationInFrames={d} color={fx.color ?? "#000"} opacity={fx.opacity ?? 0.5} radius={fx.radius ?? 0.35} />;
          case "scrapbookBorder":   return <ScrapbookBorder key={k} durationInFrames={d} color={fx.color ?? "#ffe0ee"} accent={fx.accentColor ?? "#ff88cc"} opacity={fx.opacity ?? 0.8} />;
          case "waveFrame":         return <WaveFrame key={k} durationInFrames={d} color={fx.color ?? "#aaddff"} opacity={fx.opacity ?? 0.55} depth={fx.depth ?? 30} />;
          case "doubleLine":        return <DoubleLine key={k} durationInFrames={d} color={fx.color ?? "#c8a050"} opacity={fx.opacity ?? 0.7} gap={fx.gap ?? 8} thickness={fx.thickness ?? 3} />;
          case "diamondCorners":    return <DiamondCorners key={k} durationInFrames={d} color={fx.color ?? "#c8a050"} size={fx.size ?? 40} opacity={fx.opacity ?? 0.8} />;
          case "vintageStamp":      return <VintageStamp key={k} durationInFrames={d} color={fx.color ?? "#d4a030"} teeth={fx.teeth ?? 30} opacity={fx.opacity ?? 0.7} />;
          case "dotBorder":         return <DotBorder key={k} durationInFrames={d} color={fx.color ?? "#ff88cc"} dotSize={fx.dotSize ?? 6} gap={fx.gap ?? 16} opacity={fx.opacity ?? 0.65} />;
          case "glowBorder":        return <GlowBorder key={k} durationInFrames={d} color={fx.color ?? "#ff88cc"} thickness={fx.thickness ?? 20} opacity={fx.opacity ?? 0.6} />;
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
        <EffectsLayer effects={beat.effects} imgW={meta.width} imgH={bandTop} durationInFrames={dur} />
      </div>

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
    case "slide-left": return slide({ direction: "from-right" });
    case "slide-up":   return slide({ direction: "from-bottom" });
    case "wipe":       return wipe({ direction: "from-left" });
    default:           return fade();
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
