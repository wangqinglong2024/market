import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 确定性粒子/闪光：位置与相位都由种子决定，逐帧闪烁（不可用实时随机，否则渲染会闪）。
export const Sparkles: React.FC<{ count?: number; seed?: string; color?: string }> = ({
  count = 40,
  seed = "spk",
  color = "#fff3b0",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = random(`${seed}-x-${i}`) * width;
        const y = random(`${seed}-y-${i}`) * height;
        const baseR = 3 + random(`${seed}-r-${i}`) * 7;
        const speed = 0.4 + random(`${seed}-s-${i}`) * 1.2;
        const phase = random(`${seed}-p-${i}`) * Math.PI * 2;
        const twinkle = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * speed + phase);
        const drift = Math.sin((frame / fps) * Math.PI * 2 * (0.2 + speed * 0.1) + phase) * 18;
        return (
          <circle
            key={i}
            cx={x + drift}
            cy={y - (frame / fps) * (10 + speed * 20) * 0 /* 保持定点闪烁，如需上升改此系数 */}
            r={baseR * (0.4 + twinkle * 0.8)}
            fill={color}
            opacity={0.15 + twinkle * 0.6}
          />
        );
      })}
    </svg>
  );
};
