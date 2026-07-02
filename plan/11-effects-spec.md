# 11 · 特效规范（LIVE·权威）

> 本文取代 [[09-effects-and-svg]] 的执行部分（09 仅存档历史）。
> 方向 = **锁定治愈手绘静态图 + 运镜 + 特效层**（见 [[10-art-style-locked]]）。
> **本文只给规则 + 种类方向，不写任何"具体特效"。** 每条片子的特效都是当场按内容新做的、每次都不一样——所以这里固化的是"怎么想、往哪个方向做"，不是一份可以照抄的清单。

---

## 一、铁律（任何特效都必须满足）

1. **内容为主，特效为辅——禁止干扰主视觉**：特效是大气氛的强化，不是主角。硬性约束：
   - 单个特效元素 opacity **不超过 0.55**；整体特效层不能遮挡角色脸部或关键画面内容
   - 色彩必须与该拍画面**主色调和谐**，不得使用与场景完全无关的撞色
   - **禁止在剧情/情感场景使用任何游戏化视觉**：积分弹出、聊天弹幕、HUD 文字气泡、任务提示等一概不能出现——这是家庭剧，不是游戏
   - 克制是美德：移走特效后感觉少了什么氛围，但看着时完全不会被特效分心——这才合格
2. **一拍一特效**：每个 beat 原则上只挂 **1 个**特效。宁可干净，不要堆叠——堆叠会互相打架、糊成一团、必然喧宾夺主。
3. **节奏绑定音频长度**：特效密度/次数**不写死数量**，而是接收该拍 `durationInFrames`（= 该拍音频真实时长）自行排布：
   - 事件次数按拍长算（如 `round(拍长 / 期望间隔)`），**均匀铺满整拍**；
   - 出生时刻**留末尾余量**（≈ 半个事件寿命），保证最后一个也能播完，**绝不被转场切断**；
   - 翻页/转场本就随音频长度变，特效必须同源于 `durationInFrames`，才不会跨拍串味。
4. **高对比可见（最容易翻车）**：背景是**浅粉彩**——
   - **禁止**纯白/浅色当主体（浅叠浅 = 隐形，等于没做）；
   - 每个元素必须有**饱和填充 + 粗描边 + 投影/高光**之一；
   - 自检：放到浅底上眯眼还能看见 → 合格。
5. **视觉机制必须全片唯一，且每次必须新发明**：每个 beat 的特效核心机制不得与同片任何其他 beat 相同；**每次写特效时必须发明新的机制，不得从任何现有列表或已写过的代码里取用**。"换形状的粒子"不算不同机制。仅举 3 例说明"机制本质不同"长什么样（不是菜单，不得照抄）：扫光（单一光体平移）、路径描绘（strokeDashoffset 动画）、全帧色调脉冲（整帧 opacity 心跳）。写之前列出本片已用过的机制描述，确认新 beat 的机制与它们在原理上完全不同。
6. **逐帧确定性**：一切是 `useCurrentFrame()` 的函数；随机用 `random(seed)` 种子化；**禁用** CSS 动画 / rAF / Web Animations / 实时 Canvas 循环，否则逐帧渲染会闪、不可复现。

---

## 二、按场景给方向（只给种类，不给具体特效）

特效跟着该拍的内容/情绪走。看旁白在干嘛 → 落到下面某个方向 → 当场为这拍**新做一个**该方向的特效（形态每次可以不同，只要满足铁律）：

| 该拍的场景 / 情绪 | 特效方向（种类） | 运动语言举例 |
|---|---|---|
| 开场 / 平静 / 温柔日常 | 轻柔漂浮类 | 缓慢上浮、游走、柔光 |
| 温柔 / 手上动作（撒花、放飞…） | 柔美飘落类 | 从某点洒落、打旋下坠（origin 可绑到手部/道具） |
| 答对 / 学会一句（正反馈高光） | 奖励弹出类 | HUD 牌/数字弹跳、喷射后落回 |
| 被表扬 / 惊叹 / 喊话 | 冲击强调类 | 砸入、扫光、（克制用一次的）放射爆散 |
| 卖萌 / 好奇 / 想说话 | 俏皮点缀类 | 小图标摇曳、明灭、随情绪的符号（音符/问号…） |
| 递进 / 越来越好 | 渐强热闹类 | 满屏洒落、斜掠、逐步加密 |
| 收尾 / CTA / 通关 | 整片最强一击 | 达成横幅 + 大面积庆祝（全片情绪最高点） |

