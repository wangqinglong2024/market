// 版式『hsks-hanzi · HSK部件识字(9:16)』。★与 vocab 明显区分(用户 2026-07-23):3×3 密集瓷砖(每页 9 字,比词多)、彩色填充瓷砖风、字→图记忆联想插画角标、部件 tag。保留单字朗读同步高亮。
// ★与 hsk-ziyuan(字源演变)不同角度:部件归类识字。数据零编造:字来自 02_hanzi.csv,拼音 pinyin-pro,义 vi-lexicon,部件 components.json,联想图 hsks-art。见 GANGLING.md。
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { Manifest } from "./types";
import type { FontsMeta } from "../fonts";
import { type HsksBeat, type HsksItem, zhFam, latinFam, safeArea, PaperBG, Header, HookFooter, ItemAudio, Burst, useLit, makeLayout } from "./hsks-shared";
import { Art } from "./hsks-art";

type HItem = HsksItem & { ch: string; kind: string; py: string; vi: string; comp: string; compVi: string; icon: string };

// 每字一色(配色丰富,不单一)。
const PALETTE = ["#ff7a1a", "#2b7fff", "#12b886", "#7048e8", "#ec4899", "#0ea5a5", "#e8590c", "#f0a020", "#e03131"];

const Tile: React.FC<{ it: HItem; gi: number; idx: number; nextAtMs: number; color: string; fonts?: FontsMeta }> = ({ it, gi, idx, nextAtMs, color, fonts }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAt = 2 + idx * 2;
  const s = spring({ frame: f - inAt, fps, config: { damping: 13, mass: 0.7, stiffness: 160 }, durationInFrames: 16 });
  const op = interpolate(f - inAt, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { isActive, localMs, litT } = useLit(it, nextAtMs);

  return (
    <div style={{
      position: "relative", borderRadius: 24, background: isActive ? "#fff" : `${color}12`,
      border: `3px solid ${isActive ? color : `${color}55`}`,
      boxShadow: isActive ? `0 0 0 4px ${color}22, 0 14px 30px ${color}55` : `0 6px 16px ${color}22`,
      opacity: op, transform: `translateY(${(1 - s) * 40}px) scale(${(0.74 + s * 0.26) * (1 + litT * 0.05)})`, transformOrigin: "center",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 6px 12px", overflow: "hidden",
    }}>
      {isActive ? <Burst localMs={localMs} color={color} /> : null}
      {/* 记忆联想图(放大 + 一直动) */}
      <div style={{ width: 108, height: 108, background: `${color}22`, borderRadius: 22, padding: 10, boxShadow: `inset 0 0 0 2px ${color}30` }}><Art id={it.icon} accent={color} seed={gi} /></div>
      {/* 大汉字(识字主体) */}
      <div style={{ fontFamily: zhFam(fonts), fontSize: 64, fontWeight: 800, color: "#151b26", lineHeight: 1, marginTop: 4 }}>{it.ch}</div>
      <div style={{ fontFamily: latinFam(fonts), fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{it.py}</div>
      <div style={{ fontFamily: latinFam(fonts), fontSize: 23, fontWeight: 800, color: "#26324a", marginTop: 2, textAlign: "center", lineHeight: 1.03 }}>{it.vi}</div>
      {/* 部件 tag */}
      <div style={{ marginTop: 5, padding: "2px 12px", borderRadius: 999, background: `${color}1f`, display: "flex", alignItems: "center", gap: 6, fontFamily: latinFam(fonts), fontSize: 17, fontWeight: 800, color }}>
        <span style={{ fontFamily: zhFam(fonts), fontSize: 22, fontWeight: 900 }}>{it.comp}</span><span>{it.compVi}</span>
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
  const items = beat.items as HItem[];
  const pageIn = spring({ frame: f, fps, config: { damping: 16, mass: 0.8, stiffness: 120 }, durationInFrames: 14 });
  const pageOp = interpolate(f, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const gap = 20, cols = 3, rows = 3;
  const gridW = meta.width - safeX * 2;
  const gridTop = safeTop + 206;
  const gridBottom = safeBottom - 54;
  const cardH = (gridBottom - gridTop - gap * (rows - 1)) / rows;

  return (
    <AbsoluteFill>
      <PaperBG accent={accent} seed={beat.page * 29 + 5} />
      <div style={{ transform: `translateY(${(1 - pageIn) * 70}px)`, opacity: pageOp }}>
        <Header beat={beat} fonts={fonts} accent={accent} top={safeTop} />
        <div style={{ position: "absolute", left: safeX, top: gridTop, width: gridW, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${cardH}px`, gap }}>
          {items.map((it, i) => <Tile key={it.ch + i} it={it} gi={(beat.page - 1) * items.length + i} idx={i} nextAtMs={(items[i + 1]?.readAtMs as number) ?? (beat.durationMs as number)} color={PALETTE[((beat.page - 1) * 9 + i) % PALETTE.length]} fonts={fonts} />)}
        </div>
      </div>
      <HookFooter beat={beat} fonts={fonts} accent={accent} top={gridBottom + 14} />
      <ItemAudio items={beat.items} />
    </AbsoluteFill>
  );
};

export const LAYOUT = makeLayout("hsks-hanzi", Page);
