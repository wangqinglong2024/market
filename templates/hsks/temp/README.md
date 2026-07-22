# hsks 后 4 个模板 · 生产规范（交接文档）

> **给未来新对话的 AI**：本目录是「怎么把剩下 4 个 hsks 子模板做出来」的完整规范。
> **你要做的**：严格参考 **已定稿的第一个模板 `hsks-vocab`**（架构、动效、管线全部照抄，只换知识内容与分类动效），并遵守本文所有铁律。做完一个先渲一条样片给用户验收，再做下一个。
> 4 个模板 = **grammar(语法) · topic(话题) · task(交际任务) · hanzi(部件识字)**。

---

## 0. 必读 + 参考实现（照抄这套，别另起炉灶）

先读：`templates/hsks/GANGLING.md`（家族宪法）。然后**逐文件对照 hsks-vocab 抄骨架**：

| 作用 | hsks-vocab 参考文件（照抄结构，换内容） |
|---|---|
| 构建流水线（账本+等距节拍+配音+封面+进度） | `templates/hsks/vocab/build.mjs` ← **最重要，通读它** |
| 渲染层（版式+同步高亮+炫酷动效+安全区） | `src/layouts/hsks-vocab.tsx` |
| 黑线动态简笔画图标库 | `src/layouts/hsks-icons.tsx`（可扩展/新建 `hsks-<sub>-icons.tsx`） |
| 封面组件 | `src/CoverHsksVocab.tsx` + `src/Root.tsx` 注册 `cover-hsks-vocab` |
| 参数控制台 | `templates/hsks/vocab/template.json` |
| 越南语释义库 | `templates/hsks/vocab/vi-lexicon.json` |
| 排期表 | `templates/hsks/vocab/PLAN.md` |
| 进度（自动生成） | `templates/hsks/vocab/progress/`（PROGRESS.md + 每条 `<id>.md`） |
| 版式注册 | `src/layouts/registry.ts` |
| 总账 | `catalog.json`（`template: "hsks/<sub>"`） |

**管线不变**：`node scripts/build.mjs <videoId>` → 通用编排器按 catalog 的 `template` 派发到 `templates/hsks/<sub>/build.mjs` 的 `build({videoId,dir,ROOT,settings,rel,ensure})` → 落 `manifest.json`。渲染 `npx remotion render src/index.ts <videoId> <out.mp4>`；封面 `npx remotion still src/index.ts cover-hsks-<sub> <out.png> --props=<dir>/cover.json`。TTS：`import { synth } from scripts/tts.mjs`；`synth(text, absPath, {voice, speed})` → `{ms, cached, charTimings}`，走 curl+代理 7897。

---

## 1. 不可违背的铁律（全量 · 后 4 个同样遵守）

