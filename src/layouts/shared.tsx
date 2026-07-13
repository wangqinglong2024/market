// 渲染层跨版式共享的工具与组件。各 LayoutModule 与 Video.tsx 复用这里，避免重复。
import { delayRender, continueRender } from "remotion";
import { type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { useRef, useState, useLayoutEffect } from "react";
import { pinyin } from "pinyin-pro";
import type { Beat, Motion, Effect } from "./types";
// ─── 特效库（开放·可扩展：在 src/fx/ 加一个 React 组件、再到下方 EffectsLayer 加一个 case 即接入，无固定数量、无上限）───
import { ComicPops } from "../fx/emotion/ComicPops";
import { EmojiRain } from "../fx/emotion/EmojiRain";
import { ScorePop } from "../fx/emotion/ScorePop";
import { ZoomBlur } from "../fx/distortion/ZoomBlur";

export const DEFAULT_MOTION: Motion = { scale: [1.03, 1.1], panX: [0, 0], panY: [0, 0], driftX: 8, driftY: 6, ease: "inOut" };
export const DEFAULT_CAP = { pinyinColor: "#a58e5c", zhColor: "#20242b", localColor: "#d6336c", bgColor: "#fdfcf7" };

export const manifestPath = (shard: string, id: string) => `videos/${shard}/${id}/manifest.json`;
// 只依赖 durationMs，Beat / RenderBeat / grid beat 都能传
export const beatFrames = (b: { durationMs: number }, fps: number) => Math.max(1, Math.round((b.durationMs / 1000) * fps));

export const isHan = (c: string) => /[㐀-鿿]/.test(c);

export function toRuby(zh: string): { c: string; py: string }[] {
  const sylls = pinyin(zh, { toneType: "symbol", type: "array", nonZh: "removed" });
  let i = 0;
  return Array.from(zh).map((c) => (isHan(c) ? { c, py: sylls[i++] ?? "" } : { c, py: "" }));
}

// 单行自适应缩放：内容超过 maxWidth 时整行等比缩小（配合字级跳字不占布局）
export const FitLine: React.FC<{ maxWidth: number; depKey: string; children: React.ReactNode }> = ({
  maxWidth, depKey, children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [handle] = useState(() => delayRender(`fit-${depKey}`));
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      const w = el.scrollWidth;
      setScale(w > maxWidth ? maxWidth / w : 1);
    }
    continueRender(handle);
  }, [depKey, maxWidth, handle]);
  return (
    <div style={{ width: maxWidth, display: "flex", justifyContent: "center" }}>
      <div ref={ref} style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "flex-end", transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
};

// 特效调度：按 fx.type 分发到 src/fx/ 的组件。新增特效 = 写组件 + 在此 switch 加一个 case（未知 type 忽略）。
export const EffectsLayer: React.FC<{ effects?: Effect[]; durationInFrames: number }> = ({
  effects, durationInFrames,
}) => {
  if (!effects?.length) return null;
  return (
    <>
      {effects.map((fx, i) => {
        const d = durationInFrames;
        const k = i;
        switch (fx.type) {
          case "comicPops":  return <ComicPops key={k} durationInFrames={d} seed={`cp-${k}`} words={fx.words} />;
          case "emojiRain":  return <EmojiRain key={k} durationInFrames={d} emojis={fx.emojis} count={fx.count ?? 16} opacity={fx.opacity ?? 0.55} />;
          case "scorePop":   return <ScorePop key={k} durationInFrames={d} count={fx.count} interval={fx.interval ?? 0.62} tokens={fx.tokens} seed={`sp-${k}`} />;
          case "zoomBlur":   return <ZoomBlur key={k} durationInFrames={d} cx={fx.cx ?? 0.5} cy={fx.cy ?? 0.5} color={fx.color ?? "#fff"} opacity={fx.opacity ?? 0.3} rings={fx.rings ?? 5} />;
          default:           return null;
        }
      })}
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const presentationFor = (name?: Beat["transitionIn"]): TransitionPresentation<any> => {
  switch (name) {
    case "slide-left": return slide({ direction: "from-right" });
    case "slide-up":   return slide({ direction: "from-bottom" });
    case "wipe":       return wipe({ direction: "from-left" });
    default:           return fade();
  }
};
