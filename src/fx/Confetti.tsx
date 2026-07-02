import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 游戏感彩带/星星爆发：种子化抛射 + 重力，逐帧确定性（禁实时随机）。
// 用于高光/CTA 拍。origin 为爆发中心(占比 0~1)，count 片数。
export const Confetti: React.FC<{
  count?: number;
  seed?: string;
  originX?: number;
  originY?: number;
  colors?: string[];
}> = ({
  count = 60,
  seed = "cf",
  originX = 0.5,
  originY = 0.42,
  colors = ["#ff8fab", "#ffd166", "#8ecae6", "#95d5b2", "#e0aaff", "#ffb4a2"],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps; // 秒
  const g = 900; // 重力 px/s^2
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const ang = random(`${seed}-a-${i}`) * Math.PI * 2;
        const spd = 420 + random(`${seed}-s-${i}`) * 640;
        const vx = Math.cos(ang) * spd;
        const vy = Math.sin(ang) * spd - 320; // 略向上抛
        const x0 = originX * width;
        const y0 = originY * height;
        const x = x0 + vx * t;
        const y = y0 + vy * t + 0.5 * g * t * t;
        if (y > height + 40) return null;
        const size = 10 + random(`${seed}-z-${i}`) * 16;
        const color = colors[Math.floor(random(`${seed}-c-${i}`) * colors.length)];
        const rot = (random(`${seed}-r-${i}`) * 360 + frame * (4 + random(`${seed}-w-${i}`) * 8)) % 360;
        const fadeIn = Math.min(1, frame / 4);
        const life = Math.max(0, 1 - t / 2.6);
        const star = random(`${seed}-t-${i}`) > 0.6;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={fadeIn * life}>
            {star ? (
              <path
                d="M0,-8 L2.4,-2.4 L8,-2.4 L3.2,1.6 L5,7.6 L0,3.8 L-5,7.6 L-3.2,1.6 L-8,-2.4 L-2.4,-2.4 Z"
                fill={color}
                transform={`scale(${size / 12})`}
              />
            ) : (
              <rect x={-size / 2} y={-size / 3} width={size} height={size * 0.66} rx={2} fill={color} />
            )}
          </g>
        );
      })}
    </svg>
  );
};
