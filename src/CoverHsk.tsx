// HSK字源九宫格封面(9:16缩略图):宣纸 + 越南语钩子 + 副标题行 + 三个「具象简笔 → 毛笔字」示例,底部系列标。
// ★版面居中(2026-07-20 用户定):全部内容压进画面中段(y≈410..1510),上下各留约410px安全区,防 TikTok 上下 UI 遮挡。
// 各子模板共用本组件,差异全在 props(hook/sub/chars/ep/tag),封面文案规则见 templates/hsk-ziyuan/SUBTEMPLATES.md。
// 渲染:npx remotion still src/index.ts cover-hsk <out.png> --props=<视频目录>/cover.json
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

export const CoverHsk: React.FC<{ hook: string; sub?: string; chars?: string[]; tag: string; ep: string }> = ({
  hook, sub = "山 = ⛰️ · 日 = ☀️ · 木 = 🌳", chars = ["山", "日", "木"], tag, ep,
}) => {
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

      {/* 钩子(居中安全区内) */}
      <div style={{ position: "absolute", top: 440, left: 80, width: 920, textAlign: "center",
        fontFamily: LATIN, fontWeight: 900, fontSize: 76, lineHeight: 1.12, color: INK }}>{hook}</div>
      <div style={{ position: "absolute", top: 630, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 800, fontSize: 46, color: TEAL }}>{sub}</div>

      {/* 三个 具象→字 示例 */}
      <div style={{ position: "absolute", top: 740, left: 0, width: 1080, display: "flex", justifyContent: "center", gap: 70 }}>
        {chars.map((c) => <Demo key={c} c={c} zh={zh} />)}
      </div>

      {/* 系列标 */}
      <div style={{ position: "absolute", top: 1290, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 900, fontSize: 58, color: RED }}>{ep}</div>
      <div style={{ position: "absolute", top: 1385, left: 0, width: 1080, textAlign: "center",
        fontFamily: LATIN, fontWeight: 700, fontSize: 44, color: TEAL }}>{tag}</div>
    </AbsoluteFill>
  );
};
