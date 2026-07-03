import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 蝴蝶翩飞：彩色翅膀 + 深描边，翅膀按帧扇动(横向缩放模拟)，沿 Lissajous 慢速游走、转弯时侧倾。
// 高对比(饱和翅 + 深边 + 白斑) → 浅底清楚。逐帧确定性。用于温柔/开场拍。
const OUTLINE = "#4a3a30";

const Wing: React.FC<{ color: string }> = ({ color }) => (
  <>
    <ellipse cx={-13} cy={-6} rx={12} ry={9} fill={color} stroke={OUTLINE} strokeWidth={1.6} />
    <ellipse cx={-10} cy={7} rx={8} ry={7} fill={color} stroke={OUTLINE} strokeWidth={1.6} />
    <circle cx={-14} cy={-6} r={2.6} fill="#fff" opacity={0.85} />
  </>
);

export const Butterflies: React.FC<{
  count?: number;
  seed?: string;
  colors?: string[];
}> = ({ count = 7, seed = "bf", colors = ["#ff8fb0", "#ffc94d", "#7db8ff", "#b58cff", "#7bd88f"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const cx = width * (0.15 + random(`${seed}-x-${i}`) * 0.7);
        const cy = height * (0.12 + random(`${seed}-y-${i}`) * 0.5);
        const ph = random(`${seed}-p-${i}`) * Math.PI * 2;
        const sp1 = 0.35 + random(`${seed}-a-${i}`) * 0.4;
        const sp2 = 0.5 + random(`${seed}-b-${i}`) * 0.6;
        const x = cx + Math.sin(t * sp1 + ph) * width * 0.15;
        const y = cy + Math.sin(t * sp2 + ph * 1.7) * height * 0.06;
        const rot = Math.sin(t * sp1 + ph) * 20;
        const scale = 1.6 + random(`${seed}-z-${i}`) * 1.0;
        const flap = Math.abs(Math.sin(t * (4.5 + random(`${seed}-f-${i}`) * 3) + ph)); // 0..1
        const wx = 0.28 + 0.72 * flap; // 翅膀横向张合
        const col = colors[i % colors.length];
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
            <ellipse cx={0} cy={0} rx={2.2} ry={11} fill="#3a2b22" />
            <path d="M0,-10 q-5,-6 -9,-9 M0,-10 q5,-6 9,-9" stroke="#3a2b22" strokeWidth={1.3} fill="none" />
            <g transform={`scale(${wx},1)`}>
              <Wing color={col} />
              <g transform="scale(-1,1)">
                <Wing color={col} />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
