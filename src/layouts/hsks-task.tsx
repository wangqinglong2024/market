// 版式『hsks-task · HSK我能做到(9:16)』。★无配音·密集图文卡:每页 2 条能力,每条=彩色技能插画 + 打钩✓ + 任务句(中越结合)。底部进度条。翻页浏览。
// 数据零编造:任务句原文来自 /hsk 03_tasks.csv,越南语来自 vi-lexicon。见 templates/hsks/GANGLING.md。
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { Manifest } from "./types";
import type { FontsMeta } from "../fonts";
import { type HsksBeat, type HsksItem, zhFam, latinFam, safeArea, PaperBG, Header, ItemAudio, Sparkles, useLit, makeLayout } from "./hsks-shared";
import { Art } from "./hsks-art";

type KItem = HsksItem & { type: string; text: string; vi: string; icon: string };
type KBeat = HsksBeat & { doneBase: number; total: number };

const PALETTE = ["#12b886", "#2b7fff", "#ec4899", "#f0a020", "#7048e8", "#e8590c"];

const Row: React.FC<{ it: KItem; idx: number; nextAtMs: number; color: string; fonts?: FontsMeta }> = ({ it, idx, nextAtMs, color, fonts }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAt = 6 + idx * 8;
  const s = spring({ frame: f - inAt, fps, config: { damping: 15, mass: 0.7, stiffness: 150 }, durationInFrames: 18 });
  const op = interpolate(f - inAt, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 读到该条即勾选 + 点亮
  const { isActive, localMs, litT } = useLit(it, nextAtMs);
  const read = (it.readAtMs ?? 0) > 0 || isActive; // 已读过(readAt 已过)或正在读
  const passed = f / fps * 1000 >= (it.readAtMs ?? 0);
  const tick = passed ? interpolate(localMs, [80, 520], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  void read;
  return (
    <div style={{
      position: "relative", background: "#fff", borderRadius: 30, border: `3px solid ${isActive ? color : `${color}88`}`,
      boxShadow: isActive ? `0 0 0 5px ${color}22, 0 16px 34px ${color}55` : `0 12px 28px ${color}2e`,
      padding: "22px 26px", opacity: op, transform: `translateY(${(1 - s) * 40}px) scale(${(0.95 + s * 0.05) * (1 + litT * 0.03)})`,
      display: "flex", gap: 20, alignItems: "flex-start",
    }}>
      {isActive ? <Sparkles t={litT} color={color} /> : null}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 100, height: 100, background: `${color}18`, borderRadius: 22, padding: 10, filter: isActive ? `drop-shadow(0 6px 14px ${color}77)` : "none" }}><Art id={it.icon} accent={color} /></div>
        <svg width="52" height="52" viewBox="0 0 52 52"><rect x="4" y="4" width="44" height="44" rx="12" fill={color} opacity={tick} /><rect x="4" y="4" width="44" height="44" rx="12" fill="none" stroke={color} strokeWidth="4" /><path d="M15 27l8 8 14-16" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} /></svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 999, background: `${color}1f`, fontFamily: zhFam(fonts), fontSize: 26, fontWeight: 800, color, marginBottom: 8 }}>{it.type}</div>
        <div style={{ fontFamily: zhFam(fonts), fontSize: 36, fontWeight: 800, color: "#151b26", lineHeight: 1.28 }}>{it.text}</div>
        <div style={{ fontFamily: latinFam(fonts), fontSize: 30, fontWeight: 800, color: "#26324a", marginTop: 8, lineHeight: 1.2 }}>{it.vi}</div>
      </div>
    </div>
  );
};

const Page: React.FC<{ beat: HsksBeat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = meta.fonts;
  const accent = beat.accent || (meta as { theme?: { accent?: string } }).theme?.accent || "#12b886";
  const { safeX, safeTop, safeBottom } = safeArea(meta);
  const b = beat as KBeat;
  const items = beat.items as KItem[];
  const pageIn = spring({ frame: f, fps, config: { damping: 16, mass: 0.8, stiffness: 120 }, durationInFrames: 14 });
  const pageOp = interpolate(f, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const curMs = (f / fps) * 1000;
  const readCount = items.filter((it) => curMs >= (it.readAtMs ?? 0)).length;
  const doneRatio = Math.min(1, (b.doneBase + readCount) / b.total);

  return (
    <AbsoluteFill>
      <PaperBG accent={accent} seed={beat.page * 53 + 11} />
      <div style={{ transform: `translateY(${(1 - pageIn) * 70}px)`, opacity: pageOp }}>
        <Header beat={beat} fonts={fonts} accent={accent} top={safeTop} />
        <div style={{ position: "absolute", left: safeX, top: safeTop + 210, width: meta.width - safeX * 2, height: safeBottom - (safeTop + 210) - 110, display: "flex", flexDirection: "column", gap: 26, justifyContent: "center" }}>
          {items.map((it, i) => <Row key={i} it={it} idx={i} nextAtMs={(items[i + 1]?.readAtMs as number) ?? (beat.durationMs as number)} color={PALETTE[((beat.page - 1) * items.length + i) % PALETTE.length]} fonts={fonts} />)}
        </div>
      </div>
      {/* 进度条 */}
      <div style={{ position: "absolute", left: safeX, top: safeBottom - 78, width: meta.width - safeX * 2 }}>
        <div style={{ height: 16, borderRadius: 999, background: "rgba(15,23,42,0.12)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${doneRatio * 100}%`, borderRadius: 999, background: accent, boxShadow: `0 0 16px ${accent}aa` }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontFamily: latinFam(fonts), fontSize: 28, fontWeight: 800, color: accent }}>{b.doneBase + readCount}/{b.total} ✓ · {beat.page < beat.pages ? "còn nữa ↑" : "lưu lại ♥"}</div>
      </div>
      <ItemAudio items={beat.items} />
    </AbsoluteFill>
  );
};

export const LAYOUT = makeLayout("hsks-task", Page);
