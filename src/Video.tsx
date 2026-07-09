// 视频编排层：读 manifest，按 manifest.meta.layout 选版式(src/layouts/registry)，
// 用 TransitionSeries 把各"段"串起来(段间转场)，叠加字体加载与全片 BGM。
// ★ 具体版面(图/字幕/运镜)全在各 LayoutModule 里；这里不含任何版式细节，加模板不改本文件。
import {
  AbsoluteFill, Audio, CalculateMetadataFunction, staticFile, delayRender, continueRender,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { useState, useEffect } from "react";
import { loadFonts, type FontsMeta } from "./fonts";
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
      {/* 全片固定古风背景音乐：低音量循环，垫在旁白之下（用户 2026-07-05 锁定） */}
      {bgm?.src ? <Audio src={staticFile(bgm.src)} volume={() => bgm.volume ?? 0.08} loop /> : null}
    </AbsoluteFill>
  );
};
