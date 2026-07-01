// 角色骨骼驱动：全部逐帧确定性（禁止实时随机/计时器）。
// idle：呼吸/浮动/摆动/眨眼；action：挥手/说话（张嘴）。其余角色共用这套。

export type RigState = {
  breathe: number; // 缩放系数
  bob: number; // 上下浮动 px
  lean: number; // 摆动角度 deg
  blinkScaleY: number; // 眼睛纵向缩放（1=睁，~0.1=闭）
  armR: number; // 右臂旋转角度 deg（挥手）
  mouthOpen: number; // 0=闭合微笑，1=张大
};

export function rig(action: string, frame: number, fps: number): RigState {
  const t = frame / fps;
  const breathe = 1 + Math.sin(t * Math.PI * 2 * 0.5) * 0.015;
  const bob = Math.sin(t * Math.PI * 2 * 0.55) * 8;
  const lean = Math.sin(t * Math.PI * 2 * 0.28) * 1.5;

  // 眨眼：每 ~3.2s 眨一次，快速闭合再睁开
  const period = 3.2;
  const ph = (t % period) / period;
  const blink = ph > 0.955 ? Math.sin(((ph - 0.955) / 0.045) * Math.PI) : 0;
  const blinkScaleY = 1 - blink * 0.9;

  let armR = 0;
  let mouthOpen = 0;
  if (action === "wave") armR = -38 + Math.sin(t * Math.PI * 2 * 2.2) * 34;
  if (action === "talk") mouthOpen = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 3.2);

  return { breathe, bob, lean, blinkScaleY, armR, mouthOpen };
}
