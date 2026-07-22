// 视频编排层：读 manifest，按 manifest.meta.layout 选版式(src/layouts/registry)，
// 用 TransitionSeries 把各"段"串起来(段间转场)，叠加字体加载与全片 BGM。
// ★ 具体版面(图/字幕/运镜)全在各 LayoutModule 里；这里不含任何版式细节，加模板不改本文件。
import {
  AbsoluteFill, Audio, CalculateMetadataFunction, staticFile, delayRender, continueRender,
  useCurrentFrame, useVideoConfig, interpolate, spring,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { useState, useEffect } from "react";
import { loadFonts, stackCss, DEFAULT_FONTS, type FontsMeta } from "./fonts";
import type { Manifest, VideoProps } from "./layouts/types";
import { beatFrames, manifestPath, presentationFor } from "./layouts/shared";
import { getLayout } from "./layouts/registry";

export type { VideoProps } from "./layouts/types";

export const calcVideoMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const res = await fetch(staticFile(manifestPath(props.shard, props.videoId)));
  const manifest: Manifest = await res.json();
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const sum = manifest.beats.reduce((a, b) => a + beatFrames(b, fps), 0);
  // 转场只在段边界，重叠按段数算（段的划分由版式决定：v2=场景组数、v1=拍数）
  const segments = getLayout(manifest.meta.layout).segments(manifest.beats).length;
  const overlap = Math.max(0, segments - 1) * trans;
  return {
    durationInFrames: Math.max(1, sum - overlap),
    fps,
    width: manifest.meta.width,
    height: manifest.meta.height,
    props: { ...props, manifest },
  };
};

// 按 manifest.meta.fonts 幂等加载字体；渲染前用 delayRender 等字体就绪
const FontLoader: React.FC<{ fonts?: FontsMeta }> = ({ fonts }) => {
  const [h] = useState(() => delayRender("manifest-fonts"));
  useEffect(() => {
    loadFonts(fonts ?? {}).finally(() => continueRender(h));
  }, [h, fonts]);
  return null;
};

