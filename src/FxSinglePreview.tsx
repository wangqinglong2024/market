/**
 * 单效果预览组件 — Root.tsx 为每个效果注册独立 Composition
 * id 格式: fx-<category>-<EffectName>
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

// ── atmosphere ──────────────────────────────────────────────────────────────
import { BackdropParallax } from "./fx/atmosphere/BackdropParallax";
import { Bokeh } from "./fx/atmosphere/Bokeh";
import { ColorPulse } from "./fx/atmosphere/ColorPulse";
import { CornerBloom } from "./fx/atmosphere/CornerBloom";
import { DualLight } from "./fx/atmosphere/DualLight";
import { FilmGrain } from "./fx/atmosphere/FilmGrain";
import { HeatShimmer } from "./fx/atmosphere/HeatShimmer";
import { LightLeak } from "./fx/atmosphere/LightLeak";
import { NightBloom } from "./fx/atmosphere/NightBloom";
import { SweepBeam } from "./fx/atmosphere/SweepBeam";
import { Vignette } from "./fx/atmosphere/Vignette";
import { WarmGlow } from "./fx/atmosphere/WarmGlow";
// ── particles ───────────────────────────────────────────────────────────────
import { Bubbles } from "./fx/particles/Bubbles";
import { Butterflies } from "./fx/particles/Butterflies";
import { Confetti } from "./fx/particles/Confetti";
import { Fireflies } from "./fx/particles/Fireflies";
import { Leaves } from "./fx/particles/Leaves";
import { Raindrops } from "./fx/particles/Raindrops";
import { Sakura } from "./fx/particles/Sakura";
import { ShootingStars } from "./fx/particles/ShootingStars";
import { Snow } from "./fx/particles/Snow";
import { Sparkles } from "./fx/particles/Sparkles";
import { StarDust } from "./fx/particles/StarDust";
import { ThreeParticles } from "./fx/particles/ThreeParticles";
// ── geometry ─────────────────────────────────────────────────────────────────
import { CornerFrame } from "./fx/geometry/CornerFrame";
import { DiamondBurst } from "./fx/geometry/DiamondBurst";
import { FocusLines } from "./fx/geometry/FocusLines";
import { GridFlash } from "./fx/geometry/GridFlash";
import { HexGrid } from "./fx/geometry/HexGrid";
import { Mandala } from "./fx/geometry/Mandala";
import { PulseCircle } from "./fx/geometry/PulseCircle";
import { RippleRings } from "./fx/geometry/RippleRings";
import { RotatingRays } from "./fx/geometry/RotatingRays";
import { SpiralGrow } from "./fx/geometry/SpiralGrow";
import { StarBurst } from "./fx/geometry/StarBurst";
import { TrianglePop } from "./fx/geometry/TrianglePop";
// ── reveal ───────────────────────────────────────────────────────────────────
import { BlurReveal } from "./fx/reveal/BlurReveal";
import { BrushReveal } from "./fx/reveal/BrushReveal";
import { CircleMask } from "./fx/reveal/CircleMask";
import { CurtainOpen } from "./fx/reveal/CurtainOpen";
import { DiagonalWipe } from "./fx/reveal/DiagonalWipe";
import { FadeRays } from "./fx/reveal/FadeRays";
import { IrisReveal } from "./fx/reveal/IrisReveal";
import { PathDraw } from "./fx/reveal/PathDraw";
import { PixelDissolve } from "./fx/reveal/PixelDissolve";
import { ScaleReveal } from "./fx/reveal/ScaleReveal";
import { SliceReveal } from "./fx/reveal/SliceReveal";
import { SweepReveal } from "./fx/reveal/SweepReveal";
// ── emotion ──────────────────────────────────────────────────────────────────
import { Applause } from "./fx/emotion/Applause";
import { CoinFountain } from "./fx/emotion/CoinFountain";
import { ComicPops } from "./fx/emotion/ComicPops";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { Emotes } from "./fx/emotion/Emotes";
import { FloatingIcons } from "./fx/emotion/FloatingIcons";
import { HeartBurst } from "./fx/emotion/HeartBurst";
import { LevelBanner } from "./fx/emotion/LevelBanner";
import { ScorePop } from "./fx/emotion/ScorePop";
import { SpeechBubble } from "./fx/emotion/SpeechBubble";
import { StarFill } from "./fx/emotion/StarFill";
import { ThumbBounce } from "./fx/emotion/ThumbBounce";
// ── nature ───────────────────────────────────────────────────────────────────
import { Aurora } from "./fx/nature/Aurora";
import { CampFire } from "./fx/nature/CampFire";
import { Clouds } from "./fx/nature/Clouds";
import { Fog } from "./fx/nature/Fog";
import { MoonGlow } from "./fx/nature/MoonGlow";
import { Rain } from "./fx/nature/Rain";
import { Snow2 } from "./fx/nature/Snow2";
import { Sunrays } from "./fx/nature/Sunrays";
import { Thunder } from "./fx/nature/Thunder";
import { Tornado } from "./fx/nature/Tornado";
import { WaterWave } from "./fx/nature/WaterWave";
import { Wind } from "./fx/nature/Wind";
// ── cinematic ────────────────────────────────────────────────────────────────
import { Anamorphic } from "./fx/cinematic/Anamorphic";
import { ChromaShift } from "./fx/cinematic/ChromaShift";
import { DirtyLens } from "./fx/cinematic/DirtyLens";
import { DrunkZoom } from "./fx/cinematic/DrunkZoom";
import { FilmBurn } from "./fx/cinematic/FilmBurn";
import { FlickerCut } from "./fx/cinematic/FlickerCut";
import { LensFlare } from "./fx/cinematic/LensFlare";
import { Letterbox } from "./fx/cinematic/Letterbox";
import { MagazineCover } from "./fx/cinematic/MagazineCover";
import { OldFilm } from "./fx/cinematic/OldFilm";
import { SlowMotionBlur } from "./fx/cinematic/SlowMotionBlur";
import { SplitTone } from "./fx/cinematic/SplitTone";
// ── celebration ──────────────────────────────────────────────────────────────
import { Balloons } from "./fx/celebration/Balloons";
import { BirthdayFlag } from "./fx/celebration/BirthdayFlag";
import { CakeSparkle } from "./fx/celebration/CakeSparkle";
import { Champagne } from "./fx/celebration/Champagne";
import { Confetti2 } from "./fx/celebration/Confetti2";
import { Fireworks } from "./fx/celebration/Fireworks";
import { GiftBox } from "./fx/celebration/GiftBox";
import { GoldRain } from "./fx/celebration/GoldRain";
import { PaperCuts } from "./fx/celebration/PaperCuts";
import { PomPom } from "./fx/celebration/PomPom";
import { Ribbon } from "./fx/celebration/Ribbon";
import { StreamerDrop } from "./fx/celebration/StreamerDrop";
// ── text ─────────────────────────────────────────────────────────────────────
import { BubbleText } from "./fx/text/BubbleText";
import { FloatWords } from "./fx/text/FloatWords";
import { GlowTitle } from "./fx/text/GlowTitle";
import { GradientTitle } from "./fx/text/GradientTitle";
import { KaraokeBar } from "./fx/text/KaraokeBar";
import { NeonFlicker } from "./fx/text/NeonFlicker";
import { ScatterWords } from "./fx/text/ScatterWords";
import { ShadowStack } from "./fx/text/ShadowStack";
import { SparkleText } from "./fx/text/SparkleText";
import { TypeOn } from "./fx/text/TypeOn";
import { WatermarkPulse } from "./fx/text/WatermarkPulse";
import { WaveText } from "./fx/text/WaveText";
// ── sticker ──────────────────────────────────────────────────────────────────
import { BowRibbon } from "./fx/sticker/BowRibbon";
import { Bubble } from "./fx/sticker/Bubble";
import { CherryBlossom } from "./fx/sticker/CherryBlossom";
import { CloudPuff } from "./fx/sticker/CloudPuff";
import { CrownFloat } from "./fx/sticker/CrownFloat";
import { DiamondShine } from "./fx/sticker/DiamondShine";
import { FlowerSticker } from "./fx/sticker/FlowerSticker";
import { HeartSticker } from "./fx/sticker/HeartSticker";
import { MusicNote } from "./fx/sticker/MusicNote";
import { PawPrint } from "./fx/sticker/PawPrint";
import { RainbowArc } from "./fx/sticker/RainbowArc";
import { StarSticker } from "./fx/sticker/StarSticker";
// ── distortion ───────────────────────────────────────────────────────────────
import { ChromaticAberration } from "./fx/distortion/ChromaticAberration";
import { Glitch } from "./fx/distortion/Glitch";
import { InvertFlash } from "./fx/distortion/InvertFlash";
import { Mirror } from "./fx/distortion/Mirror";
import { Pixelate } from "./fx/distortion/Pixelate";
import { Ripple } from "./fx/distortion/Ripple";
import { Shake } from "./fx/distortion/Shake";
import { Stretch } from "./fx/distortion/Stretch";
import { TVNoise } from "./fx/distortion/TVNoise";
import { VHSTracking } from "./fx/distortion/VHSTracking";
import { WarpWave } from "./fx/distortion/WarpWave";
import { ZoomBlur } from "./fx/distortion/ZoomBlur";
// ── frame ─────────────────────────────────────────────────────────────────────
import { DiamondCorners } from "./fx/frame/DiamondCorners";
import { DotBorder } from "./fx/frame/DotBorder";
import { DoubleLine } from "./fx/frame/DoubleLine";
import { FilmStrip } from "./fx/frame/FilmStrip";
import { FloralBorder } from "./fx/frame/FloralBorder";
import { GlowBorder } from "./fx/frame/GlowBorder";
import { GoldFrame } from "./fx/frame/GoldFrame";
import { PolaroidFrame } from "./fx/frame/PolaroidFrame";
import { RoundedVignette } from "./fx/frame/RoundedVignette";
import { ScrapbookBorder } from "./fx/frame/ScrapbookBorder";
import { VintageStamp } from "./fx/frame/VintageStamp";
import { WaveFrame } from "./fx/frame/WaveFrame";

export type FxSinglePreviewProps = {
  category: string;
  name: string;
  bgColor?: string;
};

type RenderFn = (d: number) => React.ReactNode;

// 每个 key = "category/EffectName"，值 = 渲染函数
const EFFECT_MAP: Record<string, RenderFn> = {
  // ── atmosphere ──────────────────────────────────────────
  "atmosphere/BackdropParallax": () => <BackdropParallax key="e" seed="prev" />,
  "atmosphere/Bokeh": (d) => <Bokeh key="e" durationInFrames={d} count={6} color="#ffd54f" opacity={0.35} seed="prev" />,
  "atmosphere/ColorPulse": (d) => <ColorPulse key="e" durationInFrames={d} color="#ffe566" accentColor="#ff88cc" opacity={0.25} />,
  "atmosphere/CornerBloom": (d) => <CornerBloom key="e" durationInFrames={d} color="#ffd700" opacity={0.4} />,
  "atmosphere/DualLight": (d) => <DualLight key="e" durationInFrames={d} color1="#ffe566" color2="#a8edff" opacity={0.3} />,
  "atmosphere/FilmGrain": (d) => <FilmGrain key="e" durationInFrames={d} opacity={0.15} />,
  "atmosphere/HeatShimmer": (d) => <HeatShimmer key="e" durationInFrames={d} color="#ff8c42" startY={0.45} opacity={0.3} />,
  "atmosphere/LightLeak": () => <LightLeak key="e" intensity={0.5} color="#ffe566" />,
  "atmosphere/NightBloom": (d) => <NightBloom key="e" durationInFrames={d} starCount={30} opacity={0.55} />,
  "atmosphere/SweepBeam": (d) => <SweepBeam key="e" durationInFrames={d} color="#fff8cc" opacity={0.38} />,
  "atmosphere/Vignette": (d) => <Vignette key="e" durationInFrames={d} color="#000" opacity={0.5} pulse />,
  "atmosphere/WarmGlow": (d) => <WarmGlow key="e" durationInFrames={d} color="#ffb347" cx={0.5} cy={0.42} opacity={0.35} />,
  // ── particles ────────────────────────────────────────────
  "particles/Bubbles": () => <Bubbles key="e" />,
  "particles/Butterflies": () => <Butterflies key="e" />,
  "particles/Confetti": () => <Confetti key="e" />,
  "particles/Fireflies": (d) => <Fireflies key="e" durationInFrames={d} count={20} color="#aaff66" opacity={0.55} />,
  "particles/Leaves": (d) => <Leaves key="e" durationInFrames={d} count={18} color="#88cc44" opacity={0.5} />,
  "particles/Raindrops": (d) => <Raindrops key="e" durationInFrames={d} count={60} color="#aaccff" opacity={0.4} />,
  "particles/Sakura": () => <Sakura key="e" count={30} originX={0.5} originY={0.4} seed="prev" />,
  "particles/ShootingStars": (d) => <ShootingStars key="e" durationInFrames={d} every={1} angleDeg={28} seed="prev" />,
  "particles/Snow": (d) => <Snow key="e" durationInFrames={d} count={40} opacity={0.55} />,
  "particles/Sparkles": () => <Sparkles key="e" seed="prev" />,
  "particles/StarDust": (d) => <StarDust key="e" durationInFrames={d} count={50} color="#ffee88" opacity={0.55} />,
  "particles/ThreeParticles": () => <ThreeParticles key="e" width={1080} height={1920} variant="bokeh" seed="prev" />,
  // ── geometry ─────────────────────────────────────────────
  "geometry/CornerFrame": (d) => <CornerFrame key="e" durationInFrames={d} color="#d4a0ff" accentColor="#ff88cc" strokeWidth={5} />,
  "geometry/DiamondBurst": (d) => <DiamondBurst key="e" durationInFrames={d} color="#ffe4f0" count={10} opacity={0.45} />,
  "geometry/FocusLines": () => <FocusLines key="e" count={20} />,
  "geometry/GridFlash": (d) => <GridFlash key="e" durationInFrames={d} color="#88ffcc" cols={6} rows={9} opacity={0.25} />,
  "geometry/HexGrid": (d) => <HexGrid key="e" durationInFrames={d} color="#88ccff" opacity={0.2} cols={8} />,
  "geometry/Mandala": (d) => <Mandala key="e" durationInFrames={d} petals={8} color="#d4a0ff" opacity={0.4} />,
  "geometry/PulseCircle": (d) => <PulseCircle key="e" durationInFrames={d} color="#ff9dd6" rings={4} opacity={0.45} />,
  "geometry/RippleRings": (d) => <RippleRings key="e" durationInFrames={d} color="#f48fb1" opacity={0.4} />,
  "geometry/RotatingRays": (d) => <RotatingRays key="e" durationInFrames={d} color="#fff5cc" opacity={0.3} rpm={4} />,
  "geometry/SpiralGrow": (d) => <SpiralGrow key="e" durationInFrames={d} color="#c4a0ff" turns={4} opacity={0.4} />,
  "geometry/StarBurst": (d) => <StarBurst key="e" durationInFrames={d} count={8} />,
  "geometry/TrianglePop": (d) => <TrianglePop key="e" durationInFrames={d} color="#ffb3d1" count={10} opacity={0.45} />,
  // ── reveal ───────────────────────────────────────────────
  "reveal/BlurReveal": (d) => <BlurReveal key="e" durationInFrames={d} maxBlur={20} opacity={0.5} />,
  "reveal/BrushReveal": (d) => <BrushReveal key="e" durationInFrames={d} color="#ffe0ee" strokes={5} opacity={0.7} />,
  "reveal/CircleMask": (d) => <CircleMask key="e" durationInFrames={d} cx={0.5} cy={0.5} color="#000" opacity={0.85} />,
  "reveal/CurtainOpen": (d) => <CurtainOpen key="e" durationInFrames={d} color="#c8506a" opacity={0.9} />,
  "reveal/DiagonalWipe": (d) => <DiagonalWipe key="e" durationInFrames={d} color="#ffe0f0" opacity={0.6} />,
  "reveal/FadeRays": (d) => <FadeRays key="e" durationInFrames={d} color="#fff8e7" opacity={0.4} />,
  "reveal/IrisReveal": (d) => <IrisReveal key="e" durationInFrames={d} sides={6} color="#1a0a3e" opacity={0.85} />,
  "reveal/PathDraw": (d) => (
    <PathDraw key="e" durationInFrames={d} opacity={0.75} paths={[
      { d: "M 200 400 Q 540 200 880 400", color: "#ff88cc", strokeWidth: 6 },
      { d: "M 200 600 Q 540 800 880 600", color: "#ffd700", strokeWidth: 6 },
    ]} />
  ),
  "reveal/PixelDissolve": (d) => <PixelDissolve key="e" durationInFrames={d} color="#1a0a2e" pixelSize={30} opacity={1} />,
  "reveal/ScaleReveal": (d) => <ScaleReveal key="e" durationInFrames={d} color="#fff" opacity={0.6} />,
  "reveal/SliceReveal": (d) => <SliceReveal key="e" durationInFrames={d} slices={8} color="#1a1a2e" opacity={1} />,
  "reveal/SweepReveal": (d) => <SweepReveal key="e" durationInFrames={d} direction="left" color="#fff" opacity={0.6} />,
  // ── emotion ──────────────────────────────────────────────
  "emotion/Applause": (d) => <Applause key="e" durationInFrames={d} color="#ffe566" count={20} opacity={0.55} />,
  "emotion/CoinFountain": (d) => <CoinFountain key="e" durationInFrames={d} seed="prev" />,
  "emotion/ComicPops": (d) => <ComicPops key="e" durationInFrames={d} seed="prev" words={["哇", "太美了", "♥", "棒"]} />,
  "emotion/EmojiRain": (d) => <EmojiRain key="e" durationInFrames={d} count={16} opacity={0.55} />,
  "emotion/Emotes": () => <Emotes key="e" count={8} seed="prev" />,
  "emotion/FloatingIcons": () => <FloatingIcons key="e" count={10} seed="prev" />,
  "emotion/HeartBurst": (d) => <HeartBurst key="e" durationInFrames={d} color="#ff6b9d" count={14} opacity={0.55} />,
  "emotion/LevelBanner": () => <LevelBanner key="e" text="✨ 太美了 ✨" />,
  "emotion/ScorePop": (d) => <ScorePop key="e" durationInFrames={d} count={5} />,
  "emotion/SpeechBubble": (d) => <SpeechBubble key="e" durationInFrames={d} text="♥ 好美" x={0.5} y={0.35} color="#ff8fa3" opacity={0.9} />,
  "emotion/StarFill": (d) => <StarFill key="e" durationInFrames={d} color="#ffe066" count={12} opacity={0.55} />,
  "emotion/ThumbBounce": (d) => <ThumbBounce key="e" durationInFrames={d} count={6} opacity={0.55} />,
  // ── nature ───────────────────────────────────────────────
  "nature/Aurora": (d) => <Aurora key="e" durationInFrames={d} color1="#00ff88" color2="#8844ff" opacity={0.4} />,
  "nature/CampFire": (d) => <CampFire key="e" durationInFrames={d} cx={0.5} cy={0.7} opacity={0.55} size={80} />,
  "nature/Clouds": (d) => <Clouds key="e" durationInFrames={d} color="#fff" count={5} opacity={0.35} />,
  "nature/Fog": (d) => <Fog key="e" durationInFrames={d} color="#ddeeff" opacity={0.35} density={1} />,
  "nature/MoonGlow": (d) => <MoonGlow key="e" durationInFrames={d} cx={0.82} cy={0.12} color="#e8f0ff" opacity={0.55} />,
  "nature/Rain": (d) => <Rain key="e" durationInFrames={d} count={80} color="#a8c8ff" opacity={0.4} />,
  "nature/Snow2": (d) => <Snow2 key="e" durationInFrames={d} count={50} color="#e8f4ff" opacity={0.5} />,
  "nature/Sunrays": (d) => <Sunrays key="e" durationInFrames={d} cx={0.5} cy={0.12} color="#ffe87a" rayCount={14} opacity={0.45} />,
  "nature/Thunder": (d) => <Thunder key="e" durationInFrames={d} color="#c8e8ff" opacity={0.55} strikes={3} />,
  "nature/Tornado": (d) => <Tornado key="e" durationInFrames={d} cx={0.5} color="#aaccdd" opacity={0.4} />,
  "nature/WaterWave": (d) => <WaterWave key="e" durationInFrames={d} color="#4499dd" waveCount={4} opacity={0.35} startY={0.6} />,
  "nature/Wind": (d) => <Wind key="e" durationInFrames={d} color="#aaddff" lines={12} opacity={0.35} />,
  // ── cinematic ────────────────────────────────────────────
  "cinematic/Anamorphic": (d) => <Anamorphic key="e" durationInFrames={d} cx={0.5} cy={0.4} color="#88ccff" opacity={0.45} />,
  "cinematic/ChromaShift": (d) => <ChromaShift key="e" durationInFrames={d} intensity={8} opacity={0.55} />,
  "cinematic/DirtyLens": (d) => <DirtyLens key="e" durationInFrames={d} spotCount={8} color="#88aacc" opacity={0.25} />,
  "cinematic/DrunkZoom": (d) => <DrunkZoom key="e" durationInFrames={d} intensity={0.06} opacity={0.4} />,
  "cinematic/FilmBurn": (d) => <FilmBurn key="e" durationInFrames={d} color="#ff6622" opacity={0.5} />,
  "cinematic/FlickerCut": (d) => <FlickerCut key="e" durationInFrames={d} color="#fff" opacity={0.45} rate={3} />,
  "cinematic/LensFlare": (d) => <LensFlare key="e" durationInFrames={d} cx={0.2} cy={0.15} color="#fff8cc" opacity={0.55} />,
  "cinematic/Letterbox": (d) => <Letterbox key="e" durationInFrames={d} barRatio={0.1} color="#000" opacity={1} />,
  "cinematic/MagazineCover": (d) => <MagazineCover key="e" durationInFrames={d} color="#c8a050" thickness={12} opacity={0.7} />,
  "cinematic/OldFilm": (d) => <OldFilm key="e" durationInFrames={d} opacity={0.45} />,
  "cinematic/SlowMotionBlur": (d) => <SlowMotionBlur key="e" durationInFrames={d} direction="h" blur={15} opacity={0.4} />,
  "cinematic/SplitTone": (d) => <SplitTone key="e" durationInFrames={d} shadowColor="#1a0a3e" highlightColor="#fff5cc" opacity={0.3} />,
  // ── celebration ──────────────────────────────────────────
  "celebration/Balloons": (d) => <Balloons key="e" durationInFrames={d} count={8} opacity={0.55} />,
  "celebration/BirthdayFlag": (d) => <BirthdayFlag key="e" durationInFrames={d} flagCount={8} opacity={0.7} y={0.08} />,
  "celebration/CakeSparkle": (d) => <CakeSparkle key="e" durationInFrames={d} cx={0.5} cy={0.6} color="#ffe566" opacity={0.55} />,
  "celebration/Champagne": (d) => <Champagne key="e" durationInFrames={d} count={40} color="#ffeeaa" opacity={0.5} />,
  "celebration/Confetti2": (d) => <Confetti2 key="e" durationInFrames={d} count={50} opacity={0.55} />,
  "celebration/Fireworks": (d) => <Fireworks key="e" durationInFrames={d} count={4} opacity={0.55} />,
  "celebration/GiftBox": (d) => <GiftBox key="e" durationInFrames={d} cx={0.5} cy={0.5} color="#ff6b9d" ribbon="#ffe066" opacity={0.75} />,
  "celebration/GoldRain": (d) => <GoldRain key="e" durationInFrames={d} count={35} color="#ffd700" opacity={0.55} />,
  "celebration/PaperCuts": (d) => <PaperCuts key="e" durationInFrames={d} count={25} opacity={0.55} />,
  "celebration/PomPom": (d) => <PomPom key="e" durationInFrames={d} count={3} opacity={0.55} />,
  "celebration/Ribbon": (d) => <Ribbon key="e" durationInFrames={d} count={8} opacity={0.5} />,
  "celebration/StreamerDrop": (d) => <StreamerDrop key="e" durationInFrames={d} count={10} opacity={0.55} />,
  // ── text ─────────────────────────────────────────────────
  "text/BubbleText": (d) => <BubbleText key="e" durationInFrames={d} text="太美了！" x={0.5} y={0.5} fontSize={48} bgColor="#ff6b9d" textColor="#fff" opacity={0.9} />,
  "text/FloatWords": (d) => <FloatWords key="e" durationInFrames={d} words={["爱", "美", "棒", "好", "赞"]} color="#ff88cc" opacity={0.55} />,
  "text/GlowTitle": (d) => <GlowTitle key="e" durationInFrames={d} text="特效库" x={0.5} y={0.45} fontSize={72} glowColor="#ff88cc" opacity={0.9} />,
  "text/GradientTitle": (d) => <GradientTitle key="e" durationInFrames={d} text="特效预览" x={0.5} y={0.45} fontSize={72} color1="#ff6b9d" color2="#ffeaa7" opacity={0.95} />,
  "text/KaraokeBar": (d) => <KaraokeBar key="e" durationInFrames={d} text="美好的一天从这里开始" x={0.5} y={0.88} fontSize={36} highlightColor="#ffe566" opacity={0.95} />,
  "text/NeonFlicker": (d) => <NeonFlicker key="e" durationInFrames={d} text="NEON" x={0.5} y={0.45} fontSize={80} color="#ff44aa" opacity={0.9} />,
  "text/ScatterWords": (d) => <ScatterWords key="e" durationInFrames={d} words={["真的", "太美了", "喜欢", "好棒", "爱了"]} color="#ff88cc" opacity={0.55} />,
  "text/ShadowStack": (d) => <ShadowStack key="e" durationInFrames={d} text="特效库" x={0.5} y={0.45} fontSize={72} color="#fff" shadowColor="#ff44aa" opacity={0.9} layers={4} />,
  "text/SparkleText": (d) => <SparkleText key="e" durationInFrames={d} text="✨ 好美 ✨" x={0.5} y={0.45} fontSize={60} color="#fff" sparkleColor="#ffe566" opacity={0.9} />,
  "text/TypeOn": (d) => <TypeOn key="e" durationInFrames={d} text="这个特效真好看" x={0.5} y={0.45} fontSize={48} color="#fff" opacity={0.9} />,
  "text/WatermarkPulse": (d) => <WatermarkPulse key="e" durationInFrames={d} text="@preview" x={0.92} y={0.05} fontSize={24} color="#fff" opacity={0.4} />,
  "text/WaveText": (d) => <WaveText key="e" durationInFrames={d} text="波浪文字效果" x={0.5} y={0.45} fontSize={56} color="#fff" opacity={0.9} />,
  // ── sticker ──────────────────────────────────────────────
  "sticker/BowRibbon": (d) => <BowRibbon key="e" durationInFrames={d} cx={0.5} cy={0.15} color="#ff6b9d" size={80} opacity={0.8} />,
  "sticker/Bubble": (d) => <Bubble key="e" durationInFrames={d} count={12} color="#aaddff" opacity={0.5} />,
  "sticker/CherryBlossom": (d) => <CherryBlossom key="e" durationInFrames={d} count={15} color="#ffb7c5" opacity={0.65} />,
  "sticker/CloudPuff": (d) => <CloudPuff key="e" durationInFrames={d} count={4} color="#fff" opacity={0.55} />,
  "sticker/CrownFloat": (d) => <CrownFloat key="e" durationInFrames={d} cx={0.5} cy={0.1} color="#ffd700" size={70} opacity={0.85} />,
  "sticker/DiamondShine": (d) => <DiamondShine key="e" durationInFrames={d} count={8} color="#cceeff" opacity={0.65} />,
  "sticker/FlowerSticker": (d) => <FlowerSticker key="e" durationInFrames={d} count={8} color="#ff88cc" opacity={0.65} />,
  "sticker/HeartSticker": (d) => <HeartSticker key="e" durationInFrames={d} count={10} opacity={0.65} />,
  "sticker/MusicNote": (d) => <MusicNote key="e" durationInFrames={d} count={8} color="#aa66ff" opacity={0.6} />,
  "sticker/PawPrint": (d) => <PawPrint key="e" durationInFrames={d} count={6} color="#ff88cc" opacity={0.55} />,
  "sticker/RainbowArc": (d) => <RainbowArc key="e" durationInFrames={d} cx={0.5} cy={0.65} r={0.35} opacity={0.6} />,
  "sticker/StarSticker": (d) => <StarSticker key="e" durationInFrames={d} count={10} opacity={0.65} />,
  // ── distortion ───────────────────────────────────────────
  "distortion/ChromaticAberration": (d) => <ChromaticAberration key="e" durationInFrames={d} intensity={6} opacity={0.45} />,
  "distortion/Glitch": (d) => <Glitch key="e" durationInFrames={d} intensity={20} opacity={0.55} rate={3} />,
  "distortion/InvertFlash": (d) => <InvertFlash key="e" durationInFrames={d} opacity={0.35} flashes={3} />,
  "distortion/Mirror": (d) => <Mirror key="e" durationInFrames={d} axis="h" color="#ffffff" opacity={0.3} />,
  "distortion/Pixelate": (d) => <Pixelate key="e" durationInFrames={d} pixelSize={24} color="#224488" opacity={0.25} />,
  "distortion/Ripple": (d) => <Ripple key="e" durationInFrames={d} cx={0.5} cy={0.5} color="#88aaff" opacity={0.4} />,
  "distortion/Shake": (d) => <Shake key="e" durationInFrames={d} intensity={12} color="#fff" opacity={0.2} />,
  "distortion/Stretch": (d) => <Stretch key="e" durationInFrames={d} color="#fff" direction="h" opacity={0.3} />,
  "distortion/TVNoise": (d) => <TVNoise key="e" durationInFrames={d} opacity={0.3} scanlines />,
  "distortion/VHSTracking": (d) => <VHSTracking key="e" durationInFrames={d} opacity={0.45} />,
  "distortion/WarpWave": (d) => <WarpWave key="e" durationInFrames={d} color="#fff" amplitude={15} opacity={0.35} />,
  "distortion/ZoomBlur": (d) => <ZoomBlur key="e" durationInFrames={d} cx={0.5} cy={0.5} color="#fff" rings={5} opacity={0.3} />,
  // ── frame ────────────────────────────────────────────────
  "frame/DiamondCorners": (d) => <DiamondCorners key="e" durationInFrames={d} color="#c8a050" size={40} opacity={0.85} />,
  "frame/DotBorder": (d) => <DotBorder key="e" durationInFrames={d} color="#ff88cc" dotSize={6} gap={16} opacity={0.7} />,
  "frame/DoubleLine": (d) => <DoubleLine key="e" durationInFrames={d} color="#c8a050" opacity={0.7} gap={8} thickness={3} />,
  "frame/FilmStrip": (d) => <FilmStrip key="e" durationInFrames={d} color="#111" opacity={0.9} holeCount={8} />,
  "frame/FloralBorder": (d) => <FloralBorder key="e" durationInFrames={d} color="#ff88cc" count={20} opacity={0.65} />,
  "frame/GlowBorder": (d) => <GlowBorder key="e" durationInFrames={d} color="#ff88cc" thickness={20} opacity={0.65} />,
  "frame/GoldFrame": (d) => <GoldFrame key="e" durationInFrames={d} thickness={18} color="#c8a050" opacity={0.85} />,
  "frame/PolaroidFrame": (d) => <PolaroidFrame key="e" durationInFrames={d} color="#fff" bottomPad={70} opacity={0.9} />,
  "frame/RoundedVignette": (d) => <RoundedVignette key="e" durationInFrames={d} color="#000" opacity={0.55} radius={0.35} />,
  "frame/ScrapbookBorder": (d) => <ScrapbookBorder key="e" durationInFrames={d} color="#ffe0ee" accent="#ff88cc" opacity={0.85} />,
  "frame/VintageStamp": (d) => <VintageStamp key="e" durationInFrames={d} color="#d4a030" teeth={30} opacity={0.75} />,
  "frame/WaveFrame": (d) => <WaveFrame key="e" durationInFrames={d} color="#aaddff" opacity={0.6} depth={30} />,
};

const BG_COLORS: Record<string, string> = {
  atmosphere: "#2a1a0a",
  particles: "#1a1a3e",
  geometry: "#0d0d2e",
  reveal: "#1a0a2e",
  emotion: "#3a0a2a",
  nature: "#0a1a2a",
  cinematic: "#0a0a0a",
  celebration: "#1a0a3e",
  text: "#2a1a3e",
  sticker: "#e8d8f0",
  distortion: "#0a0a1a",
  frame: "#2a1a0a",
};

export const FxSinglePreview: React.FC<FxSinglePreviewProps> = ({ category, name, bgColor }) => {
  const { durationInFrames, width, height } = useVideoConfig();
  const key = `${category}/${name}`;
  const renderFn = EFFECT_MAP[key];
  const bg = bgColor ?? BG_COLORS[category] ?? "#1a1a2e";

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      {/* 淡网格辅助线 */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={height * i / 10} x2={width} y2={height * i / 10} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`} x1={width * i / 6} y1={0} x2={width * i / 6} y2={height} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      {/* 效果名称标签 */}
      <div style={{ position: "absolute", top: 24, left: 24, background: "rgba(0,0,0,0.65)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 22, fontFamily: "monospace", zIndex: 999, lineHeight: 1.4 }}>
        <span style={{ color: "#888", fontSize: 16 }}>{category}/</span><br />
        {name}
      </div>
      {renderFn ? renderFn(durationInFrames) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#f66", fontSize: 32 }}>
          未找到: {key}
        </div>
      )}
    </AbsoluteFill>
  );
};
