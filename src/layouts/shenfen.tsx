// 版式 shenfen：身份系·汉字解码(姓氏)。
// 设计系统「古卷暗金」：三色锁死(墨黑#060608/宣纸金#E9BE6A/朱砂红#C13A2E)；
// 衬线大字(Playfair Display, 越南语字符集全) + 毛笔汉字(Ma Shan Zheng)；
// 全片统一暗角+胶片颗粒；朱砂印章「解」为每拍出现的品牌记号(P8 视觉固定)。
// 五拍角色：hook / tease / suspense / reveal / cta。CTA 为纯文字指令+下行箭头，禁用伪按钮。
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { LayoutModule, Manifest, RenderBeat } from "./types";

type Display = {
  eyebrow?: string;
  title1?: string;
  title2?: string;
  stat?: string;
  statLine?: string;
  statSub?: string;
  chip?: string;
  han?: string;
  pinyin?: string;
  eq?: string;
  q?: string;
  action?: string;
  tail?: string;
};

type ShenfenBeat = {
  id: string;
  role: "hook" | "tease" | "suspense" | "reveal" | "cta";
  durationMs: number;
  audio: string;
  audioDelayMs?: number;
  image?: string;
  vi?: string;
  display?: Display;
};

const GOLD = "#E9BE6A";
const GOLD_DIM = "#B99552";
const RED = "#C13A2E";
const INK = "#F5F1E6";
const BG = "#060608";

// 衬线主字体栈(标题/字幕)；圆体 Nunito 已弃用于大字
const SERIF = '"Playfair Display", "Nunito", "PingFang SC", serif';
const BRUSH = '"Ma Shan Zheng", "Winter", "SimHei", serif';

// ── 全片统一质感层 ────────────────────────────────────────────────────────────

const GRAIN_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.5'/></svg>`,
  );

