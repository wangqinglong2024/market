import "./index.css";
import { Composition } from "remotion";
import { Video, calcVideoMetadata } from "./Video";
import { FxPreview } from "./FxPreview";
import { FxSinglePreview } from "./FxSinglePreview";
import catalog from "../catalog.json";

// 特效已精简为固定 4 个（用户 2026-07-03 锁定）：只保留这几个，其余全部删除。
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
