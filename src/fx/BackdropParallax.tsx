import { random, useCurrentFrame, useVideoConfig } from "remotion";

// 视差背景：动画渐变 + 缓慢漂浮的柔色斑块。cam 传入镜头位移，背景按较小系数移动 → 纵深感。
export const BackdropParallax: React.FC<{ camX?: number; camY?: number; seed?: string }> = ({
  camX = 0,
  camY = 0,
  seed = "bg",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const blobs = 7;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* 渐变底 */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          background: "linear-gradient(160deg, #fff6d9 0%, #ffe1ec 55%, #e7f0ff 100%)",
          transform: `translate(${camX * 0.15}px, ${camY * 0.15}px)`,
        }}
      />
      {/* 漂浮柔色斑块（背景层，视差系数小） */}
      {Array.from({ length: blobs }).map((_, i) => {
        const bx = random(`${seed}-x-${i}`) * width;
        const by = random(`${seed}-y-${i}`) * height;
        const r = 120 + random(`${seed}-r-${i}`) * 260;
        const spd = 0.1 + random(`${seed}-s-${i}`) * 0.25;
        const dx = Math.sin((frame / fps) * Math.PI * 2 * spd + i) * 30;
        const dy = Math.cos((frame / fps) * Math.PI * 2 * spd + i) * 22;
        const hue = ["#ffd6a5", "#ffadad", "#bdb2ff", "#a0e7e5", "#fdffb6"][i % 5];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: r,
              height: r,
              borderRadius: "50%",
              background: hue,
              filter: "blur(40px)",
              opacity: 0.35,
              transform: `translate(${dx + camX * 0.3}px, ${dy + camY * 0.3}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
