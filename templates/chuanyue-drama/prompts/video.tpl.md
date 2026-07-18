<!--
★ I2V 视频提示词模板（kling image-to-video）。本模板产出的是「运动描述」，不是外观描述。
外观（脸/服装/发型/场景）已由输入关键帧锁定 → 视频 prompt 只让它「动起来」。

【硬规矩】
① 输入图 = 该拍关键帧（由 image-char.tpl.md 喂角色定妆图生成，脸已锁）。视频 prompt 里
   绝不重描人物长相/服装/场景细节——重描会让 kling 漂移换脸、换衣。
② generateAudio=false：不生成任何声音；成片用我们自己的 TTS，渲染层静音播放该视频。
③ 只写：主体动作 + 表情/情绪变化 + 镜头运动 + 环境动态（烛火/水花/风/尘）。单一清晰动作，
   3–5s 一个动作，别塞多段剧情。
④ 绝不写：文字/字幕/caption/subtitle/box/frame/watermark/logo；不写身体部位负面词。
⑤ 用词具体、可执行、短。英文书写。
⑥ 只有 1 个人时，别让镜头里凭空出现第二张正脸。

【payload（build 调用 gen-video 时）】
{
  "endpoint": "fal-ai/kling-video/v3/standard/image-to-video",
  "image_url": "<该拍关键帧 data-uri>",   // 人物特征代入=这里
  "prompt": "<下面模板产出的运动描述>",
  "duration": "3" | "5",                  // 秒，整数；本模板默认 3.5→取 kling 允许档
  "generate_audio": false,                 // ★关闭原声
  "aspect_ratio": "3:2" | "16:9",
  "negative_prompt": "text, subtitles, watermark, logo, caption, extra person, face swap, deformed"
}

【占位】
{motion}   = 该拍运动描述（本模板核心，见下方写法）
{camera}   = 镜头运动（可并入 motion）

【运动描述写法（{motion} 怎么写）】
- 结构：主体动作 →（伴随）表情/情绪 →（伴随）环境动态 → 镜头运动。
- 例（E001 b01 掀盖头睁眼）:
  "The bride's hand sharply lifts the red veil; she jolts upright and her eyes snap open
   wide with fright and confusion; candle flames flicker and sway around her;
   slow push-in on her face." 
- 例（E002 装病拆穿）:
  "The man on the sickbed suddenly opens his eyes and grips her wrist; his weak sickly
   air vanishes into a cold sharp stare; the candlelight steadies and brightens;
   quick subtle push-in." 
- 例（E008 护妻身手）:
  "He pulls her behind him and raises his arm to block; embers and sparks drift through
   the air; his robe sways with the swift motion; handheld camera with a fast reframe." 
- 反例（禁止）:
  ✗ 重描外观："a stunningly beautiful woman in ornate red wedding dress with gold..."（外观交给关键帧）
  ✗ 多段剧情："she wakes, then walks to the mirror, then the door opens..."（一拍一动作）
  ✗ 写字幕/边框："text at bottom / leave space for subtitles"（严禁）

【镜头运动词表（{camera}）】
push-in / pull-back / slow pan left / slow pan right / tilt up / handheld shake /
static locked-off with subtle parallax / rack focus。选与情绪匹配的一种，别叠太多。
-->
{motion}

Camera: {camera}

Keep the person, face, clothing and setting EXACTLY as in the input image — only add motion, do not change appearance. Natural realistic movement, cinematic live-action period drama. No text, no subtitles, no watermark, no logo, no extra face.
