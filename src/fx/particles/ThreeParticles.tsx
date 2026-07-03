import { ThreeCanvas } from "@remotion/three";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { useMemo } from "react";

// three.js 漂浮粒子/散景：@remotion/three 的 ThreeCanvas，逐帧确定性（用 useCurrentFrame 驱动，不用 rAF）。
// variant: "bokeh"(柔和上浮光斑) | "stars"(点状星点)。width/height 传图片区尺寸。
const Cloud: React.FC<{ count: number; seed: string; colors: string[]; big: boolean }> = ({
  count,
  seed,
  colors,
  big,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: (random(`${seed}-x-${i}`) - 0.5) * 8,
        y0: (random(`${seed}-y-${i}`) - 0.5) * 9,
        z: (random(`${seed}-z-${i}`) - 0.5) * 3,
        r: (big ? 0.18 : 0.05) + random(`${seed}-r-${i}`) * (big ? 0.4 : 0.09),
        spd: 0.25 + random(`${seed}-s-${i}`) * 0.6,
        phase: random(`${seed}-p-${i}`) * Math.PI * 2,
        color: colors[Math.floor(random(`${seed}-c-${i}`) * colors.length)],
        op: 0.25 + random(`${seed}-o-${i}`) * 0.5,
      })),
    [count, seed, colors, big],
  );
  return (
    <>
      {items.map((p, i) => {
        const y = ((p.y0 + t * p.spd + 4.5) % 9) - 4.5; // 缓慢上浮循环
        const x = p.x + Math.sin(t * p.spd + p.phase) * 0.4;
        const tw = 0.6 + 0.4 * Math.sin(t * Math.PI * 2 * p.spd + p.phase);
        return (
          <mesh key={i} position={[x, y, p.z]}>
            <circleGeometry args={[p.r, 20]} />
            <meshBasicMaterial color={p.color} transparent opacity={p.op * tw} />
          </mesh>
        );
      })}
    </>
  );
};

export const ThreeParticles: React.FC<{
  width: number;
  height: number;
  variant?: "bokeh" | "stars";
  seed?: string;
}> = ({ width, height, variant = "bokeh", seed = "tp" }) => {
  const big = variant === "bokeh";
  const colors = big
    ? ["#ffd6a5", "#ffadad", "#bdb2ff", "#a0e7e5", "#fdffb6"]
    : ["#ffffff", "#fff3b0", "#cde7ff"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 60, position: [0, 0, 6] }} gl={{ alpha: true }}>
        <ambientLight intensity={1} />
        <Cloud count={big ? 16 : 40} seed={seed} colors={colors} big={big} />
      </ThreeCanvas>
    </div>
  );
};