选择步骤：**定场景 → 定方向 → 挑一个"本片还没出现过的运动语言" → 过一遍铁律（尤其 1 不喧宾夺主、5 不重样）**。
要点：**尽量让每个场景都配到一个合适方向的特效**（别偷懒全片同一个），但密度服从铁律 1——够点睛即可，不铺满。

---

## 三、AI 量身定制特效（方案 B，**强制执行**）

**每条视频的每个 beat，由 Claude AI 根据场景内容写全新的 TSX 特效组件**，绝不重用其他视频的代码。

### 执行流程

1. `scripts/build.mjs` 在每个 beat 生成图/音后，调用 `scripts/gen-effect.mjs`
2. `gen-effect.mjs` 向 Claude API（`claude-haiku-4-5-20251001`）发一次请求，传入：
   - 场景描述（`shots[0].content`）、情绪（`emotion`）、旁白（`captions.zh`）
   - 当前片子已用过的运动语言（防止重样）
   - Plan/11 铁律（上方全部 6 条）+ 按情绪对应的方向建议
3. Claude 返回完整 TSX 代码 → 写到 `src/fx/generated/<videoId>/<beatId>.tsx`
   - 文件 export：`export const Effect: React.FC<{ durationInFrames: number }>`
   - 只允许从 `"remotion"` import（`useCurrentFrame`, `useVideoConfig`, `interpolate`, `random`）
   - 不得 import 任何本地文件
4. 全部 beat 完成后，build.mjs 重写 `src/fx/generated/registry.ts`（扫描目录，静态 import 所有生成组件）
5. `manifest.json` 里 beat.effects = `[{ "type": "ai:<videoId>/<beatId>" }]`
6. `EffectsLayer` 检测 `type.startsWith("ai:")` → 查 `effectRegistry` → 渲染

### 缓存策略
- 文件存在 → 跳过（不重复调用 API）
- 强制重生成：`--force-effects` 标志 或 手动删文件

### API 调用规则（同所有外部 API）
- 全部走 `curl -x http://127.0.0.1:7897` + 代理，不用 Node fetch

### 情绪 → 特效方向速查（仅作建议，Claude 按内容自主创作）
| 情绪关键词 | 建议方向 |
|---|---|
| pale / sick / resting | 轻柔漂浮、柔光渐变扫过 |
| focused / cooking / nervous | 奖励弹出：小星星/爱心从角色区喷出 |
| tender / gentle / flowers | 花瓣/花朵从上方飘落 |
| devoted / guarding | 爱心缓缓上浮 |
| quiet / loyal / companion | 可爱小图标（爪印/音符）轻柔游走 |
| touched / teary / grateful | 柔光从中心向外扩散 |
| warm / together / celebration | 庆祝最强一击：彩色纸屑+星星炸开 |

---

## 四、怎么把特效接进渲染层

- 生成的组件在 `src/fx/generated/<videoId>/<beatId>.tsx`
- `src/fx/generated/registry.ts` 由 build.mjs 自动维护，映射 `"<videoId>/<beatId>"` → 组件
- `EffectsLayer` 在 `Video.tsx` 里处理 `type: "ai:<videoId>/<beatId>"`，从 registry 取组件
- Studio(:3000) 热更新实时可见

---

## 五、manifest 写法

```jsonc
{
  "id": "pX",
  "durationMs": 4790,
  "effects": [
    { "type": "ai:<videoId>/<beatId>" }   // AI 量身定制，无额外参数
  ]
}
```

## 关联
[[00-overview]] · [[03-remotion-animation]] · [[08-script-to-video-rules]] · [[09-effects-and-svg]]（存档） · [[10-art-style-locked]]
