# 01 · 数据流水线与 manifest

生成层是一串 Node 脚本，每步产出可缓存的中间文件，最终汇总成 `manifest.json` 交给 Remotion。

## 步骤
1. **分镜（LLM）** `文案.txt → script.json`
   - **切句（2026-07-07 改版）**：一拍（beat）= 一句**短句**（≈4~12 字，单行放得下），逗号处也拆，宁短勿长。
   - 按**场景聚合共图**：同 `sceneId` 的连续 beat **共用一张图**（如一句诗上下句 2 拍共 1 图），场景变才换图；出图数 = 场景数 ≠ beat 数。
   - 每个 beat 输出：短句中文、所在场景 id、**是否含主角色**、出场角色列表、表情/动作提示；每个**场景**给画面描述与图内容。
2. **翻译 + 拼音** → 每拍补：越南语译文（LLM 口语化、儿童语气）、带声调拼音（处理多音字）。
3. **TTS（火山·开朗姐姐）** → **每拍（每句短句）单独合成** `.mp3` + **真实时长(ms)** + 字级时间戳（`with_timestamp:1`，见 [[04-tts-captions]]）。时长驱动该拍停留与字幕时间。
4. **出图（fal.ai）** → 按角色数路由（见 [[05-cost-and-models]]）：0/1 人=flux（空镜喂风格锚图、单人喂定妆，**非纯文生图**）；≥2 人=nano-pro。一律**纯白底**，出图后 sharp 量身高做尺寸归一化。画风永远统一。带缓存。
5. **汇总** → `manifest.json`。

## manifest.json 结构（build.mjs 实际产出，渲染层 Video.tsx 读它）
```jsonc
{
  "meta": { "fps": 30, "width": 1080, "height": 1440, "transitionFrames": 12,   // 3:4（2026-07-07 改版，旧片 1920 不重做）
            "captions": { "pinyinColor": "...", "zhColor": "...", "localColor": "...", "bgColor": "#ffffff" } },
  "beats": [
    {
      "id": "p1",
      "sceneId": "s1",               // 共图分组：同 sceneId 连续拍共用同一张图、不转场（2026-07-07）
      "image": "images/s1.png",      // 按场景出图；相邻拍可指向同一文件
      "audio": "audio/p1.mp3",
      "durationMs": 2200,            // = 该短句 TTS 真实时长 + tailPaddingMs，驱动该拍时长
      "motion": "push-in",           // 运镜预设名（见 03/motion.json）；共图相邻拍运镜连续
      "transitionIn": "fade",        // 可选：仅场景切换处有转场
      "effects": [ { "type": "zoomBlur" } ], // 可选：≤2/片（见 11）
      "imgScale": 0.822,             // 尺寸归一化系数（含人物拍才有；build 用 sharp 量身高算出，见 10 4.6）
      "charTimings": [ { "ch": "假", "startMs": 215, "endMs": 405 } ],  // 字级时间戳，驱动逐字跳字（见 04）
      "captions": {
        "pinyin": "...",             // 可留空，渲染层 pinyin-pro 自动注音
        "zh": "假舆马者，",            // ★ 一拍一句短句，单行（2026-07-07，旧 lines[] 多行对照废除）
        "local": "Người mượn xe ngựa,"  // 越南语意译，单行
      }
    }
  ]
}
```

## 缓存 / 可复现（成本与速度命脉）
- 每步按**输入 hash** 缓存：分镜 hash、TTS(文本+音色) hash、出图(prompt+seed+参考图) hash。
- 命中缓存不重生成；改一句只重算受影响的页，不重烧整片。
- 出图 **seed 固定**，可复现、可精确重抽。

## review gate（半自动）
- 出图后插入人工快速过图：坏图（脸崩/多指/画风偏）一键换 seed 重抽，通过才进 manifest 渲染。
- 后续可加自动质检（如检测人脸数/手指）降低人工量。

## 关联
[[00-overview]] · [[02-character-consistency]] · [[04-tts-captions]] · [[05-cost-and-models]]
