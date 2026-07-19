// 「字即窗口」原型:「水」字笔画里灌真实流水(可灵素材)。墨字 → 活水从底部涨上来。
// 遮罩=用加载好的毛笔字体在 canvas 画「水」→ toDataURL 当 CSS mask,墨层与水层共用同一遮罩,永远对齐。
import {
  AbsoluteFill, OffthreadVideo, interpolate, staticFile,
  useCurrentFrame, delayRender, continueRender,
} from "remotion";
import { useState, useEffect } from "react";
import { loadFonts, DEFAULT_FONTS, stackCss } from "./fonts";

const PAPER = "#ece1c9";
const INK = "#211a11";
const MASK = 720; // 遮罩画布/字框边长

// 用毛笔字体在 canvas 渲染单字 → PNG dataURL,做 CSS 遮罩(模块级缓存,渲染时只算一次)。
const maskCache: Record<string, string> = {};
function useGlyphMask(char: string): string | null {
  const [url, setUrl] = useState<string | null>(maskCache[char] ?? null);
  const [h] = useState(() => (maskCache[char] ? 0 : delayRender("mask-" + char)));
  useEffect(() => {
    if (maskCache[char]) return;
    (async () => {
      await loadFonts(DEFAULT_FONTS);
      try { await (document as unknown as { fonts: { load: (s: string) => Promise<unknown> } }).fonts.load(`520px "Ma Shan Zheng"`); } catch { /* ignore */ }
      const cv = document.createElement("canvas");
      cv.width = MASK; cv.height = MASK;
      const ctx = cv.getContext("2d")!;
      ctx.clearRect(0, 0, MASK, MASK);
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `520px "Ma Shan Zheng", sans-serif`;
      ctx.fillText(char, MASK / 2, MASK / 2 + 30);
      const u = cv.toDataURL("image/png");
      maskCache[char] = u;
      setUrl(u);
      continueRender(h as number);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return url;
}

export const InkShuiTest: React.FC = () => {
  const frame = useCurrentFrame();
  const mask = useGlyphMask("水");
  const latin = stackCss(DEFAULT_FONTS.latinStack);

  const inkIn = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const level = interpolate(frame, [24, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); // 水位 底→顶
  const infoP = interpolate(frame, [96, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const maskStyle: React.CSSProperties = mask
    ? {
        WebkitMaskImage: `url(${mask})`, maskImage: `url(${mask})`,
        WebkitMaskSize: `${MASK}px ${MASK}px`, maskSize: `${MASK}px ${MASK}px`,
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
      }
    : {};

  const boxLeft = (1080 - MASK) / 2;
  const boxTop = 1920 * 0.32 - MASK / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0) 55%, rgba(120,90,40,0.16) 100%)" }} />

      <div style={{ position: "absolute", left: boxLeft, top: boxTop, width: MASK, height: MASK }}>
        {/* 墨字(始终满,底色) */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: INK, opacity: inkIn, ...maskStyle }} />
        {/* 活水:同遮罩,clip 从底部涨上来盖住墨字 */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(${(1 - level) * 100}% 0 0 0)` }}>
          <OffthreadVideo src={staticFile("library/textures/water.mp4")} muted
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...maskStyle }} />
        </div>
      </div>

      {/* 拼音 + 越南语 */}
      <div style={{ position: "absolute", left: 0, top: 1920 * 0.55, width: 1080, textAlign: "center",
        fontFamily: latin, fontSize: 96, fontWeight: 700, color: "#2f6f8f", opacity: infoP }}>shuǐ</div>
      <div style={{ position: "absolute", left: 0, top: 1920 * 0.63, width: 1080, textAlign: "center",
        fontFamily: latin, fontSize: 78, fontWeight: 700, color: "#b0431f", opacity: infoP }}>nước</div>
    </AbsoluteFill>
  );
};
