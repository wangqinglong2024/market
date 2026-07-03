# 07 · 目录与资产布局（已落地）

三类东西彻底分开：**你调的旋钮（config/）**、**你放的输入（inputs/）**、**机器吐的产物（public/videos/）**。
原则：凡是人会编辑的（提示词、角色、参数）进 `config/`；凡是机器生成的产物进 `public/videos/`。
`public/` 只保留 Remotion 运行期真正要用 `staticFile()` 读的东西（字体 + 每条视频产物）。

## 目录结构
```
market/
├── config/                     ★ 控制台：唯一编辑面（全 git 跟踪）
│   ├── characters/             角色圣经（增/删/改角色只动这里）
│   │   ├── boy/  ref-front.png + canonical.md
│   │   ├── girl/  dad/  mom/  dog/  （同上）
│   │   └── _registry.json      角色清单（id→名字/主角色标记/参考图/描述文件）
│   ├── prompts/                中间层所有提示词（默认我维护，你随时改）
│   │   ├── storyboard.md        分镜 LLM system prompt
│   │   ├── translate.md         翻译 LLM prompt
│   │   ├── image.tpl.md         出图组装模板（含 {shot}{canon}{style}{composition}{negative} 占位）
│   │   ├── style.md             画风后缀
│   │   ├── composition.md       构图约束
│   │   └── negative.md          负面词
│   ├── motion.json             运镜/特效预设库 + 选取规则
│   └── settings.json           画幅/fps/音色/默认语言/时长留白/出图模型/字幕配色
│
├── inputs/                     ★ 你只在这里放文案
│   └── <videoId>.txt
│
├── catalog.json                ★ 视频总账（上千条的索引：id/标题/分片/语言/状态）
│
├── scripts/                    流水线引擎（你不碰）
│   ├── storyboard.mjs  localize.mjs  tts.mjs  fal-gen.mjs  build-manifest.mjs
│   └── run.mjs                 一键：inputs/<id>.txt → 成片
│
├── public/
│   ├── library/fonts/          Remotion 运行期字体（public 里唯一的全局资产）
│   └── videos/<shard>/<id>/    ★ 单条视频全部产物（按月份分片，产物入 git）
│       └── 2026-07/<id>/  ├─ input.md（原始需求）├─ script.json（转换脚本）
│                          ├─ manifest.json  ├─ images/  ├─ audio/  （+ 成片.mp4）
│                          详见 [[12-video-folder-spec]]
│
└── src/                        Remotion 渲染层（纯数据驱动，你不碰）
```

## 关键决策（本轮敲定）
- **控制台外置**：角色圣经 + 全部提示词 + 参数从 `public/library` 挪到顶层 `config/`。
  它们只被 Node 生成脚本用 `fs` 读，不需在 `public/`；这样产物再多，编辑面始终干净。
- **角色管理**：加角色 = 建 `config/characters/<id>/`（放 `ref-front.png` + 写 `canonical.md`）+ 在 `_registry.json` 加一行。脚本自动读取，无需改代码。
- **提示词可调（你的“Dify”）**：每步提示词各是一个 `config/prompts/*.md`，脚本运行时读文件拼接。默认我写，你改哪个文件下次跑就生效。出图用确定性模板占位符拼装 → 可复现。
- **运镜可配置**：`config/motion.json` 定义预设（push-in/pan-left/pan-right/climb-up/still）与按句意选取规则；build 时把选中预设解析进 manifest，Remotion 只按名播放。
- **月份分片**：产物路径 `public/videos/<YYYY-MM>/<id>/`，避免单目录几千项。
- **产物入 git**：图/音/成片都进版本库，方便直接分发（代价：仓库会变大）。
- **总账**：`catalog.json` 索引所有视频；每条可加 `state.json` 记录每步状态，支持断点续跑、只重烧改动页。

## 约定
- **单条视频**：产物全收在 `public/videos/<shard>/<id>/`，互不干扰，可独立重渲染/删除。
- **渲染**：Remotion 传入 `videoId`（+shard），`calculateMetadata` 读该条 `manifest.json` 定时长。
- **可移植**：TTS 时长探测与回退改用跨平台 `ffprobe`（原 demo 的 `afinfo/say/afconvert` 是 macOS 专用，Windows 上不可用）。

## 关联
[[00-overview]] · [[01-pipeline]] · [[02-character-consistency]] · [[08-script-to-video-rules]]
