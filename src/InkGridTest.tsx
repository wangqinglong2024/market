// 九宫格识字。9:16,上下留白各2格/左右各0.5格(1格=120px),内容区8×12→2×2共4格(每格480×720),一格一字。
// ★核心:每字有『简笔图 pic』和『线条汉字 chr』两套同构笔画(相同笔数/点数),整组4秒内逐点几何演变(pic→chr),
//   4格共用同一进度=完全同步、连续、无突变;汉字也是线条画(非毛笔),顺其自然长成。
// 朗读独立:1秒读一个(读到时才触发水墨韵律:墨晕环+脉动+辉光);第1秒山未成形即已开读。3组=12字=12秒。
// 版式:田字格居中,字垂直居中格内,拼音在上(青碧),越南文在下(深红)。纯代码+复用发音库。
import {
  AbsoluteFill, Sequence, Audio, interpolate, staticFile, useCurrentFrame,
  delayRender, continueRender, Easing,
} from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";

type Pt = [number, number];
type Zi = { id: string; c: string; py: string; vi: string; pic: Pt[][]; chr: Pt[][] };

const PAPER = "#ece1c9";
const INK = "#241c11";
const PY_COL = "#2c6e75";  // 拼音:青碧
const VI_COL = "#8f1d1d";  // 越南文:深红
const RIPPLE = "#8f1d1d";
const GRID = "rgba(120,90,40,0.30)";
const GRIDX = "rgba(120,90,40,0.16)";
const LATIN = '"Nunito", "PingFang SC", sans-serif'; // 柔和圆润·完整越南语+拼音声调

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const morphStroke = (A: Pt[], B: Pt[], p: number): Pt[] => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
const dOf = (p: Pt[]) => "M " + p.map(([x, y]) => `${x} ${y}`).join(" L ");

