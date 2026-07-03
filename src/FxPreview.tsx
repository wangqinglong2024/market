/**
 * 特效库快速预览 — Remotion Studio 中可直接播放，不需要完整视频
 * Root.tsx 每个大类注册一个 Composition：id = fx-<category>
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
// atmosphere
import { CornerBloom } from "./fx/atmosphere/CornerBloom";
import { WarmGlow } from "./fx/atmosphere/WarmGlow";
import { NightBloom } from "./fx/atmosphere/NightBloom";
import { Bokeh } from "./fx/atmosphere/Bokeh";
import { FilmGrain } from "./fx/atmosphere/FilmGrain";
// particles
import { Sakura } from "./fx/particles/Sakura";
import { CherryBlossom } from "./fx/sticker/CherryBlossom";
import { StarDust } from "./fx/particles/StarDust";
import { Fireflies } from "./fx/particles/Fireflies";
import { ShootingStars } from "./fx/particles/ShootingStars";
// geometry
import { Mandala } from "./fx/geometry/Mandala";
import { PulseCircle } from "./fx/geometry/PulseCircle";
import { DiamondBurst } from "./fx/geometry/DiamondBurst";
import { RippleRings } from "./fx/geometry/RippleRings";
import { RotatingRays } from "./fx/geometry/RotatingRays";
// reveal
import { FadeRays } from "./fx/reveal/FadeRays";
import { IrisReveal } from "./fx/reveal/IrisReveal";
// emotion
import { HeartBurst } from "./fx/emotion/HeartBurst";
import { EmojiRain } from "./fx/emotion/EmojiRain";
import { StarFill } from "./fx/emotion/StarFill";
import { Applause } from "./fx/emotion/Applause";
// nature
import { Aurora } from "./fx/nature/Aurora";
import { MoonGlow } from "./fx/nature/MoonGlow";
import { Sunrays } from "./fx/nature/Sunrays";
import { Fog } from "./fx/nature/Fog";
import { CampFire } from "./fx/nature/CampFire";
// cinematic
import { LensFlare } from "./fx/cinematic/LensFlare";
import { Anamorphic } from "./fx/cinematic/Anamorphic";
import { OldFilm } from "./fx/cinematic/OldFilm";
import { Letterbox } from "./fx/cinematic/Letterbox";
// celebration
import { Fireworks } from "./fx/celebration/Fireworks";
import { GoldRain } from "./fx/celebration/GoldRain";
import { Confetti2 } from "./fx/celebration/Confetti2";
import { Balloons } from "./fx/celebration/Balloons";
// text
import { GradientTitle } from "./fx/text/GradientTitle";
import { GlowTitle } from "./fx/text/GlowTitle";
import { FloatWords } from "./fx/text/FloatWords";
// sticker
import { FlowerSticker } from "./fx/sticker/FlowerSticker";
import { HeartSticker } from "./fx/sticker/HeartSticker";
import { StarSticker } from "./fx/sticker/StarSticker";
import { MusicNote } from "./fx/sticker/MusicNote";
import { RainbowArc } from "./fx/sticker/RainbowArc";
// distortion
import { ChromaticAberration } from "./fx/distortion/ChromaticAberration";
import { VHSTracking } from "./fx/distortion/VHSTracking";
import { Glitch } from "./fx/distortion/Glitch";
// frame
import { GlowBorder } from "./fx/frame/GlowBorder";
import { FloralBorder } from "./fx/frame/FloralBorder";
import { DotBorder } from "./fx/frame/DotBorder";
import { GoldFrame } from "./fx/frame/GoldFrame";

export type FxPreviewProps = {
  category: string;
  bgColor?: string;
};

const CATEGORY_FX: Record<string, (d: number) => React.ReactNode[]> = {
  atmosphere: (d) => [
    <CornerBloom key="a1" durationInFrames={d} color="#ffd700" opacity={0.4} />,
    <WarmGlow key="a2" durationInFrames={d} color="#ffb347" opacity={0.3} />,
    <NightBloom key="a3" durationInFrames={d} starCount={25} opacity={0.5} />,
    <Bokeh key="a4" durationInFrames={d} count={5} color="#ffd54f" opacity={0.3} seed="prev" />,
    <FilmGrain key="a5" durationInFrames={d} opacity={0.1} />,
  ],
  particles: (d) => [
    <Sakura key="p1" count={30} originX={0.5} originY={0.4} seed="prev" />,
    <CherryBlossom key="p2" durationInFrames={d} count={15} color="#ffb7c5" opacity={0.6} />,
    <StarDust key="p3" durationInFrames={d} count={40} color="#ffee88" opacity={0.5} />,
    <Fireflies key="p4" durationInFrames={d} count={15} color="#aaff66" opacity={0.5} />,
    <ShootingStars key="p5" durationInFrames={d} every={1} angleDeg={28} seed="prev" />,
  ],
  geometry: (d) => [
    <Mandala key="g1" durationInFrames={d} petals={8} color="#d4a0ff" opacity={0.4} />,
    <PulseCircle key="g2" durationInFrames={d} color="#ff9dd6" rings={4} opacity={0.4} />,
    <DiamondBurst key="g3" durationInFrames={d} color="#ffe4f0" count={10} opacity={0.4} />,
    <RippleRings key="g4" durationInFrames={d} color="#f48fb1" opacity={0.4} />,
    <RotatingRays key="g5" durationInFrames={d} color="#fff5cc" opacity={0.25} />,
  ],
  reveal: (d) => [
    <FadeRays key="r1" durationInFrames={d} color="#fff8e7" opacity={0.4} />,
    <IrisReveal key="r2" durationInFrames={d} sides={6} color="#1a0a3e" opacity={0.8} />,
  ],
  emotion: (d) => [
    <HeartBurst key="e1" durationInFrames={d} color="#ff6b9d" count={14} opacity={0.55} />,
    <EmojiRain key="e2" durationInFrames={d} count={12} opacity={0.5} />,
    <StarFill key="e3" durationInFrames={d} color="#ffe066" count={10} opacity={0.5} />,
    <Applause key="e4" durationInFrames={d} color="#ffe566" count={16} opacity={0.5} />,
  ],
  nature: (d) => [
    <Aurora key="n1" durationInFrames={d} color1="#00ff88" color2="#8844ff" opacity={0.4} />,
    <MoonGlow key="n2" durationInFrames={d} cx={0.82} cy={0.12} opacity={0.5} />,
    <Sunrays key="n3" durationInFrames={d} cx={0.15} cy={0.15} opacity={0.35} />,
    <Fog key="n4" durationInFrames={d} color="#ddeeff" opacity={0.3} />,
    <CampFire key="n5" durationInFrames={d} cx={0.5} cy={0.7} opacity={0.5} />,
  ],
  cinematic: (d) => [
    <LensFlare key="c1" durationInFrames={d} cx={0.15} cy={0.12} opacity={0.5} />,
    <Anamorphic key="c2" durationInFrames={d} cx={0.5} cy={0.45} color="#88ccff" opacity={0.4} />,
    <OldFilm key="c3" durationInFrames={d} opacity={0.35} />,
    <Letterbox key="c4" durationInFrames={d} barRatio={0.08} opacity={0.9} />,
  ],
  celebration: (d) => [
    <Fireworks key="cel1" durationInFrames={d} count={5} opacity={0.55} />,
    <GoldRain key="cel2" durationInFrames={d} count={30} opacity={0.5} />,
    <Confetti2 key="cel3" durationInFrames={d} count={40} opacity={0.5} />,
    <Balloons key="cel4" durationInFrames={d} count={6} opacity={0.5} />,
  ],
  text: (d) => [
    <GradientTitle key="t1" durationInFrames={d} text="特效预览" x={0.5} y={0.12} fontSize={72} color1="#ff6b9d" color2="#ffeaa7" opacity={0.95} />,
    <GlowTitle key="t2" durationInFrames={d} text="特效库" x={0.5} y={0.45} fontSize={60} glowColor="#ff88cc" opacity={0.9} />,
    <FloatWords key="t3" durationInFrames={d} words={["美", "爱", "棒", "好"]} color="#ff88cc" opacity={0.5} />,
  ],
  sticker: (d) => [
    <FlowerSticker key="s1" durationInFrames={d} count={8} color="#ff88cc" opacity={0.6} />,
    <HeartSticker key="s2" durationInFrames={d} count={10} opacity={0.55} />,
    <StarSticker key="s3" durationInFrames={d} count={8} opacity={0.55} />,
    <MusicNote key="s4" durationInFrames={d} count={6} color="#aa66ff" opacity={0.5} />,
    <RainbowArc key="s5" durationInFrames={d} cx={0.5} cy={0.7} r={0.3} opacity={0.55} />,
  ],
  distortion: (d) => [
    <ChromaticAberration key="d1" durationInFrames={d} intensity={8} opacity={0.45} />,
    <VHSTracking key="d2" durationInFrames={d} opacity={0.3} />,
    <Glitch key="d3" durationInFrames={d} intensity={15} opacity={0.45} rate={2} />,
  ],
  frame: (d) => [
    <GlowBorder key="f1" durationInFrames={d} color="#ff88cc" thickness={18} opacity={0.6} />,
    <FloralBorder key="f2" durationInFrames={d} color="#ff88cc" count={18} opacity={0.55} />,
    <DotBorder key="f3" durationInFrames={d} color="#ffd700" dotSize={5} gap={14} opacity={0.6} />,
    <GoldFrame key="f4" durationInFrames={d} thickness={15} opacity={0.7} />,
  ],
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
  sticker: "#f8e8f8",
  distortion: "#0a0a1a",
  frame: "#2a1a0a",
};

export const FxPreview: React.FC<FxPreviewProps> = ({ category, bgColor }) => {
  const { durationInFrames, width, height } = useVideoConfig();
  const fxFn = CATEGORY_FX[category];
  const bg = bgColor ?? BG_COLORS[category] ?? "#1a1a2e";

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={height * i / 10} x2={width} y2={height * i / 10} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`} x1={width * i / 6} y1={0} x2={width * i / 6} y2={height} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
      <div style={{ position: "absolute", top: 24, left: 24, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 24, fontFamily: "monospace", zIndex: 999 }}>
        fx/{category}
      </div>
      {fxFn ? fxFn(durationInFrames) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>
          未知类目: {category}
        </div>
      )}
    </AbsoluteFill>
  );
};
