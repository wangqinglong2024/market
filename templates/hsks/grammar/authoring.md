# 子模板：hsks-grammar · HSK语法点（9:16 · 越南受众）

> 属 `hsks` 家族，先读 [[GANGLING]]（总纲领）与 `temp/README.md`（后 4 模板交接规范）。本文只写「语法」这一类落地。
> 一句话：把 HSK 官方语法点（规则说明 + **真实例句原文**）系统化切成一批批高密度速览卡，例句打字机浮现、语法关键词脉冲高亮。

## 形态
- 9:16 竖屏 1080×1920。**每页 1 个语法点**（`perPage=1`），3..6 页。
- 每页：规则公式卡（语法点名 chip + 规则 zh + 越南语讲解）+ 例句卡（拼音 + 官方例句打字机 + 关键词脉冲 + 越南语翻译）。
- 常驻出处角标 `HSK{级}·语法·{grammar_type}`；页进度点；底部循环钩子。

## 数据 / 零编造
- 只读 `/hsk/<level>/05_grammar.csv`。语法点=一行：`grammar_detail`→标题、`content`→规则、`cases` 首行→**官方例句原文**。拼音用 `pinyin-pro` 计算。
- 越南语来自 `vi-lexicon.json`（键 = 规则 content 原文、例句原文），缺则 build 报错列出 → 人工补齐再跑，**绝不臆造**。
- 关键词脉冲：从规则 content 里按优先级取一个语法词（了/在/把/被/呢…），在例句中高亮。

## 节奏（逐点等距节拍 · 偶数秒）
- 逐点单独配音（读例句，词库 `public/library/tts-grammar/`）+ 等距 slot；点间=页间停顿均分。
- 总时长向上取整偶数秒、≤24s（`speed` 1.2 起）。例句长→每条 **4–6 点**。见 `PLAN.md`。

## 加一条：`catalog.json`（`template:"hsks/grammar"`）→ 视频目录 `script.json`（`{level,count,titleVi}`）→ `node scripts/build.mjs <id>` → 渲染。改音色/密度只改 `template.json`。
