// 版式「hsk-ziyuan」：HSK字源·九宫格识字(越南受众·9:16竖屏)。数据驱动(manifest.meta.grid/colors/sizes + beats分组)。
// 每组4字(2×2格),整组4秒内同时逐点几何演变:简笔画→线条字(前3秒),末1秒→真实毛笔字;朗读独立1秒/字,读到触发水墨韵律。
// 单段渲染(整片一条时间线):segments=[allBeats],组用 Sequence 切窗;骨架/配色/时序全来自 manifest,不写死。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame,
  Easing,
} from "remotion";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Manifest, LayoutModule, RenderBeat } from "./types";

type Pt = [number, number];
type Ch = { c: string; py: string; vi: string; pic: Pt[][]; chr: Pt[][]; audio: string; readFrame: number };
type Group = RenderBeat & { chars: Ch[] };
type Grid = {
  x0: number; y0: number; cellW: number; cellH: number; box: number;
  readFrames: number; groupFrames: number; draw: [number, number]; morph: [number, number]; real: [number, number];
};
type Colors = { paper: string; ink: string; pinyin: string; vi: string; ripple: string; grid: string; gridCross: string };
type Sizes = { pinyin: number; vi: number; char: number };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const morphStroke = (A: Pt[], B: Pt[], p: number): Pt[] => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
const dOf = (p: Pt[]) => "M " + p.map(([x, y]) => `${x} ${y}`).join(" L ");
const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Cell: React.FC<{
  ch: Ch; ci: number; g: Grid; c: Colors; s: Sizes; zh: string; latin: string;
}> = ({ ch, ci, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const col = ci % 2, row = Math.floor(ci / 2);
  const x = g.x0 + col * g.cellW, y = g.y0 + row * g.cellH;
  const readAt = ch.readFrame;

  const drawP = interpolate(f, g.draw, [0, 1], cl);
  const morphP = interpolate(f, g.morph, [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });
  const realP = interpolate(f, g.real, [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });
  const infoP = interpolate(f, [readAt + 2, readAt + 18], [0, 1], cl);
  const t = (f - readAt) / g.readFrames;
  const active = t >= 0 && t <= 1.05;
  const pulse = active ? Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI) : 0;
  const ripple = interpolate(f, [readAt, readAt + 26], [0, 1], cl);

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

      {/* 简笔→线条字:逐点演变;末秒淡出让位真实字 */}
      <svg viewBox="0 0 100 100" width={g.box} height={g.box} style={{ position: "absolute", left: bx, top: by, overflow: "visible",
        opacity: 1 - realP, transform: `scale(${(1 + pulse * 0.07) * (1 - realP * 0.04)})`, transformOrigin: "center", filter: glow }}>
        {strokes.map((p, i) => (
          <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={c.ink} strokeWidth={4.6}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
        ))}
      </svg>
      {/* 末秒:真实毛笔字 */}
      <div style={{ position: "absolute", left: bx, top: by, width: g.box, height: g.box, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: s.char, color: c.ink,
        opacity: realP, transform: `scale(${interpolate(realP, [0, 1], [0.96, 1]) + pulse * 0.07})`, transformOrigin: "center", filter: glow }}>{ch.c}</div>

      <div style={{ position: "absolute", left: x, top: y + 558, width: g.cellW, textAlign: "center",
        fontFamily: latin, fontSize: s.vi, fontWeight: 800, color: c.vi, opacity: infoP }}>{ch.vi}</div>
    </>
  );
};

const GroupGrid: React.FC<{ group: Group; g: Grid; c: Colors; s: Sizes; zh: string; latin: string }> = ({ group, g, c, s, zh, latin }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, g.groupFrames - 4, g.groupFrames], [0, 1, 1, 0], cl);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {group.chars.map((ch, i) => <Cell key={ch.c} ch={ch} ci={i} g={g} c={c} s={s} zh={zh} latin={latin} />)}
      {group.chars.map((ch) => (
        <Sequence key={`a-${ch.c}`} from={ch.readFrame} durationInFrames={g.readFrames} layout="none">
          <Audio src={staticFile(ch.audio)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const GridScene: React.FC<{ beats: Group[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const m = meta as unknown as { grid: Grid; colors: Colors; sizes: Sizes };
  const g = m.grid, c = m.colors, s = m.sizes;
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zh = stackCss(fontCfg.zhStack);
  const latin = stackCss(fontCfg.latinStack);
  return (
    <AbsoluteFill style={{ backgroundColor: c.paper }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 50% 42%, rgba(0,0,0,0) 60%, rgba(120,90,40,0.14) 100%)" }} />
      {beats.map((group, gi) => (
        <Sequence key={group.id} from={gi * g.groupFrames} durationInFrames={g.groupFrames}>
          <GroupGrid group={group} g={g} c={c} s={s} zh={zh} latin={latin} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "hsk-ziyuan",
  segments: (beats: RenderBeat[]) => [beats],   // 单段:整片一条时间线,组用 Sequence 切窗
  transitionOf: () => "fade",
  Segment: ({ beats, meta }) => <GridScene beats={beats as unknown as Group[]} meta={meta} />,
};
