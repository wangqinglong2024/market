# 11 · 特效规范（LIVE·权威，2026-07-03 精简重写）

> 取代旧「每拍由 AI 现写一个全新 TSX 特效」的方案（已废弃，见文末）。
> 现方向 = **固定 4 个特效的小调色板，克制使用**。

---

## 一、只保留这 4 个特效（用户 2026-07-03 锁定，其余全部删除）

| type | 组件 | 观感 | 什么时候用 |
|---|---|---|---|
| `comicPops` | `fx/emotion/ComicPops` | 漫画感文字气泡「哇/棒/GIỎI」弹出 | 被夸奖 / 惊叹 / 答对 / 情绪高点，想喊一句 |
| `emojiRain` | `fx/emotion/EmojiRain` | 表情/图标从上方飘落 | 温柔开心、卖萌、可爱氛围点缀 |
| `scorePop` | `fx/emotion/ScorePop` | 分数/爱心/词从角色区弹跳喷出 | 正反馈高光：学会一句、做对事、被表扬 |
| `zoomBlur` | `fx/distortion/ZoomBlur` | 径向缩放模糊冲击 | 强调 / 恍然大悟 / 镜头冲入某个焦点的一瞬 |

- 渲染层 `Video.tsx` 的 `EffectsLayer` 现在**只认这 4 个 type**，其它 type 一律不渲染（返回 null）。
- Studio 里对应预览 Composition：`fx-emotion-ComicPops`、`fx-emotion-EmojiRain`、`fx-emotion-ScorePop`、`fx-distortion-ZoomBlur`（`fx-emotion`、`fx-distortion` 为合并预览）。

## 二、使用铁律（比"有哪些特效"更重要）

1. **一条视频最多 2 个特效**。不是每拍都要有——**绝大多数拍应该没有特效**，靠画面+运镜+配音撑住。
2. **仅在内容真的需要时才加**：只有出现「情绪高点 / 正反馈 / 需要强调」的那一两拍才配，其余一律不加。没需要就别乱加。
3. **内容为主，特效为辅**：单个特效 opacity 不超过 ~0.55，不遮脸、不抢主视觉；移走它画面依然成立。
4. **和谐**：颜色跟该拍画面主色调走，别撞色。这是治愈手绘片，不是游戏——克制。
5. **逐帧确定性**：特效都是 `useCurrentFrame()` 的函数、`random(seed)` 种子化，节奏接 `durationInFrames`（该拍音频真实时长），末尾留余量别被转场切断。（4 个组件都已满足。）

## 三、怎么在脚本里挂特效

在 `script.json` 的某个 beat 上写 `effects`（不需要就**不写这个字段**）：
```jsonc
{
  "id": "p3",
  "captions": { "zh": "他一下子就想通了！" },
  "effects": [ { "type": "zoomBlur" } ]          // 恍然大悟的一瞬，强调
}
```
参数可选，缺省用组件默认值。常用：
- `comicPops`：`words`（如 `["哇","太棒了","GIỎI!"]`）
- `emojiRain`：`emojis`、`count`、`opacity`
- `scorePop`：`tokens`（如 `["❤️","+1","Con giỏi!"]`）、`count`、`interval`
- `zoomBlur`：`cx`/`cy`（冲入焦点）、`rings`、`opacity`

一条视频里累计出现 `effects` 的 beat **不超过 2 个**。

## 四、渲染接线（现状）

- `Video.tsx` → `EffectsLayer`：`switch(fx.type)` 只保留 `comicPops/emojiRain/scorePop/zoomBlur` 四个 case，`default` 返回 null。
- 图层在图片区之上、字幕带之上叠加，接收该拍 `durationInFrames`。
- ✅ **已接线（2026-07-03）**：`scripts/build.mjs` 直接透传 `script.json` 里 beat 自带的 `effects`，并过滤到只允许 `comicPops/emojiRain/scorePop/zoomBlur` 四个 type（其它忽略）；没写 `effects` 的拍就没有特效。旧的 `gen-effect.mjs` 与 `ai:<...>` 强制特效已删除。

---

## 历史存档（已废弃）
- ~~方案 B：每条视频每拍由 Claude API 现写全新 TSX 特效，存 `src/fx/generated/`~~ —— 2026-07-03 废弃，改固定 4 特效小调色板。
- ~~全 SVG 木偶/骨骼方向~~ —— 见 [[09-effects-and-svg]]（更早存档）。

## 关联
[[00-overview]] · [[03-remotion-animation]] · [[08-script-to-video-rules]] · [[10-art-style-locked]] · [[12-video-folder-spec]]
