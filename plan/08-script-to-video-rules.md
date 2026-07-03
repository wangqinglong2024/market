# 08 · 脚本 → 成片 的固定规则（核心契约）

目标：**你只交一段文案脚本，我返回最终成片**。中间每一步都由下面的**固定规则**驱动，
不需要你逐图沟通。本文件就是这套规则的唯一事实来源。

---

## 0. 输入 / 输出契约（2026-07-03 改：每日金句方向）
- **输入**：**一句**古文/经典/哲理句（中文），如「温故而知新，可以为师矣。」。可选：`videoId`、`lang`（默认 `vi`）、指定哥哥还是妹妹朗读。原样存进 `input.md`（见 [[12-video-folder-spec]]）。
- **不再是**：一整段现成旁白。旁白由我（Claude）按 [[00-overview]] 的固定内容结构**扩写**出来（孩子朗读金句 → 父母点破 → 场景演示 → 全家领悟 → CTA），写进 `script.json`。
- **输出**：`public/videos/<shard>/<id>/` 下 `成片.mp4` + 全部中间产物（`input.md`/`script.json`/audio/images/manifest，可追溯、可重渲染）。
- **不变量**：配音永远中文，**全片统一旁白「开朗姐姐」**（不做多角色分工，见 [[04-tts-captions]]）；字幕三行（拼音/中文/越南语意译）；竖屏 9:16；画风统一；人物按需出场；特效 ≤2/片、按需；**纯文化普及、禁止任何营销/广告（下载 CTA、软件推广、"一起学中文"等一律不要）**。

---

## 1. 核心数据单位：beat（一拍）
**一个 beat = 文案里的一句旁白**，它是同步的最小绑定单位。一个 beat 同时拥有：
- 原文中文一句
- 该句的配音音频（决定该 beat 时长）
- 该句三语字幕（拼音/中文/当地语）
- 由**该句内容**生成的 1~N 张图（shots）

> 因为一句话的「文字 / 配音 / 字幕 / 画面」都从同一个 beat 派生、共享同一时间窗，
> 所以**画面、原文、配音、字幕天生同步**——这就是"内容与脚本原文对应"的实现原理。

---

## 2. 流水线七步（每步规则写死）

### 第 1 步 · 切句（normalize → beats）
- 按句末标点 `。！？；…\n` 切分；过短的并入相邻句，过长的在逗号处再切，使每 beat ≈ 6~22 字（约 2~5 秒配音）。
- 产出有序 `beats[]`，每个分配稳定 id：`p01, p02, …`。
- **★ 金句原文长 / 多句 → 朗读拆多拍**（用户 2026-07-03）：若用户给的原句较长，或本身是**两句/并列结构（含分号「；」）**，把开场朗读拆成 **2 个及以上** read-quote 片段（一句/一分句一拍），后续讲解与场景**两部分都要覆盖**。例：「假舆马者…而致千里；假舟楫者…而绝江河。」→ p1 读前半、p2 读后半，再分别配「车马致千里」「舟楫绝江河」的画面。
  - **★ 两拍朗读画面一男一女（随机）**：拆成 2 拍时，这两拍**画面上的孩子一个 girl、一个 boy**，随机分配谁配哪句。**注意仅画面人物变化，配音永远统一旁白（开朗姐姐），不是孩子配音。**

### 第 2 步 · 分镜（LLM，固定 system prompt）
对每个 beat 由 LLM 判定并产出字段（写入 `script.json`）：
- `sceneId`：所属场景（同地点/时间的连续 beat 复用同一背景）。
- `hasMainCharacter`：是否出现固定主角色（哥哥/妹妹/爸/妈/狗中任一）。
- `characters`：在场主角色 id 列表（用于取参考图）。
- `emotion` / `action`：表情、动作提示。
- `shots`：图数量与每图内容。**判定规则**——
  - 句子描述「过程 / 移动 / 变化 / 先后」（含"从…到…/然后/越来越/一边…一边/最后"等）→ **多图**，按过程切（如山底→山中→山顶）。
  - 否则 → **1 图**。
  - 每个 shot 给一句英文 `content`：**只描述该句文字所指的画面**，不得脑补无关内容（画面必须忠于原文）。这是**真正传给出图模型**的 prompt 主体。
  - 每个 shot 另给一句中文 `contentZh`：与 `content` 对应的中文说明，**仅供用户看懂，不传参给模型**（`build.mjs` 只读 `content`）。
  - 每个 shot 给 `weight`：占该 beat 时长比例（默认均分）。
