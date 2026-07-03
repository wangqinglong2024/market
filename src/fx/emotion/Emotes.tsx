import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 好奇 Emotes：音符 ♪ / 问号 ? / 感叹号 ! 交替飘出，缓缓上浮 + 摇摆 + 打旋 + 明灭，伴小闪光。
// 音符用 path 画(不依赖字体 glyph)，? ! 用粗体带描边字。饱和填充 + 深描边 → 浅底可见。逐帧确定性。
// 用于"想学说话/好奇"拍(如小狗歪头)。
const GAME_FONT = '"Nunito", "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif';
const OUTLINE = "#3a2b22";

// 八分音符：符头(斜椭圆) + 符干 + 符尾
const Note: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M6,-24 L6,-3" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M6,-24 q10,2 8,12" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={0} rx={6.2} ry={4.6} fill={color} stroke={OUTLINE} strokeWidth={1.4} transform="rotate(-22)" />
  </g>
);

export const Emotes: React.FC<{
  count?: number;
  seed?: string;
  colors?: string[];
}> = ({ count = 12, seed = "em", colors = ["#ff5d8f", "#ffb703", "#4cc9f0", "#8155ff", "#2fb673"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const cycle = height * 0.62 + 120;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const kind = i % 3; // 0 音符 1 ? 2 !
        const side = i % 2 === 0 ? -1 : 1;
        const baseX = width * (0.5 + side * (0.16 + random(`${seed}-x-${i}`) * 0.2));
        const spd = 30 + random(`${seed}-s-${i}`) * 34;
        const near = ((random(`${seed}-y-${i}`) * cycle + t * spd) % cycle) / cycle; // 0底 →1顶
        const y = height * 0.62 + 60 - near * cycle;
        const x = baseX + Math.sin(t * (0.6 + random(`${seed}-w-${i}`)) * Math.PI * 2 + i) * 30;
        const tw = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 * (0.7 + random(`${seed}-t-${i}`)) + i);
        const sz = 1.5 + random(`${seed}-z-${i}`) * 1.1;
        const rot = Math.sin(t * (0.8 + random(`${seed}-r-${i}`)) * Math.PI + i) * 18;
        const col = colors[i % colors.length];
        const op = 0.95 * tw * Math.min(1, near / 0.06) * Math.max(0, 1 - (near - 0.85) / 0.15);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${sz}) rotate(${rot})`} opacity={op}>
            {kind === 0 ? (
              <Note color={col} />
            ) : (
              <text
                x={0}
                y={0}
                fontFamily={GAME_FONT}
                fontSize={26}
                fontWeight={900}
                fill={col}
                stroke={OUTLINE}
                strokeWidth={2.4}
                paintOrder="stroke"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {kind === 1 ? "?" : "!"}
              </text>
            )}
            {/* 小闪光 */}
            <path d="M0,-13 L1,-10 L4,-9.5 L1,-9 L0,-6 L-1,-9 L-4,-9.5 L-1,-10 Z" fill="#fff7d6" opacity={0.9 * tw} />
          </g>
        );
      })}
    </svg>
  );
};
