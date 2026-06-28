# 01 · 数据流水线与 manifest

生成层是一串 Node 脚本，每步产出可缓存的中间文件，最终汇总成 `manifest.json` 交给 Remotion。

## 步骤
1. **分镜（LLM）** `文案.txt → script.json`
   - 按**场景聚合**：同场景连续旁白共用一张背景，场景变才换图。
   - 一个分镜单元（page）= 一段旁白，可对应 **1~N 张**与文字内容相关的图（表现过程/推进，如"从山底爬到山顶"）。
   - 每个 page 输出：旁白中文、所在场景 id、**是否含主角色**、出场角色列表、表情/动作提示、画面描述、图数量与各图的内容。
2. **翻译 + 拼音** → 每段补：越南语译文（LLM 口语化、儿童语气）、带声调拼音（处理多音字）。
3. **TTS（火山·开朗姐姐）** → 每段中文合成 `.mp3` + **真实时长(ms)**。时长驱动该页停留与字幕时间；该段内多图按比例分配时长。
4. **出图（fal.ai）** → 按 [[02-character-consistency]] 分支：含主角色=参考条件生成；其它/无人物=文生图。画风永远统一。带缓存。
5. **汇总** → `manifest.json`。

## manifest.json 结构草案
```jsonc
{
  "meta": { "lang": "vi", "fps": 30, "width": 1080, "height": 1920, "totalMs": 60000 },
  "style": { "anchorImage": "assets/style-anchor.jpg", "promptSuffix": "..." },
  "pages": [
    {
      "id": "p01",
      "sceneId": "living-room-morning",
      "hasMainCharacter": true,       // true→参考条件生成；false→文生图
      "shots": [                      // 1~N 张，表现该段文字的内容/过程
        { "image": "images/p01-a.jpg", "weight": 1, "layers": null }
        // 多图示例: 山底/山中/山顶 三张，weight 决定各自占该段时长比例
        // layers: v2 可填 { bg, character } 做视差
      ],
      "audio": "audio/p01.mp3",
      "durationMs": 3200,            // = TTS 真实时长（+尾部留白），按 weight 分给 shots
      "narrationZh": "你好，妈妈。",
      "captions": {
        "pinyin": "nǐ hǎo, māma",
        "zh": "你好，妈妈。",
        "local": "Chào mẹ."
      },
      "wordTimings": null,           // 若火山给字级时间戳→逐字高亮跟读
      "transitionIn": "page-turn"
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
