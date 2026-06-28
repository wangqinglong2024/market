import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

const PAGE_SECONDS = 3;
const CAPTION_SEPARATOR = "|";

type LearningScene = {
  image: string;
  lesson: string;
  word: string;
  pinyin: string;
  note: string;
  accent: string;
  secondary: string;
  mascot: string;
};

const scenes: LearningScene[] = [
  {
    image: "family-learning/scene-01-living-room.jpg",
    lesson: "第一课：问好",
    word: "你好",
    pinyin: "ni hao",
    note: "和妈妈打招呼",
    accent: "#ff6b8f",
    secondary: "#ffd166",
    mascot: "morning",
  },
  {
    image: "family-learning/scene-01-living-room.jpg",
    lesson: "第二课：家人",
    word: "爸爸",
    pinyin: "ba ba",
    note: "早上说你好",
    accent: "#4dabf7",
    secondary: "#9bf6ff",
    mascot: "sun",
  },
  {
    image: "family-learning/scene-02-kitchen.jpg",
    lesson: "第三课：早餐",
    word: "吃 / 喝",
    pinyin: "chi / he",
    note: "米饭和牛奶",
    accent: "#f59f00",
    secondary: "#b2f2bb",
    mascot: "meal",
  },
  {
    image: "family-learning/scene-03-yard.jpg",
    lesson: "第四课：一起",
    word: "哥哥 / 妹妹",
    pinyin: "ge ge / mei mei",
    note: "两个胖娃一起玩",
    accent: "#51cf66",
    secondary: "#ff8787",
    mascot: "ball",
  },
  {
    image: "family-learning/scene-03-yard.jpg",
    lesson: "第五课：感谢",
    word: "谢谢",
    pinyin: "xie xie",
    note: "谢谢爸爸妈妈",
    accent: "#845ef7",
    secondary: "#fcc2d7",
    mascot: "heart",
  },
  {
    image: "family-learning/scene-04-bedtime.jpg",
    lesson: "第六课：晚安",
    word: "晚安",
    pinyin: "wan an",
    note: "温暖地说我爱你们",
    accent: "#5c7cfa",
    secondary: "#ffd43b",
    mascot: "moon",
  },
];

const isCaptionArray = (data: unknown): data is Caption[] => {
  return (
    Array.isArray(data) &&
    data.every((entry) => {
      const caption = entry as Partial<Caption>;
      return (
        typeof caption.text === "string" &&
        typeof caption.startMs === "number" &&
        typeof caption.endMs === "number"
      );
    })
  );
};

const useBilingualCaptions = () => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading bilingual captions"));

  const loadCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile("family-learning/captions.json"));
      const data: unknown = await response.json();

      if (!isCaptionArray(data)) {
        throw new Error("Invalid caption JSON");
      }

      setCaptions(data);
      continueRender(handle);
    } catch (error) {
      cancelRender(error);
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    loadCaptions();
  }, [loadCaptions]);

  return captions;
};

const splitCaption = (caption: Caption) => {
  const [chinese = "", vietnamese = ""] = caption.text.split(CAPTION_SEPARATOR);
  return { chinese, vietnamese };
};