1. **零编造**：知识只来自 `/hsk/<level>/*.csv`。语法例句用 `cases` 字段**原文**。拼音可用 `pinyin-pro`（已装，属计算非编造）。**越南语释义/讲解绝不臆造**——建每模板自己的 `vi-lexicon.json`（键=原文行/词），缺则 build 报错列出，人工补全再跑。
2. **系统化覆盖，无重复无遗漏**：覆盖账本 `_coverage.json` 按 CSV 固有顺序（vocab/hanzi 用行序；grammar 用 grammar_type 分组序；topic 用 level1>level2>item 树序；task 用 task_type 序）推进 `cursor`；**幂等**（重建同 `videoId` 复用 `{from,to}`，不推进）。
3. **PLAN.md 排期表**：每模板必须有——出多少条、每条精确取哪个范围、命名 `hsks-<sub>-<level>-NN`。见第 4 节各模板数量。
4. **progress/ 进度文件夹（build 自动写）**：`PROGRESS.md`（从账本重生成：各级已覆盖/总数/进度%/下一条起点 + 逐条用了哪些内容原文）+ 每条 `<videoId>.md`（该条全部知识点原文 + CSV 位置/sort + 页码）。**跨会话可精确接续**，这是硬需求。
5. **逐项等距节拍（停顿必须均分）**：每个知识点**单独配音**（存可复用词库 `public/library/tts-<sub>/`），全程每项一个**等长 slot = 最长项音频 + gapMs**；于是**项间停顿 = 组(页)间停顿完全均分**（用户否决"组尾停顿更长"）。每项在其 slot 起点播音+高亮。**不要整页一条 mp3、不要页尾补时。**
6. **总时长必须偶数秒**、**≤24s**：`total = 项数 × slot` 向上取整到最近偶数秒，回算 slot 保持均匀。用 `speed`（1.2 起）和每条项数控制，超 24s 就减项数或提速。**用户不接受单数秒。**
7. **配音必有 TTS 且严格同步**：读到哪项，哪项才高亮。要么不发音，要么严格对齐，绝不平均步进/乱跳。
8. **9:16 · 1080×1920 · 上下左右各留白 12%**（左右 130、上下 230）。所有内容收进安全框。
9. **引导标 = 「看图学中文 / Học tiếng Trung qua hình」🖼️**（数据驱动 `meta.badge`，`emoji` 字段，缺省 🎬）。**不是"看短剧"**。用 `meta.source.region.top`（约 320）把它压进顶部安全带、不贴顶越界。
10. **炫酷是硬指标**：错峰入场 + 同步高亮 + **色墨炸裂 Burst**（激活项，强调色扩散环+墨点四射）+ 扫光 + 迸发星火 + 背景微光。不同知识类型用**不同专属动效**（见第 4 节）。
11. **SVG 图标 = 黑色线条描边 + 配色填充 简笔画**，且**每个图标都要一直自己动**（`useCurrentFrame` 驱动内部动画，与是否被读/高亮无关）。画不出的抽象项 → 统一 fallback（黑框彩色瓷砖+大字）。**尽量每项都配图，无空板。**
12. **背景 = 宣纸底 `#ece1c9` + 径向暗角**（`radial-gradient(130% 85% at 50% 40%, rgba(0,0,0,0) 58%, rgba(120,90,40,0.16) 100%)`），**封面与视频页统一**。
13. **字号平衡**：中文别过大，拼音/越南文/关键信息要够大清晰。
14. **底部循环钩子延迟淡入**（第 0 帧不显示，播放后浮现）：`còn nữa ↑` / 末页 `lưu lại để học! ♥`。
15. **每模板原创封面**（不套旧 cover-hsk）：新建 `src/CoverHsks<Sub>.tsx`，用该模板自己的卡片风；build **自动落 `cover.json`**；`Root.tsx` 注册 `cover-hsks-<sub>`。
16. **出处角标常驻**：`HSK{级}·{类}·{No.范围或子类}`。**目录 `HSK7+` 对用户显示为 `HSK7-9`**（build 里 `LEVEL_LABEL` 映射）。级别主题色：HSK1 橙→HSK2 金→HSK3 绿→HSK4 蓝→HSK5 靛→HSK6 紫→HSK7-9 深橙（见 vocab build 的 `LEVEL_ACCENT`）。
17. **生产顺序**：级别升序，HSK1 全 → HSK2 全 → … → HSK7-9。
18. **踩过的坑**：CSV 解析要支持引号内逗号/换行（grammar 的 cases 是多行引号）；消歧数字要剥（如 `本1`→`本`）；`synth` 返回 `{ms,cached}`；改音色须用户批准。

---

## 2. 复制架构的清单（每个新模板都要建齐）

- `templates/hsks/<sub>/template.json`（`id:"hsks-<sub>"`, `layout:"hsks-<sub>"`, 音色/speed/gapMs/badge/fonts/perPage 等）
- `templates/hsks/<sub>/build.mjs`（照抄 vocab：读 CSV→账本取批→查 vi-lexicon→逐项配音+等距 slot→偶数秒→beats→cover.json→writeProgress）
- `templates/hsks/<sub>/authoring.md` + `PLAN.md` + `vi-lexicon.json`
- `src/layouts/hsks-<sub>.tsx`（导出 `LAYOUT`，`segments:()=>[beats]`，单段时间线，每页一个 `<Sequence>`，逐项 `<Audio>` 在其 slot 起点，同步高亮+Burst+安全区+宣纸底）
- 在 `src/layouts/registry.ts` 注册
- `src/CoverHsks<Sub>.tsx` + `src/Root.tsx` 注册 `cover-hsks-<sub>`
- `catalog.json` 加条目（`template:"hsks/<sub>"`），视频目录 `script.json`（`{level, count, titleVi}`）

---

## 3. 各级每类数量（排 PLAN 用）

| 级别 | 语法 grammar | 话题 topic | 交际任务 task | 汉字 hanzi |
|---|---|---|---|---|
| HSK1 | 70 | 30 | 59 | 246 |
| HSK2 | 78 | 34 | 76 | 225 |
| HSK3 | 96 | 54 | 109 | 434 |
| HSK4 | 95 | 77 | 139 | 591 |
| HSK5 | 70 | 72 | 109 | 581 |
| HSK6 | 50 | 68 | 97 | 563 |
| HSK7-9 | 134 | 92 | 89 | 1648 |
| **合计** | **593** | **427** | **678** | **4288** |

> 每条取几项由「等距节拍 ≤24s」倒推：项越"重"（例句/长句越长）→ 每条项数越少。见各模板建议。

