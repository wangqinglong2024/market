import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 流星斜掠：一组平行的流星沿固定斜向匀速划过全屏，亮头 + 逐点衰减拖尾。绝非"中心放射"，是定向平移。
// 节奏跟音频走：流星数量 = round(拍长/每颗间隔)，出生时刻均分铺满整拍。逐帧确定性。
const STAR = "M0,-7 L2,-2.1 L7,-2.1 L2.8,1 L4.2,6.6 L0,3.2 L-4.2,6.6 L-2.8,1 L-7,-2.1 L-2,-2.1 Z";

export const ShootingStars: React.FC<{
  durationInFrames: number;
  seed?: string;
  every?: number; // 期望每几秒来一颗(按拍长取整均分)
  angleDeg?: number; // 划过方向(默认右下 28°)
  colors?: string[];
}> = ({ durationInFrames, seed = "ss", every = 0.7, angleDeg = 28, colors = ["#fff", "#ffe066", "#8ecaff", "#ffa6d5"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const durSec = durationInFrames / fps;
  const life = 1.0; // 单颗划过时长(秒)
  const spawnWindow = Math.max(0.001, durSec - life * 0.5);
  const n = Math.max(2, Math.round(durSec / every));
  const gap = n > 1 ? spawnWindow / (n - 1) : 0;

  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const px = -dy; // 垂直方向(用于分道)
  const py = dx;
  const diag = Math.hypot(width, height);
  const span = diag * 1.6; // 起点在画外，终点在画外，确保完整穿过
  const cx = width / 2;
  const cy = height * 0.32; // 主要划过图片中上部

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, k) => {
        const age = t - k * gap;
        if (age < 0 || age > life) return null;
        const q = age / life; // 0→1 匀速穿过
        const fade = Math.min(1, age / 0.12) * Math.max(0, 1 - (q - 0.7) / 0.3);
        const lane = (random(`${seed}-l-${k}`) - 0.5) * diag * 0.9; // 分道错开
        const s = -span / 2 + q * span; // 沿方向前进
        const hx = cx + dx * s + px * lane;
        const hy = cy + dy * s + py * lane;
        const col = colors[Math.floor(random(`${seed}-c-${k}`) * colors.length)];
        const scale = 1.1 + random(`${seed}-z-${k}`) * 0.9;
        // 拖尾：头后方等距若干点，越远越小越淡
        const tail = 12;
        return (
          <g key={k} opacity={fade}>
            {Array.from({ length: tail }).map((_, j) => {
              const back = (j + 1) * 16 * scale;
              const bx = hx - dx * back;
              const by = hy - dy * back;
              const f = 1 - (j + 1) / (tail + 1);
              return <circle key={j} cx={bx} cy={by} r={2.4 * scale * f} fill={col} opacity={0.5 * f} />;
            })}
            {/* 亮头光晕 + 星 */}
            <circle cx={hx} cy={hy} r={9 * scale} fill={col} opacity={0.35} />
            <path d={STAR} fill="#fff" transform={`translate(${hx} ${hy}) scale(${scale})`} />
          </g>
        );
      })}
    </svg>
  );
};
