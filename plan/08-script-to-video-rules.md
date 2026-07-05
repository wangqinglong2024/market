# 08 · 脚本 → 成片 的固定规则（核心契约）

目标：**你只交一段文案脚本，我返回最终成片**。中间每一步都由下面的**固定规则**驱动，
不需要你逐图沟通。本文件就是这套规则的唯一事实来源。

---

## 0. 输入 / 输出契约（2026-07-03 改：每日金句方向）
- **输入**：**一句**古文/经典/哲理句（中文），如「温故而知新，可以为师矣。」。可选：`videoId`、`lang`（默认 `vi`）、指定哥哥还是妹妹朗读。原样存进 `input.md`（见 [[12-video-folder-spec]]）。
- **不再是**：一整段现成旁白。旁白由我（Claude）按 [[00-overview]] 的固定内容结构**扩写**出来（孩子朗读金句 → 点破意思 → 场景演示 → 文化收尾，**统一旁白、无父母分角、无 CTA**），写进 `script.json`。
- **输出**：`public/videos/<shard>/<id>/` 下 `成片.mp4` + 全部中间产物（`input.md`/`script.json`/audio/images/manifest，可追溯、可重渲染）。`*.mp4` 一律写入 `.gitignore`，只本地生成/预览，禁止提交上传到 Git。
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
- **★★ 开场引子 + 转换句（2026-07-05 用户锁定，固定文案）**：
  - **第一拍朗读**旁白/字幕以固定引子 **「古语有云，」**（越南语 `Người xưa có câu:`）开头，单独作 `captions.lines` 首行，配音也念（仅第一拍加）。
  - **点破意思（explain）拍**以固定转换句 **「这句话想告诉我们，」**（越南语 `Câu này muốn nói với chúng ta rằng:`）开头，单独作 `captions.lines` 首行，衔接古文→大白话。
  - 两句为**死命令固定文案**，别改写。规则源头见 `config/prompts/storyboard.md` 铁律 15。

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
每张图的最终 prompt = 固定模板拼接（`config/prompts/`），保证每次规则一致：
```
<SHOT.content>                          ← 来自分镜，本图要画什么（英文）
+ <CHARACTER_CANON>                     ← 在场主角色 canonical（config/characters/<id>/canonical.md）
+ <STYLE>                               ← 固定画风（config/prompts/style.md）
+ <COMPOSITION>                         ← 1:1 方图 + 纯白底（config/prompts/composition.md）
```
- 模板分三套：单人 `image-flux.tpl.md`、多人 `image.tpl.md`、空镜 `image-scene.tpl.md`。
- 🚫 **死命令**：**绝不**在 prompt 写 box/frame/subtitle/"下方留白给字幕"/"empty area at bottom"（含 `no box`），也**不放身体部位负面词**（`no extra fingers` 等会触发 fal nsfw 黑图）——单人 flux 模板本就**无 negative**。见 [[10-art-style-locked]] 4.4。
- 版式（留白/字幕带/上下留白）全由渲染层按 1:1 合成控制，出图**只画方图本身、纯白底**。
固定部分都来自 `config/prompts/`，**单一来源、每次相同** → 可复现。

### 第 4 步 · 出图（按角色数路由 + 缓存，见 [[05-cost-and-models]]、[[10-art-style-locked]]）
- **0 人（空镜/物）→ `flux`**（`fal-ai/flux-pro/kontext`）：喂**风格锚图**只借画风、绝不加人（`image-scene.tpl.md`）。**不是纯文生图**（无锚会漂移/乱加人）。
- **1 人（单角色）→ `flux`**（`fal-ai/flux-pro/kontext`）：喂该角色 1 张定妆图（`image-flux.tpl.md`）。
- **≥2 人（多角色同框）→ `nano-pro`**（`fal-ai/nano-banana-pro/edit`）：喂多张定妆图。
- 🚫 **严禁 `nano-banana` 文生图、`flux/dev`**；`shot.model` 只有 `flux`/`nano-pro`，`gen-image.mjs` 强制校验与 `characters` 数一致，不符报错。
- 🚫 **★★ 一条视频最多 1 个多角色拍 = 最多 1 次 `nano-pro`(banana $0.15)**（省钱铁律，用户 2026-07-05）：其余全 flux($0.04)；`build.mjs` 出图前统计 nano-pro 拍数，>1 直接报错。见 [[05-cost-and-models]]。
- **出图一律纯白底**（`#ffffff`，见 [[10-art-style-locked]] 4.8）；出图后 `build.mjs` 用 sharp 量人物身高、写 `imgScale` 做尺寸归一化（见 4.6）。
- `seed` = 由 shot id 派生（确定性，可精确重抽）。
- **缓存键** = hash(解析后 prompt + 参考图 + seed + model)；命中即复用，改一句不重烧整片。
- 翻车图（脸崩/多指/画风偏）→ review gate 一键换 seed 重抽（见 [[01-pipeline]]）。

### 第 5 步 · 配音 + 时间轴
- 每个 beat 的中文 → 火山 TTS，**统一旁白开朗姐姐**（`voice=narrator`，见 [[04-tts-captions]]）→ `mp3` + `durationMs`。朗读古文拍 `role=read-quote` 语速 1.0；后续讲解/场景/收尾语速 1.2。
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

## 3. 一条命令的全自动闭环（现状）
```
public/videos/<shard>/<id>/input.md   （原始需求：一句古文）
  → (会话内 Claude) 扩写 script.json（分镜/字幕/model）
  → node scripts/build.mjs <id>        （翻译拼音已在 script、TTS配音、fal出图、尺寸归一化、汇总 manifest.json）
  → npx remotion render <id> …         （出片）
  → public/videos/<shard>/<id>/成片.mp4
```
你的动作：给一句古文（存 `input.md`），触发一次。可选：过图、对个别图重抽。

## 关联
[[00-overview]] · [[01-pipeline]] · [[02-character-consistency]] · [[03-remotion-animation]] · [[04-tts-captions]]
