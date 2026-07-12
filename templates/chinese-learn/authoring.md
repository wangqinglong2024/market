# chinese-learn · 中文学习字幕片

**输入物是「一个无字幕中文视频」**(区别于其它模板的「文案」)。把原视频重排成竖屏学习版:
上方原视频、下方三行卡拉OK字幕(拼音 / 中文 / 越南语),逐词跳动高亮。

## 版面(固定)

画布 **1080×1440(3:4)**,纯黑底 `#000000`(TikTok FYP 风):

```
[黑底留白 120]
[原视频 1080×720  ← cover 裁切,focusY 调纵向焦点]
[间隙 120]
[字幕区 1080×360  ← 拼音行 / 中文行 / 越南语行]
[黑底留白 120]
```

## 制作步骤

1. 建目录 `public/videos/<shard>/<id>/`,把无字幕视频放进去命名 **`source.mp4`**。
2. 在 `catalog.json` 加一条:`{ id, template: "chinese-learn", shard, lang: "vi", ... }`。
3. 跑 `node scripts/build.mjs <id>`。首次会:抽音频 → 火山 ASR(逐字时间戳) → 分词 → 拼音 → 生成 `manifest.json`。
   - 缓存:`audio.mp3`、`asr.json`。改口播不用重识别就删 `asr.json`。
4. **越南语**:首次构建会把识别到的句子打印出来(且 `asr.json` 里也有)。把每句翻成越南语,按同序写成
   `public/videos/<shard>/<id>/vi.json`(字符串数组),再跑一次 `node scripts/build.mjs <id>`。无 `vi.json` 则越南语行留空、只显两行。
5. Remotion Studio / 渲染该 `id` 即可预览成片。

## 关键决策(已锁定)

- **逐词高亮**(非逐字):ASR 给逐字时间戳,`Intl.Segmenter` 分词后聚成词,按 `currentMs` 逐词跳动。
- **裁切保比例**:原视频 cover 填满 1080×720,`template.json` 的 `source.focusY`(0 顶~1 底)调裁切焦点。
- **ASR**:火山「录音文件识别大模型」极速版(`volc.bigasr.auc_turbo`),内联音频免公网托管;凭证在
  `api-key.txt` 的「豆包ASR」段(`default` 应用 `2528120497`,与 TTS 的 `9026810357` 是两个不同应用)。
- **音频**:直接用原视频自带声音(老师口播),无 TTS / 无 BGM;卡拉OK 跟原声对齐。

## 可调项(template.json)

- `source.region` / `source.focusY`:视频区大小与裁切焦点。
- `subtitle`:字幕区位置与高度。
- `captions`:三行颜色、`karaokeColor`(朗读中)、`dimColor`(未读)、字号 `sizes`、行距。
