# 05 · 成本与模型选型

预算：**≤ $1 / 分钟视频**。语音成本忽略不计。价格以 fal 官网实时为准，跑通前用真实调用校准一次。

## ★★★ 铁律：fal.ai 出问题不许擅自重调，必须用户同意（2026-07-05 用户锁定，最高优先级）
- **每一次 fal.ai 调用都花钱**。若某次 fal 调用（出图/编辑等）结果有问题（黑图/画错/画风偏/不满意），**禁止 Claude 自己重新调用**去"再试一次"。
- **必须先把问题告诉用户、等用户明确同意，才能再调 fal**。用户没点头，就停在那，不许自作主张烧钱重试。
- 适用于所有 fal 端点（flux / nano-banana-pro / 任何模型）。改 prompt/参考图后想重试，也要先经用户同意。
- 免费/本地的步骤（TTS 火山、本地合成 BGM `gen-bgm.py`、Remotion 渲染、改 config/脚本）不受此限，可自由重跑。
- 音乐**一律本地合成、禁止用任何 API/fal 生成**（见 [[04-tts-captions]]）。

## ★★ 省钱铁律：一条视频只准 1 次 banana（2026-07-05 用户锁定）
- **每条视频最多允许出现一次多角色同框，即最多调用一次 `nano-banana-pro`($0.15)**。其余所有拍一律用 **flux($0.04)**（单人/空镜）。
- 落地：`build.mjs` 出图前统计 `script.json` 里 `model==="nano-pro"` 的拍数，**>1 直接报错、不烧钱**。分镜阶段（[[08-script-to-video-rules]]、storyboard.md 铁律 8b）就要把多角色控制到**至多一拍**（通常留给收尾"两人同框"）。
- 想多处出现多人？改成单人特写/空镜（flux）表达，别再开第二个 nano-pro。

## fal.ai 出图模型（约 1MP 单价，参考值）
| 模型 | 约 $/张 | 用途 |
|---|---|---|
| flux/schnell | ~0.003 | 草稿/试构图，一致性弱（未用） |
| flux/dev | ~0.025 | 通用文生图（🚫 已禁用：无锚漂移/乱加人） |
| nano-banana(gemini-2.5-flash-image) | ~0.039 | 🚫 文生图已禁用（漂移/加人） |
| **flux-pro/kontext** | ~0.04 | **★ 主力：0/1 人（空镜喂锚图、单人喂定妆）** |
| **nano-banana-pro/edit** | ~0.15 | **★ 仅 ≥2 人同框** |
| recraft v3 | ~0.04 | 偏扁平矢量（非首选画风，未用） |

## 为什么不全程图生视频
kling/seedance 约 $0.05–0.10/秒 → 60 秒 = **$3–6**，超预算 3–6 倍。
→ 图生视频只留给个别高光镜头（如片头 5 秒）。

## 1 分钟视频成本账
- 旁白 ≈ 10–14 句 → 按场景聚合 ≈ 10–14 张图
- 角色圣经：**一次性** ~$0.4，摊到每条 ≈ 0
- 每条出图：约 12 × $0.039 ≈ **$0.47**
- 加重抽/补背景余量 → 约 **$0.6–0.7**
- **结论：$1 内宽裕，剩约 $0.3** 可给 1–2 个重点镜头做视差分层，或试一个片头图生视频。

## ★★ 模型在 script.json 里显式声明 + 强制校验(2026-07-03 用户锁定)
每个 `shot` 必带 `model` 字段，**只有两个值**，`gen-image.mjs` 强制执行：

| 画面人物数 | `model` | fal 端点 | 参考图 | ~$/张 |
|---|---|---|---|---|
| **0 人(空镜/物)** | `flux` | `fal-ai/flux-pro/kontext` | 喂**风格锚图**(`settings.image.styleAnchor`)，只借画风、不要人 | 0.04 |
| **1 人(单角色)** | `flux` | `fal-ai/flux-pro/kontext` | 喂该角色**定妆图** | 0.04 |
| **≥2 人(多角色)** | `nano-pro` | `fal-ai/nano-banana-pro/edit` | 喂多张定妆图 | 0.15 |

- 🚫 **严禁 `nano-banana` 文生图，也不用 `flux/dev`**（2026-07-03 实测：无锚文生图画风会漂移、还乱加人）。**空镜也走 flux-pro/kontext**，喂一张风格锚图（`config/prompts/image-scene.tpl.md` 模板：只保留画风、绝对无人）。
- **护栏**：只允许 `flux`/`nano-pro`；`flux` **必须恰好 1 张参考图**（角色定妆 或 风格锚）；`nano-pro` **仅限 ≥2 人**。声明不符 → `gen-image.mjs` **报错停下**。**不许全用贵模型。**
- 便宜优先：一条片大多数拍是空镜/单人 → 全走 flux($0.04)；只有"多角色同框"那一两拍才 nano-pro($0.15)。

## ★ 出图模型选型规则(已锁定,2026-07-02)

**角色数先按文案定**:严格依据 `script.json` 分镜文案里出现的人物来定"画面几个人",**不得臆造增删**。再按角色数路由:

| 场景 | 模型 | fal id | $/张 | 参考图 |
|---|---|---|---|---|
| **单角色**镜头 | FLUX.1 Kontext [pro] | `fal-ai/flux-pro/kontext` | **~0.04** | 喂**该角色 1 张定妆**(`image_url`,单张),保长相+画风 |
| **多角色(≥2)**镜头 | Nano Banana Pro edit | `fal-ai/nano-banana-pro/edit` | **~0.15** | 喂**多张定妆**(`image_urls[]`),保多角色一致 |

- 🚫 **硬规矩(用户 2026-07-02 锁定)**:**单角色画面禁止用 nano-banana(pro),一律 flux `fal-ai/flux-pro/kontext`。**
- ⚠️ **黑图陷阱(2026-07-02 踩坑,已解决)**:`flux-pro/kontext` safety filter 极激进,完整 prompt（含 negative 词如 "no extra fingers/deformed hands"）极易触发 `has_nsfw_concepts:true`。fal **不报错、HTTP 200**,但把图换成全黑 PNG(约 10372 字节)。`enable_safety_checker:false` 和 `safety_tolerance:"6"` 对服务端过滤**均无效**。**正确解法(已落地,不要再花钱重测)**：单角色 flux 调用改用 `config/prompts/image-flux.tpl.md` 精简模板（无 negative,无详细 composition），`build.mjs` 中 `refPaths.length===1` 时调 `buildFluxPrompt()`。nano-banana-pro/edit 无此问题,继续用完整模板。
- **为什么**:实测单角色下 flux kontext 更还原定妆图、背景更干净、便宜近 4 倍;多角色一致性才需 nano-banana-pro(单参考的 Kontext 顾不了多人)。
- **画风来源**:所有出图都以 `plan/10` 锁定的治愈手绘风 + `temp/style-tests/chars/*` 定妆图为锚。
- **链路**:一律 **curl 走代理 7897**(Node fetch 直连会超时),Key 取 `api-key.txt` 第 2 行。
- 上量后可用定妆一致图在 fal 云训角色 LoRA,单张压到 ~$0.025(见 [[10-art-style-locked]])。

## 省钱手段
- 按 hash 缓存（[[01-pipeline]]），改一句不重烧整片。
- 场景聚合：同场景共用背景图。
- 角色/背景/风格锚点全局复用，新视频边际成本极低。

## 关联
[[00-overview]] · [[01-pipeline]] · [[02-character-consistency]]
