# 子模板：hsks-hanzi · HSK部件识字（9:16 · 越南受众）

> 属 `hsks` 家族，先读 [[GANGLING]] 与 `temp/README.md`。本文只写「部件识字」这一类落地。
> **★与 `hsk-ziyuan` 区分**：ziyuan = 单字**字源演变**（象形→字）；本模板 = 按**部件/部首归类**的批量识字（不同角度，别做成字源）。

## 形态
- 9:16 竖屏。**每页 6 字**（`perPage=6`，2×3 网格），3..6 页。
- 每卡：大汉字（**部件积木拼合**动效：左右两半滑入合体）+ 拼音 + 部件 chip（部件 + 越南语标注）+ 越南语字义；朗读步进高亮。
- 出处角标 `HSK{级}·汉字·{认读/手写}`；页进度点；循环钩子。

## 数据 / 零编造
- 只读 `/hsk/<level>/02_hanzi.csv`（`hanzi_type_name` 认读/手写, `character`）。**只有字** → 拼音用 `pinyin-pro` 计算。
- 字义越南语来自 `vi-lexicon.json`（可与 vocab 单字义复用）；部件来自 `components.json`（视觉可验证的基础部件/笔画，**非权威康熙部首**，需人工审校）。二者缺则 build 报错 → 补齐再跑。

## 节奏
- 逐字配音（读单字，**复用 vocab 词库** `public/library/tts-vocab/`）+ 等距 slot。单字短→slot 小，每条 **12–18 字**（见 `PLAN.md`）。总时长偶数秒 ≤24s。

## 加一条：`catalog.json`（`template:"hsks/hanzi"`）→ `script.json`（`{level,count,titleVi}`）→ build → 渲染。
