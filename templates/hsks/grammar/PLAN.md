# hsks-grammar · 出片排期表（系统化覆盖 · 无重复无遗漏）

> 属 `hsks` 家族，守 [[GANGLING]]。取点完全确定：按 `/hsk/<level>/05_grammar.csv` 行序，覆盖账本 `_coverage.json` 记录进度。

## 参数（定稿）
- **每条 4 个语法点** = 4 页（每页 1 点）。例句较长→点少控 ≤24s。
- **命名**：`hsks-grammar-<level>-NN`（例 `hsks-grammar-hsk1-01`）。
- **取点范围**：第 N 条覆盖行序 `[(N-1)×4 + 1, N×4]`；出处角标 `HSK{级}·语法·{grammar_type}`。

## 各级出片量（每条 4 点，按官方语法点数）
| 级别 | 语法点 | 视频数(≈) |
|---|---|---|
| HSK1 | 70 | 18 |
| HSK2 | 78 | 20 |
| HSK3 | 96 | 24 |
| HSK4 | 95 | 24 |
| HSK5 | 70 | 18 |
| HSK6 | 50 | 13 |
| HSK7-9 | 134 | 34 |

> 数量以 build 实际解析的 CSV 行数为准（`_coverage.json` 的 cursor/total 即真源）。

## 生产顺序
级别升序，HSK1（01→…）全部做完再 HSK2……。**幂等**：重建同一 id 复用其区间，不推进游标。
