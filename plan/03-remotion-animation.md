# 03 · Remotion 绘本页动效与排版

渲染层是**纯数据驱动**：一个万能 Composition 读 `manifest.json` 渲染，自身不含业务内容。
`calculateMetadata` 读 manifest 累加各页 `durationMs` 得总时长与 fps。

## 一段旁白内的多图过程动画
一个 page 可含 `shots[]`（1~N 张）。按 `weight` 把该页 `durationMs` 分给各 shot，
shot 间用交叉淡入/顺序揭示表现"过程"（如山底→山中→山顶的攀爬）。单图时退化为静态页 + Ken Burns。

## "翻小人书"动感 = 这几样叠加（都不烧 API）
1. **翻页转场**：镜头间做翻书/卷页（CSS 3D `rotateY` 或卷曲）。"小人书"感的灵魂。
2. **Ken Burns**：单页内极缓慢推拉/平移，静图也有呼吸。
3. **Line boil（手绘抖动）**：每隔几帧让画面/线条极轻微位移+旋转，模仿逐帧手绘。便宜且出彩。
4. **纸张质感 + 暗角**：叠纸纹理 + vignette，强化绘本翻看感。
5. **视差（v2 可选）**：若 manifest 提供 `imageLayers{bg,character}`，角色与背景错位轻晃。成本翻倍，先不做。
6. **翻页音效 + 轻 BGM**：见 [[04-tts-captions]] 音频部分。

## 竖屏构图与安全区（9:16, 1080×1920）
- 画面主体居中偏上；底部留给三行字幕。
- 避开平台安全区：顶部（头像/搜索）、底部（文案/按钮）。重要内容收在中间安全带。

## 三行字幕排版
```
nǐ hǎo, māma      ← 拼音，中号，声调符号 ā á ǎ à
你好，妈妈          ← 中文，最大，主视觉
Chào mẹ.          ← 当地语言，中号
```
- **字体**：必须同时覆盖中文 + 拼音声调 + 越南语附加符号（ạ ầ ễ）。选 Noto 系（Noto Serif/Sans SC + Noto Sans Vietnamese 同族）避免豆腐块。
- 停留时长 = 该页 TTS 真实音频长度（音频驱动）。
- **逐字高亮（卡拉OK跟读）**：若火山 TTS 提供字级时间戳（见 04），中文逐字点亮，教学效果强；否则整句淡入淡出。

### ★ 三行一律不换行(已锁定，2026-07-02)
- 拼音 ruby / 中文 / 当地语言**每行都单行显示，绝不 flex-wrap 折行**。
- 实现：每行 `white-space: nowrap`，用 layout 测量行宽 vs 字幕带可用宽，超宽则**整行等比缩小**贴合（`FitLine` 组件：`useLayoutEffect` 量 `scrollWidth`，算 `scale=min(1,avail/measured)`，配 `delayRender/continueRender` 保渲染确定性）。
- 字幕带只在人物**正下方**，上下留白相等（安全区），见 [[10-art-style-locked]] 版式。

## ★ 运镜升级：组合运镜（已锁定，2026-07-02）
`config/motion.json` 预设支持组合字段：`scale`(推拉) + `panX/panY`(平移) + `driftX/driftY`(正弦漂移，让静图持续"呼吸") + `rotate`(轻微旋转) + `ease`(inOut 缓动)。
- 预设：`push-in / pull-back / pan-left / pan-right / climb-up / ken-burns / sway / pop / still`。
- 分镜按句意（`rules.byKeyword`）自动选 preset；渲染层 `Video.tsx` 按名播放，**改预设即调运镜，不动代码**。
- beat 间用 `@remotion/transitions`（淡入/滑入/翻页）做转场，不再只是 opacity 淡入淡出。

## 片头 / 片尾
- 片头：品牌露出 + 主题。
- 片尾：软件 CTA「下载 XX，全家一起学中文」+ 二维码/应用商店标识。固定模板。

## 关联
[[00-overview]] · [[01-pipeline]] · [[04-tts-captions]]
