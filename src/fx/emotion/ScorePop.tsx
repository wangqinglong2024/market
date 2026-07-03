import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 游戏奖励飘字："+1" / "很棒!" / "GIỎI!" 依次冒出，弹入(overshoot) → 上浮 → 淡出（多邻国式答对反馈）。
// 节奏跟音频走：数量按本拍时长算，出生时刻均匀铺在拍内并留出末尾淡出余量，绝不被转场切断。逐帧确定性。
// Nunito 打头(数字/越南语)，SimHei 兜底中文字形(已在 fonts.ts 加载)。
const GAME_FONT = '"Nunito", "SimHei", "PingFang SC", "Microsoft YaHei", sans-serif';
const STAR = "M0,-9 L2.6,-2.8 L9,-2.8 L3.6,1.4 L5.4,8.6 L0,4.2 L-5.4,8.6 L-3.6,1.4 L-9,-2.8 L-2.6,-2.8 Z";

// easeOutBack：越过 1 再回弹，"啵"地弹出
const backOut = (x: number) => {
  const c = 2.2;
  const u = x - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

export const ScorePop: React.FC<{
  durationInFrames: number; // 本拍总帧数(= 音频长度)
  count?: number; // 不给则按拍长自动算
  seed?: string;
  interval?: number; // 期望间隔秒(仅在未指定 count 时用于估数)
  tokens?: string[];
  colors?: string[];
}> = ({
  durationInFrames,
  count,
  seed = "sp",
  interval = 0.62,
  tokens = ["+1", "很棒!", "+5", "GIỎI!", "+1", "棒!", "+10", "TUYỆT!"],
  colors = ["#ff5d8f", "#ffb703", "#4cc9f0", "#43aa8b", "#9b5de5", "#f9844a"],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const life = 1.5;
  const fs = 46;
  const durSec = durationInFrames / fps;
  // 出生窗口：留末尾余量让最后一个也能升起淡出，不被转场切断
  const spawnWindow = Math.max(0.001, durSec - life * 0.55);
  const n = Math.max(1, count ?? Math.round(durSec / interval));
  const gap = n > 1 ? spawnWindow / (n - 1) : 0;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, k) => {
        const age = t - k * gap;
        if (age < 0 || age > life) return null;
        const p = age / life;
        const pop = age < 0.2 ? backOut(age / 0.2) : 1;
        const opacity = p > 0.72 ? Math.max(0, 1 - (p - 0.72) / 0.28) : Math.min(1, age / 0.08);
        const rise = -p * 140;
        const side = random(`${seed}-s-${k}`) > 0.5 ? 1 : -1;
        const x = width * (0.5 + side * (0.24 + random(`${seed}-x-${k}`) * 0.13));
        const y = height * (0.18 + random(`${seed}-y-${k}`) * 0.3) + rise;
        const tok = tokens[k % tokens.length];
        const col = colors[k % colors.length];
        // 估算胶囊宽度：中日韩字宽 ~ fs，其余 ~ 0.6fs
        const est = Array.from(tok).reduce((w, ch) => w + (/[一-鿿]/.test(ch) ? fs : fs * 0.6), 0);
        const pw = est + 52;
        const ph = fs + 30;
        return (
          <g key={k} transform={`translate(${x} ${y}) scale(${pop})`} opacity={opacity}>
            {/* 投影 */}
            <rect x={-pw / 2 + 4} y={-ph / 2 + 6} width={pw} height={ph} rx={ph / 2} fill="rgba(0,0,0,0.18)" />
            {/* 胶囊主体 + 白描边 */}
            <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph / 2} fill={col} stroke="#fff" strokeWidth={4} />
            {/* 左上角小星点缀 */}
            <path d={STAR} fill="#fff9d6" transform={`translate(${-pw / 2 + 2} ${-ph / 2 + 2}) scale(1.5) rotate(-12)`} />
            <text
              x={0}
              y={0}
              fontFamily={GAME_FONT}
              fontSize={fs}
              fontWeight={900}
              fill="#fff"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {tok}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
