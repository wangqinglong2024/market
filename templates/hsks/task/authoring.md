# 子模板：hsks-task · HSK我能做到（9:16 · 越南受众）

> 属 `hsks` 家族，先读 [[GANGLING]] 与 `temp/README.md`。本文只写「交际任务」这一类落地。
> 一句话：把 HSK 官方「能听懂/能看懂/能说…」交际能力清单，逐条打钩✓ + 进度条，给学习者「我在这一级能做到什么」的成就感。

## 形态
- 9:16 竖屏。**每页 1 条能力**（`perPage=1`），3..6 页。
- 每页：大复选框（读到即画✓）+ task_type chip + 任务句原文 + 越南语翻译；底部进度条 `page/pages ✓`。
- 出处角标 `HSK{级}·交际·{task_type}`；页进度点；循环钩子。

## 数据 / 零编造
- 只读 `/hsk/<level>/03_tasks.csv`（`task_type, task_example`）。task_example=**能力句原文**。
- 越南语来自 `vi-lexicon.json`（键 = task_example 原文，长句必须审校），缺则 build 报错 → 补齐再跑，**绝不臆造**。

## 节奏
- 逐条配音（读任务句，库 `public/library/tts-task/`）+ 等距 slot。任务句长 → `speed` 提到 **1.5** 控 ≤24s；仍超则 build 报错→减 count。每条 **3–4 条**（见 `PLAN.md`）。

## 加一条：`catalog.json`（`template:"hsks/task"`）→ `script.json`（`{level,count,titleVi}`）→ build → 渲染。
