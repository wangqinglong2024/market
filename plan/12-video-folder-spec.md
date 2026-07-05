# 12 · 每条视频的目录产物规范（原始需求 → 转换脚本 → 配音 → 出图）

> 2026-07-03 用户要求：每条视频目录下要能看到**完整链路**——
> ① 我给的原始需求文案 → ② 你转换/设计后的脚本（每句配什么音、分几个画面、每个画面怎么给 AI 写出图提示词）→ ③ 据此配音出图 → ④ 成片。
> 一个目录看下去，就知道这条片子是怎么从一句话长成成片的。

## 目录布局：`public/videos/<shard>/<id>/`（shard = 年/月/日 YYYY/MM/DD，2026-07-05 用户改）
```
public/videos/2026/07/03/<id>/
├── input.md          ① 原始需求：用户交的那句古文/哲理句 + 任何附加要求（原样保存，可追溯）
├── script.json       ② 转换脚本（本文重点）：分镜 + 每拍配音角色 + 场景 + 出图 prompt + 三语字幕
├── audio/            ③ 每拍配音 pXX.mp3（按 script 的 voice 角色合成）
├── images/           ③ 每拍出图 pXX.png（按 script 的 prompt + 角色路由 flux/nano 生成）
├── cost/coast.md     ③ 出图成本日志（2026-07-05 用户加）：每次真实调用出图模型记一行「时间到秒 | 拍 | 模型 | 花费」，缓存命中不计
├── manifest.json     ④ 渲染数据（build.mjs 汇总，Remotion 读它出片）
└── 成片.mp4          ④ 最终成片
```
> **shard 分片（2026-07-05 改）**：原按月 `2026-07/` 改成年/月/日三级 `2026/07/03/`。`catalog.json` 每条 `shard` 就是这段路径；代码只当路径片段拼接，故改层级无需动脚本。
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
      "role": "read-quote",          // 该拍在结构里的角色：read-quote/explain/scene/payoff（无 cta，纯文化不打广告）
      "voice": "narrator",           // ★配音：全片统一旁白开朗姐姐（见 04）
      "sceneId": "study-ancient",    // 场景（同地点连续拍复用背景）
      "hasMainCharacter": true,      // ★这拍需不需要出人物（不需要就 false，画空镜/物件）
      "characters": ["boy"],         // 在场主角色 id；空=无人物
      "costume": "ancient",          // 可选：ancient=穿汉服（现代小孩打扮成汉服，非古代；见 10 4.7）
      "emotion": "solemn, sweet",
      "motion": "push-in",           // ★运镜预设（按内容多样化选，见 03/motion.json）
      "effects": [],                 // ★特效（≤2/片，按需，多数拍留空，见 11）
      "shots": [                     // ★分几个画面 + 每画面的出图提示词
        {
          "content": "<英文出图提示词：真正传给模型，只画这句所指的画面>",
          "contentZh": "<对应中文：仅给用户看懂，不传参给模型>",
          "model": "flux(0或1人) | nano-pro(≥2人)",  // ★显式声明出图模型，出图前可审、省钱可控
          "weight": 1
        }
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
- **「每个画面怎么给 AI 出图提示词」** → 每个 `shot.content`（英文）= 该画面的出图提示词主体，**真正传给模型**；`shot.contentZh`（中文）仅供用户看懂、**不传参给模型**。build 时再拼固定 STYLE/LAYOUT/NOTEXT（见 [[10-art-style-locked]]）。
- **「用哪个模型」** → 每个 shot 显式声明 `model`（只有 `flux` / `nano-pro` 两个值），**出图前就能在脚本里审、成本可控**。硬规矩：**0 人或 1 人 = `flux`(~$0.04)；≥2 人 = `nano-pro`(~$0.15)**。**严禁 nano-banana 文生图，空镜也走 flux**；`gen-image.mjs` 强制校验 `model` 与 `characters` 数一致，**不符报错**，杜绝对单人/空镜误用贵模型（见 [[05-cost-and-models]]）。

## 出图提示词怎么定（第②→③层）
`shot.content` 只写**该拍要画什么**（忠于该句、极简背景、别脑补）。最终 prompt = `content` + 固定画风/版式/负面模板拼接（确定性、可复现）。
- **无人物拍**（讲道理的书本/灯/山/路空镜）：`hasMainCharacter=false`，走 flux `flux-pro/kontext` 喂**风格锚图**只借画风（**不是纯文生图**，无锚会漂移/加人）。
- **单角色拍**（孩子朗读、一个人复习）：走 flux `flux-pro/kontext`，喂该角色 1 张定妆。
- **多角色拍**（≥2 人同框）：走 nano-banana-pro/edit，喂多张定妆。
- 出图一律**纯白底**；出图后 `build.mjs` 用 sharp 量人物身高做**尺寸归一化**（统一=p6，见 [[10-art-style-locked]] 4.6/4.8）。

## 谁生成 script.json
**会话内由我（Claude）生成**：拿 `input.md` 的一句古文 → 按 [[00-overview]] 的固定内容结构扩写 → 填全上面字段 → 写入目录。之后 `node scripts/build.mjs <id>`（配音+出图+尺寸归一化+汇总 manifest），再 `npx remotion render <id> …` 出片。

## 关联
[[00-overview]] · [[04-tts-captions]] · [[08-script-to-video-rules]] · [[10-art-style-locked]] · [[11-effects-spec]] · [[07-asset-layout]]