// 每字:pic(简笔图) ↔ chr(线条汉字),同构(笔数/每笔点数一致)→逐点插值演变。
const DATA: Zi[][] = [
  [
    { id: "shan", c: "山", py: "shān", vi: "núi",
      pic: [[[12,70],[88,70]],[[16,70],[30,45],[44,70]],[[36,70],[52,28],[68,70]],[[58,70],[74,49],[88,70]]],
      chr: [[[18,68],[82,68]],[[30,68],[30,48],[30,68]],[[50,68],[50,25],[50,68]],[[72,68],[72,46],[72,68]]] },
    { id: "shui", c: "水", py: "shuǐ", vi: "nước",
      pic: [[[50,26],[45,42],[54,57],[48,72]],[[40,40],[31,49]],[[36,56],[29,66]],[[62,42],[71,54]]],
      chr: [[[50,24],[50,45],[50,60],[52,73]],[[50,42],[35,32]],[[46,52],[32,68]],[[50,48],[67,66]]] },
    { id: "huo", c: "火", py: "huǒ", vi: "lửa",
      pic: [[[41,52],[36,40]],[[59,52],[64,40]],[[50,28],[41,66]],[[50,42],[59,66]]],
      chr: [[[38,44],[33,54]],[[62,44],[67,54]],[[52,28],[36,72]],[[50,46],[65,72]]] },
    { id: "mu", c: "木", py: "mù", vi: "cây",
      pic: [[[34,36],[66,36]],[[50,28],[50,74]],[[50,44],[34,60]],[[50,44],[66,60]]],
      chr: [[[28,42],[72,42]],[[50,28],[50,74]],[[50,42],[32,68]],[[50,42],[68,68]]] },
  ],
  [
    { id: "ri", c: "日", py: "rì", vi: "mặt trời",
      pic: [[[37,31],[63,31],[63,69],[37,69],[37,31]],[[47,50],[53,50]]],
      chr: [[[38,28],[62,28],[62,72],[38,72],[38,28]],[[38,50],[62,50]]] },
    { id: "yue", c: "月", py: "yuè", vi: "trăng",
      pic: [[[58,26],[46,33],[42,50],[46,67],[58,74]],[[58,30],[50,39],[48,50],[50,61],[58,70]]],
      chr: [[[47,26],[43,44],[43,58],[45,72],[47,74]],[[47,26],[62,29],[62,50],[62,71],[57,74]]] },
    { id: "ren", c: "人", py: "rén", vi: "người",
      pic: [[[50,28],[34,72]],[[50,28],[66,72]]],
      chr: [[[50,26],[32,74]],[[52,42],[68,74]]] },
    { id: "kou", c: "口", py: "kǒu", vi: "miệng",
      pic: [[[38,36],[62,36],[62,64],[38,64],[38,36]]],
      chr: [[[36,34],[64,34],[64,66],[36,66],[36,34]]] },
  ],
  [
    { id: "yu", c: "雨", py: "yǔ", vi: "mưa",
      pic: [[[28,34],[72,34]],[[28,34],[28,46]],[[72,34],[72,46]],[[38,52],[38,64]],[[50,54],[50,68]],[[62,52],[62,64]]],
      chr: [[[26,30],[74,30]],[[34,38],[34,72]],[[66,38],[66,72]],[[50,40],[50,72]],[[42,52],[42,62]],[[58,52],[58,62]]] },
    { id: "tian", c: "田", py: "tián", vi: "ruộng",
      pic: [[[36,30],[64,30],[64,70],[36,70],[36,30]],[[50,30],[50,70]],[[36,50],[64,50]]],
      chr: [[[36,30],[64,30],[64,70],[36,70],[36,30]],[[50,30],[50,70]],[[36,50],[64,50]]] },
    { id: "mueye", c: "目", py: "mù", vi: "mắt",
      pic: [[[34,50],[50,36],[66,50],[50,64],[34,50]],[[42,46],[58,46]],[[42,55],[58,55]]],
      chr: [[[38,30],[62,30],[62,70],[38,70],[38,30]],[[38,44],[62,44]],[[38,57],[62,57]]] },
    { id: "xin", c: "心", py: "xīn", vi: "tim",
      pic: [[[50,66],[34,50],[36,37],[46,37],[50,46],[54,37],[64,37],[66,50],[50,66]]],
      chr: [[[32,47],[35,61],[47,67],[59,63],[66,52],[61,46],[52,51],[45,45],[40,49]]] },
  ],
];

const X0 = 60, Y0 = 240, CW = 480, CH = 720;
const CELLS = [
  { x: X0, y: Y0 }, { x: X0 + CW, y: Y0 },
  { x: X0, y: Y0 + CH }, { x: X0 + CW, y: Y0 + CH },
];
const READ = 30;
const BOX = 340;

