// chinese-drama 海报式封面（render-rules 第10条，用户 2026-07-15 锁：封面=海报，一集一张）。
// 1080×1440 与视频同尺寸。★按电影海报设计，禁止照搬字幕三行样式/配色：
//   左上=竖排系列名+红印章集数 · 右上=卷标题 · 下部=章主题名(金色渐变大字,主标题)+当集钩子标题(红条)。
// 章主题名/钩子标题均为 拼音/中文/越南语 三行；全部 FitLine 单行禁溢出；行尾禁标点。
// 渲染：npx remotion still src/index.ts cover-drama <中文名>-封面.png --props=<dir>/cover.json
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FitLine } from "./layouts/shared";

type TriTitle = { py: string; zh: string; vi: string };

const MAX_W = 1000;
const ZH_FONT = '"Ma Shan Zheng", "SimHei", "PingFang SC", serif';
const LATIN_FONT = '"Itim", "Nunito", "PingFang SC", sans-serif';
// 金色渐变大字（主标题）
const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #fff6dd 8%, #f7d98b 52%, #caa04e 100%)",
  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.9))",
};

export const CoverDrama: React.FC<{
  image: string;             // public/ 相对路径（海报底图,fal 单独新出）
  focusY?: number;
  tag: string;               // 系列名：毒嫁
  tagVi?: string;            // 系列越南语名
  seal?: string;             // 红印章集数：E01
  volume?: { zh: string; vi?: string }; // 卷标题：卷一 · 惊醒
  chapter: TriTitle;         // 章主题名（主标题）
  episode: TriTitle;         // 当集钩子标题（红条）
}> = ({ image, focusY = 0.35, tag, tagVi, seal, volume, chapter, episode }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0405" }}>
      {image ? (
        <Img src={staticFile(image)} style={{
          width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY * 100}%`,
        }} />
      ) : null}
      {/* 上下渐变压暗，保文字可读 */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 46%, rgba(10,2,3,0.86) 74%, rgba(10,2,3,0.97) 100%)" }} />

      {/* 左上：竖排系列名 + 红印章集数 */}
      <div style={{ position: "absolute", top: 52, left: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{
          writingMode: "vertical-rl", fontFamily: ZH_FONT, fontSize: 66, letterSpacing: 10,
          color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.95)",
        }}>{tag}</div>
        {seal ? (
          <div style={{
            background: "linear-gradient(160deg, #c1182c, #8f0f20)", color: "#ffe9c8",
            fontFamily: LATIN_FONT, fontWeight: 700, fontSize: 40, lineHeight: 1,
            padding: "14px 12px", borderRadius: 10, border: "2px solid rgba(255,233,200,0.55)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
          }}>{seal}</div>
        ) : null}
      </div>

      {/* 右上：卷标题（金线框标签） */}
      {volume ? (
        <div style={{
          position: "absolute", top: 56, right: 52, textAlign: "center",
          border: "2px solid rgba(233,197,125,0.85)", borderRadius: 6, padding: "10px 22px 12px",
          background: "rgba(10,4,5,0.45)",
        }}>
          <div style={{ fontFamily: ZH_FONT, fontSize: 42, color: "#f2d9a4", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{volume.zh}</div>
          {volume.vi ? <div style={{ fontFamily: LATIN_FONT, fontSize: 24, color: "#d9b981", fontWeight: 700, marginTop: 2 }}>{volume.vi}</div> : null}
        </div>
      ) : null}

      {/* 左上系列越南语名（竖排名下方横排,小字） */}
      {tagVi ? (
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontFamily: LATIN_FONT, fontSize: 26, color: "rgba(217,185,129,0.85)", fontWeight: 700 }}>{tagVi}</div>
      ) : null}

      {/* 下部标题区：章主题名(金色主标题) + 钩子标题(红条) */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        {/* 章主题名 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <FitLine maxWidth={MAX_W} depKey={`ch-py-${chapter.py}`}>
            <span style={{ fontFamily: LATIN_FONT, fontSize: 44, letterSpacing: 3, color: "#d9b981", fontWeight: 700, whiteSpace: "nowrap" }}>{chapter.py}</span>
          </FitLine>
          <FitLine maxWidth={MAX_W} depKey={`ch-zh-${chapter.zh}`}>
            <span style={{ fontFamily: ZH_FONT, fontSize: 96, lineHeight: 1.12, whiteSpace: "nowrap", ...GOLD_TEXT }}>{chapter.zh}</span>
          </FitLine>
          <FitLine maxWidth={MAX_W} depKey={`ch-vi-${chapter.vi}`}>
            <span style={{ fontFamily: LATIN_FONT, fontSize: 56, color: "#f2ddb0", fontWeight: 700, whiteSpace: "nowrap", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{chapter.vi}</span>
          </FitLine>
        </div>
        {/* 分隔 ◆ */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: 0.9 }}>
          <div style={{ width: 190, height: 2, background: "linear-gradient(90deg, transparent, #caa04e)" }} />
          <div style={{ color: "#e9c57d", fontSize: 22 }}>◆</div>
          <div style={{ width: 190, height: 2, background: "linear-gradient(270deg, transparent, #caa04e)" }} />
        </div>
        {/* 当集钩子标题：红条 */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          background: "linear-gradient(90deg, rgba(154,15,31,0) 0%, rgba(154,15,31,0.94) 12%, rgba(154,15,31,0.94) 88%, rgba(154,15,31,0) 100%)",
          padding: "18px 70px 22px", width: "100%", boxSizing: "border-box",
        }}>
          <FitLine maxWidth={MAX_W - 80} depKey={`ep-py-${episode.py}`}>
            <span style={{ fontFamily: LATIN_FONT, fontSize: 38, letterSpacing: 2, color: "#ffd9a0", fontWeight: 700, whiteSpace: "nowrap" }}>{episode.py}</span>
          </FitLine>
          <FitLine maxWidth={MAX_W - 80} depKey={`ep-zh-${episode.zh}`}>
            <span style={{ fontFamily: ZH_FONT, fontSize: 64, lineHeight: 1.15, color: "#ffffff", whiteSpace: "nowrap", textShadow: "0 3px 10px rgba(0,0,0,0.75)" }}>{episode.zh}</span>
          </FitLine>
          <FitLine maxWidth={MAX_W - 80} depKey={`ep-vi-${episode.vi}`}>
            <span style={{ fontFamily: LATIN_FONT, fontSize: 46, color: "#ffe4b8", fontWeight: 700, whiteSpace: "nowrap" }}>{episode.vi}</span>
          </FitLine>
        </div>
      </div>
    </AbsoluteFill>
  );
};
