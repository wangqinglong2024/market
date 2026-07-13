import "./index.css";
import { Composition } from "remotion";
import { Video, calcVideoMetadata } from "./Video";
import { FxPreview } from "./FxPreview";
import { FxSinglePreview } from "./FxSinglePreview";
import catalog from "../catalog.json";

// 特效库开放可扩展：下面只是"已有预览 Composition"的登记表，新增特效就往这里加一行（不是固定集合）。
const FX_CATEGORIES = ["emotion", "distortion"] as const;

const FX_EFFECTS: Record<string, string[]> = {
  emotion:    ["ComicPops", "EmojiRain", "ScorePop"],
  distortion: ["ZoomBlur"],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── 视频 Compositions（由 catalog.json 驱动）────────────────────── */}
      {catalog.videos.map((v) => (
        <Composition
          key={v.id}
          id={v.id}
          component={Video}
          calculateMetadata={calcVideoMetadata}
          defaultProps={{ videoId: v.id, shard: v.shard, manifest: null }}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}

      {/* ── 大类预览（每类合并，Studio 快速浏览）────────────────────────── */}
      {FX_CATEGORIES.map((cat) => (
        <Composition
          key={`fx-${cat}`}
          id={`fx-${cat}`}
          component={FxPreview}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ category: cat }}
        />
      ))}

      {/* ── 单效果预览（每个效果独立 Composition，共 144 个）──────────── */}
      {FX_CATEGORIES.flatMap((cat) =>
        (FX_EFFECTS[cat] ?? []).map((name) => (
          <Composition
            key={`fx-${cat}-${name}`}
            id={`fx-${cat}-${name}`}
            component={FxSinglePreview}
            durationInFrames={150}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{ category: cat, name }}
          />
        ))
      )}
    </>
  );
};
