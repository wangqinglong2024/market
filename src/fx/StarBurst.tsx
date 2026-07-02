import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 游戏"通关/得分"星光爆散：整拍内等距脉冲爆发，每次爆发星星向外冲(缓出) + 中心闪光 + 扩散光环。
// 节奏跟音频走：爆发次数 = round(拍时长/period)，均匀铺满这一拍（= 该拍音频长度）。逐帧确定性。
// 高光/答对拍用，最强"游戏特效"辨识度。origin 为爆发中心(占全画幅 0~1)。
const STAR = "M0,-10 L2.9,-3.1 L10,-3.1 L4,1.6 L6,9.5 L0,4.7 L-6,9.5 L-4,1.6 L-10,-3.1 L-2.9,-3.1 Z";

export const StarBurst: React.FC<{
  durationInFrames: number; // 本拍总帧数(= 音频长度)，特效据此排布节奏
  count?: number;
  seed?: string;
  originX?: number;
  originY?: number;
  period?: number; // 期望每几秒爆一次(实际会按拍长取整均分)
  radius?: number; // 最大扩散半径(px)
  colors?: string[];
}> = ({
  durationInFrames,
  count = 18,
  seed = "sb",
  originX = 0.5,
  originY = 0.36,
  period = 1.4,
  radius = 440,
  colors = ["#ffd23f", "#ff8fab", "#4cc9f0", "#80ed99", "#e0aaff", "#ffffff"],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const cx = originX * width;
  const cy = originY * height;
  const durSec = durationInFrames / fps;
  const nBursts = Math.max(1, Math.round(durSec / period)); // 按本拍音频长度决定爆几次
  const step = durSec / nBursts; // 等距铺满整拍
  const life = Math.min(step * 1.12, 1.3); // 相邻爆发首尾相接
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: nBursts }).map((_, b) => {
        const tl = t - b * step; // 本次爆发已过秒数
        if (tl < 0 || tl > life) return null;
        const p = Math.min(1, tl / life); // 0→1 进度
        const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic：先快后慢冲出
        const fade = tl < 0.12 ? tl / 0.12 : Math.max(0, 1 - (p - 0.2) / 0.8);
        const bs = `${seed}-${b}`;
        return (
          <g key={b}>
            {/* 中心闪光 */}
            <circle cx={cx} cy={cy} r={70 * (0.4 + ease * 1.6)} fill="#fff" opacity={Math.max(0, 0.5 - p * 0.95)} />
            {/* 扩散光环 */}
            <circle
              cx={cx}
              cy={cy}
              r={ease * radius * 0.92}
              fill="none"
              stroke="#fff3b0"
              strokeWidth={12 * (1 - p)}
              opacity={Math.max(0, 0.75 - p)}
            />
            {Array.from({ length: count }).map((_, i) => {
              const a = (i / count) * Math.PI * 2 + random(`${bs}-a-${i}`) * 0.3;
              const rr = radius * (0.55 + random(`${bs}-r-${i}`) * 0.5) * ease;
              const x = cx + Math.cos(a) * rr;
              const y = cy + Math.sin(a) * rr;
              const sz = (0.8 + random(`${bs}-z-${i}`) * 1.4) * (0.5 + ease * 0.9);
              const col = colors[Math.floor(random(`${bs}-c-${i}`) * colors.length)];
              const spin = (a * 57 + tl * 260) % 360;
              return (
                <path
                  key={i}
                  d={STAR}
                  fill={col}
                  opacity={fade}
                  transform={`translate(${x} ${y}) scale(${sz}) rotate(${spin})`}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
