import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 漫画爆炸词：带尖角的爆炸对话框(饱和填充 + 粗黑描边)"砸"入(overshoot)，中间粗体喊话词，停顿后弹出。
// 依次散布在画面上，节奏跟音频走：数量按拍长算，出生时刻均分。高对比 → 浅背景上极醒目。逐帧确定性。
const GAME_FONT = '"Nunito", "SimHei", "PingFang SC", "Microsoft YaHei", sans-serif';

// 生成尖角爆炸多边形 path(spikes 个尖，外/内半径交替)
const burstPath = (spikes: number, outer: number, inner: number, seed: string) => {
  const pts: string[] = [];
  for (let j = 0; j < spikes * 2; j++) {
    const a = (j / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = (j % 2 === 0 ? outer : inner) * (0.9 + random(`${seed}-${j}`) * 0.2);
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

const backOut = (x: number) => {
  const c = 2.4;
  const u = x - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

export const ComicPops: React.FC<{
  durationInFrames: number;
  seed?: string;
  words?: string[];
  fills?: string[];
}> = ({
  durationInFrames,
  seed = "cp",
  words = ["哇!", "厉害!", "TỐT!", "很棒!", "GIỎI!"],
  fills = ["#ffd23f", "#ff5d8f", "#4cc9f0", "#8bd450", "#ff8b3d"],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const life = 1.05;
  const durSec = durationInFrames / fps;
  const spawnWindow = Math.max(0.001, durSec - life * 0.55);
  const n = Math.max(2, Math.round(durSec / 0.7));
  const gap = n > 1 ? spawnWindow / (n - 1) : 0;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, k) => {
        const age = t - k * gap;
        if (age < 0 || age > life) return null;
        const p = age / life;
        const stamp = age < 0.2 ? backOut(age / 0.2) : 1;
        const opacity = p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.2) : Math.min(1, age / 0.06);
        const word = words[k % words.length];
        const fill = fills[k % fills.length];
        // 散布：左右两侧 + 上下错开，避开正中角色脸
        const side = k % 2 === 0 ? -1 : 1;
        const x = width * (0.5 + side * (0.2 + random(`${seed}-x-${k}`) * 0.16));
        const y = height * (0.14 + random(`${seed}-y-${k}`) * 0.34);
        const fs = 44;
        const est = Array.from(word).reduce((w, ch) => w + (/[一-鿿]/.test(ch) ? fs : fs * 0.6), 0);
        const outer = Math.max(est * 0.72 + 46, 78);
        const rot = (random(`${seed}-r-${k}`) - 0.5) * 24;
        return (
          <g key={k} transform={`translate(${x} ${y}) scale(${stamp}) rotate(${rot})`} opacity={opacity}>
            <path d={burstPath(12, outer, outer * 0.66, `${seed}-b-${k}`)} fill={fill} stroke="#2a2320" strokeWidth={5} strokeLinejoin="round" />
            <text
              x={0}
              y={0}
              fontFamily={GAME_FONT}
              fontSize={fs}
              fontWeight={900}
              fill="#fff"
              stroke="#2a2320"
              strokeWidth={4}
              paintOrder="stroke"
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${-rot})`}
            >
              {word}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
