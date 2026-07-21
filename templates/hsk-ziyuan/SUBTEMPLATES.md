# hsk-ziyuan 子模板清单

> 生产视频时**用户指定子模板名**，按对应示例写该视频的 `script.json`。
> 所有子模板共用同一套构建管线（`build.mjs`）与渲染层（`src/layouts/hsk-ziyuan.tsx`），差异只在 script.json 的配置组合。
> 全片仅单字中文朗读（爽快思思），**无任何越南语配音**（2026-07-20 用户定稿）。

| 子模板名 | 中文名 | 模式 | 节奏 | 顶部引导条 | 典型时长 |
|---|---|---|---|---|---|
| `plain` | 纯字版 | parallel | 4字同时演变，4.8s/组 | 无 | 2组=9.6s |
| `memtest` | 记忆测试版 | sequential | 逐个1.2s/字（charSlot=36） | 有：挑战文案→末组催评论 | 3组=14.4s |
| `inkburst` | 炸裂墨韵版 | inkburst | 4字同时慢起急收，burst帧四格同步炸裂，5s/组 | 无 | 2组=10s |

---

## plain · 纯字版

只有字，没有任何引导/提示文字。4 字同时「简笔画→线条字→毛笔字」演变，朗读独立逐字。

```json
{
  "groups": [
    [ { "c": "山", "vi": "núi" }, { "c": "木", "vi": "cây" }, { "c": "日", "vi": "mặt trời" }, { "c": "月", "vi": "trăng" } ],
    [ { "c": "水", "vi": "nước" }, { "c": "火", "vi": "lửa" }, { "c": "雨", "vi": "mưa" }, { "c": "目", "vi": "mắt" } ]
  ]
}
```

示例视频：`hsk-ziran-01`。

**封面**（cover.json，规则见文末「封面规则」）：钩子 = 字源揭示（如 `Chữ Hán bắt nguồn từ hình vẽ`），`ep` = `Tập N`（第 N 集）。

## memtest · 记忆测试版

逐个模式（1.2s/字）+ **顶部引导文字条**（纯视觉不朗读，不增加总时长）。每组开头 **4 个象形简笔画全部画出、静止陈列**，轮到哪个字它才开始演变+朗读（2026-07-20 用户定）：

- 画面顶部让出一条高度，2×2 格子按 `template.json → banner.grid/sizes` 缩小下移；
- `banner.lead`：最后一组之前的各组顶部常驻挑战文案（如「记住 10/12 个字 = 记忆力超过 90% 的人」的越南语）；
- `banner.tail`：最后一组出现时文案切换为催评论 CTA；
- 每行文案：第 1 行墨色大字，第 2 行深红小字。

```json
{
  "mode": "sequential",
  "charSlot": 36,
  "banner": {
    "lead": ["Nhớ được 10/12 chữ 🧠", "= Trí nhớ vượt 90% mọi người!"],
    "tail": ["Bạn nhớ được mấy chữ?", "👇 Bình luận nhé!"]
  },
  "groups": [ "…3组×4字…" ]
}
```

示例视频：`hsk-mem-01`（12字 = 14.4s）。

## inkburst · 炸裂墨韵版

在 `plain`「4字同时演变」基础上升级：morph 用 easeIn **慢起急收**制造蓄势，第 `burst` 帧（=morph 终点）**四格同步炸裂**。继承 app 水墨语义（`template/game/01-ink-wash`），但用 Remotion/SVG 把「象征」升成「真墨」——渲染层 `CellInkburst`（`src/layouts/hsk-ziyuan.tsx`）：

- **墨滴飞溅**：每格 28 颗确定性（seed 稳定）墨滴，减速外飞 + 重力下坠 + 拉伸，`feGaussianBlur`+`feDisplacementMap` 让每颗不规则滲开；
- **湿墨冲击环** ×2（墨 + 朱砂），边缘经 `feTurbulence` 位移；
- **墨池**：成字母体从中心啵地滲开，`mixBlendMode:multiply` 吸进宣纸；
- **毛笔字飞白扫写**：`clip-path` 左→右 + blur 由糊变锐 + 弹簧过冲；
- **整格 kick**：炸裂瞬间该格抖一记。

节奏：`groupFrames=150`、`reads 0/26/52/78`（四拍蓄势）、`burst=90`（一齐爆）。参数在 `template.json → grid.inkburst`。

```json
{ "mode": "inkburst", "groups": [ "…2组×4字…" ] }
```

示例视频：`hsk-burst-01`（8字 = 10s，shard 2026/07/21）。

**封面**（cover.json）：钩子 = 字源揭示（与 plain 同口径），`ep` = `Tập N`。

**封面**（cover.json）：钩子 = 挑战宣言，**与片内顶部引导条同文案口径**（`hook` = banner.lead 第 1 行，`sub` = banner.lead 第 2 行），`ep` = `Thử thách trí nhớ #N`（挑战期数）。

---

## 封面规则（各子模板共用）

组件 `cover-hsk`（`src/CoverHsk.tsx`）：宣纸底 + 越南语钩子 + 副标题行 + 三个「具象简笔 → 毛笔字」示例 + 底部系列标。各子模板共用，差异全在 props。
**★版面居中铁律（2026-07-20 用户定）**：所有内容压进画面中段（y≈440..1440），上下各留 ≥440px 空白安全区——TikTok 顶部搜索栏/底部文案会遮挡上下边缘，封面文字不许贴边。

1. 每条视频目录放 `cover.json`，字段：
   - `hook`：主钩子（墨色 84px，1 行为佳）——子模板各有口径，见上方各节；
   - `sub`：副标题行（青碧 46px）——plain 缺省为 `山 = ⛰️ · 日 = ☀️ · 木 = 🌳`，memtest 写挑战规则；
   - `chars`：三个示例字（缺省 `山/日/木`，可换成该集的字，须在 `glyphs.json` 中）；
   - `ep`：系列标（深红）；`tag`：固定 `HSK · Tự học tiếng Trung`。
2. 渲染：`npx remotion still src/index.ts cover-hsk <视频目录>/cover.png --props=<视频目录>/cover.json`
3. 生产一条视频 = script.json + cover.json + 渲染成片 + 渲染封面，四件套齐才算完。

## 新增子模板的规矩

1. 先在本清单登记：名字、模式、节奏、引导条形态、示例 script。
2. 参数（几何/配色/字号/音色）一律进 `template.json`，script.json 只放该视频的内容与组合开关。
3. 象形起点必须具象（见 `authoring.md` 铁律），新字先补 `glyphs.json`。
