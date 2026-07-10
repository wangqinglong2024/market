// 版式 grid-9：照搬 temp/TikTok.mp4。3:4 暖米色底 · 顶部问答框(左=问句、右=答句框，文字全来自 script.json，非固定；示例:你在做什么?/我在＿＿) 分步入场 ·
// 3×3 九宫格词卡：每格小女儿贴纸图+越南语标签；轮到某格→图轻微摆动→滑走→原地换成中文词+拼音，滑走那刻发音。
// 单段版式：整片一张连续画布(segments 返回 [allBeats]，无段间转场)，全部动画由 useCurrentFrame 按绝对 ms 驱动。
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { DEFAULT_FONTS, stackCss } from "../fonts";
import type { Manifest, LayoutModule, RenderBeat } from "./types";

// 本版式的 beat 形状（question 一条 + item 若干条）
type QBeat = {
  id: string; role: "question"; audio: string; durationMs: number;
  answerAudio?: string; answerRevealMs?: number;
  question: { zh: string; pinyin: string; viet: string };
  answer: { zh: string; pinyin: string };
};
type IBeat = {
  id: string; role: "item"; gridIndex: number;
  zh: string; pinyin: string; viet: string; image: string; audio: string;
  gapMs: number; durationMs: number;
};

const DEF_COLORS = {
  bg: "#fee8c9",
  chineseFill: "#53dbf5", chineseStroke: "#0e3547", // 顶部问句/答句：青色(同越南文)
  vietFill: "#53dbf5", vietStroke: "#1c5e6d",        // 越南文(大问句+标签)：青色+深青描边
  wordFill: "#ffffff", wordStroke: "#123049",         // 词卡中文(起床…)：白字+深描边
  pinyin: "#2c3742",
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const framesMs = (ms: number, fps: number) => Math.max(1, Math.round((ms / 1000) * fps));

// 带深色描边的贴纸字（fill 填充 + stroke 描边，paint-order 让描边在下）
const Sticker: React.FC<{
  text: string; size: number; fill: string; stroke: string; strokeW: number;
  family: string; weight?: number; style?: React.CSSProperties;
}> = ({ text, size, fill, stroke, strokeW, family, weight = 800, style }) => (
  <span
    style={{
      fontFamily: family, fontSize: size, fontWeight: weight, color: fill,
      WebkitTextStroke: `${strokeW}px ${stroke}`, paintOrder: "stroke",
      lineHeight: 1.12, whiteSpace: "nowrap", ...style,
    }}
  >
    {text}
  </span>
);

const GridSegment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const all = beats as unknown as (QBeat | IBeat)[];
  const qb = all.find((b) => b.role === "question") as QBeat | undefined;
  const items = all.filter((b) => b.role === "item") as IBeat[];

  // 每个 item 的绝对起点(ms) = 开场问句时长 + 之前所有 item 时长
  const openMs = qb?.durationMs ?? 0;
  const starts: number[] = [];
  let acc = openMs;
  for (const it of items) { starts.push(acc); acc += it.durationMs; }

  const colors = { ...DEF_COLORS, ...(meta.colors || {}) };
  const cols = meta.grid?.cols ?? 3;
  const rows = meta.grid?.rows ?? 3;
  const W = meta.width, H = meta.height;
  const fontCfg = { ...DEFAULT_FONTS, ...(meta.fonts || {}) };
  const zhFamily = stackCss(fontCfg.zhStack);
  const latin = stackCss(fontCfg.latinStack);
  const zhWeight = fontCfg.zhWeight ?? 700;

  // 版面几何(照参考)：顶部 headerH 放问答框，下面九宫格
  const headerH = Math.round(H * 0.30);
  const gridTop = headerH;
  const cellW = W / cols;
  const cellH = (H - gridTop) / rows;

  // 顶部入场：中文/拼音/越南语依次左滑入，答句模板弹入
  const slideL = (t0: number, t1: number) => {
    const p = clamp01((ms - t0) / (t1 - t0));
    return { opacity: p, tx: (1 - easeOut(p)) * -120 };
  };
  const pop = (t0: number, t1: number) => {
    const p = clamp01((ms - t0) / (t1 - t0));
    return { opacity: p, sc: 0.6 + 0.4 * easeOut(p) };
  };
  // 顶部左侧「中文问句 + 拼音 + 越南语」三行作为一个整体一起滑入(照参考视频)
  const headA = slideL(150, 800);
  // 右侧答句框在『我在』发音时刻弹入(与配音同步)
  const ansReveal = qb?.answerRevealMs ?? 1150;
  const ansA = pop(ansReveal, ansReveal + 420);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* 顶部左：你在做什么？ + 拼音 + 越南语（三行整体一起滑入） */}
      <div style={{ position: "absolute", left: 44, top: 22, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", maxWidth: W * 0.6, opacity: headA.opacity, transform: `translateX(${headA.tx}px)` }}>
        <Sticker text={qb?.question.zh ?? ""} size={106} fill={colors.chineseFill} stroke={colors.chineseStroke} strokeW={9} family={zhFamily} weight={zhWeight} />
        <span style={{ fontFamily: latin, fontSize: 40, fontWeight: 700, color: colors.pinyin }}>
          {qb?.question.pinyin}
        </span>
        <div style={{ marginTop: 4 }}>
          <Sticker text={qb?.question.viet ?? ""} size={84} fill={colors.vietFill} stroke={colors.vietStroke} strokeW={8} family={latin} weight={900} style={{ whiteSpace: "normal", display: "inline-block", lineHeight: 1.04 }} />
        </div>
      </div>

      {/* 顶部右：我在＿＿（照参考：与问句同区上方，占位符画成一根实心横杠，不用下划线字符） */}
      {(() => {
        const az = qb?.answer.zh ?? "";
        const m = az.match(/^([\s\S]*?)([＿_＿]+)\s*$/);
        const prefix = m ? m[1] : az;
        const hasBlank = !!m;
        return (
          <div style={{ position: "absolute", right: 92, top: 250, display: "flex", flexDirection: "column", alignItems: "center", opacity: ansA.opacity, transform: `scale(${ansA.sc})`, transformOrigin: "center" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <Sticker text={prefix} size={92} fill={colors.chineseFill} stroke={colors.chineseStroke} strokeW={9} family={zhFamily} weight={zhWeight} />
              {hasBlank && <div style={{ width: 132, height: 11, borderRadius: 6, background: colors.chineseStroke, marginBottom: 16 }} />}
            </div>
            <div style={{ fontFamily: latin, fontSize: 36, fontWeight: 700, color: colors.pinyin, marginTop: 6 }}>{qb?.answer.pinyin}</div>
          </div>
        );
      })()}

      {/* 九宫格词卡 */}
      {items.map((it, idx) => {
        const r = Math.floor(it.gridIndex / cols);
        const c = it.gridIndex % cols;
        const cx = c * cellW, cy = gridTop + r * cellH;
        const s = starts[idx], reveal = s + it.gapMs;
        // 摆动：轮到它的 gap 窗口内轻微来回晃(小幅旋转)
        let angle = 0;
        const wobX = 0, wobY = 0;
        if (ms >= s && ms < reveal) {
          const p = (ms - s) / it.gapMs;
          angle = Math.sin(p * Math.PI * 6) * 6 * (1 - 0.25 * p);
        }
        // reveal 后 ~180ms：图滑走(淡出+上移)、词卡弹入(交叉)
        const ex = clamp01((ms - reveal) / 180);
        const imgW = Math.min(cellW * 0.82, 300);
        const imgH = cellH * 0.6;
        return (
          <div key={it.id} style={{ position: "absolute", left: cx, top: cy, width: cellW, height: cellH }}>
            {ex < 1 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: cellH * 0.05, display: "flex", justifyContent: "center", opacity: 1 - ex, transform: `translate(${wobX}px, ${wobY - 26 * ex}px) rotate(${angle}deg)`, transformOrigin: "center bottom" }}>
                <Img src={staticFile(it.image)} style={{ width: imgW, height: imgH, objectFit: "contain" }} />
              </div>
            )}
            {ex > 0 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: cellH * 0.1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: ex, transform: `scale(${0.6 + 0.4 * easeOut(ex)})`, transformOrigin: "center" }}>
                <Sticker text={it.zh} size={92} fill={colors.wordFill} stroke={colors.wordStroke} strokeW={9} family={zhFamily} weight={zhWeight} />
                <span style={{ fontFamily: latin, fontSize: 38, fontWeight: 700, color: colors.pinyin }}>{it.pinyin}</span>
              </div>
            )}
            {/* 越南语标签常驻 */}
            <div style={{ position: "absolute", left: 0, right: 0, top: cellH * 0.76, display: "flex", justifyContent: "center", padding: "0 8px" }}>
              <Sticker text={it.viet} size={52} fill={colors.vietFill} stroke={colors.vietStroke} strokeW={7} family={latin} weight={900} style={{ whiteSpace: "nowrap" }} />
            </div>
          </div>
        );
      })}

      {/* 音频：问句 t=0；『我在』在答句框弹入时刻发音；每个词在滑走揭示的那一刻发音 */}
      {qb && (
        <Sequence durationInFrames={framesMs(qb.durationMs, fps)} layout="none">
          <Audio src={staticFile(qb.audio)} />
        </Sequence>
      )}
      {qb?.answerAudio && (
        <Sequence from={framesMs(ansReveal, fps)} durationInFrames={framesMs(Math.max(1, qb.durationMs - ansReveal), fps)} layout="none">
          <Audio src={staticFile(qb.answerAudio)} />
        </Sequence>
      )}
      {items.map((it, idx) => (
        <Sequence key={`au-${it.id}`} from={framesMs(starts[idx] + it.gapMs, fps)} durationInFrames={framesMs(it.durationMs - it.gapMs, fps)} layout="none">
          <Audio src={staticFile(it.audio)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const LAYOUT: LayoutModule = {
  id: "grid-9",
  segments: (beats) => [beats], // 单段：整片一张连续画布，无段间转场
  transitionOf: () => undefined,
  Segment: GridSegment,
};