// 首 N 秒「看短剧学中文」引导标(越南语):顶部留白区(图片上方)对话框气泡,让刚进来的人立刻知道这是学中文的。
// 数据驱动:meta.badge 存在即渲染(textVi 主行 + 可选 textZh 中文小字, durationMs 后弹出消失)。
// 对话框式:spring 弹入下滑 + 底部小尾巴三角。
const LearnBadge: React.FC<{ meta: Manifest["meta"] }> = ({ meta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = meta.badge;
  const textVi = badge?.textVi ?? "Học tiếng Trung";
  const textZh = badge?.textZh;
  const emoji = badge?.emoji ?? "🎬";
  const pairs = badge?.pairs;
  const durMs = badge?.durationMs ?? 3000;
  const hideAt = Math.round((durMs / 1000) * fps);
  if (frame >= hideAt) return null;
  // spring 弹入(带回弹),末尾淡出上滑。
  const pop = spring({ frame, fps, config: { damping: 12, mass: 0.7, stiffness: 140 }, durationInFrames: 18 });
  const outT = interpolate(frame, [hideAt - 12, hideAt], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - outT);
  const scale = 0.7 + 0.3 * pop;
  const rise = (1 - pop) * -16 + outT * -14; // 从上方弹入,退场再上滑
  const region = meta.source?.region ?? { top: 120, height: 720 };
  const latinFamily = stackCss({ ...DEFAULT_FONTS, ...(meta.fonts || {}) }.latinStack);
  const zhFamily = stackCss({ ...DEFAULT_FONTS, ...(meta.fonts || {}) }.zhStack);
  const CYAN = "#25f4ee";
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width: meta.width, height: region.top,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity, transform: `translateY(${rise}px) scale(${scale})`, transformOrigin: "center top", pointerEvents: "none",
    }}>
      <div style={{ position: "relative" }}>
        {/* 气泡主体 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          padding: pairs?.length ? "8px 30px 10px" : (textZh ? "9px 32px 11px" : "12px 34px"), borderRadius: 26,
          background: "rgba(6,10,14,0.82)", border: `2.5px solid ${CYAN}`,
          boxShadow: `0 0 26px rgba(37,244,238,0.45), 0 6px 18px rgba(0,0,0,0.4)`,
        }}>
          <span style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</span>
          {pairs?.length ? (
            // 逐字对照:每个汉字一列,越南语词对齐其下,列间距拉大。sep=分隔点列。
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              {pairs.map((p, i) => p.sep ? (
                <span key={i} style={{ fontFamily: latinFamily, fontSize: 34, color: CYAN, opacity: 0.6, alignSelf: "flex-start", padding: "0 2px", marginTop: 2 }}>{p.sep}</span>
              ) : (
                // ★越南语大字(主,给越南受众)在上,中文小字在下(用户 2026-07-19)。
                <span key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.04 }}>
                  <span style={{ fontFamily: latinFamily, fontSize: 37, fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap" }}>{p.vi}</span>
                  <span style={{ fontFamily: zhFamily, fontSize: 23, fontWeight: 400, color: CYAN, marginTop: 2 }}>{p.zh}</span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.05 }}>
              <span style={{ fontFamily: latinFamily, fontSize: 42, fontWeight: 800, color: "#ffffff", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{textVi}</span>
              {textZh ? (
                <span style={{ fontFamily: zhFamily, fontSize: 30, fontWeight: 400, color: CYAN, letterSpacing: 3, whiteSpace: "nowrap", marginTop: 2 }}>{textZh}</span>
              ) : null}
            </div>
          )}
        </div>
        {/* 对话框底部小尾巴三角 */}
        <div style={{
          position: "absolute", left: "50%", bottom: -13, transform: "translateX(-50%)",
          width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent",
          borderTop: `14px solid ${CYAN}`,
        }} />
        <div style={{
          position: "absolute", left: "50%", bottom: -9, transform: "translateX(-50%)",
          width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
          borderTop: "11px solid rgba(6,10,14,0.82)",
        }} />
      </div>
    </div>
  );
};

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  if (!manifest) return <AbsoluteFill style={{ backgroundColor: "#fdfcf7" }} />;
  const fps = manifest.meta.fps;
  const trans = manifest.meta.transitionFrames ?? 12;
  const bg = manifest.meta.captions?.bgColor ?? "#fdfcf7";
  const layout = getLayout(manifest.meta.layout);
  const Segment = layout.Segment;

  const children: React.ReactNode[] = [];
  layout.segments(manifest.beats).forEach((seg, i) => {
    const segDur = seg.reduce((a, b) => a + beatFrames(b, fps), 0);
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${seg[0].id}`}
          presentation={presentationFor(layout.transitionOf(seg))}
          timing={linearTiming({ durationInFrames: trans })}
        />,
      );
    }
    children.push(
      <TransitionSeries.Sequence key={`s-${seg[0].id}`} durationInFrames={segDur}>
        <Segment beats={seg} meta={manifest.meta} />
      </TransitionSeries.Sequence>,
    );
  });

  const bgm = manifest.meta.bgm;

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <FontLoader fonts={manifest.meta.fonts} />
      <TransitionSeries>{children}</TransitionSeries>
      {/* 首 N 秒「看短剧学中文」引导标:数据驱动(meta.badge 存在即渲染) */}
      {manifest.meta.badge ? <LearnBadge meta={manifest.meta} /> : null}
      {/* 全片固定古风背景音乐：低音量循环，垫在旁白之下（用户 2026-07-05 锁定） */}
      {bgm?.src ? <Audio src={staticFile(bgm.src)} volume={() => bgm.volume ?? 0.08} loop /> : null}
    </AbsoluteFill>
  );
};
