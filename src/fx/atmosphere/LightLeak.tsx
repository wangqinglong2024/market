import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// 漏光/暖光扫过：柔和斜向渐变随帧移动，screen 混合叠在画面上，制造电影感光晕。
export const LightLeak: React.FC<{ intensity?: number; color?: string }> = ({
  intensity = 0.5,
  color = "255,214,120",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sweep = interpolate(frame, [0, durationInFrames], [-30, 130]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: intensity,
        background: `radial-gradient(60% 80% at ${sweep}% 20%, rgba(${color},0.9), rgba(${color},0) 60%),
                     radial-gradient(50% 60% at ${100 - sweep}% 90%, rgba(255,180,200,0.6), rgba(255,180,200,0) 60%)`,
      }}
    />
  );
};
