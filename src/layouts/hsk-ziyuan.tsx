// 版式「hsk-ziyuan」：HSK字源·九宫格识字(越南受众·9:16竖屏)。数据驱动(manifest.meta.grid/colors/sizes + beats)。
// ★两种模式(meta.grid.seq):parallel=4字同时演变+朗读独立逐字;sequential=逐个来,每字独占slot走完全程+朗读,4格逐格填入保留。
// ★开头钩子/结尾CTA=覆盖在第一组/最后一组的字上(居中空隙带·带越南语配音·说完淡出),用 Sequence 套在组内→绝不增加总时长。
// 每字:具象简笔(+extra细节淡出抽象)→线条字→末段真实毛笔字;读到触发水墨韵律。单段渲染,组按时长顺序切窗。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, Easing,
} from "remotion";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Manifest, LayoutModule, RenderBeat } from "./types";

type Pt = [number, number];
type Ch = { c: string; py: string; vi: string; pic: Pt[][]; chr: Pt[][]; extra?: Pt[][]; audio: string; slot: number; readFrame: number };
type Overlay = { lines: string[]; audio?: string; frames: number };
type Beat = RenderBeat & { chars?: Ch[]; overlayIn?: Overlay; overlayOut?: Overlay };
type Grid = {
  seq: boolean; x0: number; y0: number; cellW: number; cellH: number; box: number; groupFrames: number;
  draw: [number, number]; morph: [number, number]; real: [number, number]; readFrames: number | null;
};
type Colors = { paper: string; ink: string; pinyin: string; vi: string; ripple: string; grid: string; gridCross: string };
type Sizes = { pinyin: number; vi: number; char: number };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const morphStroke = (A: Pt[], B: Pt[], p: number): Pt[] => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
const dOf = (p: Pt[]) => "M " + p.map(([x, y]) => `${x} ${y}`).join(" L ");
const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ms2f = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

const Cell: React.FC<{ ch: Ch; ci: number; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ ch, ci, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const seq = g.seq;
  const col = ci % 2, row = Math.floor(ci / 2);
  const x = g.x0 + col * g.cellW, y = g.y0 + row * g.cellH;

  const base = f - ch.slot;
  const drawP = interpolate(base, g.draw, [0, 1], cl);
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
      <div style={{ position: "absolute", left: x, top: y + 86, width: g.cellW, textAlign: "center",
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

      <div style={{ position: "absolute", left: x, top: y + 558, width: g.cellW, textAlign: "center",
        fontFamily: latin, fontSize: s.vi, fontWeight: 800, color: c.vi, opacity: infoP }}>{ch.vi}</div>
    </>
  );
};

// 覆盖式文字卡:居中(落在上下两排格子的空隙带),半透明宣纸底板→文字清晰不与笔画重影,四周网格仍可见;带越南语配音,淡入淡出。
const OverlayCard: React.FC<{ ov: Overlay; c: Colors; latin: string }> = ({ ov, c, latin }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 6], [0, 1], cl) * interpolate(f, [ov.frames - 8, ov.frames], [1, 0], cl);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{ width: 950, textAlign: "center", padding: "30px 44px", borderRadius: 30,
        background: "rgba(236,225,201,0.74)", boxShadow: "0 0 40px 24px rgba(236,225,201,0.74)" }}>
        {ov.lines.map((l, i) => (
          <div key={i} style={{ fontFamily: latin, fontWeight: 900, lineHeight: 1.22, marginTop: i ? 22 : 0,
            fontSize: i === 0 ? 66 : 48, color: i === 0 ? c.ink : (i % 2 ? c.vi : c.pinyin) }}>{l}</div>
        ))}
      </div>
      {ov.audio ? <Audio src={staticFile(ov.audio)} /> : null}
    </AbsoluteFill>
  );
};

const GroupGrid: React.FC<{ group: Beat; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ group, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, g.groupFrames - 4, g.groupFrames], [0, 1, 1, 0], cl);
  const chars = group.chars ?? [];
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {chars.map((ch, i) => <Cell key={ch.c} ch={ch} ci={i} g={g} c={c} s={s} zh={zh} latin={latin} />)}
      {chars.map((ch) => (
        <Sequence key={`a-${ch.c}`} from={ch.readFrame} layout="none"><Audio src={staticFile(ch.audio)} /></Sequence>
      ))}
      {group.overlayIn ? (
        <Sequence from={0} durationInFrames={group.overlayIn.frames} layout="none">
          <OverlayCard ov={group.overlayIn} c={c} latin={latin} />
        </Sequence>
      ) : null}
      {group.overlayOut ? (
        <Sequence from={Math.max(0, g.groupFrames - group.overlayOut.frames)} durationInFrames={group.overlayOut.frames} layout="none">
          <OverlayCard ov={group.overlayOut} c={c} latin={latin} />
        </Sequence>
      ) : null}
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
        <GroupGrid group={b} g={g} c={c} s={s} zh={zh} latin={latin} />
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