---

## 4. 后 4 个模板逐个规格

### ① hsks-grammar 语法点（金矿，含官方真实例句）
- **数据**：`05_grammar.csv`（`grammar_type, category_type, grammar_detail, content, cases`）。一项 = 一个语法点：`content`=规则说明，`cases`=**真实例句（原文，可能多行）**。
- **展示**：语法结构公式化（如 `S + 了`）+ `content` 越南语讲解 + **官方例句**（拼音用 pinyin-pro 生成）+ 例句越南语翻译。
- **专属动效**：例句**打字机逐字浮现**；**语法关键词（了/把/被/在/过…）脉冲高亮**；结构公式卡片弹入。
- **配音**：读例句（较长）→ slot 大 → **每条约 4–6 个语法点**（控 ≤24s）。出处 `HSK3·语法·{grammar_type}`。
- **越南语**：`vi-lexicon.json` 键 = 语法点（content 或行号），值 = 规则的越南语讲解 + 例句翻译。**必须人工/审校，别臆造。**
- **SVG**：例句场景小图（可选，画不出用 fallback）。
- **系统化**：按 `grammar_type` 分组顺序推进。

### ② hsks-topic 话题图谱
- **数据**：`04_topics.csv`（`level1_topic, level2_topic, topic_item`，三级树）。可用 `06_tree_nodes.csv` 增强结构。
- **展示**：一个话题域 = 中心词（level1/level2）+ 分支（topic_item）。
- **专属动效**：**思维导图放射展开**（中心→分支逐条 radiate/连线生长）。
- **配音**：读中心词+分支词。**每条约 1–2 个 level2 话题**（连其 items）。出处 `HSK4·话题·{level1_topic}`。
- **越南语**：话题名/条目翻译（vi-lexicon）。
- **SVG**：主题场景图标（家庭/学校/购物…）。
- **系统化**：按 level1>level2>item 树序。

### ③ hsks-task 我能做到（交际能力）
- **数据**：`03_tasks.csv`（`task_type, task_example`，"能听懂…能看懂…"长句）。
- **展示**：「在 HSK{级} 你能做到：」清单，每条一个能力。
- **专属动效**：逐条**打钩 ✓ 勾选** + 进度条/完成感。
- **配音**：读任务句（长）→ **每条约 4–6 条任务**。出处 `HSK2·交际·{task_type}`。
- **越南语**：任务句翻译（vi-lexicon，长句必须审校）。
- **SVG**：情景小人（听/说/读/写场景）。
- **系统化**：按 `task_type` 顺序。

### ④ hsks-hanzi 部件识字
- **数据**：`02_hanzi.csv`（`hanzi_type_name` 认读/手写, `character`）。**只有字，无拼音/义** → 拼音用 pinyin-pro 生成；字义越南语走 vi-lexicon（或复用 vocab 的单字义）。
- **★与 hsk-ziyuan 区分**：ziyuan = 单字**字源演变**（象形→字）；本模板 = **按部首/部件归类的批量识字**（不同角度，别做成字源）。
- **展示**：字 + 拼音 + 部首/部件 + 越南语义；按部首分组。
- **专属动效**：**部件积木拼合**（偏旁+部件飞入拼成整字）。
- **配音**：读单字（短）→ slot 小 → **每条可 12–18 字**。出处 `HSK1·汉字·{认读/手写}`。
- **SVG**：部件高亮/拼合示意（可复用 hsks-icons 或新建）。
- **系统化**：按 CSV 行序（认读优先）。需要部首映射（可用简单部首表或库）。

---

## 5. 交付验收清单（做完每个模板逐条自检，别遗漏）

- [ ] 只用 CSV 原文，越南语来自 vi-lexicon（缺词报错）；出处角标正确、HSK7-9 显示正确
- [ ] 账本系统化推进 + 幂等；PLAN.md 数量/范围写清；progress/ 自动生成且精确到原文+位置
- [ ] 逐项等距节拍：项间=组间停顿均分；读到哪高亮到哪；**总时长偶数秒 ≤24s**
- [ ] 9:16 四边 12% 安全区；引导标「看图学中文」🖼️ 在安全带内
- [ ] 炫酷：入场+同步高亮+色墨炸裂+扫光+星火；该类专属动效到位
- [ ] SVG 黑线+配色简笔画，**每个都一直自己动**；抽象项 fallback，无空板
- [ ] 宣纸底+暗角（封面与视频页统一）；字号平衡；底部钩子延迟淡入
- [ ] 原创封面 + 自动 cover.json + Root 注册 `cover-hsks-<sub>`
- [ ] `npm run lint`/tsc 无错；渲染出样片给用户验收，通过再批量
