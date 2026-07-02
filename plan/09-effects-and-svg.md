# 09 · 视觉升级：特效栈

> ⚠️ 更新(2026-07-02)：**SVG 木偶/骨骼方向已废弃**（见 `temp/NEXT-SESSION.md`、[[10-art-style-locked]]）。
> 现方向 = **锁定治愈手绘风的静态图 + 运镜 + 特效层**。本文下方"全 SVG"历史内容仅存档，不再执行。

## ★ 已落地的特效栈(图片+运镜方向)
特效**按 beat 绑定、伴随语音**，全部**逐帧确定性**（见下"铁律"）。渲染层按 `beat.effects[]` 叠加：

| 特效 | 组件 | 说明 |
|---|---|---|
| 闪烁星点 | `src/fx/Sparkles.tsx` | 确定性粒子，定点闪烁 |
| 漏光/暖光扫 | `src/fx/LightLeak.tsx` | screen 混合，电影感光晕 |
| **彩带/星星爆发(游戏感)** | `src/fx/Confetti.tsx` | 种子化抛射+重力，高光/CTA 拍用，"游戏特效"感 |
| **three.js 漂浮粒子/景深** | `src/fx/ThreeParticles.tsx` | `@remotion/three` 的 ThreeCanvas，3D 浮点/散景 |
| 视差背景(可选) | `src/fx/BackdropParallax.tsx` | 渐变 + 漂浮柔色斑块 |

- `beat.effects` 例：`[{"type":"sparkle","count":40},{"type":"confetti"},{"type":"three","variant":"bokeh"}]`。
- 运镜见 [[03-remotion-animation]] 组合运镜；转场用 `@remotion/transitions`。

## 历史存档（全 SVG 矢量方向，已废弃）
从"图片幻灯片"升级为"矢量动画短片，有视觉冲击"。角色改**全 SVG 扁平矢量、可绑骨骼、零出图 API**；
背景/特效用 SVG / three.js / 粒子 / 物理。特效与图片一样**按 beat 绑定、伴随语音**。

## 铁律：逐帧确定性（最重要）
Remotion 渲染是逐帧截图，不是实时播放。因此：
- 一切动画必须是 `useCurrentFrame()` 的函数。**禁用** CSS animation / requestAnimationFrame / Web Animations API / 实时 Canvas 循环。
- 随机与物理必须**种子化 + 按帧步进**：用 Remotion `random(seed)`；物理引擎每帧从初始态手动 step N 次到当前帧（或预烧轨迹）。否则画面闪、不可复现。

## 技术栈映射
| 用途 | 方案 |
|---|---|
| 3D 运镜/视差/景深 | `@remotion/three`（官方，首选） |
| GPU 粒子瀑布/大批量精灵 | PixiJS（手动按帧 render）或 three Points；轻量用 SVG/Canvas2D 逐帧 |
| 物理（掉落/弹跳/堆叠） | matter.js / rapier，种子化按帧 step |
| 光效/漏光/发光/故障 | SVG 滤镜 + 逐帧 Canvas2D |
| 角色 | 分层 SVG + 部件命名（头/眼/嘴/手/身），代码按帧绑骨骼 |
| 转场 | `@remotion/transitions`（翻页/擦除/whip-pan） |
| UI/HUD | React（本就是） |

## 分层数据模型（manifest 每个 beat）
```jsonc
{
  "id": "p01",
  "layers": {
    "bg":    { "type": "svg-scene" | "gradient" | "three", "ref": "..." },
    "characters": [ { "id": "boy", "pose": "wave", "motion": "parallax-far" } ],
    "fgFx":  [ { "type": "sparkle" } ]
  },
  "effects": [ { "type": "lightLeak", "intensity": 0.4 } ],  // 与该拍语音同窗
  "motion": { "compose": ["push-in", "pan-right", "rotate-1"], "seed": 12 },
  "transitionIn": "page-turn"
}
```

## config 新增/扩展
- `config/effects.json`：特效预设库（粒子/光效/转场参数），可调。
- `config/motion.json`：扩成**可组合 + 种子微随机 + 避免连拍重复**的运镜库（自动编排）。
- `config/characters/<id>/character.svg`：可编辑矢量 + 命名部件；`spec.json` 存配色/默认姿态。

## 角色产出方法（待定，见本轮提问）
- **A 矢量化现有 AI 参考图**（推荐）：描摹 → 分层 → 拆件绑骨骼。保住现有萌感，零 API。
- **B 从零手绘扁平矢量**：全新画风，工作量大、萌度风险高。

## 落地节奏（先做垂直切片再铺开）
1. 一个角色（boy）矢量化 + 绑骨骼 + 一条"满配特效"的场景（背景+粒子+3D视差+转场+自动运镜）。
2. 你在 :3000 看新画风，确认后再铺到 5 角色 + 全 beat。
（沿用 [[06-open-questions]] 的"先 spike 验证最高风险"思路——新画风就是当前最高风险。）

## 关联
[[00-overview]] · [[03-remotion-animation]] · [[07-asset-layout]] · [[08-script-to-video-rules]]