const FloatingEffects: React.FC<{
  accent: string;
  secondary: string;
  variant: string;
}> = ({ accent, secondary, variant }) => {
  const frame = useCurrentFrame();
  const items = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        left: 110 + ((index * 137) % 1700),
        top: 90 + ((index * 211) % 760),
        size: 14 + ((index * 9) % 28),
        delay: index * 4,
      })),
    [],
  );

  return (
    <AbsoluteFill>
      {items.map((item, index) => {
        const lift = interpolate(
          (frame + item.delay) % 90,
          [0, 45, 90],
          [0, -28, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.37, 0, 0.63, 1),
          },
        );
        const opacity = interpolate(
          (frame + item.delay) % 90,
          [0, 18, 72, 90],
          [0.05, 0.55, 0.55, 0.05],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <div
            key={`${variant}-${index}`}
            style={{
              position: "absolute",
              left: item.left,
              top: item.top,
              width: item.size,
              height: item.size,
              borderRadius: variant === "heart" ? "45% 45% 55% 55%" : 999,
              backgroundColor: index % 2 === 0 ? accent : secondary,
              opacity,
              translate: `0px ${lift}px`,
              rotate: `${interpolate(
                (frame + item.delay) % 90,
                [0, 90],
                [-12, 18],
              )}deg`,
              boxShadow: `0 0 ${item.size}px rgba(255,255,255,0.45)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const WordCard: React.FC<{ scene: LearningScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [8, 24], [0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const bob = interpolate(frame % 60, [0, 30, 60], [0, -10, 0], {
    easing: Easing.bezier(0.37, 0, 0.63, 1),
  });

  return (
    <div
      style={{
        alignSelf: "flex-start",
        width: 540,
        borderRadius: 28,
        background: "rgba(255, 255, 255, 0.92)",
        border: `8px solid ${scene.accent}`,
        boxShadow: "0 24px 60px rgba(54, 38, 20, 0.22)",
        padding: "34px 42px 38px",
        scale: pop,
        translate: `0px ${bob}px`,
      }}
    >
      <div
        style={{
          fontSize: 36,
          color: "#5b4b3d",
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        {scene.lesson}
      </div>
      <div
        style={{
          fontSize: 104,
          lineHeight: 1,
          color: "#1f1a17",
          fontWeight: 900,
          letterSpacing: 0,
        }}
      >
        {scene.word}
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 42,
          color: scene.accent,
          fontWeight: 800,
        }}
      >
        {scene.pinyin}
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: 32,
          color: "#6b5b4d",
          fontWeight: 700,
        }}
      >
        {scene.note}
      </div>
    </div>
  );
};

const CaptionBlock: React.FC<{ caption: Caption; accent: string }> = ({
  caption,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { chinese, vietnamese } = splitCaption(caption);
  const rise = interpolate(frame, [0, 18], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [0, 15, 78, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 1280,
        borderRadius: 30,
        background: "rgba(24, 22, 20, 0.72)",
        boxShadow: "0 22px 70px rgba(0, 0, 0, 0.28)",
        border: "3px solid rgba(255,255,255,0.45)",
        padding: "32px 44px",
        opacity,
        translate: `0px ${rise}px`,
      }}
    >
      <div
        style={{
          fontSize: 72,
          lineHeight: 1.16,
          color: "#ffffff",
          fontWeight: 900,
          textAlign: "center",
          textShadow: "0 4px 14px rgba(0,0,0,0.38)",
        }}
      >
        {chinese}
      </div>
      <div
        style={{
          margin: "18px auto 0",
          width: 760,
          height: 5,
          borderRadius: 999,
          background: accent,
        }}
      />
      <div
        style={{
          marginTop: 18,
          fontSize: 44,
          lineHeight: 1.22,
          color: "#f8f1df",
          fontWeight: 800,
          textAlign: "center",
        }}
      >
        {vietnamese}
      </div>
    </div>
  );
};

const ScenePage: React.FC<{
  scene: LearningScene;
  caption: Caption;
  pageIndex: number;
}> = ({ scene, caption, pageIndex }) => {
  const frame = useCurrentFrame();
  const backgroundScale = interpolate(frame, [0, 90], [1.08, 1.01], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [78, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wipe = interpolate(frame, [0, 20], [-520, 2100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9efe2", overflow: "hidden" }}>
      <Img
        src={staticFile(scene.image)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: backgroundScale,
          opacity: fadeIn * fadeOut,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(20,16,12,0.12) 45%, rgba(20,16,12,0.54) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 340,
          background:
            "linear-gradient(180deg, rgba(36,30,24,0) 0%, rgba(36,30,24,0.9) 48%, rgba(36,30,24,0.99) 100%)",
        }}
      />
      <FloatingEffects
        accent={scene.accent}
        secondary={scene.secondary}
        variant={scene.mascot}
      />
      <div
        style={{
          position: "absolute",
          top: 66,
          right: 80,
          borderRadius: 999,
          padding: "18px 30px",
          background: "rgba(255,255,255,0.86)",
          color: "#47392e",
          fontSize: 34,
          fontWeight: 900,
          boxShadow: "0 14px 42px rgba(0,0,0,0.15)",
        }}
      >
        {String(pageIndex + 1).padStart(2, "0")} / 06
      </div>
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 100,
          right: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 50,
        }}
      >
        <WordCard scene={scene} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 88,
          display: "flex",
          justifyContent: "center",
          padding: "0 100px",
        }}
      >
        <CaptionBlock caption={caption} accent={scene.accent} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -140,
          left: wipe,
          width: 360,
          height: 1360,
          rotate: "18deg",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.42), rgba(255,255,255,0))",
          opacity: 0.75,
        }}
      />
    </AbsoluteFill>
  );
};

export const FamilyLearningDemo: React.FC = () => {
  const captions = useBilingualCaptions();
  const { fps } = useVideoConfig();
  const pageFrames = PAGE_SECONDS * fps;

  if (!captions) {
    return null;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#f9efe2" }}>
      {scenes.map((scene, index) => {
        const caption = captions[index];

        if (!caption) {
          return null;
        }

        return (
          <Sequence
            key={`${scene.word}-${index}`}
            from={index * pageFrames}
            durationInFrames={pageFrames}
          >
            <ScenePage scene={scene} caption={caption} pageIndex={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
