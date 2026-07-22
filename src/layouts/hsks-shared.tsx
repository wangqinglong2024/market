// hsks 家族·共享渲染件(grammar/topic/task/hanzi 复用)。守 templates/hsks/GANGLING.md。
// 提供：宣纸底+暗角+微光、出处徽标+页进度点、命中色墨炸裂 Burst、迸发星火、循环钩子、安全区、逐项配音、单段时间线工厂。
// 各子模板只写自己的 Page(版式+专属动效)，其余全用这里，保证全家族设计系统一致。
import {
  AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, spring,
} from "remotion";
import type { LayoutModule, RenderBeat, Manifest } from "./types";
import { DEFAULT_FONTS, stackCss, type FontsMeta } from "../fonts";

export type HsksItem = { readAtMs?: number; read?: string; audio?: string; [k: string]: unknown };
export type HsksBeat = RenderBeat & {
  page: number; pages: number; source: string; titleVi?: string; accent?: string; items: HsksItem[];
};

export const zhFam = (fonts?: FontsMeta) => stackCss({ ...DEFAULT_FONTS, ...(fonts || {}) }.zhStack);
export const latinFam = (fonts?: FontsMeta) => stackCss({ ...DEFAULT_FONTS, ...(fonts || {}) }.latinStack);

// 9:16 四边 12% 安全区(避平台 UI)。
export const safeArea = (meta: Manifest["meta"]) => {
  const safeX = Math.round(meta.width * 0.12);    // ≈130
  const safeTop = Math.round(meta.height * 0.12); // ≈230
  return { safeX, safeTop, safeBottom: meta.height - safeTop };
};

// ── 背景漂浮光点(微动·呼吸感) ──
export const Bokeh: React.FC<{ accent: string; seed: number }> = ({ accent, seed }) => {
  const f = useCurrentFrame();
  const dots = Array.from({ length: 14 }, (_, i) => {
    const r = ((seed * 9301 + i * 49297) % 233280) / 233280;
    const r2 = ((seed * 4507 + i * 7919) % 233280) / 233280;
    const drift = Math.sin((f / 30 + i) * 0.6) * 18;
    return (
      <div key={i} style={{
        position: "absolute", left: 60 + r * 960, top: 200 + r2 * 1520 + drift,
        width: 6 + r * 22, height: 6 + r * 22, borderRadius: "50%",
        background: i % 3 === 0 ? accent : "#ffffff", opacity: 0.05 + r2 * 0.12, filter: "blur(1px)",
      }} />
    );
  });
  return <>{dots}</>;
};

// ── 宣纸底 + 暗角 + 微光(与封面统一) ──
export const PaperBG: React.FC<{ accent: string; seed: number }> = ({ accent, seed }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: "#ece1c9" }} />
    <AbsoluteFill style={{ background: "radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)" }} />
    <Bokeh accent={accent} seed={seed} />
  </>
);

