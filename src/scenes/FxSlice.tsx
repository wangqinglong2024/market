import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BackdropParallax } from "../fx/BackdropParallax";
import { Sparkles } from "../fx/Sparkles";
import { LightLeak } from "../fx/LightLeak";
import { Character } from "../characters/Character";
import { FONT_ZH, FONT_LATIN } from "../fonts";

// 垂直切片：矢量角色 + 视差背景 + 粒子 + 漏光 + 组合运镜 + 入场转场，特效与 p1 语音同窗。
// 用来在 :3000 判断"会动的满配场景"新画风。
export const FX_SLICE_FRAMES = 195; // ≈ p1 音频 6.5s @30fps

const BAND_TOP = 1330;

export const FxSlice: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 组合运镜（自动、非固定死）：推近 + 轻微摇移
  const camScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08]);
  const camX = Math.sin((frame / 30) * Math.PI * 2 * 0.15) * 26;
  const camY = Math.cos((frame / 30) * Math.PI * 2 * 0.12) * 14;

  // 入场转场：淡入 + 轻微回缩
  const intro = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const introScale = interpolate(frame, [0, 18], [1.06, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", opacity: intro }}>
      {/* 画面区（镜头 + 分层视差 + 特效） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${camScale * introScale})`,
          transformOrigin: "50% 42%",
        }}
      >
        <BackdropParallax camX={camX} camY={camY} />
        <div style={{ position: "absolute", inset: 0, transform: `translate(${camX * 1.1}px, ${camY * 1.1}px)` }}>
          <Character src={staticFile("library/characters/boy-recraft.svg")} xPct={50} yPct={40} widthPx={470} />
        </div>
        <Sparkles count={46} color="#fff3b0" />
        <LightLeak intensity={0.45} />
      </div>

      {/* 字幕带 + 三语字幕（与语音同窗） */}
      <div style={{ position: "absolute", top: BAND_TOP, left: 0, width: "100%", height: 1920 - BAND_TOP, backgroundColor: "#fefefe" }} />
      <div
        style={{
          position: "absolute",
          top: BAND_TOP,
          left: 48,
          right: 48,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: FONT_ZH, fontSize: 60, color: "#20242b", lineHeight: 1.25 }}>
          早晨，阳光照进小屋，胖乎乎的哥哥和妹妹醒来啦。
        </div>
        <div style={{ fontFamily: FONT_LATIN, fontSize: 42, color: "#d6336c", fontWeight: 800, lineHeight: 1.15 }}>
          Buổi sáng, nắng chiếu vào nhà, anh trai và em gái mũm mĩm thức dậy rồi.
        </div>
      </div>

      <Audio src={staticFile("videos/2026-07/demo/audio/p1.mp3")} />
    </AbsoluteFill>
  );
};
