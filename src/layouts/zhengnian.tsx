// 版式 zhengnian：正念翻牌引擎（驱逐/接收共用，manifest.meta.series 区分）。
// 结构：hook(主题大图+正念吸引+三语钩子,只越语发音) → word×N(越语+图先行→拼音+中文咒文→逐词定制动效) → seal(解印+领取钩)。
// 设计系统：纯黑底(#000)融入 TikTok 信息流、3:4、动漫大图、毛笔大字、朱砂"解"印。
// 动效纪律：一词一效(fx 字段驱动)，本文件实现动效原语，参数按词定制。
import {
  AbsoluteFill,
  Audio,
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

type ZBeat = {
  id: string;
  role: "hook" | "word" | "seal";
  index: number;
  total: number;
  durationMs: number;
  audio?: string;
  audioDelayMs?: number;
  zhAudio?: string;
  image?: string;
  zh?: string;
  pinyin?: string;
  vi?: string;
  preview?: string;
  fx?: string;
  sfx?: string;
};

const GOLD = "#E9BE6A";
const GOLD_DIM = "#B99552";
const RED = "#C13A2E";
const INK = "#F5F1E6";
const BG = "#000000";
const W = 1080;
const H = 1440;

// 确定性伪随机（渲染必须逐帧可重放）
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const sfxSrc = (name: string) => staticFile(`library/audio/sfx/${name}.wav`);

// ── 品牌元素 ──────────────────────────────────────────────────────────────────

const Seal: React.FC<{ size?: number; zh: string; style?: React.CSSProperties }> = ({ size = 70, zh, style }) => (
  <div
    style={{
      width: size, height: size, background: RED, borderRadius: size * 0.14,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: "rotate(3deg)", boxShadow: "0 4px 24px rgba(193,58,46,0.5)", ...style,
    }}
  >
    <span style={{ fontFamily: zh, fontSize: size * 0.6, color: "#F7EBE0", lineHeight: 1 }}>解</span>
  </div>
);

// 词/封印拍右上角标：解印 + 竖排"正念吸引"
const CornerBrand: React.FC<{ zh: string }> = ({ zh }) => (
  <div style={{ position: "absolute", top: 60, right: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <Seal size={64} zh={zh} />
    <div style={{ fontFamily: zh, fontSize: 26, color: GOLD_DIM, writingMode: "vertical-rl", letterSpacing: 6 }}>正念吸引</div>
  </div>
);

// 接收系福印进度条：total 格，litCount 格已亮，current 在收取时点亮
const FuRow: React.FC<{ zh: string; total: number; lit: number; igniteP?: number }> = ({ zh, total, lit, igniteP = 0 }) => (
  <div style={{ position: "absolute", bottom: 74, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
    {Array.from({ length: total }).map((_, i) => {
      const isLit = i < lit;
      const isCur = i === lit;
      const glow = isLit ? 1 : isCur ? igniteP : 0;
      return (
        <div
          key={i}
          style={{
            width: 86, height: 86, borderRadius: 12,
            border: `2px solid ${glow > 0.05 ? GOLD : "#3a3428"}`,
            background: glow > 0.05 ? `rgba(233,190,106,${0.12 + glow * 0.25})` : "rgba(20,18,12,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: glow > 0.05 ? `0 0 ${26 * glow}px rgba(233,190,106,${0.7 * glow})` : "none",
            transform: `scale(${1 + (isCur ? igniteP * 0.12 : 0)})`,
          }}
        >
          <span style={{ fontFamily: zh, fontSize: 46, color: glow > 0.05 ? GOLD : "#4a4234", lineHeight: 1 }}>福</span>
        </div>
      );
    })}
  </div>
);

// ── 开场拍 ────────────────────────────────────────────────────────────────────

const HookBeat: React.FC<{ b: ZBeat; zh: string; latin: string }> = ({ b, zh, latin }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brand = spring({ frame, fps, config: { damping: 12, stiffness: 170 } });
  const l1 = spring({ frame: frame - Math.round(0.25 * fps), fps, config: { damping: 15, stiffness: 140 } });
  const zoom = 1.06 + (frame / fps) * 0.012;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {b.image ? (
        <Img src={staticFile(b.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.12) 30%, rgba(0,0,0,0.16) 55%, rgba(0,0,0,0.86) 100%)" }} />
      {/* 品牌四字 + 越南语小注 */}
      <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center", opacity: brand, transform: `scale(${interpolate(brand, [0, 1], [1.25, 1])})` }}>
        <div style={{ fontFamily: zh, fontSize: 128, color: GOLD, letterSpacing: 20, lineHeight: 1, textShadow: "0 0 60px rgba(233,190,106,0.5), 0 4px 18px rgba(0,0,0,0.9)" }}>
          正念吸引
        </div>
        <div style={{ fontFamily: latin, fontWeight: 700, fontSize: 30, color: GOLD_DIM, letterSpacing: 8, marginTop: 14 }}>
          CHÁNH NIỆM · LUẬT HẤP DẪN
        </div>
      </div>
      {/* 三语钩子：拼音 + 中文 + 越南语（只越语发音） */}
      <div style={{ position: "absolute", bottom: 150, left: 70, right: 70, textAlign: "center", opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>
        <div style={{ fontFamily: latin, fontWeight: 700, fontStyle: "italic", fontSize: 34, color: GOLD, letterSpacing: 2 }}>{b.pinyin}</div>
        <div style={{ fontFamily: zh, fontSize: 78, color: INK, marginTop: 10, lineHeight: 1.15, textShadow: "0 3px 20px rgba(0,0,0,0.9)" }}>{b.zh}</div>
        <div style={{ fontFamily: latin, fontWeight: 900, fontSize: 56, color: INK, marginTop: 18, lineHeight: 1.25, textShadow: "0 3px 22px rgba(0,0,0,0.95)" }}>{b.vi}</div>
      </div>
      <Sequence from={2}>
        <Audio src={sfxSrc("boom")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── 动效原语：负向毁灭 ────────────────────────────────────────────────────────

// 通用碎片化：把 children 渲染 N 份，各自 clip-path 多边形 + 独立飞散
const Shards: React.FC<{
  p: number; salt: number; cols: number; rows: number; spread: number; gravity: number;
  children: React.ReactNode;
}> = ({ p, salt, cols, rows, spread, gravity, children }) => {
  if (p <= 0) return <>{children}</>;
  const shards = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const d = Math.max(0, p - rnd(i, salt) * 0.25) / 0.75; // 各碎片错峰
      const dx = (rnd(i, salt + 1) - 0.5) * spread * d;
      const dy = -rnd(i, salt + 2) * 120 * d + gravity * d * d;
      const rot = (rnd(i, salt + 3) - 0.5) * 140 * d;
      const x0 = (c / cols) * 100, x1 = ((c + 1) / cols) * 100;
      const y0 = (r / rows) * 100, y1 = ((r + 1) / rows) * 100;
      shards.push(
        <div
          key={i}
          style={{
            position: "absolute", inset: 0,
            clipPath: `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`,
            transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
            opacity: Math.max(0, 1 - d * 1.15),
          }}
        >
          {children}
        </div>,
      );
    }
  }
  return <div style={{ position: "absolute", inset: 0 }}>{shards}</div>;
};

// 雨丝(渣男氛围层)
const Rain: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: 26 }).map((_, i) => {
      const x = rnd(i, 7) * W;
      const len = 90 + rnd(i, 8) * 120;
      const y = ((frame * (16 + rnd(i, 9) * 20) + rnd(i, 10) * H) % (H + len)) - len;
      return (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 2, height: len, background: "linear-gradient(rgba(200,220,255,0), rgba(200,220,255,0.5))", transform: "rotate(8deg)" }} />
      );
    })}
  </AbsoluteFill>
);

// 负向动效调度：按 fx 名给出容器变换/碎片参数
const Destruction: React.FC<{ fx: string; p: number; children: React.ReactNode }> = ({ fx, p, children }) => {
  if (fx === "tear-half") {
    // 撕成两半：左右半幅反向旋转坠落
    const halves = [0, 1].map((k) => {
      const dir = k === 0 ? -1 : 1;
      const zig = "52% 0%, 46% 18%, 55% 36%, 47% 55%, 54% 74%, 48% 100%";
      const clip = k === 0 ? `polygon(0% 0%, ${zig}, 0% 100%)` : `polygon(100% 0%, ${zig.split(", ").reverse().join(", ")}, 100% 100%)`;
      return (
        <div key={k} style={{ position: "absolute", inset: 0, clipPath: clip, transform: `translate(${dir * 260 * p}px, ${140 * p * p}px) rotate(${dir * 16 * p}deg)`, opacity: 1 - p * 0.9 }}>
          {children}
        </div>
      );
    });
    return <div style={{ position: "absolute", inset: 0 }}>{halves}</div>;
  }
  if (fx === "strip-peel") {
    // 横条剥落：6 条交替左右滑出
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          const d = Math.max(0, p - i * 0.07) / 0.93;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, clipPath: `polygon(0% ${(i / 6) * 100}%, 100% ${(i / 6) * 100}%, 100% ${((i + 1) / 6) * 100}%, 0% ${((i + 1) / 6) * 100}%)`, transform: `translate(${dir * 700 * d * d}px, ${90 * d * d}px) rotate(${dir * 6 * d}deg)`, opacity: 1 - d }}>
              {children}
            </div>
          );
        })}
      </div>
    );
  }
  if (fx === "shadow-crumble") {
    // 影子先崩、本体后碎（小人）
    const shadowP = Math.min(1, p * 2.2);
    const mainP = Math.max(0, (p - 0.3) / 0.7);
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(26px, 26px) translateY(${-60 * shadowP}px)`, filter: "brightness(0)", opacity: 0.55 * (1 - shadowP) }}>
          {children}
        </div>
        <Shards p={mainP} salt={5} cols={5} rows={5} spread={520} gravity={480}>{children}</Shards>
      </div>
    );
  }
  // 默认/shatter-rain：玻璃碎裂
  return <Shards p={p} salt={3} cols={4} rows={5} spread={760} gravity={560}>{children}</Shards>;
};

// ── 动效原语：正向收取 ────────────────────────────────────────────────────────

// 收取粒子：按 fx 换粒子形态，全部汇入福印槽位
const AbsorbFx: React.FC<{ fx: string; p: number; zh: string; slotX: number }> = ({ fx, p, zh, slotX }) => {
  if (p <= 0) return null;
  const n = 16;
  const parts = Array.from({ length: n }).map((_, i) => {
    const d = Math.max(0, p - rnd(i, 21) * 0.3) / 0.7;
    const sx = W / 2 + (rnd(i, 22) - 0.5) * 620;
    const sy = 640 + (rnd(i, 23) - 0.5) * 420;
    const tx = slotX, ty = H - 116;
    const arc = fx === "coin-burst" ? -260 * Math.sin(Math.PI * d) : fx === "light-swirl" ? (rnd(i, 24) - 0.5) * 340 * Math.sin(Math.PI * d) : 0;
    const x = sx + (tx - sx) * d + (fx === "light-swirl" ? arc : 0);
    const y = sy + (ty - sy) * d + (fx === "coin-burst" ? arc : 0);
    const o = d < 0.9 ? 0.95 : (1 - d) * 9.5;
    if (fx === "coin-burst") {
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #ffe9ad, #E9BE6A 55%, #8a6420)", boxShadow: "0 0 18px rgba(233,190,106,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: 24, color: "#6b4a12", opacity: o, transform: `rotate(${d * 300 * (rnd(i, 25) - 0.5)}deg)` }}>财</div>;
    }
    if (fx === "petal-thread") {
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 26, height: 18, borderRadius: "60% 40% 60% 40%", background: "linear-gradient(135deg, #ffd3dd, #ff8fa8)", opacity: o, transform: `rotate(${d * 260}deg)` }} />;
    }
    if (fx === "gate-light") {
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: 6, height: 60 + rnd(i, 26) * 60, background: "linear-gradient(rgba(255,240,200,0), #ffe9ad, rgba(255,240,200,0))", opacity: o, transform: `rotate(${(rnd(i, 27) - 0.5) * 20}deg)` }} />;
    }
    // light-swirl 默认：金色流光
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: 10, height: 10, borderRadius: "50%", background: "#ffe9ad", boxShadow: "0 0 22px 8px rgba(233,190,106,0.75)", opacity: o }} />;
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{parts}</AbsoluteFill>;
};

// 贵人：金门开启背景层
const GatePanels: React.FC<{ p: number }> = ({ p }) =>
  p <= 0 ? null : (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "50%", background: "linear-gradient(90deg, rgba(120,90,30,0), rgba(233,190,106,0.28))", transform: `translateX(${-p * 320}px)` }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", background: "linear-gradient(-90deg, rgba(120,90,30,0), rgba(233,190,106,0.28))", transform: `translateX(${p * 320}px)` }} />
      <div style={{ position: "absolute", left: "42%", right: "42%", top: 0, bottom: 0, background: "linear-gradient(rgba(255,240,200,0), rgba(255,240,200,0.5), rgba(255,240,200,0))", filter: "blur(18px)", opacity: p }} />
    </AbsoluteFill>
  );

// 真爱：红线绕结（SVG 描线生长）
const RedThread: React.FC<{ p: number }> = ({ p }) =>
  p <= 0 ? null : (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path
        d={`M 140 520 C 420 380, 660 380, 800 560 C 900 700, 640 860, 540 720 C 460 600, 620 520, 760 640 C 880 740, 760 900, 540 880`}
        stroke="#e0475a" strokeWidth={9} fill="none" strokeLinecap="round"
        strokeDasharray={2600} strokeDashoffset={2600 * (1 - Math.min(1, p * 1.4))}
        style={{ filter: "drop-shadow(0 0 10px rgba(224,71,90,0.8))" }}
      />
    </svg>
  );

// ── 词汇拍 ────────────────────────────────────────────────────────────────────

const WordBeat: React.FC<{ b: ZBeat; series: string; zh: string; latin: string }> = ({ b, series, zh, latin }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f1 = Math.round(0.9 * fps);  // 拼音+中文入场
  const f2 = Math.round(1.7 * fps);  // 动效爆发
  const enter = spring({ frame, fps, config: { damping: 13, stiffness: 160 } });
  const zhIn = spring({ frame: frame - f1, fps, config: { damping: 11, stiffness: 190, mass: 0.8 } });
  const fxP = interpolate(frame, [f2, Math.round(2.35 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const neg = series === "quzhu";
  const flip = !neg ? interpolate(Math.min(frame, Math.round(0.5 * fps)), [0, Math.round(0.5 * fps)], [90, 0]) : 0;

  const slotX = W / 2 + ((b.index - 1) - (b.total - 1) / 2) * 108;

  // 内容组：图 + 越南语词 + (后入)拼音+中文
  const content = (
    <AbsoluteFill>
      {/* 词图：中部 */}
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, height: 800, opacity: enter }}>
        {b.image ? (
          <Img src={staticFile(b.image)} style={{ width: "100%", height: "100%", objectFit: "cover", WebkitMaskImage: "radial-gradient(ellipse 72% 62% at 50% 50%, black 55%, transparent 98%)", maskImage: "radial-gradient(ellipse 72% 62% at 50% 50%, black 55%, transparent 98%)" }} />
        ) : null}
      </div>
      {/* 越南语词：先行，砸入图下沿，不消失 */}
      <div style={{ position: "absolute", top: 1030, left: 60, right: 60, textAlign: "center", opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [1.7, 1])})` }}>
        <div style={{ fontFamily: latin, fontWeight: 900, fontSize: 84, color: neg ? INK : GOLD, lineHeight: 1.1, textShadow: "0 4px 26px rgba(0,0,0,0.95)" }}>{b.vi}</div>
      </div>
      {/* 拼音 + 中文毛笔大字：第二时序，图上方 */}
      {frame >= f1 ? (
        <div style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center", opacity: zhIn, transform: `scale(${interpolate(zhIn, [0, 1], [2.1, 1])})` }}>
          <div style={{ fontFamily: zh, fontSize: b.zh && b.zh.length > 2 ? 240 : 320, color: neg ? INK : GOLD, lineHeight: 1, textShadow: neg ? "0 0 70px rgba(245,241,230,0.28), 0 6px 30px rgba(0,0,0,0.9)" : "0 0 90px rgba(233,190,106,0.55), 0 6px 30px rgba(0,0,0,0.9)" }}>
            {b.zh}
          </div>
          <div style={{ fontFamily: latin, fontWeight: 700, fontStyle: "italic", fontSize: 42, color: GOLD_DIM, marginTop: 4 }}>{b.pinyin}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* 贵人金门背景层 */}
      {b.fx === "gate-light" ? <GatePanels p={fxP} /> : null}
      {neg ? (
        <>
          <Destruction fx={b.fx ?? "shatter-rain"} p={fxP}>{content}</Destruction>
          {b.fx === "shatter-rain" ? <Rain frame={frame} /> : null}
        </>
      ) : (
        <>
          {/* 翻牌入场 + 收取时整体向福印吸入 */}
          <div style={{ position: "absolute", inset: 0, transform: `perspective(1400px) rotateY(${flip}deg) translate(${(slotX - W / 2) * fxP}px, ${(H - 116 - 700) * fxP * 0.9}px) scale(${1 - fxP * 0.85})`, opacity: 1 - Math.max(0, fxP - 0.75) * 4, transformOrigin: "50% 45%" }}>
            {content}
          </div>
          {b.fx === "petal-thread" ? <RedThread p={fxP} /> : null}
          <AbsorbFx fx={b.fx ?? "light-swirl"} p={fxP} zh={zh} slotX={slotX} />
          <FuRow zh={zh} total={b.total} lit={b.index - 1} igniteP={interpolate(fxP, [0.65, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </>
      )}
      <CornerBrand zh={zh} />
      {/* 音频：入场重击 → 中文朗读 → 动效音 */}
      <Sequence from={1}><Audio src={sfxSrc(neg ? "boom" : "chime")} volume={0.45} /></Sequence>
      {b.zhAudio ? <Sequence from={f1}><Audio src={staticFile(b.zhAudio)} /></Sequence> : null}
      <Sequence from={f2}><Audio src={sfxSrc(b.sfx ?? (neg ? "shatter" : "chime"))} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};

// ── 封印拍 ────────────────────────────────────────────────────────────────────

const SealBeat: React.FC<{ b: ZBeat; series: string; zh: string; latin: string }> = ({ b, series, zh, latin }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 260, mass: 1.2 } });
  const txt = spring({ frame: frame - Math.round(0.5 * fps), fps, config: { damping: 15, stiffness: 130 } });
  const neg = series === "quzhu";
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 65% 42% at 50% 40%, rgba(120,82,26,0.3), transparent 70%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 46 }}>
        <Seal size={230} zh={zh} style={{ transform: `rotate(3deg) scale(${interpolate(stamp, [0, 1], [2.6, 1])})`, opacity: stamp }} />
        <div style={{ textAlign: "center", opacity: txt, transform: `translateY(${(1 - txt) * 24}px)`, padding: "0 80px" }}>
          <div style={{ fontFamily: latin, fontWeight: 900, fontSize: 58, color: INK, lineHeight: 1.3 }}>{b.vi}</div>
          <div style={{ fontFamily: latin, fontWeight: 700, fontStyle: "italic", fontSize: 38, color: GOLD_DIM, marginTop: 26 }}>{b.preview}</div>
        </div>
      </AbsoluteFill>
      {!neg ? <FuRow zh={zh} total={b.total} lit={b.total} /> : null}
      <Sequence from={6}><Audio src={sfxSrc("stamp")} volume={0.7} /></Sequence>
      {!neg ? <Sequence from={12}><Audio src={sfxSrc("chime")} volume={0.4} /></Sequence> : null}
    </AbsoluteFill>
  );
};

// ── 模块契约 ──────────────────────────────────────────────────────────────────

const Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const { fps } = useVideoConfig();
  const b = beats[0] as unknown as ZBeat;
  const series = ((meta as unknown as { series?: string }).series) ?? "quzhu";
  const fonts = meta.fonts ?? DEFAULT_FONTS;
  const zh = stackCss(fonts.zhStack);
  const latin = stackCss(fonts.latinStack);

  let body: React.ReactNode;
  if (b.role === "hook") body = <HookBeat b={b} zh={zh} latin={latin} />;
  else if (b.role === "word") body = <WordBeat b={b} series={series} zh={zh} latin={latin} />;
  else body = <SealBeat b={b} series={series} zh={zh} latin={latin} />;

  const delay = Math.round(((b.audioDelayMs ?? 0) / 1000) * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {body}
      {b.audio ? (
        <Sequence from={delay}>
          <Audio src={staticFile(b.audio)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "zhengnian",
  segments: (beats) => beats.map((b) => [b]),
  transitionOf: () => "fade",
  Segment,
};
