import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 漫画集中线/速度线：从中心向四周放射的楔形线，随帧脉动"冲刺"。逐帧确定性。
// 强调拍用（喊话/惊讶/CTA），最"带感"，又贴手绘漫画调性。
export const FocusLines: React.FC<{
  count?: number;
  seed?: string;
  color?: string;
  centerX?: number;
  centerY?: number;
  intensity?: number;
}> = ({ count = 60, seed = "fl", color = "40,36,32", centerX = 0.5, centerY = 0.42, intensity = 0.16 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const cx = centerX * width;
  const cy = centerY * height;
  const outer = Math.hypot(width, height); // 一定超出画面
  const t = frame / fps;
  // 内圈半径脉动：镜头中间留白给角色，线只在外围"冲"
  const innerBase = Math.min(width, height) * 0.34;
  const pulse = 1 + 0.06 * Math.sin(t * Math.PI * 2 * 0.9);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.04;
        const inner = innerBase * pulse * (0.9 + random(`${seed}-r-${i}`) * 0.35);
        const w = (0.6 + random(`${seed}-w-${i}`) * 2.6) * (1 + 0.4 * Math.sin(t * 6 + i)); // 粗细呼吸
        // 楔形：近中心一点，远端两条边张开成细长三角
        const nx = Math.cos(a), ny = Math.sin(a);
        const px = -ny, py = nx; // 垂直方向
        const x1 = cx + nx * inner, y1 = cy + ny * inner;
        const x2 = cx + nx * outer + px * w, y2 = cy + ny * outer + py * w;
        const x3 = cx + nx * outer - px * w, y3 = cy + ny * outer - py * w;
        const op = intensity * (0.5 + 0.5 * random(`${seed}-o-${i}`));
        return <path key={i} d={`M${x1},${y1} L${x2},${y2} L${x3},${y3} Z`} fill={`rgba(${color},${op})`} />;
      })}
    </svg>
  );
};
