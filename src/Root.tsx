import "./index.css";
import { Composition } from "remotion";
import { Video, calcVideoMetadata } from "./Video";
import { FxPreview } from "./FxPreview";
import { FxSinglePreview } from "./FxSinglePreview";
import catalog from "../catalog.json";

const FX_CATEGORIES = [
  "atmosphere",
  "particles",
  "geometry",
  "reveal",
  "emotion",
  "nature",
  "cinematic",
  "celebration",
  "text",
  "sticker",
  "distortion",
  "frame",
] as const;

// 每类 12 个特效的文件名（不含 .tsx）
const FX_EFFECTS: Record<string, string[]> = {
  atmosphere: ["BackdropParallax", "Bokeh", "ColorPulse", "CornerBloom", "DualLight", "FilmGrain", "HeatShimmer", "LightLeak", "NightBloom", "SweepBeam", "Vignette", "WarmGlow"],
  particles:  ["Bubbles", "Butterflies", "Confetti", "Fireflies", "Leaves", "Raindrops", "Sakura", "ShootingStars", "Snow", "Sparkles", "StarDust", "ThreeParticles"],
  geometry:   ["CornerFrame", "DiamondBurst", "FocusLines", "GridFlash", "HexGrid", "Mandala", "PulseCircle", "RippleRings", "RotatingRays", "SpiralGrow", "StarBurst", "TrianglePop"],
  reveal:     ["BlurReveal", "BrushReveal", "CircleMask", "CurtainOpen", "DiagonalWipe", "FadeRays", "IrisReveal", "PathDraw", "PixelDissolve", "ScaleReveal", "SliceReveal", "SweepReveal"],
  emotion:    ["Applause", "CoinFountain", "ComicPops", "EmojiRain", "Emotes", "FloatingIcons", "HeartBurst", "LevelBanner", "ScorePop", "SpeechBubble", "StarFill", "ThumbBounce"],
  nature:     ["Aurora", "CampFire", "Clouds", "Fog", "MoonGlow", "Rain", "Snow2", "Sunrays", "Thunder", "Tornado", "WaterWave", "Wind"],
  cinematic:  ["Anamorphic", "ChromaShift", "DirtyLens", "DrunkZoom", "FilmBurn", "FlickerCut", "LensFlare", "Letterbox", "MagazineCover", "OldFilm", "SlowMotionBlur", "SplitTone"],
  celebration:["Balloons", "BirthdayFlag", "CakeSparkle", "Champagne", "Confetti2", "Fireworks", "GiftBox", "GoldRain", "PaperCuts", "PomPom", "Ribbon", "StreamerDrop"],
  text:       ["BubbleText", "FloatWords", "GlowTitle", "GradientTitle", "KaraokeBar", "NeonFlicker", "ScatterWords", "ShadowStack", "SparkleText", "TypeOn", "WatermarkPulse", "WaveText"],
  sticker:    ["BowRibbon", "Bubble", "CherryBlossom", "CloudPuff", "CrownFloat", "DiamondShine", "FlowerSticker", "HeartSticker", "MusicNote", "PawPrint", "RainbowArc", "StarSticker"],
  distortion: ["ChromaticAberration", "Glitch", "InvertFlash", "Mirror", "Pixelate", "Ripple", "Shake", "Stretch", "TVNoise", "VHSTracking", "WarpWave", "ZoomBlur"],
  frame:      ["DiamondCorners", "DotBorder", "DoubleLine", "FilmStrip", "FloralBorder", "GlowBorder", "GoldFrame", "PolaroidFrame", "RoundedVignette", "ScrapbookBorder", "VintageStamp", "WaveFrame"],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── 视频 Compositions（由 catalog.json 驱动）────────────────────── */}
      {catalog.videos.map((v) => (
        <Composition
          key={v.id}
          id={v.id}
          component={Video}
          calculateMetadata={calcVideoMetadata}
          defaultProps={{ videoId: v.id, shard: v.shard, manifest: null }}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}

      {/* ── 大类预览（每类合并，Studio 快速浏览）────────────────────────── */}
      {FX_CATEGORIES.map((cat) => (
        <Composition
          key={`fx-${cat}`}
          id={`fx-${cat}`}
          component={FxPreview}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ category: cat }}
        />
      ))}

      {/* ── 单效果预览（每个效果独立 Composition，共 144 个）──────────── */}
      {FX_CATEGORIES.flatMap((cat) =>
        (FX_EFFECTS[cat] ?? []).map((name) => (
          <Composition
            key={`fx-${cat}-${name}`}
            id={`fx-${cat}-${name}`}
            component={FxSinglePreview}
            durationInFrames={150}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{ category: cat, name }}
          />
        ))
      )}
    </>
  );
};