// 暗角 + 中心微光 + 胶片颗粒：每一拍都套，保证质感统一
const Atmosphere: React.FC<{ glow?: number }> = ({ glow = 0.32 }) => (
  <>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 68% 46% at 50% 42%, rgba(120,82,26,${glow}) 0%, rgba(18,12,5,0.5) 50%, ${BG} 100%)`,
      }}
    />
    <AbsoluteFill style={{ backgroundImage: `url("${GRAIN_URI}")`, opacity: 0.06, mixBlendMode: "overlay" }} />
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 120% 90% at 50% 50%, transparent 62%, rgba(0,0,0,0.55) 100%)" }}
    />
  </>
);

// 朱砂印章「解」：品牌记号，全片每拍出现(P8)。默认右上角，hook 拍居中用大号。
const Seal: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 88, style }) => (
  <div
    style={{
      width: size,
      height: size,
      background: RED,
      borderRadius: size * 0.14,
      transform: "rotate(3deg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 26px rgba(193,58,46,0.45)",
      ...style,
    }}
  >
    <span style={{ fontFamily: BRUSH, fontSize: size * 0.62, color: "#F7EBE0", lineHeight: 1 }}>解</span>
  </div>
);

const CornerSeal: React.FC = () => <Seal size={74} style={{ position: "absolute", top: 96, right: 84 }} />;

// 金色考据条：细线框小字，出处/依据的视觉载体
const EvidenceChip: React.FC<{ text?: string; opacity?: number }> = ({ text, opacity = 1 }) =>
  text ? (
    <div
      style={{
        position: "absolute",
        top: 180,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          border: `1.5px solid ${GOLD_DIM}`,
          padding: "16px 34px",
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: 6,
          color: GOLD,
          background: "rgba(6,6,8,0.45)",
        }}
      >
        {text}
      </div>
    </div>
  ) : null;

// 底部越南语字幕：衬线、淡入上移
const BottomSub: React.FC<{ text?: string; size?: number }> = ({ text, size = 54 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text) return null;
  const o = interpolate(frame, [Math.round(0.15 * fps), Math.round(0.5 * fps)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        bottom: 300,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.38,
        color: INK,
        opacity: o,
        transform: `translateY(${(1 - o) * 18}px)`,
        textShadow: "0 3px 24px rgba(0,0,0,0.92)",
      }}
    >
      {text}
    </div>
  );
};

// ── 各拍 ──────────────────────────────────────────────────────────────────────

const HookBeat: React.FC<{ b: ShenfenBeat }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = b.display ?? {};
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 160, mass: 0.9 } });
  const sealIn = spring({ frame: frame - Math.round(0.3 * fps), fps, config: { damping: 11, stiffness: 200 } });
  return (
    <AbsoluteFill>
      <Atmosphere />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: pop }}>
          <div style={{ width: 72, height: 1.5, background: GOLD_DIM }} />
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, letterSpacing: 12, color: GOLD_DIM }}>
            {d.eyebrow}
          </div>
          <div style={{ width: 72, height: 1.5, background: GOLD_DIM }} />
        </div>
        <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`, opacity: pop, textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 88, letterSpacing: 34, color: GOLD, lineHeight: 1 }}>
            {d.title1}
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 198,
              color: INK,
              lineHeight: 1.12,
              textShadow: "0 0 90px rgba(233,190,106,0.3)",
            }}
          >
            {d.title2}
          </div>
        </div>
        <Seal size={104} style={{ opacity: sealIn, transform: `rotate(3deg) scale(${interpolate(sealIn, [0, 1], [1.6, 1])})` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const TeaseBeat: React.FC<{ b: ShenfenBeat }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = b.display ?? {};
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 170, mass: 1 } });
  const l2 = spring({ frame: frame - Math.round(0.28 * fps), fps, config: { damping: 16, stiffness: 130 } });
  const l3 = spring({ frame: frame - Math.round(0.75 * fps), fps, config: { damping: 16, stiffness: 130 } });
  return (
    <AbsoluteFill>
      <Atmosphere glow={0.22} />
      <CornerSeal />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 330,
            lineHeight: 1,
            color: RED,
            transform: `scale(${interpolate(pop, [0, 1], [1.55, 1])})`,
            opacity: pop,
            textShadow: "0 0 110px rgba(193,58,46,0.4)",
          }}
        >
          {d.stat}
        </div>
        <div
          style={{
            fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: INK, marginTop: 30,
            opacity: l2, transform: `translateY(${(1 - l2) * 26}px)`,
          }}
        >
          {d.statLine}
        </div>
        <div
          style={{
            fontFamily: SERIF, fontWeight: 600, fontStyle: "italic", fontSize: 50, color: GOLD, marginTop: 14,
            opacity: l3, transform: `translateY(${(1 - l3) * 26}px)`,
          }}
        >
          {d.statSub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SuspenseBeat: React.FC<{ b: ShenfenBeat; durFrames: number }> = ({ b, durFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, durFrames], [0, 1], { easing: Easing.inOut(Easing.quad) });
  const chipIn = spring({ frame: frame - Math.round(0.4 * fps), fps, config: { damping: 16, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {b.image ? (
        <Img
          src={staticFile(b.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1.1 + t * 0.12}) translateY(${t * -34}px)`,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,6,8,0.8) 0%, rgba(6,6,8,0) 24%, rgba(6,6,8,0) 52%, rgba(6,6,8,0.92) 88%, #060608 100%)",
        }}
      />
      <AbsoluteFill style={{ backgroundImage: `url("${GRAIN_URI}")`, opacity: 0.05, mixBlendMode: "overlay" }} />
      <EvidenceChip text={b.display?.chip} opacity={chipIn} />
      <CornerSeal />
      <BottomSub text={b.vi} />
    </AbsoluteFill>
  );
};

const RevealBeat: React.FC<{ b: ShenfenBeat }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = b.display ?? {};
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 120, mass: 1.1 } });
  const sub = spring({ frame: frame - Math.round(0.5 * fps), fps, config: { damping: 16, stiffness: 130 } });
  const glowPulse = 0.5 + 0.16 * Math.sin((frame / fps) * Math.PI * 1.6);
  return (
    <AbsoluteFill>
      <Atmosphere glow={0.5} />
      <CornerSeal />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily: BRUSH,
            fontSize: 600,
            lineHeight: 1,
            color: GOLD,
            transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])}) rotate(${interpolate(pop, [0, 1], [-5, 0])}deg)`,
            opacity: pop,
            textShadow: `0 0 130px rgba(233,190,106,${glowPulse}), 0 8px 40px rgba(0,0,0,0.8)`,
            marginTop: -100,
          }}
        >
          {d.han}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 34,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 24}px)`,
            marginTop: 20,
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: "italic", fontSize: 66, color: GOLD_DIM }}>
            {d.pinyin}
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 88, color: INK }}>{d.eq}</div>
        </div>
      </AbsoluteFill>
      <BottomSub text={b.vi} />
    </AbsoluteFill>
  );
};

// CTA：纯文字指令 + 下行箭头(指向真实评论区方向)。不做伪按钮。
const CtaBeat: React.FC<{ b: ShenfenBeat }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = b.display ?? {};
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const l2 = spring({ frame: frame - Math.round(0.3 * fps), fps, config: { damping: 15, stiffness: 140 } });
  const drift = ((frame / fps) * 46) % 34;
  const chevron = (i: number) => (
    <div
      key={i}
      style={{
        width: 0,
        height: 0,
        borderLeft: "26px solid transparent",
        borderRight: "26px solid transparent",
        borderTop: `20px solid ${GOLD}`,
        opacity: 0.9 - i * 0.3,
        marginTop: 10,
        transform: `translateY(${drift}px)`,
      }}
    />
  );
  return (
    <AbsoluteFill>
      <Atmosphere glow={0.28} />
      <CornerSeal />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div
          style={{
            fontFamily: SERIF, fontWeight: 900, fontSize: 120, color: INK, textAlign: "center", lineHeight: 1.14,
            opacity: pop, transform: `scale(${interpolate(pop, [0, 1], [0.88, 1])})`,
            textShadow: "0 0 80px rgba(233,190,106,0.22)",
          }}
        >
          {d.q}
        </div>
        <div style={{ width: 220, height: 1.5, background: GOLD_DIM, opacity: l2 }} />
        <div
          style={{
            fontFamily: SERIF, fontWeight: 700, fontSize: 58, textAlign: "center", lineHeight: 1.3,
            color: INK, opacity: l2, transform: `translateY(${(1 - l2) * 20}px)`,
          }}
        >
          {d.action?.split("|").map((line, i) => (
            <div key={i} style={{ color: i === 1 ? RED : INK, fontWeight: i === 1 ? 900 : 700 }}>{line}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: l2 }}>
          {[0, 1, 2].map(chevron)}
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontStyle: "italic", fontSize: 40, color: GOLD_DIM, opacity: l2 }}>
          {d.tail}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 模块契约 ──────────────────────────────────────────────────────────────────

const Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats }) => {
  const { fps } = useVideoConfig();
  const b = beats[0] as unknown as ShenfenBeat;
  const durFrames = Math.max(1, Math.round((b.durationMs / 1000) * fps));

  let body: React.ReactNode = null;
  if (b.role === "hook") body = <HookBeat b={b} />;
  else if (b.role === "tease") body = <TeaseBeat b={b} />;
  else if (b.role === "suspense") body = <SuspenseBeat b={b} durFrames={durFrames} />;
  else if (b.role === "reveal") body = <RevealBeat b={b} />;
  else body = <CtaBeat b={b} />;

  const delayFrames = Math.round(((b.audioDelayMs ?? 0) / 1000) * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {body}
      <Sequence from={delayFrames}>
        <Audio src={staticFile(b.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "shenfen",
  segments: (beats) => beats.map((b) => [b]),
  transitionOf: (seg) => seg[0].transitionIn ?? "fade",
  Segment,
};
