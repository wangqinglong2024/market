import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";

// 矢量角色：整体二级动作（入场弹入 + 呼吸 + 上下浮动 + 轻微摆动），全部逐帧驱动。
// 说明：更细的绑骨骼（眨眼/挥手/张嘴）需要把 SVG 拆成命名部件，是下一步增强。
export const Character: React.FC<{
  src: string;
  xPct?: number;
  yPct?: number;
  widthPx?: number;
}> = ({ src, xPct = 50, yPct = 45, widthPx = 620 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const breathe = 1 + Math.sin(t * Math.PI * 2 * 0.5) * 0.015;
  const bob = Math.sin(t * Math.PI * 2 * 0.55) * 8;
  const lean = Math.sin(t * Math.PI * 2 * 0.28) * 1.5;
  return (
    <div style={{ position: "absolute", left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}>
      <div
        style={{
          transform: `translateY(${bob}px) rotate(${lean}deg) scale(${enter * breathe})`,
          transformOrigin: "bottom center",
        }}
      >
        <Img src={src} style={{ width: widthPx, height: "auto", display: "block" }} />
      </div>
    </div>
  );
};
