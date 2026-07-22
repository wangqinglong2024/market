// 版式『hsks-vocab · HSK词汇卡（高密度速览·9:16）』。
// 一条视频=一批 HSK 官方词汇，恒 12 秒，分若干「页」(每页 6 词 2×3)，每页停留由 build 按密度算(3页4s/4页3s/5页2.4s/6页2s)。
// 单段时间线：每页一个 <Sequence from dur>，页内卡片错峰弹入(cascade)，朗读步进高亮(colorPop+glow)，页间「上浮翻入」=翻页感。
// 数据零编造：词/拼音/词性来自 /hsk CSV，越南语来自 vi-lexicon，出处角标常驻。见 templates/hsks/GANGLING.md。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring, Easing,
} from "remotion";
import type { LayoutModule, RenderBeat, Manifest } from "./types";
import { DEFAULT_FONTS, stackCss, type FontsMeta } from "../fonts";
import { HskIcon } from "./hsks-icons";

type Word = { c: string; py: string; pos: string; vi: string; readAtMs?: number; readEndMs?: number; audio?: string };
type PageBeat = RenderBeat & {
  audio?: string; page: number; pages: number; source: string; titleVi?: string; words: Word[]; accent?: string;
};

// ── 词性分类色（设计系统·一屏可辨）。名蓝/动橙/形绿/数紫/量青/代粉/副琥珀/助灰/叹玫红 ──
const POS_COLORS: Record<string, string> = {
  名: "#2b7fff", 动: "#ff7a1a", 形: "#12b886", 数: "#8b5cf6", 量: "#0ea5a5",
  代: "#ec4899", 副: "#f0a020", 助: "#6b7280", 叹: "#e03131", 介: "#5c7cfa", 连: "#7048e8",
};
const posColor = (pos: string) => POS_COLORS[(pos || "").trim().charAt(0)] || "#64748b";
const posLabelVi: Record<string, string> = {
  名: "danh từ", 动: "động từ", 形: "tính từ", 数: "số từ", 量: "lượng từ",
  代: "đại từ", 副: "phó từ", 助: "trợ từ", 叹: "thán từ", 介: "giới từ", 连: "liên từ",
};

const zhFam = (fonts?: FontsMeta) => stackCss({ ...DEFAULT_FONTS, ...(fonts || {}) }.zhStack);
const latinFam = (fonts?: FontsMeta) => stackCss({ ...DEFAULT_FONTS, ...(fonts || {}) }.latinStack);

// ── 背景漂浮光点（微动、不抢戏，给一点『炫』的呼吸感）──
const Bokeh: React.FC<{ accent: string; seed: number }> = ({ accent, seed }) => {
  const f = useCurrentFrame();
  const dots = Array.from({ length: 14 }, (_, i) => {
    const r = ((seed * 9301 + i * 49297) % 233280) / 233280;
    const r2 = ((seed * 4507 + i * 7919) % 233280) / 233280;
    const x = 60 + r * 960;
    const y0 = 200 + r2 * 1520;
    const size = 6 + r * 22;
    const drift = Math.sin((f / 30 + i) * 0.6) * 18;
    const op = 0.05 + r2 * 0.12;
    return (
      <div key={i} style={{
        position: "absolute", left: x, top: y0 + drift, width: size, height: size, borderRadius: "50%",
        background: i % 3 === 0 ? accent : "#ffffff", opacity: op, filter: "blur(1px)",
      }} />
    );
  });
  return <>{dots}</>;
};