// ── 出处徽标 + 越南语标题 + 页进度点('还有更多页'心理暗示) ──
export const Header: React.FC<{ beat: HsksBeat; fonts?: FontsMeta; accent: string; top: number }> = ({ beat, fonts, accent, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 14, mass: 0.6, stiffness: 160 }, durationInFrames: 16 });
  return (
    <div style={{ position: "absolute", top, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `translateY(${(1 - pop) * -14}px)`, opacity: pop }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 26px", borderRadius: 999, background: "rgba(15,23,42,0.92)", border: `2px solid ${accent}`, boxShadow: `0 0 22px ${accent}55` }}>
        <span style={{ fontSize: 26 }}>📚</span>
        <span style={{ fontFamily: zhFam(fonts), fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>{beat.source}</span>
      </div>
      {beat.titleVi ? (
        <span style={{ fontFamily: latinFam(fonts), fontSize: 38, fontWeight: 900, color: "#1f2937", letterSpacing: 0.5, textAlign: "center", padding: "0 40px", lineHeight: 1.1 }}>{beat.titleVi}</span>
      ) : null}
      <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
        {Array.from({ length: beat.pages }, (_, i) => (
          <div key={i} style={{ width: i + 1 === beat.page ? 34 : 12, height: 12, borderRadius: 999, background: i + 1 === beat.page ? accent : "rgba(30,41,59,0.22)" }} />
        ))}
      </div>
    </div>
  );
};

// ── 命中色墨炸裂(读到该项瞬间：扩散环 + 墨点四射) ──
export const Burst: React.FC<{ localMs: number; color: string; size?: string }> = ({ localMs, color, size = "92%" }) => {
  const p = interpolate(localMs, [0, 360], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (p <= 0 || p >= 1) return null;
  const angles = [8, 52, 96, 140, 184, 228, 272, 316];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible" }}>
        <circle cx="100" cy="100" r={38 + p * 74} fill="none" stroke={color} strokeWidth={9 * (1 - p)} opacity={0.7 * (1 - p)} />
        {angles.map((a, i) => {
          const r = (a * Math.PI) / 180; const d = 26 + p * 78 + (i % 3) * 6; const rad = (7 + (i % 3) * 3) * (1 - p * 0.55);
          return <circle key={i} cx={100 + d * Math.cos(r)} cy={100 + d * Math.sin(r)} r={Math.max(0, rad)} fill={i % 2 ? color : "#fff"} opacity={1 - p} />;
        })}
      </svg>
    </div>
  );
};

// ── 迸发星火(围绕四角弹出小星) ──
export const Sparkles: React.FC<{ t: number; color: string }> = ({ t, color }) => {
  const pts = [{ x: 14, y: 18 }, { x: 86, y: 14 }, { x: 90, y: 62 }, { x: 10, y: 70 }, { x: 50, y: 8 }, { x: 78, y: 88 }];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pts.map((p, i) => {
        const phase = Math.min(1, Math.max(0, t * 1.2 - i * 0.06)); const s = Math.sin(phase * Math.PI);
        return (
          <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: 16, height: 16, transform: `translate(-50%,-50%) scale(${s}) rotate(${phase * 90}deg)`, opacity: s }}>
            <svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 0l2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4z" fill={i % 2 ? "#fff" : color} /></svg>
          </div>
        );
      })}
    </div>
  );
};

// ── 底部循环钩子(延迟淡入,第0帧不显示) ──
export const HookFooter: React.FC<{ beat: HsksBeat; fonts?: FontsMeta; accent: string; top: number }> = ({ beat, fonts, accent, top }) => {
  const f = useCurrentFrame();
  const hookIn = interpolate(f, [14, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top, left: 0, width: "100%", textAlign: "center", fontFamily: latinFam(fonts), fontSize: 30, fontWeight: 800, color: accent, opacity: 0.9 * hookIn, transform: `translateY(${(1 - hookIn) * 14}px)` }}>
      {beat.page < beat.pages ? "còn nữa ↑" : "lưu lại để học! ♥"}
    </div>
  );
};

// ── 逐项配音：每项在其等距 slot 起点播放(词库复用)，与高亮同拍 ──
export const ItemAudio: React.FC<{ items: HsksItem[] }> = ({ items }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {items.map((it, i) => it.audio ? (
        <Sequence key={`a-${i}`} from={Math.round(((it.readAtMs ?? 0) / 1000) * fps)} layout="none">
          <Audio src={staticFile(it.audio as string)} />
        </Sequence>
      ) : null)}
    </>
  );
};

// 当前项是否点亮 + 局部时间(音频驱动高亮，严格对齐发音含停顿)。
export function useLit(item: HsksItem, nextAtMs: number) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (f / fps) * 1000;
  const startMs = item.readAtMs ?? 0;
  const isActive = currentMs >= startMs && currentMs < nextAtMs;
  const winLen = Math.max(140, nextAtMs - startMs);
  const localMs = currentMs - startMs;
  const litT = isActive ? interpolate(localMs, [0, 90, winLen * 0.72, winLen], [0, 1, 1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return { isActive, localMs, litT, winLen };
}

// 单段时间线工厂：每页一个 <Sequence>，页时长各自 durationMs，总和为偶数秒。传入各模板自己的 Page。
export function makeLayout(id: string, Page: React.FC<{ beat: HsksBeat; meta: Manifest["meta"] }>): LayoutModule {
  const Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }> = ({ beats, meta }) => {
    const fps = meta.fps; let from = 0;
    return (
      <AbsoluteFill style={{ backgroundColor: "#ece1c9" }}>
        {beats.map((b) => {
          const dur = Math.max(1, Math.round(((b.durationMs as number) / 1000) * fps));
          const seq = <Sequence key={b.id} from={from} durationInFrames={dur}><Page beat={b as HsksBeat} meta={meta} /></Sequence>;
          from += dur; return seq;
        })}
      </AbsoluteFill>
    );
  };
  return { id, segments: (beats: RenderBeat[]) => [beats], transitionOf: () => "fade", Segment };
}
