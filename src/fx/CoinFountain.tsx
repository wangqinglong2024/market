import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 金币喷泉：金币从 origin 处不断向上喷出、重力落回，边飞边"翻面"(3D 翻转靠横向缩放模拟)，翻到侧面露深色边。
// 金色 + 深棕描边 → 浅背景上极显眼。节奏跟音频走：金币数量按拍长算，出生时刻均分铺满整拍。逐帧确定性。
const STAR = "M0,-5 L1.5,-1.6 L5,-1.6 L2.1,0.7 L3.2,4.6 L0,2.3 L-3.2,4.6 L-2.1,0.7 L-5,-1.6 L-1.5,-1.6 Z";

export const CoinFountain: React.FC<{
  durationInFrames: number;
  seed?: string;
  originX?: number;
  originY?: number;
  every?: number; // 期望每几秒喷一枚(按拍长取整均分)
}> = ({ durationInFrames, seed = "coin", originX = 0.5, originY = 0.52, every = 0.11 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const g = 1600; // 重力
  const durSec = durationInFrames / fps;
  const n = Math.max(6, Math.round(durSec / every));
  const gap = durSec / n;
  const x0 = originX * width;
  const y0 = originY * height;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, k) => {
        const age = t - k * gap;
        if (age < 0) return null;
        const ang = -Math.PI / 2 + (random(`${seed}-a-${k}`) - 0.5) * 1.5; // 大体向上、左右张开
        const spd = 720 + random(`${seed}-s-${k}`) * 560;
        const x = x0 + Math.cos(ang) * spd * age;
        const y = y0 + Math.sin(ang) * spd * age + 0.5 * g * age * age;
        if (y > height + 70) return null;
        const R = 18 + random(`${seed}-z-${k}`) * 10;
        const flip = Math.cos(age * (7 + random(`${seed}-f-${k}`) * 6) + random(`${seed}-p-${k}`) * 6); // -1..1
        const rx = Math.max(2.5, Math.abs(flip) * R);
        const edge = Math.abs(flip) < 0.35; // 翻到侧面
        const face = edge ? "#d99114" : "#ffd23f";
        const op = Math.min(1, age / 0.05);
        const front = rx > R * 0.55; // 正面朝前才画星/高光
        return (
          <g key={k} transform={`translate(${x} ${y})`} opacity={op}>
            <ellipse rx={rx} ry={R} fill={face} stroke="#a9690a" strokeWidth={3.5} />
            {front && <path d={STAR} fill="#a9690a" transform={`scale(${R / 5})`} />}
            {front && (
              <ellipse cx={-rx * 0.35} cy={-R * 0.4} rx={rx * 0.28} ry={R * 0.16} fill="#fff7d6" opacity={0.85} />
            )}
          </g>
        );
      })}
    </svg>
  );
};
