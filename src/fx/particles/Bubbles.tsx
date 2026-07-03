import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 泡泡：彩色描边 + 白色高光的半透明泡泡，缓缓上浮、轻微摇摆，到顶"啵"地放大破掉后循环。
// 高可见：靠饱和描边 + 高光在浅背景上也清楚。逐帧确定性(相位由种子决定，位置是帧的函数)。
export const Bubbles: React.FC<{
  count?: number;
  seed?: string;
  colors?: string[];
}> = ({ count = 18, seed = "bb", colors = ["#22aee0", "#ff5d8f", "#ffb703", "#8155ff", "#2fb673"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const cycle = height + 200;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x0 = random(`${seed}-x-${i}`) * width;
        const spd = 46 + random(`${seed}-s-${i}`) * 78; // px/s 上浮
        const near = ((random(`${seed}-y-${i}`) * cycle + t * spd) % cycle) / cycle; // 0底 → 1顶
        const y = height + 80 - near * cycle;
        const r = 20 + random(`${seed}-r-${i}`) * 48;
        const x = x0 + Math.sin(t * (0.5 + random(`${seed}-w-${i}`)) * Math.PI * 2 + i) * 32;
        const col = colors[Math.floor(random(`${seed}-c-${i}`) * colors.length)];
        // 破裂：顶端 10% 放大淡出；底端淡入
        let scale = 1;
        let op = 0.95;
        if (near > 0.9) {
          const p = (near - 0.9) / 0.1;
          scale = 1 + p * 0.7;
          op = 0.95 * (1 - p);
        } else {
          op = 0.95 * Math.min(1, near / 0.05);
        }
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`} opacity={op}>
            <circle r={r} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={4} />
            <ellipse
              cx={-r * 0.34}
              cy={-r * 0.36}
              rx={r * 0.26}
              ry={r * 0.15}
              fill="#fff"
              opacity={0.9}
              transform={`rotate(-32 ${-r * 0.34} ${-r * 0.36})`}
            />
            <circle cx={r * 0.3} cy={r * 0.32} r={r * 0.09} fill="#fff" opacity={0.55} />
          </g>
        );
      })}
    </svg>
  );
};