- **铁律**：LLM 只做"把文字翻译成画面描述 + 结构化"，**不改写、不增删剧情**。

### 第 3 步 · 组装提示词（确定性模板，非自由发挥）
每张图的最终 prompt = 固定模板拼接，保证每次规则一致：
```
<SHOT.content>                          ← 来自分镜，本图要画什么
+ <CHARACTER_CANON>                     ← 在场主角色的 canonical 描述（library/characters.json）
+ <STYLE_SUFFIX>                        ← 固定画风后缀（library/style/style.md）
+ <COMPOSITION_RULES>                   ← 固定：竖屏9:16、主体居中偏上、下方留白给字幕、避开平台安全区
+ <NEGATIVE>                            ← 固定：no text/logo/watermark/extra fingers…
```
固定部分（CANON / STYLE_SUFFIX / COMPOSITION / NEGATIVE）都来自 library，**单一来源、每次相同** → 可复现。

### 第 4 步 · 出图（按 beat 分支 + 缓存）
- `hasMainCharacter = true` → **nano-banana/edit**：`image_urls` = 在场主角色的圣经参考图 + 组装 prompt（"保持与参考完全一致"）。
- `hasMainCharacter = false` → **nano-banana / flux 文生图**：仅锁画风。
- `seed` = 由 shot id 派生（确定性，可精确重抽）。
- **缓存键** = hash(解析后 prompt + 参考图 + seed + model)；命中即复用，改一句不重烧整片。
- 翻车图（脸崩/多指/画风偏）→ review gate 一键换 seed 重抽（见 [[01-pipeline]]）。

### 第 5 步 · 配音 + 时间轴
- 每个 beat 的中文 → 火山 TTS，**统一旁白开朗姐姐**（`voice=narrator`，见 [[04-tts-captions]]）→ `mp3` + `durationMs`。
- `beat.durationMs` = 该 beat 在片中的时长；多 shot 按 `weight` 切分这段时长。
- beats 首尾相接：`start(p_n) = Σ durationMs(前面所有 beat)`。

### 第 6 步 · 同步绑定（画面 ↔ 原文 ↔ 配音 ↔ 字幕）
- 每个 beat 占时间窗 `[start, start + durationMs]`：
  - 播该 beat 配音；
  - 显该 beat 三语字幕；
  - 显该 beat 的 shots（多图按 weight 在窗内交叉切换，表现过程）。
- 若火山返回**字级时间戳** → 中文字幕在窗内**逐字高亮**（卡拉OK跟读）；否则整句淡入淡出。
- Remotion 中每个 beat = 一个 `<Sequence from={start} durationInFrames={ms→frames}>`，由 manifest 驱动。

### 第 7 步 · 渲染
- `remotion render`，传入 `videoId` → 读 `manifest.json` → 出 `成片.mp4`。

---

## 3. 一条命令的全自动闭环（最终形态）
```
inputs/<videoId>.txt
  → storyboard → localize(翻译+拼音) → tts → fal出图 → build-manifest → remotion render
  → public/videos/<videoId>/成片.mp4
```
你的动作：把文案放进 `inputs/`，触发一次。可选：在 review gate 扫一眼图、对个别图重抽。

## 关联
[[00-overview]] · [[01-pipeline]] · [[02-character-consistency]] · [[03-remotion-animation]] · [[04-tts-captions]]
