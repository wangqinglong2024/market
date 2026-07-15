// 渲染层共享类型：manifest 数据结构 + 版式模块契约。
// 版式注册表(registry.ts)按 manifest.meta.layout 选一个 LayoutModule；
// 新模板若字幕/版式不同 = 新增一个 src/layouts/<id>.tsx 导出 LAYOUT 并在 registry 注册。
import type React from "react";
import type { FontsMeta } from "../fonts";

export type Motion = {
  scale: [number, number];
  panX: [number, number];
  panY: [number, number];
  driftX?: number;
  driftY?: number;
  rotate?: [number, number];
  ease?: "inOut" | "linear";
};

// Effect 支持所有可能参数（[key: string]: any 结尾允许任意扩展）
export type Effect = {
  type: string;
  // 通用
  count?: number;
  intensity?: number;
  color?: string;
  color1?: string;
  color2?: string;
  opacity?: number;
  // 位置
  originX?: number;
  originY?: number;
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  startY?: number;
  // 文字
  text?: string;
  fontSize?: number;
  words?: string[];
  emojis?: string[];
  // 颜色扩展
  accentColor?: string;
  glowColor?: string;
  bgColor?: string;
  textColor?: string;
  shadowColor?: string;
  highlightColor?: string;
  baseColor?: string;
  ribbon?: string;
  // 动效参数
  bpm?: number;
  period?: number;
  interval?: number;
  every?: number;
  rate?: number;
  rpm?: number;
  turns?: number;
  // 形状/结构
  shape?: "star" | "heart" | "mix";
  variant?: "bokeh" | "stars";
  mode?: "burst" | "rain";
  direction?: "left" | "right" | "up" | "down" | "h" | "v";
  axis?: "h" | "v";
  angleDeg?: number;
  sides?: number;
  slices?: number;
  strokes?: number;
  petals?: number;
  rayCount?: number;
  rings?: number;
  cols?: number;
  rows?: number;
  lines?: number;
  waveCount?: number;
  flagCount?: number;
  // 尺寸
  radius?: number;
  size?: number;
  thickness?: number;
  gap?: number;
  depth?: number;
  dotSize?: number;
  barRatio?: number;
  amplitude?: number;
  maxBlur?: number;
  pixelSize?: number;
  // 其他
  heavy?: boolean;
  pulse?: boolean;
  scanlines?: boolean;
  flashes?: number;
  strikes?: number;
  spotCount?: number;
  starCount?: number;
  holeCount?: number;
  bottomPad?: number;
  phase?: number;
  density?: number;
  layers?: number;
  // 路径等
  tokens?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paths?: any[];
  seed?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// 字级时间戳（火山 TTS with_timestamp，2026-07-07）：驱动中文逐字跳字
export type CharTiming = { ch: string; startMs: number; endMs: number };

// 越南语词级时间戳（chinese-drama，2026-07-15）：越南语音色无真时间戳，build 按拍时长均匀铺词，驱动越南语行逐词卡拉OK
export type ViWordTiming = { w: string; startMs: number; endMs: number };

// 卡拉OK词单元（chinese-learn 版式，2026-07-12）：一个「词」= 一段汉字 + 拼音 + 绝对起止毫秒。
// ASR 返回逐字时间戳，build 用 Intl.Segmenter 分词后聚成词单元，渲染层按 currentMs 逐词高亮。
export type KaraWord = { zh: string; py: string; startMs: number; endMs: number };

export type Beat = {
  id: string;
  // 场景共图分组——同 sceneId 连续拍共用一张图、不换图不转场
  sceneId?: string;
  image: string;
  audio: string;
  durationMs: number;
  motion?: string;
  transitionIn?: "fade" | "slide-left" | "slide-up" | "wipe";
  effects?: Effect[];
  // 单人物图缩小系数：flux 老把人画满整框，渲染层按此缩小
  imgScale?: number;
  charTimings?: CharTiming[];
  viWordTimings?: ViWordTiming[];
  // 内心思考拍(chinese-drama,用户 2026-07-15):中文思考+说话音色,字幕加💭标记与开口对白区分
  inner?: boolean;
  captions: {
    pinyin: string;
    zh: string;
    local?: string;
    vi?: string;
    // 逐行中越对照（旧版式）：每个元素一行
    lines?: { zh: string; vi?: string }[];
  };
};

// 字幕排版参数（config → manifest.meta.captions 全量透传）
export type CaptionCfg = {
  pinyinColor: string; zhColor: string; localColor: string; bgColor: string;
  sizes?: { pinyin: number; zh: number; local: number; vi?: number };
  gapPinyinZh?: number; gapZhLocal?: number; sidePad?: number;
  pinyinColumnGap?: number; opticalLift?: number; karaokeColor?: string;
  // chinese-learn 版式补充:越南语行色 + 未读(dim)色 + 行距 + 解说音频(压低原声/解说音量)
  viColor?: string; dimColor?: string; readColor?: string;
  lineGap?: number; duck?: number; narrationVolume?: number;
};

export type Manifest = {
  meta: {
    fps: number;
    width: number;
    height: number;
    // 版式选择键：registry 按此选 LayoutModule。缺省/未知 → 旧版式(v1-legacy)。
    layout?: string;
    bandTopRatio?: number;
    transitionFrames?: number;
    motionPresets?: Record<string, Motion>;
    pageTurn?: { fadeFrames: number; captionRiseFrames: number; captionRisePx: number };
    captions?: CaptionCfg;
    bgm?: { src: string; volume?: number };
    fonts?: FontsMeta;
    // chinese-learn 版式用（其它版式忽略）：上方原视频源 + 裁切区 + 下方字幕区
    source?: {
      video: string;                       // staticFile 相对路径（public/ 下）
      region?: { top: number; height: number }; // 视频摆放区(宽=画布宽)，cover 裁切
      focusY?: number;                     // 裁切纵向焦点 0(顶)~1(底)，默认 0.5
    };
    subtitle?: { top: number; height: number };
  };
  beats: Beat[];
};

export type VideoProps = { videoId: string; shard: string; manifest: Manifest | null };

// ── 版式模块契约 ───────────────────────────────────────────────────────────────
// 不同版式的 beat 形状不同(guoxue 有 captions、chinese-learn 有 words/vi/kind…)，
// 所以渲染契约只保证 id+durationMs+transitionIn，其余字段各版式自己按需断言。
export type RenderBeat = {
  id: string;
  durationMs: number;
  transitionIn?: Beat["transitionIn"];
  [k: string]: unknown;
};

// 每个版式负责：把 beats 切成"段"(段间才转场)、渲染一段、给出段的入场转场。
// Video.tsx 只做编排(TransitionSeries/字体/BGM)，具体版面全在各 LayoutModule 里。
// 单段版式(如 chinese-learn 整片一张连续时间线)让 segments 返回 [allBeats] 即可。
export type LayoutModule = {
  id: string;
  // 把 beats 切成若干段：每段渲染为一个 TransitionSeries.Sequence，转场发生在段之间。
  segments: (beats: RenderBeat[]) => RenderBeat[][];
  // 该段的入场转场类型（取自段首拍）
  transitionOf: (seg: RenderBeat[]) => RenderBeat["transitionIn"];
  // 渲染一段
  Segment: React.FC<{ beats: RenderBeat[]; meta: Manifest["meta"] }>;
};
