// 头像(1:1,会被裁成圆形):越南受众「学中文」频道头像。★圆形安全区铁律——所有内容压进中心圆(r≈460内),
// 四角与边缘会被裁掉;背景满铺宣纸(裁圆后无白角)。风格承接 HSK 字源系列:宣纸底 + 毛笔墨字 + 朱砂印章 + 青碧标。
// 渲染:npx remotion still src/index.ts avatar-hsk <out.png>
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";

const PAPER = "#ece1c9";
const INK = "#241c11";
const TEAL = "#2c6e75";
const RED = "#9a2020";
const CREAM = "#f4ead2";
const LATIN = '"Nunito", "PingFang SC", sans-serif';

export const AvatarHsk: React.FC = () => {
  const [h] = useState(() => delayRender("avatar-fonts"));
  useEffect(() => {
    loadFonts(DEFAULT_FONTS).finally(() => continueRender(h));
  }, [h]);
  const zh = stackCss(DEFAULT_FONTS.zhStack);
  const S = 1080;
  const C = S / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily: LATIN }}>
      {/* 宣纸暖光 + 边缘压暗(裁圆后四周有厚度感) */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 120% at 50% 40%, rgba(255,250,236,0.55) 0%, rgba(0,0,0,0) 46%, rgba(120,90,40,0.22) 100%)" }} />

      {/* 印章式双环(半径 470/446,安全在裁圆 540 之内) */}
      <div style={{ position: "absolute", left: C - 470, top: C - 470, width: 940, height: 940, borderRadius: "50%", border: `6px solid ${INK}`, opacity: 0.82 }} />
      <div style={{ position: "absolute", left: C - 446, top: C - 446, width: 892, height: 892, borderRadius: "50%", border: `3px dashed ${RED}`, opacity: 0.5 }} />

      {/* 顶部小标 */}
      <div style={{ position: "absolute", top: 150, left: 0, width: S, textAlign: "center", fontWeight: 900, fontSize: 46, letterSpacing: 8, color: TEAL }}>汉语 · HSK</div>

      {/* 主角毛笔「中」(=中文/中国),居中圆内 */}
      <div style={{ position: "absolute", top: 232, left: 0, width: S, height: 560, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: zh, fontSize: 540, lineHeight: 1, color: INK, textShadow: "0 8px 20px rgba(60,40,10,0.14)" }}>中</div>

      {/* 朱砂印章「学」(=学习),盖在右上留白处 */}
      <div style={{ position: "absolute", left: 726, top: 246, width: 150, height: 150, background: RED, borderRadius: 24, transform: "rotate(6deg)",
        boxShadow: "0 8px 18px rgba(120,20,20,0.32)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: zh, fontSize: 120, color: CREAM, lineHeight: 1 }}>学</span>
      </div>

      {/* 底部越南语主标(身份)+ 副标(独特卖点:看图学汉字) */}
      <div style={{ position: "absolute", top: 806, left: 0, width: S, textAlign: "center", fontWeight: 900, fontSize: 80, color: RED }}>Học tiếng Trung</div>
      <div style={{ position: "absolute", top: 908, left: 0, width: S, textAlign: "center", fontWeight: 800, fontSize: 42, color: TEAL, letterSpacing: 1 }}>Chữ Hán qua hình vẽ</div>
    </AbsoluteFill>
  );
};
