# 12 · 每条视频的目录产物规范（原始需求 → 转换脚本 → 配音 → 出图）

> 2026-07-03 用户要求：每条视频目录下要能看到**完整链路**——
> ① 我给的原始需求文案 → ② 你转换/设计后的脚本（每句配什么音、分几个画面、每个画面怎么给 AI 写出图提示词）→ ③ 据此配音出图 → ④ 成片。
> 一个目录看下去，就知道这条片子是怎么从一句话长成成片的。

## 目录布局：`public/videos/<shard>/<id>/`
```
public/videos/2026-07/<id>/
├── input.md          ① 原始需求：用户交的那句古文/哲理句 + 任何附加要求（原样保存，可追溯）
├── script.json       ② 转换脚本（本文重点）：分镜 + 每拍配音角色 + 场景 + 出图 prompt + 三语字幕
├── audio/            ③ 每拍配音 pXX.mp3（按 script 的 voice 角色合成）
├── images/           ③ 每拍出图 pXX.png（按 script 的 prompt + 角色路由 flux/nano 生成）
├── manifest.json     ④ 渲染数据（build.mjs 汇总，Remotion 读它出片）
└── 成片.mp4          ④ 最终成片
```
- **input.md** = 第①层。内容就是用户给的一句（如「温故而知新，可以为师矣。」）加可选备注（时长/语言/指定哥哥还是妹妹朗读等）。它是这条片的"需求单"。
- **script.json** = 第②层，是我**设计**的东西，不是机械切句：金句怎么扩写成 6–9 拍、每拍谁来配音、分几个画面、每个画面给 AI 什么出图提示词——全在这里定死，后续配音/出图**只照着执行**。

## script.json 每个 beat 必填字段（第②层的设计面）
```jsonc
{
  "videoId": "wengu-zhixin",
  "lang": "vi",
  "sourceQuote": "温故而知新，可以为师矣。",   // 本条金句原句（来自 input.md）
  "beats": [
    {
      "id": "p1",
      "role": "read-quote",          // 该拍在结构里的角色：read-quote/explain/scene/payoff/cta
      "voice": "narrator",           // ★配音：全片统一旁白开朗姐姐（见 04）
      "sceneId": "study-ancient",    // 场景（同地点连续拍复用背景）
      "hasMainCharacter": true,      // ★这拍需不需要出人物（不需要就 false，画空镜/物件）
      "characters": ["boy"],         // 在场主角色 id；空=无人物
      "costume": "ancient",          // 可选：ancient=古装（金句朗读拍孩子穿古人服装）
      "emotion": "solemn, sweet",
      "motion": "push-in",           // ★运镜预设（按内容多样化选，见 03/motion.json）
      "effects": [],                 // ★特效（≤2/片，按需，多数拍留空，见 11）
      "shots": [                     // ★分几个画面 + 每画面的出图提示词
        { "content": "<英文出图提示词：只画这句所指的画面>", "weight": 1 }
      ],
      "captions": {
        "zh": "温故而知新，可以为师矣。",
        "pinyin": "wēn gù ér zhī xīn, kě yǐ wéi shī yǐ",
        "local": "Ôn lại điều cũ mà hiểu điều mới, ắt có thể làm thầy."   // 越南语意译
      }
    }
  ]
}
```
字段职责对照用户三问：
- **「每句配什么音」** → `voice`（逐拍指定角色，build 映射到火山 voice_type）。
- **「分几个画面」** → 拍数（beats 数）+ 每拍 `shots[]`（一拍可 1~N 张表现过程）。
- **「每个画面怎么给 AI 出图提示词」** → 每个 `shot.content` = 该画面的出图提示词主体；build 时再拼固定 STYLE/LAYOUT/NOTEXT（见 [[10-art-style-locked]]），并按 `characters` 数路由 flux(无人物/单角色) / nano-banana-pro(多角色，见 [[05-cost-and-models]]）。

## 出图提示词怎么定（第②→③层）
`shot.content` 只写**该拍要画什么**（忠于该句、极简背景、别脑补）。最终 prompt = `content` + 固定画风/版式/负面模板拼接（确定性、可复现）。
- **无人物拍**（讲道理的书本/灯/山/路空镜）：`hasMainCharacter=false`，走 flux 纯文生图，只锁画风。
- **单角色拍**（孩子朗读、一个人复习）：走 flux `flux-pro/kontext`，喂该角色 1 张定妆。
- **多角色拍**（全家领悟）：走 nano-banana-pro/edit，喂多张定妆。

## 谁生成 script.json
**会话内由我（Claude）生成**：拿 `input.md` 的一句古文 → 按 [[00-overview]] 的固定内容结构扩写 → 填全上面字段 → 写入目录。之后 `node scripts/run.mjs <id>` 照着配音+出图+汇总+（可选）渲染。

## 关联
[[00-overview]] · [[04-tts-captions]] · [[08-script-to-video-rules]] · [[10-art-style-locked]] · [[11-effects-spec]] · [[07-asset-layout]]
