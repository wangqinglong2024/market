// 版式「hsk-ziyuan」：HSK字源·九宫格识字(越南受众·9:16竖屏)。数据驱动(manifest.meta.grid/colors/sizes + beats)。
// ★两种模式(meta.grid.seq):parallel=4字同时演变+朗读独立逐字;sequential=逐个来,每字独占slot走完全程+朗读,4格逐格填入保留。
// ★顶部引导文字条(meta.banner,可选):常驻画面顶部,按 spans 分时段换文案(挑战引导→催评论);纯视觉不朗读、
//   不增加总时长;启用时构建层已把格子缩小下移让位。子模板清单见 templates/hsk-ziyuan/SUBTEMPLATES.md。
// 每字:具象简笔(+extra细节淡出抽象)→线条字→末段真实毛笔字;读到触发水墨韵律。单段渲染,组按时长顺序切窗。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring, Easing,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Manifest, LayoutModule, RenderBeat } from "./types";

type Pt = [number, number];
type Ch = { c: string; py: string; vi: string; pic: Pt[][]; chr: Pt[][]; extra?: Pt[][]; audio: string; slot: number; readFrame: number };
type BannerSpan = { fromMs: number; toMs: number; lines: string[] };
type Banner = { y: number; width: number; fontSize: number; fontSize2: number; lineGap: number; spans: BannerSpan[] };
type Beat = RenderBeat & { chars?: Ch[]; hero?: boolean };
type Grid = {
  seq: boolean; mode?: string; x0: number; y0: number; cellW: number; cellH: number; box: number; groupFrames: number;
  draw: [number, number]; morph: [number, number]; real: [number, number]; readFrames: number | null; burst?: number | null;
  introFrames?: number; introDraw?: [number, number]; introMorph?: [number, number]; introBurst?: number; heroBox?: number;
};
type Colors = { paper: string; ink: string; pinyin: string; vi: string; ripple: string; grid: string; gridCross: string };
type Sizes = { pinyin: number; vi: number; char: number };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const morphStroke = (A: Pt[], B: Pt[], p: number): Pt[] => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
const dOf = (p: Pt[]) => "M " + p.map(([x, y]) => `${x} ${y}`).join(" L ");
const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ms2f = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
// 确定性伪随机(seed 相同→每帧渲染一致):炸裂墨韵版的墨滴/飞白参数需要跨帧稳定。
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const Cell: React.FC<{ ch: Ch; ci: number; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ ch, ci, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const seq = g.seq;
  const col = ci % 2, row = Math.floor(ci / 2);
  const x = g.x0 + col * g.cellW, y = g.y0 + row * g.cellH;

  const base = f - ch.slot;
  // sequential:4 格简笔画在组开头就全部画出、静止等待,轮到该字(slot 到点)才开始 morph;parallel 不变。
  const drawP = interpolate(seq ? f : base, g.draw, [0, 1], cl);
  const morphP = interpolate(base, g.morph, [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });
  const realP = interpolate(base, g.real, [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });

  const readLen = seq ? 20 : (g.readFrames ?? 36);
  const rr = (f - ch.readFrame) / readLen;
  const active = rr >= 0 && rr <= 1.05;
  const pulse = active ? Math.sin(Math.min(Math.max(rr, 0), 1) * Math.PI) : 0;
  const ripple = interpolate(f, [ch.readFrame, ch.readFrame + 24], [0, 1], cl);
  const infoP = seq
    ? interpolate(base, [g.real[0] - 6, g.real[0] + 8], [0, 1], cl)
    : interpolate(f, [ch.readFrame + 2, ch.readFrame + 18], [0, 1], cl);

  const bx = x + (g.cellW - g.box) / 2, by = y + (g.cellH - g.box) / 2;
  const cx = bx + g.box / 2, cy = by + g.box / 2;
  const strokes = ch.pic.map((p, i) => morphStroke(p, ch.chr[i], morphP));
  const glow = pulse > 0.02 ? `drop-shadow(0 0 ${14 * pulse}px ${c.ripple})` : "none";

  return (
    <>
      <div style={{ position: "absolute", left: x, top: y + Math.round(g.cellH * 0.12), width: g.cellW, textAlign: "center",
        fontFamily: latin, fontSize: s.pinyin, fontWeight: 800, color: c.pinyin, opacity: infoP, letterSpacing: 1 }}>{ch.py}</div>

      <div style={{ position: "absolute", left: bx, top: by, width: g.box, height: g.box, border: `2px solid ${c.grid}` }} />
      <div style={{ position: "absolute", left: bx, top: cy, width: g.box, height: 0, borderTop: `1.5px dashed ${c.gridCross}` }} />
      <div style={{ position: "absolute", left: cx, top: by, width: 0, height: g.box, borderLeft: `1.5px dashed ${c.gridCross}` }} />

      {active ? (
        <div style={{ position: "absolute", left: cx - g.box / 2, top: cy - g.box / 2, width: g.box, height: g.box, borderRadius: "50%",
          border: `3px solid ${c.ripple}`, opacity: (1 - ripple) * 0.45, transform: `scale(${0.5 + ripple * 0.9})` }} />
      ) : null}

      <svg viewBox="0 0 100 100" width={g.box} height={g.box} style={{ position: "absolute", left: bx, top: by, overflow: "visible",
        opacity: 1 - realP, transform: `scale(${(1 + pulse * 0.07) * (1 - realP * 0.04)})`, transformOrigin: "center", filter: glow }}>
        {strokes.map((p, i) => (
          <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={c.ink} strokeWidth={4.6}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
        ))}
      </svg>
      {/* 具象细节(extra):起始画真实物体的额外部件(头/臂/嘴唇线/多余田埂),演变时淡出抽象掉 */}
      {ch.extra ? (
        <svg viewBox="0 0 100 100" width={g.box} height={g.box} style={{ position: "absolute", left: bx, top: by, overflow: "visible",
          opacity: interpolate(morphP, [0, 0.6], [1, 0], cl) * (1 - realP) }}>
          {ch.extra.map((p, i) => (
            <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={c.ink} strokeWidth={4.2}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
          ))}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: bx, top: by, width: g.box, height: g.box, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: s.char, color: c.ink,
        opacity: realP, transform: `scale(${interpolate(realP, [0, 1], [0.96, 1]) + pulse * 0.07})`, transformOrigin: "center", filter: glow }}>{ch.c}</div>

      <div style={{ position: "absolute", left: x, top: y + Math.round(g.cellH * 0.775), width: g.cellW, textAlign: "center",
        fontFamily: latin, fontSize: s.vi, fontWeight: 800, color: c.vi, opacity: infoP }}>{ch.vi}</div>
    </>
  );
};

