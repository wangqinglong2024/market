# 模板：guoxue-jinju · 国学金句 · 中华经典文化短视频

> 本文件是本模板的**唯一作者指南**：用户说「用 `guoxue-jinju` 模板 + 一句古文」，我(Claude)读这份指南把文案扩写成 `script.json`，然后
> `node scripts/build.mjs <videoId>`（配音+出图+归一化+manifest）→ `npx remotion render <videoId> …`（出片）。
> 跨模板通用的规律/架构/铁律见仓库 `base/*.md`，但**做这个模板只需读本文**。

## 1. 输入 / 输出
- **输入**：用户给**一句**古文/经典/哲理句（中文），如「温故而知新，可以为师矣」。可选 `videoId`、`lang`(默认 vi)、指定哥哥还是妹妹朗读。原样存 `public/videos/<shard>/<id>/input.md`。
- **输出**：`public/videos/<shard>/<id>/` 下 `input.md` / `script.json` / audio / images / `manifest.json` / `成片.mp4`。`*.mp4` 一律 gitignore，只本地生成，禁止提交。
- **shard** = 年/月/日（YYYY/MM/DD）。catalog.json 里为该视频建条目并写 `"template": "guoxue-jinju"`。

## 2. 固定内容结构（25–40 秒；扩写脚本按此走）
1. **孩子朗读金句**（钩子）：现代小孩**穿汉服**（不是古代人），郑重念出这句古文。**配音永远是统一旁白「开朗姐姐」**，孩子只是画面里在"读"。两句/并列原文按上句/下句**逐拍朗读**（分开读、分开上字幕），整句诗可共用 1 张图。
2. **点破意思**：用大白话解释这句话讲什么（不写「妈妈说」等引述词）。
3. **场景演示道理**（2–3 拍）：用具体画面演示这个道理。
4. **文化收尾**：点出智慧/点睛，温暖收束。

> **★ 纯文化普及，禁止任何营销/广告**：不做软件推广、下载 CTA、「一起学中文」等；收尾回到文化本身。
> **不插任何固定引子/套话**（「古语有云」「这句话想告诉我们」等一律不要）；一切以文案与场景设计，不套模板句。

## 3. 核心单位 beat（一拍 = 一句短句）
- 一拍 ≈ **4~12 汉字**（单行放得下，约 1~3 秒配音）；按句末标点切，**逗号也拆**，宁短勿长。
- 稳定 id：`p01, p02, …`。每拍带 `sceneId`。
- **场景共图**：同 `sceneId` 的连续拍**共用一张图**（只出 1 次图），出图数 = 场景数 ≠ 拍数。一个语义画面（一句诗、一个演示情节）就一个 sceneId；切句变细不等于图变多。
- **人物按需出场**：不是每拍都出主角；讲道理的空镜（书/灯/山/路）画物/景。朗读画面出哪个孩子/几张图按文案设计，不为凑数硬上多角色。

