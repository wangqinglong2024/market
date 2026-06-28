# 07 · 目录与资产布局

区分两类资产：**全局复用库**（跨所有视频，长期不变）与 **单条视频产物**（每条视频独立生成）。
Remotion 用 `staticFile()` 读取，故运行期资产都放 `public/` 下。

## 目录结构
```
market/
├── inputs/                      # 输入文案脚本（每条视频一个 .txt）
│   └── <video-id>.txt
│
├── plan/                        # 方案文档（本目录）
│
├── scripts/                     # 生成层 Node 脚本（渲染之外）
│   ├── fal-gen.mjs              # fal.ai 出图（通用，含缓存）
│   ├── storyboard.mjs           # 文案 → 分镜 script.json
│   ├── localize.mjs             # 翻译 + 拼音
│   ├── tts.mjs                  # 火山 TTS → mp3 + 时长
│   └── build-manifest.mjs       # 汇总 → manifest.json
│
├── public/
│   ├── library/                 # ★ 全局复用库（跨视频，git 跟踪，体积小）
│   │   ├── characters/          # 角色圣经（一次性，长期复用）
│   │   │   ├── boy/   (ref-*.png + canonical.md)
│   │   │   ├── girl/
│   │   │   ├── dad/
│   │   │   ├── mom/
│   │   │   └── dog/
│   │   ├── characters.json      # 5 角色 canonical 描述（脚本读取拼进 prompt）
│   │   ├── style/               # 画风锚点
│   │   │   ├── style-anchor.png
│   │   │   └── style.md         # 固定画风提示词后缀
│   │   ├── backgrounds/         # 可复用场景底板（客厅/厨房/院子/卧室…）
│   │   ├── fonts/               # 覆盖中文+拼音声调+越南语的字体（Noto 系）
│   │   └── audio/
│   │       ├── bgm/             # 轻 BGM（可商用）
│   │       └── sfx/             # 翻页音效等
│   │
│   └── videos/                  # ★ 单条视频产物（可不入 git / 按需清理）
│       └── <video-id>/
│           ├── manifest.json
│           ├── script.json
│           ├── images/  (p01-a.jpg …)
│           └── audio/   (p01.mp3 …)
│
├── src/                         # Remotion 渲染层（纯数据驱动 Composition）
└── .cache/                      # 出图/TTS 按 hash 缓存（不入 git）
```

## 约定
- **角色圣经 + 风格锚点 + 可复用背景**：全局唯一，所有视频共享，改一次全局生效 → 一致性的物理保证。
- **单条视频**：所有产物收在 `public/videos/<video-id>/`，互不干扰，可独立重渲染/删除。
- **缓存**：`.cache/` 按输入 hash 存出图与 TTS 结果，改一句不重烧整片。
- **渲染**：Remotion 传入 `videoId` prop，`calculateMetadata` 读 `public/videos/<id>/manifest.json` 定时长。

## 关联
[[00-overview]] · [[01-pipeline]] · [[02-character-consistency]]
