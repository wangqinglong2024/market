import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 上浮的星星/爱心/气泡：实色可见（不用 screen 混合），逐帧确定性缓慢上浮 + 摆动 + 眨。
// 用于温暖/高光拍，增加"带感"又不刺眼。shape: "star" | "heart" | "mix"。
const STAR = "M0,-10 L3,-3 L10,-3 L4.5,2 L6.5,9.5 L0,5 L-6.5,9.5 L-4.5,2 L-10,-3 L-3,-3 Z";
const HEART = "M0,9 C-9,1 -8,-8 -2.6,-8 C-0.6,-8 0,-6 0,-5 C0,-6 0.6,-8 2.6,-8 C8,-8 9,1 0,9 Z";

export const FloatingIcons: React.FC<{
  count?: number;
  seed?: string;
  shape?: "star" | "heart" | "mix";
  colors?: string[];
}> = ({ count = 16, seed = "fi", shape = "star", colors = ["#ffd166", "#ff8fab", "#8ecae6", "#95d5b2"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x0 = random(`${seed}-x-${i}`) * width;
        const spd = 26 + random(`${seed}-s-${i}`) * 40; // px/s 上浮
        const rise = (random(`${seed}-y-${i}`) * height + t * spd) % (height + 80);
        const y = height + 40 - rise;
        const sway = Math.sin(t * (0.6 + random(`${seed}-w-${i}`)) * Math.PI * 2 + i) * 26;
        const sz = 2.2 + random(`${seed}-z-${i}`) * 2.4;
        const tw = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 * (0.6 + random(`${seed}-t-${i}`)) + i);
        const col = colors[Math.floor(random(`${seed}-c-${i}`) * colors.length)];
        const isHeart = shape === "heart" || (shape === "mix" && random(`${seed}-h-${i}`) > 0.5);
        const spin = isHeart ? 0 : (t * 40 + i * 30) % 360;
        return (
          <path
            key={i}
            d={isHeart ? HEART : STAR}
            fill={col}
            stroke="#fff"
            strokeWidth={1.4}
            opacity={0.9 * tw}
            transform={`translate(${x0 + sway} ${y}) scale(${sz}) rotate(${spin})`}
          />
        );
      })}
    </svg>
  );
};
