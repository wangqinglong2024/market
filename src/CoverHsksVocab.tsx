// hsks-vocab 封面(9:16 缩略图):本级主题色 + 越南语钩子 + 3 张示例词卡(黑线简笔画图标) + 范围/系列标。
// 12% 全安全区(避 TikTok 上下 UI)。各词汇视频共用,差异在 props。build.mjs 自动为每条视频落 cover.json。
// 渲染:npx remotion still src/index.ts cover-hsks-vocab <out.png> --props=<视频目录>/cover.json
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";
import { HskIcon } from "./layouts/hsks-icons";

type W = { c: string; py: string; pos: string; vi: string };
const POS_COLORS: Record<string, string> = {
  名: "#2b7fff", 动: "#ff7a1a", 形: "#12b886", 数: "#8b5cf6", 量: "#0ea5a5",
  代: "#ec4899", 副: "#f0a020", 助: "#6b7280", 叹: "#e03131", 介: "#5c7cfa", 连: "#7048e8",
};
const posColor = (p: string) => POS_COLORS[(p || "").trim().charAt(0)] || "#64748b";

const MiniCard: React.FC<{ w: W; zh: string; latin: string }> = ({ w, zh, latin }) => {
  const pc = posColor(w.pos);
  return (
    <div style={{
      width: 250, borderRadius: 30, background: "#fff", border: `3px solid ${pc}`,
      boxShadow: `0 14px 30px ${pc}33`, padding: "20px 10px 18px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: 132, height: 132 }}><HskIcon word={w.c} accent={pc} /></div>
      <div style={{ fontFamily: latin, fontSize: 38, fontWeight: 800, color: pc, marginTop: 6 }}>{w.py}</div>
      <div style={{ fontFamily: zh, fontSize: 56, fontWeight: 800, color: "#151b26", lineHeight: 1.02 }}>{w.c}</div>
      <div style={{ fontFamily: latin, fontSize: 34, fontWeight: 800, color: "#26324a", marginTop: 4, textAlign: "center" }}>{w.vi}</div>
    </div>
  );
};

export const CoverHsksVocab: React.FC<{
  level?: string; accent?: string; hook?: string; titleVi?: string; range?: string; tag?: string; words?: W[];
}> = ({
  level = "HSK1", accent = "#ff7a1a", hook = "Từ vựng HSK phải thuộc",
  titleVi = "Từ vựng · 词汇", range = "No.1–18", tag = "HSK · Tự học tiếng Trung",
  words = [],
}) => {
  const [h] = useState(() => delayRender("cover-hsks-fonts"));
  useEffect(() => {
    Promise.all([
      loadFonts(DEFAULT_FONTS),
      loadFonts({ files: [{ family: "Nunito", file: "library/fonts/Nunito.ttf", weight: "400 900" }] }),
    ]).finally(() => continueRender(h));
  }, [h]);
  const zh = stackCss(DEFAULT_FONTS.zhStack);
  const latin = stackCss(DEFAULT_FONTS.latinStack);
  const sample = words.slice(0, 3);

  return (
    <AbsoluteFill style={{ backgroundColor: "#ece1c9" }}>
      {/* 宣纸暗角(取自 hsk-ziyuan 封面背景) */}
      <AbsoluteFill style={{ background: "radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)" }} />
      {/* 顶部级别徽标(安全区内) */}
      <div style={{ position: "absolute", top: 300, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 14, padding: "16px 44px", borderRadius: 999,
          background: "rgba(15,23,42,0.94)", border: `3px solid ${accent}`, boxShadow: `0 0 30px ${accent}66`,
        }}>
          <span style={{ fontSize: 46 }}>📚</span>
          <span style={{ fontFamily: latin, fontSize: 72, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{level}</span>
        </div>
        <div style={{ fontFamily: latin, fontSize: 52, fontWeight: 900, color: "#1f2937" }}>{titleVi}</div>
      </div>

      {/* 越南语钩子 */}
      <div style={{
        position: "absolute", top: 600, left: 120, width: 840, textAlign: "center",
        fontFamily: latin, fontWeight: 900, fontSize: 78, lineHeight: 1.12, color: accent,
        textShadow: "0 2px 0 rgba(0,0,0,0.06)",
      }}>{hook}</div>

      {/* 3 张示例词卡 */}
      <div style={{ position: "absolute", top: 820, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 26 }}>
        {sample.map((w, i) => <MiniCard key={w.c + i} w={w} zh={zh} latin={latin} />)}
      </div>

      {/* 范围 + 系列标(安全区内) */}
      <div style={{ position: "absolute", top: 1500, left: 0, width: "100%", textAlign: "center", fontFamily: zh, fontWeight: 900, fontSize: 60, color: "#151b26" }}>
        {level} · 词汇 · {range}
      </div>
      <div style={{ position: "absolute", top: 1590, left: 0, width: "100%", textAlign: "center", fontFamily: latin, fontWeight: 800, fontSize: 44, color: accent }}>
        {tag}
      </div>
    </AbsoluteFill>
  );
};
