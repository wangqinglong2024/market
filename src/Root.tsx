import "./index.css";
import { Composition } from "remotion";
import { Video, calcVideoMetadata } from "./Video";
import { FxPreview } from "./FxPreview";
import { FxSinglePreview } from "./FxSinglePreview";
import { Cover } from "./Cover";
import { CoverDrama } from "./CoverDrama";
import { CoverHsk } from "./CoverHsk";
import { AvatarHsk } from "./AvatarHsk";
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

      {/* ── HSK字源九宫格封面：宣纸 · 具象简笔→汉字 · 越南语钩子。────
           渲染：remotion still src/index.ts cover-hsk <out.png> --props=<视频目录>/cover.json */}
      <Composition
        id="cover-hsk"
        component={CoverHsk}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ hook: "Chữ Hán bắt nguồn từ hình vẽ", tag: "HSK · Tự học tiếng Trung", ep: "Tập 1" }}
      />

      {/* ── 头像（1:1，裁圆用）：learn-Chinese 频道头像。渲染：remotion still src/index.ts avatar-hsk <out.png> */}
      <Composition
        id="avatar-hsk"
        component={AvatarHsk}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* ── 通用封面（全局规则）：原视频一帧 + 文字钩子，渲染成缩略图。────
           渲染：remotion still src/index.ts cover <out.png> --props=<视频目录>/cover.json */}
      <Composition
        id="cover"
        component={Cover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
        defaultProps={{
          image: "",
          title: "标题",
          subtitle: "",
          tag: "中文学习 · 葫芦兄弟",
          titleColor: "#ffffff",
          accentColor: "#ffd24a",
        }}
      />

      {/* ── chuanyue-drama 封面/海报（render-rules 10）：三语标题排版，封面与海报共用。──
           渲染：remotion still src/index.ts cover-drama <out.png> --props=<视频目录>/cover.json */}
      <Composition
        id="cover-drama"
        component={CoverDrama}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
        defaultProps={{
          image: "", focusY: 0.35, tag: "毒嫁", tagVi: "Cô Dâu Báo Thù",
          seal: "E01", volume: { zh: "第一案 · 毒婚", vi: "Vụ án 1 · Hôn lễ độc" },
          chapter: { py: "dú jià", zh: "毒嫁", vi: "Cô Dâu Báo Thù" },
          episode: { py: "wèi shén me tā hái shì hē le", zh: "为什么他还是喝了", vi: "Vì sao chàng vẫn uống?" },
        }}
      />

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
