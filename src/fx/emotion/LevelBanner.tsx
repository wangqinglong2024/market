import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";

// 游戏"达成/通关"横幅：弹簧弹入(spring) 到画面上方 → 白光循环扫过 + 环绕小星脉冲，停留。CTA/收尾拍用。
// 逐帧确定性：入场用 spring(frame)，扫光/星星脉冲都是帧的函数。
const GAME_FONT = '"Nunito", "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif';
const STAR = "M0,-10 L2.9,-3.1 L10,-3.1 L4,1.6 L6,9.5 L0,4.7 L-6,9.5 L-4,1.6 L-10,-3.1 L-2.9,-3.1 Z";

export const LevelBanner: React.FC<{
  text?: string;
  seed?: string;
  posY?: number; // 相对全高 0~1
  colors?: [string, string];
}> = ({ text = "GIỎI QUÁ!", seed = "lb", posY = 0.1, colors = ["#ff5d8f", "#ffb703"] }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const enter = spring({ frame, fps, config: { damping: 11, stiffness: 130, mass: 0.9 } });

  const fs = 76;
  const est = Array.from(text).reduce((w, ch) => w + (/[一-鿿]/.test(ch) ? fs : fs * 0.62), 0);
  const pw = est + 120;
  const ph = fs + 64;
  const cx = width / 2;
  const cy = height * posY + ph / 2;
  const scale = 0.3 + enter * 0.7;
  const gid = `lb-grad-${seed}`;
  const cid = `lb-clip-${seed}`;

  // 白光扫过：每 1.6s 从左扫到右，clip 在胶囊内
  const sweep = ((t % 1.6) / 1.6) * (pw + 260) - pw / 2 - 130;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
        <clipPath id={cid}>
          <rect x={cx - pw / 2} y={cy - ph / 2} width={pw} height={ph} rx={ph / 2} />
        </clipPath>
      </defs>
      <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`} opacity={Math.min(1, enter * 1.4)}>
        {/* 投影 */}
        <rect x={cx - pw / 2} y={cy - ph / 2 + 10} width={pw} height={ph} rx={ph / 2} fill="rgba(0,0,0,0.22)" />
        {/* 胶囊主体 + 粗白描边 */}
        <rect
          x={cx - pw / 2}
          y={cy - ph / 2}
          width={pw}
          height={ph}
          rx={ph / 2}
          fill={`url(#${gid})`}
          stroke="#fff"
          strokeWidth={8}
        />
        {/* 扫光 */}
        <g clipPath={`url(#${cid})`}>
          <rect
            x={cx + sweep}
            y={cy - ph / 2}
            width={90}
            height={ph}
            fill="#ffffff"
            opacity={0.5}
            transform={`skewX(-18)`}
          />
        </g>
        <text
          x={cx}
          y={cy}
          fontFamily={GAME_FONT}
          fontSize={fs}
          fontWeight={900}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="central"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1}
        >
          {text}
        </text>
        {/* 环绕脉冲小星 */}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.4;
          const rx = pw / 2 + 26;
          const ry = ph / 2 + 18;
          const x = cx + Math.cos(a) * rx;
          const y = cy + Math.sin(a) * ry;
          const tw = 0.4 + 0.6 * Math.sin(t * Math.PI * 2 * (0.7 + random(`${seed}-p-${i}`)) + i);
          const col = i % 2 ? "#fff2a8" : "#fff";
          return (
            <path
              key={i}
              d={STAR}
              fill={col}
              opacity={enter * tw}
              transform={`translate(${x} ${y}) scale(${0.8 + tw * 0.7}) rotate(${(t * 60 + i * 40) % 360})`}
            />
          );
        })}
      </g>
    </svg>
  );
};
