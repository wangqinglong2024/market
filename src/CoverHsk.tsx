// HSK字源九宫格封面(9:16缩略图):宣纸 + 越南语钩子 + 三个「具象简笔 → 毛笔字」示例(山/日/木),底部系列标。
// 渲染:npx remotion still src/index.ts cover-hsk <out.png> [--props=cover.json]
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";
import glyphsJson from "../templates/hsk-ziyuan/glyphs.json";

type Pt = [number, number];
const glyphs = glyphsJson.glyphs as unknown as Record<string, { py: string; pic: Pt[][]; chr: Pt[][] }>;
const dOf = (p: Pt[]) => "M " + p.map(([x, y]) => `${x} ${y}`).join(" L ");

const PAPER = "#ece1c9";
const INK = "#241c11";
const TEAL = "#2c6e75";
const RED = "#8f1d1d";
const LATIN = '"Nunito", "PingFang SC", sans-serif';

const Demo: React.FC<{ c: string; zh: string }> = ({ c, zh }) => {
  const g = glyphs[c];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg viewBox="0 0 100 100" width={210} height={210} style={{ overflow: "visible" }}>
        {g.pic.map((p, i) => (
          <path key={i} d={dOf(p)} pathLength={1} fill="none" stroke={INK} strokeWidth={4.6}
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <div style={{ fontSize: 54, color: RED, lineHeight: 0.6 }}>↓</div>
      <div style={{ fontFamily: zh, fontSize: 176, color: INK, lineHeight: 1 }}>{c}</div>
    </div>
  );
};

export const CoverHsk: React.FC<{ hook: string; tag: string; ep: string }> = ({ hook, tag, ep }) => {
  const [h] = useState(() => delayRender("cover-fonts"));
  useEffect(() => {
    Promise.all([
      loadFonts(DEFAULT_FONTS),
      loadFonts({ files: [{ family: "Nunito", file: "library/fonts/Nunito.ttf", weight: "400 900" }] }),
    ]).finally(() => continueRender(h));
  }, [h]);
  const zh = stackCss(DEFAULT_FONTS.zhStack);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)" }} />

      {/* 钩子 */}
      <div style={{ position: "absolute", top: 150, left: 80, width: 920, textAlign: "center",
        fontFamily: LATIN, fontWeight: 900, fontSize: 84, lineHeight: 1.12, color: INK }}>{hook}</div>
      <div style={{ position: "absolute", top: 420, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 800, fontSize: 46, color: TEAL }}>山 = ⛰️ · 日 = ☀️ · 木 = 🌳</div>

      {/* 三个 具象→字 示例 */}
      <div style={{ position: "absolute", top: 640, left: 0, width: 1080, display: "flex", justifyContent: "center", gap: 70 }}>
        <Demo c="山" zh={zh} />
        <Demo c="日" zh={zh} />
        <Demo c="木" zh={zh} />
      </div>

      {/* 系列标 */}
      <div style={{ position: "absolute", bottom: 240, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 900, fontSize: 60, color: RED }}>{ep}</div>
      <div style={{ position: "absolute", bottom: 150, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 700, fontSize: 44, color: TEAL }}>{tag}</div>
    </AbsoluteFill>
  );
};
