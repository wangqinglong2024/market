// 字源 morph 概念验证(纯 Remotion·零 AI 成本):水墨简笔三峰山 → 收拢straighten成楷书「山」。
// 目的:验证"简笔水墨"风格能不能让"画→字"一眼对上(实景做不到,漫画/水墨能)。
import {
  AbsoluteFill, interpolate, useCurrentFrame,
  Easing, delayRender, continueRender,
} from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";

type Pt = [number, number];
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpPts = (A: Pt[], B: Pt[], p: number): Pt[] => A.map((a, i) => [lerp(a[0], B[i][0], p), lerp(a[1], B[i][1], p)]);
const dOf = (pts: Pt[]) => "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ");

// 视觉坐标系 100×100。水墨三峰(简笔) → 楷书「山」的梳齿骨架(底横 + 三竖)。
// 五笔一一对应,逐点插值 = 山峰"拉直"成字。
const MOUNTAIN: Pt[][] = [
  [[10, 70], [90, 70]],                 // 山脚地平线
  [[12, 70], [25, 36], [38, 70]],       // 左峰 ^
  [[34, 70], [50, 18], [66, 70]],       // 中峰 ^(最高)
  [[62, 70], [75, 42], [88, 70]],       // 右峰 ^
];
const CHAR: Pt[][] = [
  [[18, 70], [82, 70]],                 // 底横
  [[28, 70], [28, 46], [28, 70]],       // 左竖(短)
  [[50, 70], [50, 22], [50, 70]],       // 中竖(长)
  [[72, 70], [72, 44], [72, 70]],       // 右竖(中)
];

const INK = "#211a11";
const PAPER = "#ece1c9";

export const InkShanTest: React.FC = () => {
  const frame = useCurrentFrame();
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => { loadFonts(DEFAULT_FONTS).finally(() => continueRender(h)); }, [h]);

  const zhFamily = stackCss(DEFAULT_FONTS.zhStack);
  const latin = stackCss(DEFAULT_FONTS.latinStack);

  // 时间线(30fps):①画山 0-30 ②停顿看 30-48 ③morph 48-96 ④化字 96-120 ⑤定 120-
  const drawP = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const morphP = interpolate(frame, [48, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) });
  const glyphP = interpolate(frame, [96, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const infoP = interpolate(frame, [104, 128], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const guessOp = interpolate(frame, [24, 40, 50, 62], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const strokes = MOUNTAIN.map((m, i) => lerpPts(m, CHAR[i], morphP));

  const BOX = 720; // svg 边长(px)
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {/* 宣纸暗角 */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 42%, rgba(0,0,0,0) 55%, rgba(120,90,40,0.18) 100%)" }} />

      {/* 山→字 骨架(SVG 水墨笔画) */}
      <div style={{ position: "absolute", left: (1080 - BOX) / 2, top: 1920 * 0.30 - BOX / 2, width: BOX, height: BOX, opacity: 1 - glyphP * 0.0 }}>
        <svg viewBox="0 0 100 100" width={BOX} height={BOX} style={{ overflow: "visible", opacity: 1 - glyphP }}>
          {strokes.map((pts, i) => (
            <path key={i} d={dOf(pts)} pathLength={1}
              fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={1} strokeDashoffset={1 - drawP}
              style={{ filter: "url(#rough)" }} />
          ))}
          <defs>
            <filter id="rough">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* 真·楷书「山」(毛笔字):morph 完成后从骨架化出来 */}
      <div style={{
        position: "absolute", left: 0, top: 1920 * 0.30 - BOX / 2, width: 1080, height: BOX,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: zhFamily, fontSize: 560, color: INK, opacity: glyphP,
        transform: `scale(${lerp(0.96, 1, glyphP)})`,
      }}>山</div>

      {/* 拼音 + 越南语释义 */}
      <div style={{
        position: "absolute", left: 0, top: 1920 * 0.52, width: 1080, textAlign: "center",
        fontFamily: latin, fontSize: 96, fontWeight: 700, color: "#8a5a1e", opacity: infoP,
      }}>shān</div>
      <div style={{
        position: "absolute", left: 0, top: 1920 * 0.60, width: 1080, textAlign: "center",
        fontFamily: latin, fontSize: 78, fontWeight: 700, color: "#b0431f", opacity: infoP,
      }}>núi</div>

      {/* 猜字提示 */}
      <div style={{
        position: "absolute", left: 0, top: 1920 * 0.70, width: 1080, textAlign: "center",
        fontFamily: latin, fontSize: 58, color: "#6b5836", opacity: guessOp,
      }}>Đây là chữ gì?</div>
    </AbsoluteFill>
  );
};
