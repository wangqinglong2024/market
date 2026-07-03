import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
export const SparkleText: React.FC<{ durationInFrames: number; text: string; x?: number; y?: number; fontSize?: number; color?: string; sparkleColor?: string; opacity?: number }> = ({ durationInFrames, text, x = 0.5, y = 0.88, fontSize = 38, color = "#fff", sparkleColor = "#ffe566", opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(frame, [0, fps * 0.5, durationInFrames - fps * 0.4, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textW = text.length * fontSize * 0.55;
  const tx = W * x - textW / 2;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs><filter id="skt-g"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <text x={W * x} y={H * y} textAnchor="middle" fontSize={fontSize} fill={color} opacity={fade * opacity} fontFamily="system-ui" fontWeight="700">{text}</text>
      {Array.from({ length: 12 }, (_, i) => {
        const sx = tx + random(`skt-x${i}`) * textW;
        const sy = H * y - random(`skt-y${i}`) * fontSize * 1.5;
        const life = ((t * (1 + random(`skt-l${i}`) * 0.5) + random(`skt-p${i}`)) % 1);
        const sz = 3 + random(`skt-sz${i}`) * 5;
        const sc = sz * Math.sin(life * Math.PI);
        const op = Math.sin(life * Math.PI) * opacity;
        const rot = life * 360;
        return <polygon key={i} points={`0,${-sc} ${sc * 0.25},${-sc * 0.25} ${sc},0 ${sc * 0.25},${sc * 0.25} 0,${sc} ${-sc * 0.25},${sc * 0.25} ${-sc},0 ${-sc * 0.25},${-sc * 0.25}`} fill={sparkleColor} transform={`translate(${sx},${sy}) rotate(${rot})`} opacity={fade * op} filter="url(#skt-g)" />;
      })}
    </svg>
  );
};
