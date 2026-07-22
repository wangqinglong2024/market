// 版式『hsks-grammar · HSK语法点(9:16)』。★无配音·密集图文卡:每页 2 个语法点,每条=彩色插画 + 语法点名(中越) + 规则(中越) + 官方例句(拼音+中越,关键词脉冲)。翻页浏览。
// 数据零编造:语法点/规则/例句来自 /hsk 05_grammar.csv,拼音 pinyin-pro,越南语 vi-lexicon。见 templates/hsks/GANGLING.md。
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { Manifest } from "./types";
import type { FontsMeta } from "../fonts";
import { type HsksBeat, type HsksItem, zhFam, latinFam, safeArea, PaperBG, Header, HookFooter, makeLayout } from "./hsks-shared";
import { Art } from "./hsks-art";

type GItem = HsksItem & { label: string; type: string; rule: string; ruleVi: string; example: string; examplePy: string; exampleVi: string; keyword: string; icon: string };

// 丰富配色(不单一):每条卡取一个色。
const PALETTE = ["#ff7a1a", "#2b7fff", "#12b886", "#7048e8", "#ec4899", "#0ea5a5", "#e8590c", "#f0a020"];

// 例句：关键词强调色 + 脉冲。
const ExampleZh: React.FC<{ example: string; keyword: string; color: string; fonts?: FontsMeta; f: number }> = ({ example, keyword, color, fonts, f }) => {
  const chars = Array.from(example);
  const hit = new Set<number>();
  if (keyword) for (let i = 0; (i = example.indexOf(keyword, i)) !== -1; i += keyword.length) for (let k = 0; k < Array.from(keyword).length; k++) hit.add(i + k);
  const pulse = 1 + Math.abs(Math.sin(f * 0.2)) * 0.16;
  return (
    <div style={{ fontFamily: zhFam(fonts), fontSize: 39, fontWeight: 800, color: "#151b26", lineHeight: 1.2, letterSpacing: 0.5 }}>
      {chars.map((c, i) => hit.has(i)
        ? <span key={i} style={{ display: "inline-block", color, transform: `scale(${pulse})`, textShadow: `0 0 14px ${color}77` }}>{c}</span>
        : <span key={i}>{c}</span>)}
    </div>
  );
};

const Card: React.FC<{ it: GItem; idx: number; color: string; fonts?: FontsMeta }> = ({ it, idx, color, fonts }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAt = 4 + idx * 6;
  const s = spring({ frame: f - inAt, fps, config: { damping: 15, mass: 0.7, stiffness: 150 }, durationInFrames: 18 });
  const op = interpolate(f - inAt, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      background: "#fff", borderRadius: 26, border: `3px solid ${color}`, boxShadow: `0 10px 24px ${color}30`,
      padding: "14px 22px 16px", opacity: op, transform: `translateY(${(1 - s) * 36}px) scale(${0.94 + s * 0.06})`,
      display: "flex", flexDirection: "column", gap: 8, overflow: "hidden",
    }}>
      {/* 头：插画 + 语法点名(中越) */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 72, height: 72, flex: "0 0 auto", background: `${color}1a`, borderRadius: 18, padding: 7 }}><Art id={it.icon} accent={color} /></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "inline-block", padding: "2px 14px", borderRadius: 999, background: color, fontFamily: zhFam(fonts), fontSize: 27, fontWeight: 900, color: "#fff" }}>{it.label}</div>
          <div style={{ fontFamily: latinFam(fonts), fontSize: 27, fontWeight: 800, color, marginTop: 3, lineHeight: 1.08 }}>{it.ruleVi}</div>
        </div>
      </div>
      {/* 规则(中文) */}
      <div style={{ fontFamily: zhFam(fonts), fontSize: 29, fontWeight: 700, color: "#334155", lineHeight: 1.15 }}>{it.rule}</div>
      {/* 例句盒 */}
      <div style={{ background: `${color}12`, borderRadius: 16, padding: "10px 16px", borderLeft: `8px solid ${color}` }}>
        <div style={{ fontFamily: latinFam(fonts), fontSize: 23, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>{it.examplePy}</div>
        <ExampleZh example={it.example} keyword={it.keyword} color={color} fonts={fonts} f={f} />
        <div style={{ fontFamily: latinFam(fonts), fontSize: 27, fontWeight: 800, color: "#26324a", marginTop: 4, lineHeight: 1.12 }}>{it.exampleVi}</div>
      </div>
    </div>
  );
};

const Page: React.FC<{ beat: HsksBeat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = meta.fonts;
  const accent = beat.accent || (meta as { theme?: { accent?: string } }).theme?.accent || "#ff7a1a";
  const { safeX, safeTop, safeBottom } = safeArea(meta);
  const items = beat.items as GItem[];
  const pageIn = spring({ frame: f, fps, config: { damping: 16, mass: 0.8, stiffness: 120 }, durationInFrames: 14 });
  const pageOp = interpolate(f, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBG accent={accent} seed={beat.page * 31 + 7} />
      <div style={{ transform: `translateY(${(1 - pageIn) * 70}px)`, opacity: pageOp }}>
        <Header beat={beat} fonts={fonts} accent={accent} top={safeTop} />
        <div style={{ position: "absolute", left: safeX, top: safeTop + 210, width: meta.width - safeX * 2, height: safeBottom - (safeTop + 210) - 40, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center" }}>
          {items.map((it, i) => <Card key={i} it={it} idx={i} color={PALETTE[((beat.page - 1) * items.length + i) % PALETTE.length]} fonts={fonts} />)}
        </div>
      </div>
      <HookFooter beat={beat} fonts={fonts} accent={accent} top={safeBottom - 44} />
    </AbsoluteFill>
  );
};

export const LAYOUT = makeLayout("hsks-grammar", Page);
