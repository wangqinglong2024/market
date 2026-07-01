import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useMemo } from "react";
import { pinyin } from "pinyin-pro";
import { FONT_LATIN, FONT_ZH } from "./fonts";

// ---- 数据类型：完全由 manifest 驱动，渲染层不含业务内容 ----
type Motion = { scale: [number, number]; panX: [number, number]; panY: [number, number] };

type Beat = {
  id: string;
  image: string;
  audio: string;
  durationMs: number;
  motion?: string; // 运镜预设名，见 meta.motionPresets
  captions: { pinyin: string; zh: string; local?: string; vi?: string };
};

type Manifest = {
  meta: {
    fps: number;
    width: number;
    height: number;
    bandTopRatio?: number;
    motionPresets?: Record<string, Motion>;
    pageTurn?: { fadeFrames: number; captionRiseFrames: number; captionRisePx: number };
    captions?: { pinyinColor: string; zhColor: string; localColor: string; bgColor: string };
  };
  beats: Beat[];
};

export type VideoProps = { videoId: string; shard: string; manifest: Manifest | null };

const DEFAULT_MOTION: Motion = { scale: [1.03, 1.09], panX: [0, 0], panY: [0, 0] };
const DEFAULT_CAP = { pinyinColor: "#a58e5c", zhColor: "#20242b", localColor: "#d6336c", bgColor: "#fefefe" };

const manifestPath = (shard: string, id: string) => `videos/${shard}/${id}/manifest.json`;

// 时长/画幅由 manifest 决定，一个组件服务所有视频
export const calcVideoMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const res = await fetch(staticFile(manifestPath(props.shard, props.videoId)));
  const manifest: Manifest = await res.json();
  const fps = manifest.meta.fps;
  const frames = manifest.beats.reduce((a, b) => a + Math.round((b.durationMs / 1000) * fps), 0);
  return {
    durationInFrames: Math.max(1, frames),
    fps,
    width: manifest.meta.width,
    height: manifest.meta.height,
    props: { ...props, manifest },
  };
};

const isHan = (c: string) => /[㐀-鿿]/.test(c);

// 汉字↔拼音一一对应（整句注音保证多音字准确，再按字对齐）
function toRuby(zh: string): { c: string; py: string }[] {
  const sylls = pinyin(zh, { toneType: "symbol", type: "array", nonZh: "removed" });
  let i = 0;
  return Array.from(zh).map((c) => (isHan(c) ? { c, py: sylls[i++] ?? "" } : { c, py: "" }));
}

const RubyCaption: React.FC<{ zh: string; pinyinColor: string; zhColor: string }> = ({
  zh,
  pinyinColor,
  zhColor,
}) => {
  const pairs = useMemo(() => toRuby(zh), [zh]);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-end",
        rowGap: 8,
        columnGap: 2,
      }}
    >
      {pairs.map((p, idx) => (
        <span key={idx} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span
            style={{
              fontFamily: FONT_LATIN,
              fontSize: 32,
              lineHeight: "36px",
              fontWeight: 800,
              color: pinyinColor,
              height: 36,
            }}
          >
            {p.py}
          </span>
          <span style={{ fontFamily: FONT_ZH, fontSize: 62, lineHeight: "70px", color: zhColor }}>{p.c}</span>
        </span>
      ))}
    </div>
  );
};

const Scene: React.FC<{ beat: Beat; meta: Manifest["meta"] }> = ({ beat, meta }) => {
  const frame = useCurrentFrame();
  const durationInFrames = Math.max(1, Math.round((beat.durationMs / 1000) * meta.fps));

  const preset = (beat.motion && meta.motionPresets?.[beat.motion]) || DEFAULT_MOTION;
  const cap = { ...DEFAULT_CAP, ...meta.captions };
  const pageTurn = { fadeFrames: 10, captionRiseFrames: 14, captionRisePx: 22, ...meta.pageTurn };
  const bandTop = meta.height * (meta.bandTopRatio ?? 0.6927);
  const local = beat.captions.local ?? beat.captions.vi ?? "";

  const clampR = { extrapolateRight: "clamp" as const };
  const scale = interpolate(frame, [0, durationInFrames], preset.scale, clampR);
  const panX = interpolate(frame, [0, durationInFrames], preset.panX, clampR);
  const panY = interpolate(frame, [0, durationInFrames], preset.panY, clampR);

  const opacity = interpolate(
    frame,
    [0, pageTurn.fadeFrames, durationInFrames - pageTurn.fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const capRise = interpolate(frame, [0, pageTurn.captionRiseFrames], [pageTurn.captionRisePx, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: cap.bgColor }}>
      {/* 图片区：只占上方，overflow 裁掉多余，绝不进入字幕带 */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: bandTop, overflow: "hidden" }}>
        <Img
          src={staticFile(beat.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          }}
        />
      </div>

      {/* 字幕带：纯色，文字处没有画面 */}
      <div
        style={{
          position: "absolute",
          top: bandTop,
          left: 0,
          width: "100%",
          height: meta.height - bandTop,
          backgroundColor: cap.bgColor,
        }}
      />
      {/* 顶部一条极窄渐变，衔接图片和字幕带 */}
      <div
        style={{
          position: "absolute",
          top: bandTop - 40,
          left: 0,
          width: "100%",
          height: 40,
          background: `linear-gradient(rgba(0,0,0,0), ${cap.bgColor})`,
        }}
      />

      {/* 字幕内容 */}
      <div
        style={{
          position: "absolute",
          top: bandTop,
          left: 48,
          right: 48,
          bottom: 0,
          transform: `translateY(${capRise}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          textAlign: "center",
        }}
      >
        <RubyCaption zh={beat.captions.zh} pinyinColor={cap.pinyinColor} zhColor={cap.zhColor} />
        {local ? (
          <div style={{ fontFamily: FONT_LATIN, fontSize: 54, lineHeight: 1.16, color: cap.localColor, fontWeight: 800 }}>
            {local}
          </div>
        ) : null}
      </div>

      <Audio src={staticFile(beat.audio)} />
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({ manifest }) => {
  if (!manifest) return <AbsoluteFill style={{ backgroundColor: "#fefefe" }} />;
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: manifest.meta.captions?.bgColor ?? "#fefefe" }}>
      {manifest.beats.map((beat) => {
        const frames = Math.max(1, Math.round((beat.durationMs / 1000) * manifest.meta.fps));
        const el = (
          <Sequence key={beat.id} from={from} durationInFrames={frames}>
            <Scene beat={beat} meta={manifest.meta} />
          </Sequence>
        );
        from += frames;
        return el;
      })}
    </AbsoluteFill>
  );
};