// ── 出处角标 + 页进度点（『还有更多页』的心理暗示）──
const Header: React.FC<{ beat: PageBeat; fonts?: FontsMeta; accent: string; top: number }> = ({ beat, fonts, accent, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 14, mass: 0.6, stiffness: 160 }, durationInFrames: 16 });
  return (
    <div style={{ position: "absolute", top, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, transform: `translateY(${(1 - pop) * -14}px)`, opacity: pop }}>
      {/* 出处徽标 */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 26px", borderRadius: 999,
        background: "rgba(15,23,42,0.92)", border: `2px solid ${accent}`, boxShadow: `0 0 22px ${accent}55`,
      }}>
        <span style={{ fontSize: 26 }}>📚</span>
        <span style={{ fontFamily: zhFam(fonts), fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{beat.source}</span>
      </div>
      {beat.titleVi ? (
        <span style={{ fontFamily: latinFam(fonts), fontSize: 40, fontWeight: 900, color: "#1f2937", letterSpacing: 0.5 }}>{beat.titleVi}</span>
      ) : null}
      {/* 页进度点 */}
      <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
        {Array.from({ length: beat.pages }, (_, i) => (
          <div key={i} style={{
            width: i + 1 === beat.page ? 34 : 12, height: 12, borderRadius: 999,
            background: i + 1 === beat.page ? accent : "rgba(30,41,59,0.22)", transition: "none",
          }} />
        ))}
      </div>
    </div>
  );
};

