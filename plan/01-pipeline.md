# 01 · 数据流水线与 manifest

生成层是一串 Node 脚本，每步产出可缓存的中间文件，最终汇总成 `manifest.json` 交给 Remotion。

## 步骤
1. **分镜（LLM）** `文案.txt → script.json`
   - 按**场景聚合**：同场景连续旁白共用一张背景，场景变才换图。
   - 一个分镜单元（page）= 一段旁白，可对应 **1~N 张**与文字内容相关的图（表现过程/推进，如"从山底爬到山顶"）。
   - 每个 page 输出：旁白中文、所在场景 id、**是否含主角色**、出场角色列表、表情/动作提示、画面描述、图数量与各图的内容。
2. **翻译 + 拼音** → 每段补：越南语译文（LLM 口语化、儿童语气）、带声调拼音（处理多音字）。
3. **TTS（火山·开朗姐姐）** → 每段中文合成 `.mp3` + **真实时长(ms)**。时长驱动该页停留与字幕时间；该段内多图按比例分配时长。
4. **出图（fal.ai）** → 按角色数路由（见 [[05-cost-and-models]]）：0/1 人=flux（空镜喂风格锚图、单人喂定妆，**非纯文生图**）；≥2 人=nano-pro。一律**纯白底**，出图后 sharp 量身高做尺寸归一化。画风永远统一。带缓存。
5. **汇总** → `manifest.json`。

## manifest.json 结构（build.mjs 实际产出，渲染层 Video.tsx 读它）
```jsonc
{
  "meta": { "fps": 30, "width": 1080, "height": 1920, "transitionFrames": 12,
            "captions": { "pinyinColor": "...", "zhColor": "...", "localColor": "...", "bgColor": "#ffffff" } },
  "beats": [
    {
      "id": "p1",
      "image": "images/p1.png",
      "audio": "audio/p1.mp3",
      "durationMs": 5008,            // = TTS 真实时长 + tailPaddingMs，驱动该拍时长
      "motion": "push-in",           // 运镜预设名（见 03/motion.json）
      "transitionIn": "fade",        // 可选：转场
      "effects": [ { "type": "zoomBlur" } ], // 可选：≤2/片（见 11）
      "imgScale": 0.822,             // 尺寸归一化系数（含人物拍才有；build 用 sharp 量身高算出，见 10 4.6）
      "captions": {
        "pinyin": "...",             // 可留空，渲染层 pinyin-pro 自动注音
        "zh": "假舆马者，非利足也，而致千里；",
        "local": "Người mượn xe ngựa, ...",     // 越南语整句意译
        "lines": [ { "zh": "假舆马者，非利足也，", "vi": "Người mượn xe ngựa, ..." } ] // 逐行中越对照（见 03）
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