// ★炸裂墨韵版(inkburst 子模板)。节奏(用户 2026-07-21 定):变化 2.4s → 炸裂 1.6s【持续】,不是一闪。
//   炸裂段用「三波墨滴 + 多道湿墨冲击环 + 持续外扩的墨轮 + 毛笔字飞白扫写 + 弹簧过冲 + 整格kick(带余震)」
//   把 1.6s 填满不留静帧;墨从中心炸开外飞、露出中央干净的毛笔字。hero=true 时为全屏单字冷开场。
//   继承 app 水墨语义(01-ink-wash),用 SVG feTurbulence 把「象征」升成「真墨」。与 plain/memtest 不重叠。
const CellInkburst: React.FC<{ ch: Ch; ci: number; g: Grid; c: Colors; s: Sizes; zh: string; latin: string; hero?: boolean }> = ({ ch, ci, g, c, s, zh, latin, hero }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heroMode = !!hero;
  const cellW = heroMode ? 1080 : g.cellW, cellH = heroMode ? 1920 : g.cellH;
  const box = heroMode ? (g.heroBox ?? 640) : g.box;
  const col = ci % 2, row = Math.floor(ci / 2);
  const x = heroMode ? 0 : g.x0 + col * g.cellW;
  const y = heroMode ? 0 : g.y0 + row * g.cellH;
  const boxL = (cellW - box) / 2, boxT = (cellH - box) / 2;
  const cxL = cellW / 2, cyL = cellH / 2;
  const cp = ch.c.codePointAt(0) ?? 0;
  const uid = `wet-${cp}-${ci}${heroMode ? "-h" : ""}`;

  // 时序:变化(draw→morph,easeIn 慢起急收)→ burst → 炸裂持续 EXP 帧(≈1.6s=48)
  const drawR = heroMode ? (g.introDraw ?? g.draw) : g.draw;
  const morphR = heroMode ? (g.introMorph ?? g.morph) : g.morph;
  const burst = heroMode ? (g.introBurst ?? g.real[0]) : (g.burst ?? g.real[0]);
  const groupFrames = heroMode ? (g.introFrames ?? g.groupFrames) : g.groupFrames;
  const EXP = Math.max(12, groupFrames - burst);
  const revealLen = heroMode ? 10 : 20;
  const tb = f - burst;

  const drawP = interpolate(f, drawR, [0, 1], cl);
  const morphP = interpolate(f, morphR, [0, 1], { ...cl, easing: Easing.in(Easing.cubic) });
  const realP = interpolate(f, [burst, burst + revealLen], [0, 1], cl);
  const writeP = interpolate(f, [burst, burst + revealLen - 2], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });

  // 弹簧过冲(峰值≈1.18)+ 成形后微呼吸 + 整格 kick(初击 + 余震)
  const pop = spring({ frame: Math.max(0, tb), fps, config: { damping: 7, mass: 0.7, stiffness: 160 } });
  const breathe = tb > revealLen ? Math.sin((tb - revealLen) * 0.22) * 0.02 : 0;
  const charScale = tb < 0 ? 1 : 0.6 + 0.55 * pop + breathe;
  const shock = (t0: number, amp: number, dur: number) => (tb >= t0 && tb < t0 + dur ? Math.sin((tb - t0) * 1.3) * amp * (1 - (tb - t0) / dur) : 0);
  const kick = shock(0, 15, 11) + shock(Math.round(EXP * 0.3), 7, 9);
  const kickY = tb >= 0 && tb < 11 ? Math.cos(tb * 1.1) * 5 * (1 - tb / 11) : 0;

  // 湿墨边位移:常驻微湿 + 两次爆冲 + 持续沸腾抖动
  const spike = (t0: number, amp: number, dur: number) => (tb >= t0 && tb < t0 + dur ? (1 - (tb - t0) / dur) * amp : 0);
  const disp = 1.6 + spike(0, 11, 9) + spike(Math.round(EXP * 0.3), 5, 7) + (tb >= 0 ? Math.sin(tb * 0.5) * 0.9 : 0);

  const strokes = ch.pic.map((p, i) => morphStroke(p, ch.chr[i], morphP));

  // ★朱墨读标(与炸裂无关):朗读到本字时,该格亮朱墨——晕圈外扩 + 朱光 + 拼音跳出 + 轻脉动。
  const readLen = 16;
  const rr = (f - ch.readFrame) / readLen;
  const reading = rr >= 0 && rr <= 1.1;
  const readPulse = reading ? Math.sin(Math.min(Math.max(rr, 0), 1) * Math.PI) : 0;
  const readRipple = interpolate(f, [ch.readFrame, ch.readFrame + 22], [0, 1], cl);
  const readGlow = readPulse > 0.02 ? ` drop-shadow(0 0 ${16 * readPulse}px ${c.ripple})` : "";
  const pinyinOp = Math.max(realP, readPulse);

  // 三波墨滴:births 铺满整个炸裂段→持续 1.6s 有飞沫,不是一闪。减速外飞+重力下坠+拉伸。
  const births = [0, Math.round(EXP * 0.28), Math.round(EXP * 0.55)];
  const parts = useMemo(() => {
    const r = rng(cp * 131 + ci * 7919);
    const arr: { birth: number; a: number; spd: number; size: number; rot: number; asp: number; life: number; drift: number; seal: boolean }[] = [];
    births.forEach((birth, w) => {
      const n = w === 0 ? 34 : 20;
      for (let i = 0; i < n; i++) {
        arr.push({
          birth, a: r() * Math.PI * 2,
          spd: (w === 0 ? 6 : 4) + r() * (w === 0 ? 11 : 8),
          size: 6 + r() * (w === 0 ? 32 : 22),
          rot: r() * 180, asp: 0.4 + r() * 0.9,
          life: 26 + r() * 20, drift: (r() - 0.5) * 3, seal: r() < 0.13,
        });
      }
    });
    return arr;
  }, [cp, ci, EXP]);

  return (
    <div style={{ position: "absolute", left: x, top: y, width: cellW, height: cellH,
      transform: `translate(${kick}px, ${kickY}px)` }}>
      {/* 拼音(青碧):朗读到本字时跳出 */}
      <div style={{ position: "absolute", left: 0, top: heroMode ? boxT - 104 : Math.round(cellH * 0.11), width: cellW, textAlign: "center",
        fontFamily: latin, fontSize: heroMode ? 92 : s.pinyin, fontWeight: 800, color: c.pinyin, opacity: pinyinOp,
        transform: `scale(${1 + readPulse * 0.12})`, transformOrigin: "center", letterSpacing: 1 }}>{ch.py}</div>

      {/* 田字格 */}
      <div style={{ position: "absolute", left: boxL, top: boxT, width: box, height: box,
        border: `2px solid ${reading ? c.ripple : c.grid}` }} />
      <div style={{ position: "absolute", left: boxL, top: cyL, width: box, height: 0, borderTop: `1.5px dashed ${c.gridCross}` }} />
      <div style={{ position: "absolute", left: cxL, top: boxT, width: 0, height: box, borderLeft: `1.5px dashed ${c.gridCross}` }} />

      {/* 朱墨读标:朗读到本字时的晕圈外扩(朱砂,区别于黑墨炸裂) */}
      {reading ? (
        <div style={{ position: "absolute", left: cxL, top: cyL, width: box * 0.72, height: box * 0.72,
          transform: `translate(-50%,-50%) scale(${0.5 + readRipple * 1.05})`, borderRadius: "50%",
          border: `4px solid ${c.ripple}`, opacity: (1 - readRipple) * 0.5 }} />
      ) : null}

      {/* 持续外扩的墨轮(环状,中心留白露字):整个炸裂段都在向外滲,把 1.6s 撑满 */}
      {tb >= 0 && tb < EXP ? (
        <div style={{ position: "absolute", left: cxL, top: cyL, width: box * 1.1, height: box * 1.1,
          transform: `translate(-50%,-50%) scale(${interpolate(tb, [0, EXP * 0.7], [0.4, 2.6], cl)}) rotate(${tb * 2}deg)`,
          borderRadius: "50%", mixBlendMode: "multiply", filter: "blur(7px)",
          background: `radial-gradient(circle, transparent 0%, transparent 27%, ${c.ink} 44%, ${c.ink} 55%, transparent 76%)`,
          opacity: interpolate(tb, [0, EXP * 0.12, EXP * 0.82, EXP], [0, 0.55, 0.4, 0], cl) }} />
      ) : null}
      {/* 初击闪墨:第一帧一记浓墨爆闪 */}
      {tb >= 0 && tb < 10 ? (
        <div style={{ position: "absolute", left: cxL, top: cyL, width: box, height: box,
          transform: `translate(-50%,-50%) scale(${interpolate(tb, [0, 9], [0.5, 2], cl)})`, borderRadius: "50%",
          background: `radial-gradient(circle, ${c.ink} 0%, transparent 60%)`, mixBlendMode: "multiply",
          opacity: interpolate(tb, [0, 2, 10], [0, 0.5, 0], cl), filter: "blur(8px)" }} />
      ) : null}

      {/* 墨滴飞溅 + 多道湿墨冲击环(SVG;湍流位移让墨边不规则滲开) */}
      <svg viewBox={`0 0 ${cellW} ${cellH}`} width={cellW} height={cellH}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "multiply" }}>
        <defs>
          <filter id={uid} x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.021" numOctaves={2} seed={cp % 97} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${uid}-b`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.7" />
          </filter>
        </defs>
        {/* 三道错时的湿墨冲击环 */}
        {[0, Math.round(EXP * 0.33), Math.round(EXP * 0.66)].map((off, k) => {
          const rt = tb - off, dur = 22;
          if (rt < 0 || rt > dur) return null;
          const rad = 30 + rt * 19;
          const op = (1 - rt / dur) * 0.55;
          return (
            <circle key={k} cx={cxL} cy={cyL} r={rad} fill="none"
              stroke={k === 1 ? c.ripple : c.ink} strokeWidth={Math.max(2, 15 * (1 - rt / dur))}
              opacity={op} filter={`url(#${uid})`} />
          );
        })}
        {/* 墨滴:三波续飞(blur 使其为墨渍质感;不逐颗湍流以保渲染速度) */}
        <g filter={`url(#${uid}-b)`}>
          {parts.map((p, i) => {
            const lt = tb - p.birth;
            if (lt < 0 || lt >= p.life) return null;
            const prog = lt / p.life;
            const reach = p.spd * lt * (1 - prog * 0.4);
            const px = cxL + Math.cos(p.a) * reach + p.drift * lt;
            const py = cyL + Math.sin(p.a) * reach + 0.5 * 0.55 * lt * lt * (p.size / 28);
            const op = (1 - prog) * 0.95;
            const sc = 0.55 + prog * 1.1;
            const rx = (p.size / 2) * sc, ry = rx * p.asp;
            return (
              <g key={i} transform={`translate(${px} ${py}) rotate(${p.rot + prog * 50})`}>
                <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={p.seal ? c.ripple : c.ink} opacity={op} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 简笔→线条字(湿墨边),炸裂后淡出(墨被炸飞、露出毛笔字);朗读到本字时脉动+朱光 */}
      <svg viewBox="0 0 100 100" width={box} height={box} style={{ position: "absolute", left: boxL, top: boxT,
        overflow: "visible", opacity: 1 - realP, filter: `url(#${uid})${readGlow}`,
        transform: `scale(${1 + readPulse * 0.06})`, transformOrigin: "center" }}>
        {strokes.map((p, i) => (
          <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={c.ink} strokeWidth={4.6}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
        ))}
      </svg>
      {ch.extra ? (
        <svg viewBox="0 0 100 100" width={box} height={box} style={{ position: "absolute", left: boxL, top: boxT,
          overflow: "visible", opacity: interpolate(morphP, [0, 0.6], [1, 0], cl) * (1 - realP) }}>
          {ch.extra.map((p, i) => (
            <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={c.ink} strokeWidth={4.2}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
          ))}
        </svg>
      ) : null}

      {/* 真实毛笔字:飞白扫写(左→右 clip)+ 由糊变锐 + 弹簧过冲 */}
      <div style={{ position: "absolute", left: boxL, top: boxT, width: box, height: box, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: heroMode ? 480 : s.char, color: c.ink,
        opacity: realP, transform: `scale(${charScale * (1 + readPulse * 0.05)})`, transformOrigin: "center",
        clipPath: `inset(0 ${(1 - writeP) * 100}% 0 0)`, filter: `blur(${(1 - writeP) * 3}px)${readGlow}` }}>{ch.c}</div>

      {/* 越南文(深红) */}
      {ch.vi ? (
        <div style={{ position: "absolute", left: 0, top: Math.round(cellH * 0.775), width: cellW, textAlign: "center",
          fontFamily: latin, fontSize: s.vi, fontWeight: 800, color: c.vi, opacity: realP }}>{ch.vi}</div>
      ) : null}
    </div>
  );
};

// 冷开场:全屏单字英雄镜头(script.intro 指定,如「日」),1 秒内 画→字→炸,把格式教给冷启观众再进九宫格。
const HeroScene: React.FC<{ beat: Beat; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ beat, g, c, s, zh, latin }) => {
  const ch = beat.chars?.[0];
  if (!ch) return null;
  return (
    <AbsoluteFill>
      <CellInkburst ch={ch} ci={0} g={g} c={c} s={s} zh={zh} latin={latin} hero />
      <Sequence from={ch.readFrame} layout="none"><Audio src={staticFile(ch.audio)} /></Sequence>
    </AbsoluteFill>
  );
};

