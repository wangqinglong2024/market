import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import manifest from "./demo-manifest.json";

const FPS = manifest.meta.fps;

export const beatsWithFrames = manifest.beats.map((b) => ({
  ...b,
  frames: Math.round((b.durationMs / 1000) * FPS),
}));

export const DEMO_TOTAL_FRAMES = beatsWithFrames.reduce(
  (a, b) => a + b.frames,
  0,
);

const FONT =
  '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif';

const Scene: React.FC<{
  beat: (typeof beatsWithFrames)[number];
}> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ken Burns：缓慢推近
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.12], {
    extrapolateRight: "clamp",
  });
  // 翻页淡入淡出
  const opacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // 字幕轻微上浮
  const capRise = interpolate(frame, [0, 14], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ backgroundColor: "#fffdf7" }} />
      <Img
        src={staticFile(beat.image)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      {/* 字幕区 */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 150,
          transform: `translateY(${capRise}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            borderRadius: 28,
            padding: "26px 38px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
            border: "3px solid rgba(255, 209, 102, 0.9)",
          }}
        >
          <div style={{ fontSize: 40, color: "#8a8170", fontWeight: 600 }}>
            {beat.captions.pinyin}
          </div>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.18,
              color: "#2b2b2b",
              fontWeight: 900,
              margin: "6px 0",
            }}
          >
            {beat.captions.zh}
          </div>
          <div style={{ fontSize: 46, color: "#d6336c", fontWeight: 700 }}>
            {beat.captions.vi}
          </div>
        </div>
      </div>
      <Audio src={staticFile(beat.audio)} />
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#fffdf7" }}>
      {beatsWithFrames.map((beat) => {
        const el = (
          <Sequence key={beat.id} from={from} durationInFrames={beat.frames}>
            <Scene beat={beat} />
          </Sequence>
        );
        from += beat.frames;
        return el;
      })}
    </AbsoluteFill>
  );
};
