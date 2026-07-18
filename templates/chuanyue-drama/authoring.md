# `chuanyue-drama`（《凰谋》）· 作者指南与生产流程

现代顶级女法医穿越成罪臣之女、被送进摄政王府"冲喜"的古装权谋爱情复仇连续剧。
面向越南受众，竖屏 60s/集，**图文 + 动态视频（kling I2V）随机穿插**，前 3 秒必是动态钩子。
旁白越南语、角色对白中文、字幕三行拼音/中文/越南语逐字卡拉OK。

## 唯一事实源（续写/生产只读这些）
1. `story/总纲.md`（整体总述：世界观·主角·人设铁律·结构标准·1200集12卷脉络）
2. `story/卷NN-*/卷总述.md`（该卷 100 集总述）
3. `story/卷NN-*/第MM章-*.md`（每章 10 集内容；卷1第1章 = E001–E010 已写满剧本）
4. `characters/`（角色 canonical + 定妆图：端庄版/露腿版/现代版，全 nano-banana-pro，同脸锁定）
5. `prompts/`（出图/出视频规范：全部 nano-banana-pro，已弃 flux）

旧模板（chinese-drama / 毒嫁 / 灵兰）的角色、故事、图、prompt **一律不得反向污染**。

## 生产链路（一集怎么长成成片）
```
episodes/E***.md  →  script.json(Claude 设计,字段见 prompts/script-rules.md)
  → build(ctx):  每拍 TTS(火山,旁白vi/角色zh) + 每场景关键帧(flux,喂定妆图)
                 + 动态拍(type:video)用关键帧走 kling I2V(★关原声) → manifest.json
  → Remotion 渲染(layout=chinese-drama,上媒体区图/视频 + 下三行字幕) → <中文名>.mp4
  + 海报封面(见下) → <中文名>-封面.png
```
命令：`node scripts/build.mjs <videoId>`（先在 catalog.json 建记录，template=chuanyue-drama）。

## 出图 / 出视频规范（★必读）
- 全部见 `prompts/render-rules.md`（铁律）、`prompts/video.tpl.md`（★I2V 运动提示词）、
  `prompts/image-*.tpl.md`、`prompts/portrait.tpl.md`、`prompts/script-rules.md`。
- 记住三条：① 外观锁在关键帧、视频 prompt 只写运动；② `generate_audio=false` 关原声；
  ③ 一图一正脸、全片≤1 次多人 nano-pro。

## 成本铁律（≤ $2/集）
- 预算表：动态秒数×$0.084 + 独立关键帧×$0.04 + 新角色定妆×$0.06 + 海报封面×~$0.06。
- build 内置预算硬卡：累计花费超 `budget.maxUsdPerEpisode`（$2）立即抛错停止。
- **fal 出问题（黑图/漂移/换脸/画错）禁止自动重试**，先报用户、同意后再调（`/base/04`）。

## 双人工闸门（花钱前）
1. 设计阶段（免费）：写故事、script.json、prompt、成本预检——本轮止于此，等用户审。
2. 定妆阶段：出角色定妆图（flux），**逐张人工验脸**锁定后才继续。
3. 生产阶段：用户明确批准后才出关键帧 + kling 动态 + 渲染成片。
4. 每个付费资产**最多尝试一次**，失败重新向用户说明、经同意再调。

## 封面规则（★按 0.4.4「海报式」，用户 2026-07-18 锁）
- **不是抽视频帧**，而是 fal **单出一张 3:4 竖版海报**（`images/poster.png`，紧扣本集主题、
  不与正片画面重复；女主+关键道具/场景，露腿服从场景合理化）。约 +$0.06，计入预算。
- 写 `cover.json`（字段照 0.4.4）：
  ```jsonc
  {
    "image": "videos/<shard>/<id>/images/poster.png",
    "focusY": 0.22,
    "tag": "凰谋",  "tagVi": "<系列名越南语>",  "seal": "E01",
    "volume": { "zh": "卷一 · 冲喜入府", "vi": "..." },
    "chapter": { "py": "...", "zh": "章主题(主标题)", "vi": "..." },
    "episode": { "py": "...", "zh": "当集钩子(红条大字)", "vi": "..." }
  }
  ```
- 渲染：`node_modules/.bin/remotion still src/index.ts cover "<dir>/<中文名>-封面.png" --props=<dir>/cover.json`
  （`src/Cover.tsx` 是全局通用组件，跨模板复用；层级=系列名竖排+印章E号 / 卷标题 / 章主题 / 当集钩子红条）。
- 产物：`cover.json` + `images/poster.png` + `<中文名>-封面.png`，放该视频目录。

## 交付命名（全局规则 /base/02 五）
- 文件夹用英文 id；成片 `<中文名>.mp4`、封面 `<中文名>-封面.png`（如「凰谋E01·花轿睁眼」）。
- mp4 一律 gitignore，只本地生成/预览/交付。

## 出片前逐句体检（免费必做）
- 逐句听多音字读音，读错补 `ttsZh` 引导字段重合成该拍（只烧这一句）。
- 过一遍 `/base/01` 自检清单：3 秒钩子、悬念后置、每 3 秒变化、回环、本地化三关。
