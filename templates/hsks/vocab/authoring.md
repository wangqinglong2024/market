# 子模板：hsks-vocab · HSK 词汇卡（9:16 · 恒 12 秒 · 越南受众）

> 属 `hsks` 家族，先读 [[GANGLING]]（总纲领）。本文只写「词汇」这一类的落地。
> 一句话：把 HSK 官方词汇，按官方顺序**系统化、无重复无遗漏**地切成一批批 12 秒高密度速览卡，每词配彩色 SVG 卡通图。

## 形态

- 9:16 竖屏 1080×1920，**恒 12 秒**。每页 2×3 = 6 词。
- 每卡：卡通图标（`src/layouts/hsks-icons.tsx`）· 拼音 · 汉字 · 越南语 · 词性色标（名蓝/动橙/形绿/数紫/量青/代粉…）。
- **★图标必须是「意义/用法」的抽象表达，绝不把汉字本身当图**（卡上已有汉字文字层，图标区不许再摆同一个字；虚词也按词类抽象——见 [[GANGLING]] §七 图标铁律）。fallback 只出纯图形，不出汉字。
- 常驻出处角标 `HSK{级}·词汇·No.{sort范围}`；页进度点（暗示"还有更多页"）；朗读步进高亮；底部 `còn nữa ↑ / lưu lại ♥` 循环钩子。

## 系统化取词（★不手挑）

- 覆盖账本 `_coverage.json`：按 `/hsk/<level>/01_vocabulary.csv` 的 `sort_order` 顺序推进游标。
- 一条视频只声明取「下一批 count 个」；build 自动取该级别未覆盖的下 count 行、标记消费、推进游标、记录 `{videoId, from, to}`。
- **幂等**：重建同一 videoId 复用其区间，不再推进（放心重渲）。
- 越南语来自 `vi-lexicon.json`；缺词 build 报错列出 → 补齐再跑（绝不臆造）。

## 节奏（★逐词等距节拍 · 偶数秒）

- `perPage=6`；`pages = clamp(ceil(count/6), 3, 6)`（仅决定版面密度）。
- **逐词单独配音**（复用词库 `public/library/tts-vocab/`）+ **等距节拍**：每词一个等长 `slot = 最长词音频 + gapMs`；**词间停顿 = 组(页)间停顿，完全均分**。
- 每词在其 slot 起点**播音并高亮**（读到哪词哪卡亮）；`readAtMs` = 页内局部序×slot。
- **总时长 = 词数×slot 向上取整到偶数秒**（≤24s），回算 slot 保持均匀。默认 `count=18`、`speed=1.2` → **约 22s**。
- 出多少条、每条取词范围 → 见 **`PLAN.md`**（每条 18 词，按 `sort_order` 顺序，账本推进）。

## 加一条新视频

1. `catalog.json` 加条目：`template: "hsks/vocab"`, `shard: 年/月/日`。
2. 视频目录 `public/videos/<shard>/<id>/script.json`：
   ```json
   { "level": "HSK1", "count": 18, "titleVi": "Từ vựng HSK1 · No.19–36" }
   ```
   只声明级别与批量；**取哪些词由账本自动定**。
3. `node scripts/build.mjs <id>`（取词 + 查越南语 + 每页配音 + 出 manifest）。
4. `npx remotion render src/index.ts <compositionId> <out.mp4> --props=...`（见项目渲染约定）。

改音色/密度/配色/字体 → 只改 `template.json`，不动 `build.mjs`。