const Cell: React.FC<{ zi: Zi; x: number; y: number; readAt: number; zh: string }> = ({ zi, x, y, readAt, zh }) => {
  const f = useCurrentFrame();
  const cl = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  // ★前3秒:4字一起、逐点几何演变成线条字(与朗读无关)。
  const drawP = interpolate(f, [2, 16], [0, 1], cl);
  const morphP = interpolate(f, [16, 86], [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });
  // ★最后1秒:线条字 → 真实毛笔字(每组都这样收尾)。
  const realP = interpolate(f, [90, 114], [0, 1], { ...cl, easing: Easing.inOut(Easing.ease) });
  // 朗读层(独立)。
  const infoP = interpolate(f, [readAt + 2, readAt + 18], [0, 1], cl);
  const t = (f - readAt) / READ;
  const active = t >= 0 && t <= 1.05;
  const pulse = active ? Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI) : 0;
  const ripple = interpolate(f, [readAt, readAt + 26], [0, 1], cl);

  const bx = x + (CW - BOX) / 2, by = y + (CH - BOX) / 2;
  const cx = bx + BOX / 2, cy = by + BOX / 2;
  const strokes = zi.pic.map((p, i) => morphStroke(p, zi.chr[i], morphP));

  return (
    <>
      <div style={{ position: "absolute", left: x, top: y + 86, width: CW, textAlign: "center",
        fontFamily: LATIN, fontSize: 68, fontWeight: 800, color: PY_COL, opacity: infoP, letterSpacing: 1 }}>{zi.py}</div>

      <div style={{ position: "absolute", left: bx, top: by, width: BOX, height: BOX, border: `2px solid ${GRID}` }} />
      <div style={{ position: "absolute", left: bx, top: cy, width: BOX, height: 0, borderTop: `1.5px dashed ${GRIDX}` }} />
      <div style={{ position: "absolute", left: cx, top: by, width: 0, height: BOX, borderLeft: `1.5px dashed ${GRIDX}` }} />

      {active ? (
        <div style={{ position: "absolute", left: cx - BOX / 2, top: cy - BOX / 2, width: BOX, height: BOX, borderRadius: "50%",
          border: `3px solid ${RIPPLE}`, opacity: (1 - ripple) * 0.45, transform: `scale(${0.5 + ripple * 0.9})` }} />
      ) : null}

      {/* 图↔线条字:同一套线条逐点演变(前3秒),末秒淡出让位真实字 + 读到时脉动 */}
      <svg viewBox="0 0 100 100" width={BOX} height={BOX} style={{ position: "absolute", left: bx, top: by, overflow: "visible",
        opacity: 1 - realP, transform: `scale(${(1 + pulse * 0.07) * (1 - realP * 0.04)})`, transformOrigin: "center",
        filter: pulse > 0.02 ? `drop-shadow(0 0 ${14 * pulse}px rgba(143,29,29,${0.55 * pulse}))` : "none" }}>
        {strokes.map((p, i) => (
          <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={INK} strokeWidth={4.6}
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - drawP} />
        ))}
      </svg>
      {/* 最后1秒:真实毛笔字浮现 */}
      <div style={{ position: "absolute", left: bx, top: by, width: BOX, height: BOX, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: zh, fontSize: 268, color: INK,
        opacity: realP, transform: `scale(${interpolate(realP, [0, 1], [0.96, 1]) + pulse * 0.07})`, transformOrigin: "center",
        filter: pulse > 0.02 ? `drop-shadow(0 0 ${14 * pulse}px rgba(143,29,29,${0.55 * pulse}))` : "none" }}>{zi.c}</div>

      <div style={{ position: "absolute", left: x, top: y + 558, width: CW, textAlign: "center",
        fontFamily: LATIN, fontSize: 56, fontWeight: 800, color: VI_COL, opacity: infoP }}>{zi.vi}</div>
    </>
  );
};

const Batch: React.FC<{ zis: Zi[]; zh: string }> = ({ zis, zh }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, 116, 120], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      {zis.map((zi, i) => <Cell key={zi.id} zi={zi} x={CELLS[i].x} y={CELLS[i].y} readAt={i * READ} zh={zh} />)}
    </AbsoluteFill>
  );
};

export const InkGridTest: React.FC = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      loadFonts(DEFAULT_FONTS),
      loadFonts({ files: [{ family: "Nunito", file: "library/fonts/Nunito.ttf", weight: "400 900" }] }),
    ]).finally(() => continueRender(h));
  }, [h]);
  const zh = stackCss(DEFAULT_FONTS.zhStack);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 50% 42%, rgba(0,0,0,0) 60%, rgba(120,90,40,0.14) 100%)" }} />
      {DATA.map((zis, b) => (
        <Sequence key={b} from={b * 120} durationInFrames={120}>
          <Batch zis={zis} zh={zh} />
        </Sequence>
      ))}
      {DATA.map((zis, b) => zis.map((zi, i) => (
        <Sequence key={`a-${zi.id}`} from={b * 120 + i * READ} durationInFrames={READ} layout="none">
          <Audio src={staticFile(`library/tts-hanzi/${zi.id}.mp3`)} />
        </Sequence>
      )))}
    </AbsoluteFill>
  );
};
