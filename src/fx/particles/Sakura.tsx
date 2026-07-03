import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 樱花洒落：花瓣从 origin(她手部位置)不断飘出，向下 + 外扩散落、边落边打旋摇摆，靠近底部淡出后循环。
// 粉色 + 稍深粉描边 → 浅底可见。逐帧确定性(相位由种子，位置是帧的函数)。
// 花瓣形：带小凹口的椭圆瓣。origin 为发源点(占全画幅 0~1)。
const PETAL = "M0,-7 C4.2,-5 5,1.2 2.4,7 C1.4,5.2 -1.4,5.2 -2.4,7 C-5,1.2 -4.2,-5 0,-7 Z";

export const Sakura: React.FC<{
  count?: number;
  seed?: string;
  originX?: number;
  originY?: number;
  colors?: string[];
}> = ({ count = 26, seed = "sk", originX = 0.5, originY = 0.4, colors = ["#ffc2dc", "#ff9ec4", "#ffd6e6", "#ff8fbf"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const ox = originX * width;
  const oy = originY * height;
  const g = 150; // 轻重力
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const period = 2.4 + random(`${seed}-t-${i}`) * 1.8; // 本瓣飘落总时长
        const ph = random(`${seed}-p-${i}`);
        const local = (t + ph * period) % period; // 0..period
        const c = local / period; // 0→1
        const ang = Math.PI / 2 + (random(`${seed}-a-${i}`) - 0.5) * 1.8; // 向下扇形散开
        const v0 = 60 + random(`${seed}-v-${i}`) * 90;
        const swAmp = 26 + random(`${seed}-w-${i}`) * 34;
        const x = ox + Math.cos(ang) * v0 * local + Math.sin(local * (1.4 + random(`${seed}-s-${i}`) * 1.6) * Math.PI + i) * swAmp;
        const y = oy + Math.sin(ang) * v0 * local + 0.5 * g * local * local;
        const spin = (local * (120 + random(`${seed}-r-${i}`) * 220) + i * 40) % 360;
        const sz = 1.3 + random(`${seed}-z-${i}`) * 1.5;
        const col = colors[Math.floor(random(`${seed}-c-${i}`) * colors.length)];
        const op = Math.min(1, c / 0.08) * Math.max(0, 1 - (c - 0.72) / 0.28);
        if (y > height + 30) return null;
        return (
          <path
            key={i}
            d={PETAL}
            fill={col}
            stroke="#e8749f"
            strokeWidth={0.9}
            opacity={0.95 * op}
            transform={`translate(${x} ${y}) scale(${sz}) rotate(${spin})`}
          />
        );
      })}
    </svg>
  );
};
