// 通用封面（全局能力，跨模板）：原视频一帧作主视觉 + 文字钩子，渲染成静图当视频封面/缩略图。
// 用法：remotion still src/index.ts cover <out.png> --props=<cover.json>
// ★版式与「内容(视频)版式」一致(用户 2026-07-13)：1080×1440，上下及中间间隔均 120，
//   图片区 720、文字区 360，全部集中在中间安全带——避免平台裁切封面后主体/文字被遮挡。
//   同帧模糊铺底填满画布。文字由 Claude 按每条视频实际内容拟(要抓人、不要瞎搞，见 base/03 封面规则)。
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { stackCss } from "./fonts";

// 与 chinese-learn 内容版式对齐：120 / 图720 / 120 / 字360 / 120 = 1440
const PAD = 120, IMG_H = 720, GAP = 120, TXT_H = 360;

export type CoverProps = {
  image: string;          // 主视觉帧：staticFile 相对路径（public/ 下）
  title: string;          // 中文钩子大字（可用 \n 换行，最多两行最好）
  subtitle?: string;      // 越南语钩子/译文（受众母语，第二行）
  tag?: string;           // 顶部小标（系列/品牌）
  titleColor?: string;    // 中文大字颜色（默认白）
  accentColor?: string;   // 越南语/高亮色（默认暖黄）
};

export const Cover: React.FC<CoverProps> = ({
  image, title, subtitle, tag, titleColor = "#ffffff", accentColor = "#ffd24a",
}) => {
  const zh = stackCss(["Ma Shan Zheng", "SimHei", "PingFang SC", "serif"]);
  const latin = stackCss(["Nunito", "PingFang SC", "sans-serif"]);
  const src = image ? staticFile(image) : "";
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* 模糊铺底：同帧放大模糊压暗，填满画布、无黑边 */}
      {src ? (
        <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", filter: "blur(46px) brightness(0.4) saturate(1.2)", transform: "scale(1.2)" }} />
      ) : null}

      {/* 图片区：上边距 120，高 720，整帧完整呈现(contain 居中)，不裁主体 */}
      {src ? (
        <div style={{ position: "absolute", top: PAD, left: 0, width: "100%", height: IMG_H,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={src} style={{ maxWidth: 1080, maxHeight: IMG_H, objectFit: "contain",
            borderRadius: 18, boxShadow: "0 16px 54px rgba(0,0,0,0.7)" }} />
        </div>
      ) : null}

      {/* 文字区：上边距 120+720+120=960，高 360，整组垂直居中——与字幕区同位，裁切安全 */}
      <div style={{ position: "absolute", top: PAD + IMG_H + GAP, left: 0, width: "100%", height: TXT_H,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 64px" }}>
        {tag ? (
          <div style={{ fontFamily: latin, color: "#ffffff", fontSize: 34, fontWeight: 800, letterSpacing: 2,
            opacity: 0.9, marginBottom: 14, textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>{tag}</div>
        ) : null}
        <div style={{ fontFamily: zh, color: titleColor, fontSize: 104, fontWeight: 400, lineHeight: 1.12,
          whiteSpace: "pre-line", textAlign: "center", textShadow: "0 6px 26px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.95)" }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 20, fontFamily: latin, color: accentColor, fontSize: 54, fontWeight: 800,
            textAlign: "center", textShadow: "0 4px 16px rgba(0,0,0,0.95)" }}>{subtitle}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