// ── 激活迸发星火（『炫』的点睛，围绕卡片四角弹出小星）──
const Sparkles: React.FC<{ t: number; color: string }> = ({ t, color }) => {
  const pts = [
    { x: 14, y: 18 }, { x: 86, y: 14 }, { x: 90, y: 62 }, { x: 10, y: 70 }, { x: 50, y: 8 }, { x: 78, y: 88 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pts.map((p, i) => {
        const phase = Math.min(1, Math.max(0, t * 1.2 - i * 0.06));
        const s = Math.sin(phase * Math.PI); // 0→1→0
        return (
          <div key={i} style={{
            position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            width: 16, height: 16, transform: `translate(-50%,-50%) scale(${s}) rotate(${phase * 90}deg)`,
            opacity: s,
          }}>
            <svg viewBox="0 0 20 20" width="16" height="16">
              <path d="M10 0l2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4z" fill={i % 2 ? "#fff" : color} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ── 命中色墨炸裂（读到该词瞬间：扩散环 + 墨点四射，强调色，『炫』的爆发感）──
const Burst: React.FC<{ localMs: number; color: string }> = ({ localMs, color }) => {
  const p = interpolate(localMs, [0, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (p <= 0 || p >= 1) return null;
  const angles = [8, 52, 96, 140, 184, 228, 272, 316];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <svg viewBox="0 0 200 200" width="92%" height="92%" style={{ overflow: "visible" }}>
        <circle cx="100" cy="100" r={38 + p * 74} fill="none" stroke={color} strokeWidth={9 * (1 - p)} opacity={0.7 * (1 - p)} />
        {angles.map((a, i) => {
          const r = (a * Math.PI) / 180;
          const d = 26 + p * 78 + (i % 3) * 6;
          const rad = (7 + (i % 3) * 3) * (1 - p * 0.55);
          return <circle key={i} cx={100 + d * Math.cos(r)} cy={100 + d * Math.sin(r)} r={Math.max(0, rad)} fill={i % 2 ? color : "#fff"} opacity={1 - p} />;
        })}
      </svg>
    </div>
  );
};

// ── 单词卡片：错峰弹入 + 朗读步进高亮 ──
const Card: React.FC<{ w: Word; idx: number; nextAtMs: number; fonts?: FontsMeta; accent: string }> = ({
  w, idx, nextAtMs, fonts, accent,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pc = posColor(w.pos);

  // 入场：错峰(每卡 +2 帧)快速弹入，scale+上移+淡入(读第一个词前基本就位)
  const inAt = 2 + idx * 2;
  const s = spring({ frame: f - inAt, fps, config: { damping: 13, mass: 0.7, stiffness: 160 }, durationInFrames: 16 });
  const enterY = (1 - s) * 46;
  const enterScale = 0.72 + 0.28 * s;
  const op = interpolate(f - inAt, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ★音频驱动高亮：当前发音落在本词窗口 [readAtMs, nextAtMs) 时点亮，严格对齐发音(含 TTS 停顿)。
  const currentMs = (f / fps) * 1000;
  const startMs = w.readAtMs ?? 0;
  const isActive = currentMs >= startMs && currentMs < nextAtMs;
  const winLen = Math.max(140, nextAtMs - startMs);
  const localMs = currentMs - startMs;
  const litT = isActive ? interpolate(localMs, [0, 90, winLen * 0.72, winLen], [0, 1, 1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const litScale = 1 + litT * 0.05;
  // 激活扫光：白色斜光条从左扫到右(随发音)
  const shineP = isActive ? interpolate(localMs, [0, Math.min(520, winLen * 0.6)], [-40, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : -100;

  return (
    <div style={{
      position: "relative", borderRadius: 30, background: isActive ? "#ffffff" : `${pc}0f`,
      border: `3px solid ${isActive ? pc : `${pc}44`}`,
      boxShadow: isActive ? `0 0 0 4px ${pc}22, 0 16px 36px ${pc}55` : `0 8px 20px ${pc}22`,
      opacity: op, transform: `translateY(${enterY}px) scale(${enterScale * litScale})`, transformOrigin: "center",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "16px 10px 14px", overflow: "hidden",
    }}>
      {/* 顶部色条(词性) */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 10, background: pc, opacity: 0.95 }} />
      {/* 激活扫光 */}
      {isActive ? (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none",
          background: `linear-gradient(105deg, transparent ${shineP - 22}%, ${pc}30 ${shineP}%, #ffffffcc ${shineP + 6}%, ${pc}30 ${shineP + 12}%, transparent ${shineP + 34}%)`,
          mixBlendMode: "screen", opacity: litT,
        }} />
      ) : null}
      {/* 命中色墨炸裂 + 迸发星火 */}
      {isActive ? <Burst localMs={localMs} color={pc} /> : null}
      {isActive ? <Sparkles t={litT} color={pc} /> : null}
      {/* 卡通图标(放大 + 彩色圆角底板,更醒目) */}
      <div style={{
        width: 150, height: 150, background: isActive ? `${pc}1c` : "#ffffffcc", borderRadius: 26, padding: 12,
        boxShadow: `inset 0 0 0 2px ${pc}33`, filter: isActive ? `drop-shadow(0 8px 18px ${pc}77)` : "none", transform: `scale(${1 + litT * 0.06})`,
      }}>
        <HskIcon word={w.c} accent={pc} />
      </div>
      {/* 拼音 */}
      <div style={{ fontFamily: latinFam(fonts), fontSize: 40, fontWeight: 800, color: pc, marginTop: 8, lineHeight: 1 }}>{w.py}</div>
      {/* 汉字 */}
      <div style={{ fontFamily: zhFam(fonts), fontSize: 58, fontWeight: 800, color: "#151b26", lineHeight: 1.02, marginTop: 3 }}>{w.c}</div>
      {/* 越南语释义 */}
      <div style={{ fontFamily: latinFam(fonts), fontSize: 38, fontWeight: 800, color: "#26324a", marginTop: 6, textAlign: "center", lineHeight: 1.08 }}>{w.vi}</div>
      {/* 词性小标 */}
      <div style={{
        marginTop: 8, padding: "4px 16px", borderRadius: 999, background: pc,
        fontFamily: latinFam(fonts), fontSize: 26, fontWeight: 800, color: "#fff",
      }}>{(w.pos || "").trim().charAt(0)} · {posLabelVi[(w.pos || "").trim().charAt(0)] || ""}</div>
    </div>
  );
};

// ── 一整页 ──
const Page: React.FC<{ beat: PageBeat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = meta.fonts;
  const accent = beat.accent || (meta as { theme?: { accent?: string } }).theme?.accent || "#ff7a1a";

  // 翻页感：整页从下方上浮弹入
  const pageIn = spring({ frame: f, fps, config: { damping: 16, mass: 0.8, stiffness: 120 }, durationInFrames: 14 });
  const pageY = (1 - pageIn) * 70;
  const pageOp = interpolate(f, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 底部钩子延迟淡入(第0帧/封面帧不显示,页面开始后才浮现)
  const hookIn = interpolate(f, [14, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const words = beat.words;
  // ★9:16 上下左右各留白 12%(避平台 UI)：内容全部收进安全框。
  const safeX = Math.round(meta.width * 0.12);    // 1080×12% ≈ 130
  const safeTop = Math.round(meta.height * 0.12); // 1920×12% ≈ 230
  const safeBottom = meta.height - safeTop;       // ≈ 1690
  const gap = 30;
  const cols = 2;
  const gridW = meta.width - safeX * 2;
  const cardW = (gridW - gap * (cols - 1)) / cols;
  const rows = 3;
  const gridTop = safeTop + 206;   // 头部(徽标+标题+页点)之下
  const hookH = 54;
  const gridBottom = safeBottom - hookH;
  const gridH = gridBottom - gridTop;
  const cardH = (gridH - gap * (rows - 1)) / rows;

  return (
    <AbsoluteFill>
      {/* 背景：宣纸底 + 暗角(与封面统一,取自 hsk-ziyuan) + 微光点 */}
      <AbsoluteFill style={{ backgroundColor: "#ece1c9" }} />
      <AbsoluteFill style={{ background: "radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)" }} />
      <Bokeh accent={accent} seed={beat.page * 31 + 7} />
      <div style={{ transform: `translateY(${pageY}px)`, opacity: pageOp }}>
        <Header beat={beat} fonts={fonts} accent={accent} top={safeTop} />
        <div style={{
          position: "absolute", left: safeX, top: gridTop, width: gridW,
          display: "grid", gridTemplateColumns: `repeat(${cols}, ${cardW}px)`,
          gridAutoRows: `${cardH}px`, gap,
        }}>
          {words.map((w, i) => (
            <Card key={w.c + i} w={w} idx={i} nextAtMs={words[i + 1]?.readAtMs ?? beat.durationMs} fonts={fonts} accent={accent} />
          ))}
        </div>
      </div>
      {/* 底部(仍在安全区内)：还有更多(循环钩子)。延迟淡入,第0帧不显示 */}
      <div style={{
        position: "absolute", top: gridBottom + 12, left: 0, width: "100%", textAlign: "center",
        fontFamily: latinFam(fonts), fontSize: 30, fontWeight: 800, color: accent,
        opacity: 0.9 * hookIn, transform: `translateY(${(1 - hookIn) * 14}px)`,
      }}>
        {beat.page < beat.pages ? "còn nữa ↑" : "lưu lại để học! ♥"}
      </div>
      {/* 逐词配音：每词在其等距 slot 起点播放(词库复用)，词间=组间停顿，与高亮同拍 */}
      {words.map((w, i) => w.audio ? (
        <Sequence key={`a-${i}`} from={Math.round(((w.readAtMs ?? 0) / 1000) * fps)} layout="none">
          <Audio src={staticFile(w.audio)} />
        </Sequence>
      ) : null)}
    </AbsoluteFill>
  );
};

// 单段时间线：每页一个 Sequence，页时长各自的 durationMs，总和恒 12 秒（无跨段转场重叠）。
const Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const fps = meta.fps;
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#ece1c9" }}>
      {beats.map((b) => {
        const dur = Math.max(1, Math.round(((b.durationMs as number) / 1000) * fps));
        const seq = (
          <Sequence key={b.id} from={from} durationInFrames={dur}>
            <Page beat={b as PageBeat} meta={meta} />
          </Sequence>
        );
        from += dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "hsks-vocab",
  segments: (beats: RenderBeat[]) => [beats],
  transitionOf: () => "fade",
  Segment,
};

// Easing 引用占位以防 tree-shake 报未用（保留给后续动效扩展）
void Easing;
