// hsks 家族·通用封面(grammar/topic/task/hanzi 复用,数据驱动)。宣纸底+暗角 + 级别徽标 + 越南语钩子 + 3 张示例卡 + 范围/系列标。
// 12% 全安全区。build.mjs 自动落 cover.json(统一形状:{level,accent,kind,hook,range,tag,icon,samples:[{zh,vi}]})。
// 渲染:npx remotion still src/index.ts cover-hsks-<sub> <out.png> --props=<视频目录>/cover.json
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";

type Sample = { zh: string; vi: string };

export const CoverHsksGeneric: React.FC<{
  level?: string; accent?: string; kind?: string; hook?: string; range?: string; tag?: string; icon?: string; samples?: Sample[];
}> = ({
  level = "HSK1", accent = "#ff7a1a", kind = "语法", hook = "HSK", range = "#1-4",
  tag = "HSK · Tự học tiếng Trung", icon = "📚", samples = [],
}) => {
  const [h] = useState(() => delayRender("cover-hsks-generic-fonts"));
  useEffect(() => {
    Promise.all([
      loadFonts(DEFAULT_FONTS),
      loadFonts({ files: [{ family: "Nunito", file: "library/fonts/Nunito.ttf", weight: "400 900" }] }),
    ]).finally(() => continueRender(h));
  }, [h]);
  const zh = stackCss(DEFAULT_FONTS.zhStack);
  const latin = stackCss(DEFAULT_FONTS.latinStack);

  return (
    <AbsoluteFill style={{ backgroundColor: "#ece1c9" }}>
      <AbsoluteFill style={{ background: "radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)" }} />

      {/* 级别徽标 */}
      <div style={{ position: "absolute", top: 300, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "16px 44px", borderRadius: 999, background: "rgba(15,23,42,0.94)", border: `3px solid ${accent}`, boxShadow: `0 0 30px ${accent}66` }}>
          <span style={{ fontSize: 46 }}>{icon}</span>
          <span style={{ fontFamily: latin, fontSize: 72, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{level}</span>
        </div>
        <div style={{ fontFamily: latin, fontSize: 52, fontWeight: 900, color: "#1f2937" }}>{kind}</div>
      </div>

      {/* 越南语钩子 */}
      <div style={{ position: "absolute", top: 600, left: 110, width: 860, textAlign: "center", fontFamily: latin, fontWeight: 900, fontSize: 74, lineHeight: 1.12, color: accent, textShadow: "0 2px 0 rgba(0,0,0,0.06)" }}>{hook}</div>

      {/* 3 张示例卡 */}
      <div style={{ position: "absolute", top: 860, left: 130, width: 820, display: "flex", flexDirection: "column", gap: 26 }}>
        {samples.slice(0, 3).map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 26, border: `3px solid ${accent}`, boxShadow: `0 12px 26px ${accent}2e`, padding: "22px 30px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: zh, fontSize: 52, fontWeight: 800, color: "#151b26", lineHeight: 1.15 }}>{s.zh}</div>
            <div style={{ fontFamily: latin, fontSize: 36, fontWeight: 800, color: accent, lineHeight: 1.1 }}>{s.vi}</div>
          </div>
        ))}
      </div>

      {/* 范围 + 系列标 */}
      <div style={{ position: "absolute", top: 1580, left: 0, width: "100%", textAlign: "center", fontFamily: latin, fontWeight: 900, fontSize: 46, color: accent }}>
        {level} · {kind} · {range}
      </div>
      <div style={{ position: "absolute", top: 1650, left: 0, width: "100%", textAlign: "center", fontFamily: latin, fontWeight: 800, fontSize: 38, color: "#151b26" }}>
        {tag}
      </div>
    </AbsoluteFill>
  );
};