// 顶部引导文字条:常驻画面顶部(格子已让位),按 spans 分时段换文案,段间淡入淡出;纯视觉无配音。
const TopBanner: React.FC<{ b: Banner; c: Colors; latin: string; fps: number }> = ({ b, c, latin, fps }) => {
  const f = useCurrentFrame();
  return (
    <>
      {b.spans.map((sp, i) => {
        const from = ms2f(sp.fromMs, fps), to = ms2f(sp.toMs, fps);
        const op = interpolate(f, [from, from + 8], [0, 1], cl) * interpolate(f, [to - 8, to], [1, 0], cl);
        if (op <= 0.001) return null;
        return (
          <div key={i} style={{ position: "absolute", left: (1080 - b.width) / 2, top: b.y, width: b.width,
            textAlign: "center", opacity: op }}>
            {sp.lines.map((l, j) => (
              <div key={j} style={{ fontFamily: latin, fontWeight: 900, lineHeight: 1.2, marginTop: j ? b.lineGap : 0,
                fontSize: j === 0 ? b.fontSize : b.fontSize2, color: j === 0 ? c.ink : c.vi }}>{l}</div>
            ))}
          </div>
        );
      })}
    </>
  );
};

const GroupGrid: React.FC<{ group: Beat; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ group, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, g.groupFrames - 4, g.groupFrames], [0, 1, 1, 0], cl);
  const chars = group.chars ?? [];
  const burst = g.mode === "inkburst";
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {chars.map((ch, i) => burst
        ? <CellInkburst key={ch.c} ch={ch} ci={i} g={g} c={c} s={s} zh={zh} latin={latin} />
        : <Cell key={ch.c} ch={ch} ci={i} g={g} c={c} s={s} zh={zh} latin={latin} />)}
      {chars.map((ch) => (
        <Sequence key={`a-${ch.c}`} from={ch.readFrame} layout="none"><Audio src={staticFile(ch.audio)} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const GridScene: React.FC<{ beats: Beat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const m = meta as unknown as { grid: Grid; colors: Colors; sizes: Sizes; banner?: Banner };
  const g = m.grid, c = m.colors, s = m.sizes;
  const fps = meta.fps;
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zh = stackCss(fontCfg.zhStack);
  const latin = stackCss(fontCfg.latinStack);
  let off = 0;
  const segs = beats.map((b) => {
    const dur = ms2f(b.durationMs, fps);
    const from = off; off += dur;
    return (
      <Sequence key={b.id} from={from} durationInFrames={dur}>
        {b.hero
          ? <HeroScene beat={b} g={g} c={c} s={s} zh={zh} latin={latin} />
          : <GroupGrid group={b} g={g} c={c} s={s} zh={zh} latin={latin} />}
      </Sequence>
    );
  });
  return (
    <AbsoluteFill style={{ backgroundColor: c.paper }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 50% 42%, rgba(0,0,0,0) 60%, rgba(120,90,40,0.14) 100%)" }} />
      {segs}
      {m.banner ? <TopBanner b={m.banner} c={c} latin={latin} fps={fps} /> : null}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "hsk-ziyuan",
  segments: (beats: RenderBeat[]) => [beats],
  transitionOf: () => "fade",
  Segment: ({ beats, meta }) => <GridScene beats={beats as unknown as Beat[]} meta={meta} />,
};
