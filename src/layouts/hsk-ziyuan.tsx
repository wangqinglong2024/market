// 版式「hsk-ziyuan」：HSK字源·九宫格识字(越南受众·9:16竖屏)。数据驱动(manifest.meta.grid/colors/sizes + beats)。
// ★两种子模板(meta.grid.mode):parallel(纯字版)=4字同时演变+朗读独立逐字;inkburst(炸裂墨韵版)=蓄势后一记墨炸弹爆破。
// 每字:具象简笔(+extra细节淡出抽象)→线条字→末段真实毛笔字;读到触发水墨韵律。单段渲染,组按时长顺序切窗。
// 子模板清单见 templates/hsk-ziyuan/SUBTEMPLATES.md。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring, Easing,
} from "remotion";
import { useMemo } from "react";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Manifest, LayoutModule, RenderBeat } from "./types";

type Pt = [number, number];
type Ch = { c: string; py: string; vi: string; pic: Pt[][]; chr: Pt[][]; extra?: Pt[][]; audio: string; slot: number; readFrame: number };
type Beat = RenderBeat & { chars?: Ch[]; hero?: boolean };
type Grid = {
  mode?: string; x0: number; y0: number; cellW: number; cellH: number; box: number; groupFrames: number;
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
  const col = ci % 2, row = Math.floor(ci / 2);
  const x = g.x0 + col * g.cellW, y = g.y0 + row * g.cellH;

  // parallel:4 字【严格同步同速】演变——draw/morph 全用【线性】(匀速),4格进度逐帧完全一致,
  //   不用 ease(ease 会在中段加速,放大不同字的形变差,看着「有的快有的慢」);朗读独立逐字。
  const drawP = interpolate(f, g.draw, [0, 1], cl);
  const morphP = interpolate(f, g.morph, [0, 1], cl);
  const realP = interpolate(f, g.real, [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });

  const readLen = g.readFrames ?? 36;
  const rr = (f - ch.readFrame) / readLen;
  const active = rr >= 0 && rr <= 1.05;
  const pulse = active ? Math.sin(Math.min(Math.max(rr, 0), 1) * Math.PI) : 0;
  const ripple = interpolate(f, [ch.readFrame, ch.readFrame + 24], [0, 1], cl);
  const infoP = interpolate(f, [ch.readFrame + 2, ch.readFrame + 18], [0, 1], cl);

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

      {/* 演变期不加朗读脉动缩放(否则被读的字会「鼓一下」,破坏同步感);朗读特殊显示=朱晕+朱光+拼音/越南文跳出 */}
      <svg viewBox="0 0 100 100" width={g.box} height={g.box} style={{ position: "absolute", left: bx, top: by, overflow: "visible",
        opacity: 1 - realP, transform: `scale(${1 - realP * 0.04})`, transformOrigin: "center", filter: glow }}>
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

// ★炸裂墨韵版(inkburst 子模板)。节奏(用户 2026-07-21 重定):蓄势 easeIn 慢起急收 → burst 一记「墨炸弹」。
//   ★无任何圆环——不规则随机墨迹炸裂开:frame0 中央巨墨爆体砸碎(湍流打散·非正圆)+ 数十枚墨弹【全随机角度】
//   一齐高速甩飞(三档 chunk/shard/mist;初速极高→阻力急停 reach=v0·τ·(1-e^-t/τ),拉成彗尾/飞白甩条,
//   落点收成不规则墨渍留宣纸);中央毛笔字被砸进画面(scale 过冲 punch + 飞白由糊变锐)+ 整格硬震(指数衰减)。
//   hero=true 为全屏单字冷开场(1秒直接炸出字再读)。继承 app 水墨语义(01-ink-wash),SVG feTurbulence 把象征升成真墨。
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

  // 时序:蓄势(draw→morph,easeIn 慢起急收)→ burst → 爆破 EXP 帧
  const drawR = heroMode ? (g.introDraw ?? g.draw) : g.draw;
  const morphR = heroMode ? (g.introMorph ?? g.morph) : g.morph;
  const burst = heroMode ? (g.introBurst ?? g.real[0]) : (g.burst ?? g.real[0]);
  const groupFrames = heroMode ? (g.introFrames ?? g.groupFrames) : g.groupFrames;
  const EXP = Math.max(12, groupFrames - burst);
  const tb = f - burst;           // 距爆炸帧(<0 为蓄势)
  const det = Math.max(0, tb);    // 爆后帧数(clamp≥0)

  // 演变期【线性匀速】:4格进度逐帧完全一致、同速同步(不用 ease,避免「有的快有的慢」);张力交给 burst 爆破本身。
  const drawP = interpolate(f, drawR, [0, 1], cl);
  const morphP = interpolate(f, morphR, [0, 1], cl);

  // 毛笔字被「砸」进画面:scale 过冲 punch + 飞白(blur 由糊变锐),不再左→右扫写(扫写太温柔)
  const revealLen = heroMode ? 8 : 12;
  const realP = interpolate(f, [burst, burst + revealLen], [0, 1], cl);
  const clear = interpolate(f, [burst, burst + revealLen - 1], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: det, fps, config: { damping: 9, mass: 0.6, stiffness: 210 } });
  const breathe = tb > revealLen ? Math.sin((tb - revealLen) * 0.2) * 0.015 : 0;
  const charScale = tb < 0 ? 1 : lerp(1.3, 1.0, Math.min(1, pop)) + breathe;

  // 整格硬震:爆瞬最猛,~8 帧指数衰减(炸弹冲击,不是柔性余震)
  const kAmp = tb >= 0 ? Math.exp(-det / 4) * (heroMode ? 30 : 20) : 0;
  const kick = tb >= 0 ? Math.sin(det * 2.4) * kAmp : 0;
  const kickY = tb >= 0 ? Math.cos(det * 2.0) * kAmp * 0.55 : 0;

  // 湿墨边湍流位移:爆瞬猛烈→指数衰减(不再持续沸腾)
  const disp = 2 + (tb >= 0 ? Math.exp(-det / 6) * 15 : 0);

  const strokes = ch.pic.map((p, i) => morphStroke(p, ch.chr[i], morphP));

  // ★朱墨读标(与炸裂无关):朗读到本字时,该格亮朱墨——晕圈外扩 + 朱光 + 拼音跳出 + 轻脉动。
  const readLen = 16;
  const rr = (f - ch.readFrame) / readLen;
  const reading = rr >= 0 && rr <= 1.1;
  const readPulse = reading ? Math.sin(Math.min(Math.max(rr, 0), 1) * Math.PI) : 0;
  const readGlow = readPulse > 0.02 ? ` drop-shadow(0 0 ${16 * readPulse}px ${c.ripple})` : "";
  const pinyinOp = Math.max(realP, readPulse);

  // ★墨弹:全部 frame0 一齐炸出(瞬时齐射)。角度【全随机】→ 随机团块/空隙 = 不规则墨迹,不是均匀圆。
  //   三档:chunk(巨墨块·主爆体)/ shard(中·多带飞白甩条)/ mist(细沫·飞散)。初速极高→阻力急停
  //   (reach=v0·τ·(1-e^-t/τ)),飞行段被拉成彗尾/飞白条,减速收圆;settle 落点收成不规则墨渍留宣纸,其余飞散淡出。
  const parts = useMemo(() => {
    const r = rng(cp * 131 + ci * 7919);
    const N = heroMode ? 108 : 78;
    const scl = heroMode ? 1.5 : 1;   // 全屏冷开场墨弹更大更远
    const arr: { ang: number; v0: number; tau: number; size: number; asp: number; settle: boolean; life: number; grav: number; streak: boolean; seal: boolean }[] = [];
    for (let i = 0; i < N; i++) {
      const ang = r() * Math.PI * 2;                             // 全随机角度 → 不规则
      const t = r();
      let v0, size, tau, streak;
      if (t < 0.2) {          // chunk 巨墨块:慢而大,构成主爆体
        v0 = (7 + r() * 9) * scl; size = (30 + r() * 42) * scl; tau = 4 + r() * 3; streak = false;
      } else if (t < 0.58) {  // shard 中弹:快,多带飞白甩条
        v0 = (16 + r() * 20) * scl; size = (10 + r() * 18) * scl; tau = 3 + r() * 3; streak = r() < 0.5;
      } else {                // mist 细沫:最快,飞散
        v0 = (22 + r() * 30) * scl; size = (4 + r() * 9) * scl; tau = 2.6 + r() * 3; streak = r() < 0.4;
      }
      const asp = 0.3 + r() * 0.45;
      const settle = r() < 0.55;                                 // 落点留渍 or 飞散淡出
      const life = settle ? EXP : Math.round(14 + r() * 16);
      const grav = 0.5 + r() * 0.9;
      const seal = r() < 0.12;                                   // 朱砂点缀
      arr.push({ ang, v0, tau, size, asp, settle, life, grav, streak, seal });
    }
    return arr;
  }, [cp, ci, EXP, heroMode]);

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

      {/* 朱墨读标:朗读到本字时的『特殊显示』——不规则朱砂晕(无圆环)+ 脉动;box 边框也转朱 */}
      {reading ? (
        <div style={{ position: "absolute", left: cxL, top: cyL, width: box * 0.92, height: box * 0.92,
          transform: `translate(-50%,-50%) scale(${0.65 + readPulse * 0.4})`,
          borderRadius: "46% 54% 52% 48% / 50% 47% 53% 50%",
          background: `radial-gradient(circle, ${c.ripple} 0%, transparent 60%)`,
          opacity: readPulse * 0.3, filter: "blur(11px)", mixBlendMode: "multiply" }} />
      ) : null}

      {/* 中央巨墨爆体(BANG):frame0 一记浓墨硬核砸碎;湍流+高位移打散成不规则块,非正圆,无任何圆环;短促,交给墨弹撑场 */}
      {tb >= 0 && tb < 5 ? (
        <div style={{ position: "absolute", left: cxL, top: cyL, width: box * 0.82, height: box * 0.82,
          transform: `translate(-50%,-50%) scale(${interpolate(det, [0, 4], [0.3, 1.5], cl)}) rotate(${(cp % 8) * 24}deg)`,
          borderRadius: "38% 62% 45% 55% / 58% 40% 60% 42%",
          background: `radial-gradient(circle, ${c.ink} 0%, ${c.ink} 22%, transparent 58%)`,
          mixBlendMode: "multiply", filter: `url(#${uid}) blur(1.5px)`,
          opacity: interpolate(det, [0, 1, 5], [0, 0.6, 0], cl) }} />
      ) : null}

      {/* 墨弹飞溅(SVG;湍流位移让墨边不规则滲开) */}
      <svg viewBox={`0 0 ${cellW} ${cellH}`} width={cellW} height={cellH}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "multiply" }}>
        <defs>
          <filter id={uid} x="-70%" y="-70%" width="240%" height="240%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.02" numOctaves={2} seed={cp % 97} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={`${uid}-b`} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
        {/* 墨弹:frame0 齐射,减速外飞;飞行段被拉成彗尾/飞白条,减速收圆,settle 落点留渍 */}
        <g filter={`url(#${uid}-b)`}>
          {parts.map((p, i) => {
            if (tb < 0 || det >= p.life) return null;
            const lt = det;
            const prog = lt / p.life;
            const cosA = Math.cos(p.ang), sinA = Math.sin(p.ang);
            const speed = p.v0 * Math.exp(-lt / p.tau);
            const reach = p.v0 * p.tau * (1 - Math.exp(-lt / p.tau));
            const sag = 0.5 * p.grav * Math.max(0, lt - p.tau) ** 2 * 0.03 * (p.size / 22);
            const px = cxL + cosA * reach;
            const py = cyL + sinA * reach + sag;
            const stretch = (0.5 + speed * (p.streak ? 0.4 : 0.16)) * (p.streak ? 2.1 : 1);
            const rx = (p.size / 2) * Math.max(1, stretch);
            const ry = (p.size / 2) * (p.streak ? p.asp * 0.5 : p.asp);
            const op = p.settle
              ? interpolate(prog, [0, 0.04, 0.85, 1], [0, 0.9, 0.85, 0.7], cl)
              : (1 - prog) * 0.92;
            const deg = (p.ang * 180) / Math.PI;
            return (
              <g key={i} transform={`translate(${px} ${py}) rotate(${deg})`}>
                <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={p.seal ? c.ripple : c.ink} opacity={op} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 简笔→线条字(湿墨边),炸裂后淡出(墨被炸飞、露出毛笔字);朗读特殊显示=朱光,不加脉动缩放(保同步感) */}
      <svg viewBox="0 0 100 100" width={box} height={box} style={{ position: "absolute", left: boxL, top: boxT,
        overflow: "visible", opacity: 1 - realP, filter: `url(#${uid})${readGlow}`, transformOrigin: "center" }}>
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

      {/* 真实毛笔字:被爆开的墨砸进画面——scale 过冲 punch + 飞白(blur 由糊变锐) */}
      <div style={{ position: "absolute", left: boxL, top: boxT, width: box, height: box, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: heroMode ? 480 : s.char, color: c.ink,
        opacity: realP, transform: `scale(${charScale * (1 + readPulse * 0.05)})`, transformOrigin: "center",
        filter: `blur(${(1 - clear) * 4}px)${readGlow}` }}>{ch.c}</div>

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
  const m = meta as unknown as { grid: Grid; colors: Colors; sizes: Sizes };
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
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "hsk-ziyuan",
  segments: (beats: RenderBeat[]) => [beats],
  transitionOf: () => "fade",
  Segment: ({ beats, meta }) => <GridScene beats={beats as unknown as Beat[]} meta={meta} />,
};