## 4. script.json 结构（build.mjs 实际消费的字段）
顶层：`{ videoId, lang, sourceQuote, beats: [...] }`。每个 beat：
```jsonc
{
  "id": "p01",
  "role": "read-quote|hook|explain|scene|closing",  // read-quote=朗读古文拍(语速0.9、喂带帽汉服样板)；其余语速1.1
  "voice": "narrator",            // 永远 narrator(统一旁白)；voices 映射见 template.json
  "sceneId": "s1-open",           // 共图分组：同 sceneId 连续拍共用一张图、不换图不转场
  "hasMainCharacter": true,        // 是否出现固定主角色
  "characters": ["mom"],           // 在场主角色 id(取参考图用)；空镜为 []
  "motion": "push-in",            // 可选，运镜预设名(见 motion.json)；不填则按关键词/默认 ken-burns
  "refMode": "style",             // 可选，仅"古代典故重演"用：喂风格锚图画古人、不用定妆不保IP
  "canonOverride": "…",           // 可选，该拍换装时整段替换角色 canon(如成人穿长袍)
  "ttsZh": "…",                    // 可选，多音字发音引导(只供合成不上屏；汉字数必须=captions.zh)
  "transitionIn": "fade|slide-left|slide-up|wipe",  // 可选，仅场景切换处
  "effects": [ { "type": "zoomBlur" } ],            // 可选，见 §6
  "shots": [                       // 每个场景的第一拍必须带 shots；同场景后续拍可省
    {
      "content": "英文画面描述——真正传给出图模型的 prompt 主体，只画该句文字所指、忠于原文、纯白底",
      "contentZh": "对应中文说明(仅供用户看懂，不传参)",
      "model": "flux",            // flux(0/1人或典故重演) | nano-pro(≥2人同框)
      "weight": 1                  // 多 shot 时占该拍时长比例，默认均分
    }
  ],
  "captions": {
    "zh": "杯弓蛇影背后的故事，",   // ★一拍一句短句、单行
    "pinyin": "bēi gōng shé yǐng …", // 空格分隔、音节数=汉字数才生效，否则渲染层 pinyin-pro 自动注音
    "local": "Câu chuyện …"          // 越南语口语化意译(非逐字直译)，单行
  }
}
```

## 5. 出图路由（模型/参考图铁律，build.mjs 按此执行）
- **0 人(空镜/物) → flux**：喂**风格锚图**(template.json `image.styleAnchor`)只借画风、绝不加人。非纯文生图。
- **古代典故重演(`refMode:"style"`) → flux**：喂风格锚图画古人、按 shot 描述、几个人画几个人（非 IP 多人也 flux）。
- **1 人 → flux**：喂该角色定妆图；朗读拍(`role:"read-quote"`)自动改喂「戴书生帽+汉服」样板。
- **≥2 人同框 → nano-pro**：喂多张定妆图。
- 🚫 **一条视频最多 1 个 nano-pro 拍 = 最多 1 次 banana($0.15)**（省钱铁律）；build.mjs 出图前 >1 直接报错。其余全 flux($0.04)。
- 🚫 prompt 里**绝不**写 box/frame/subtitle/"留白给字幕"，也**不放身体部位负面词**(会触发 fal nsfw 黑图)；出图**只画 3:2 横图本身、纯白底 #ffffff**。版式由渲染层合成。
- 🚫🚫 **fal 出问题(黑图/画错)禁止擅自重调**，必须先告知用户、同意后才能再调（每次 fal 都花钱）。本地步骤(TTS/渲染/改 config)不受限。

## 6. 特效 / 运镜 / 字幕 / 配音
- **特效**：全库固定 4 个（comicPops / emojiRain / scorePop / zoomBlur），**一片最多 2 个、按需**，宁缺毋滥。
- **运镜**：按句意多样化（push-in/pull-back/pan-left/pan-right/climb-up/ken-burns/sway/pop/still，见 motion.json），别全片一个运镜。
- **字幕**：一屏一句短句，单行拼音 + 单行中文 + 单行越南语，禁止多行。中文按 charTimings 逐字跳字。金句原文配越南语意译(不直译)。
- **配音**：永远中文、全片统一旁白「开朗姐姐」(narrator)，不做多角色分工。角色区分只在画面。

## 7. 画风（全片统一，锁定）
治愈系手绘：粗铅笔线 + 暖蜡笔，简洁可爱卡通脸，绘本感，**纯白底**。金句朗读拍孩子(现代小孩)穿汉服。背景贴合该拍内容、极简克制，不堆家具/不无脑户外/不画空盒子房间。
详见本模板 `prompts/style.md`、`prompts/composition.md`、`characters/<id>/canonical*.md`。

## 8. 固定角色
哥哥(boy)、妹妹(girl)、爸爸(dad)、妈妈(mom)、狗狗(dog)。金句片主要用孩子(朗读)+父母(讲解)，其余按内容。见 `characters/_registry.json`。
