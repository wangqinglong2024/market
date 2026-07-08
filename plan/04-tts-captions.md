# 04 · 多角色配音、字幕、翻译（意译）、拼音

## ★ 配音：统一用旁白开朗姐姐（2026-07-03 用户最终锁定）
**全片每一拍都用旁白「开朗姐姐」念**（`voice=narrator`），**不做**多角色分工——试过多角色后用户决定还是统一一个旁白声更顺。
- 文案里也**不要出现**「妈妈说：」「爸爸说：」这类引述词，直接叙述。
- 角色划分只体现在**画面**（谁朗读/谁在场），声音都是同一个旁白。
- 下面的多角色映射表**保留为可选基建**（`voice` 字段仍支持 boy/girl/dad/mom，改一版就能启用），但**当前默认全 narrator**。

### 多角色音色表（当前不启用，留作可选）
每拍可在 `script.json` 用 `voice` 字段指定角色，build 时映射到火山 `voice_type`：

| 角色(voice) | 用途 | 火山 voice_type（`config/settings.json.voices`） | 状态 |
|---|---|---|---|
| `narrator` | 旁白叙述（场景演示/收尾） | `zh_female_kailangjiejie_moon_bigtts`（开朗姐姐，明亮讲故事） | ✅ 已验证 |
| `boy` | 儿子朗读金句、领悟 | `zh_male_naiqimengwa_mars_bigtts`（奶气萌娃，男童） | ✅ 已验证 |
| `girl` | 女儿朗读金句、领悟 | `zh_female_tianmeixiaoyuan_moon_bigtts`（甜美小源，女童） | ✅ 已验证 |
| `dad` | 爸爸讲解 | `zh_male_wennuanahu_moon_bigtts`（温暖阿虎，温暖成年男） | ✅ 已验证 |
| `mom` | 妈妈讲解 | `zh_female_wenrouxiaoya_moon_bigtts`（温柔小雅，温柔成年女） | ✅ 已验证 |

> `voice` 角色名与 `characters` 里的主角色 id 对齐（boy/girl/dad/mom），只有 `narrator` 是无对应人物的旁白音。

- **音色码解耦**：`voice` 只写角色名，真实 `voice_type` 放 `config/settings.json.voices`。要换音色只改 config，不动脚本。
- 4 个码均 2026-07-03 真机验证可用（curl 走代理 7897）。备选码见 `settings.audio._alternates`，样本存 `temp/voice-samples/`。选码原则：偏**大众/温暖/中性**，避开方言/角色音（京腔、湾湾腔等）。
- ⚠️ 账号未开通的码返回 `code 3001 resource not granted`（如 `*_jupiter_bigtts`、部分 `*_mars_bigtts`）——换 `moon_bigtts` 系。
- ✅ **已接线（2026-07-03）**：`build.mjs` 按 `beat.voice` → `settings.audio.voices[...]` 传给火山 TTS（默认 `narrator`）。
- 每拍中文旁白单独合成一个 `.mp3`，取**真实时长(ms)** → 驱动该拍停留与字幕时间。
- 段尾加少量留白（`tailPaddingMs`），避免翻页过紧。
- **★ 语速（2026-07-05 用户调整）**：按内容类型分流。开场朗读古文拍 `role=read-quote` 用 `settings.audio.readQuoteSpeed = 0.9`，后续讲解/场景/收尾用 `settings.audio.speed = 1.1`。火山 `speed_ratio` 参数，`build.mjs` 按 `beat.role` 传入。**配音变快 → `beat.durationMs` 变短 → 画面/运镜节奏自动跟着变快**（时长是唯一节奏源，不用另调 motion）。⚠️ 改语速后要**删掉受影响的 `audio/*.mp3` 重合成**——缓存只按输出路径命中，不认语速变化。拍尾留白见下方「拍尾留白默认值」（旧统一 320ms 已废）。
- TTS HTTP **优先走 curl + 代理 7897**（Node fetch 不走代理，见记忆 [[fal-use-curl-proxy]]）；如果本机 7897 未监听，`scripts/tts.mjs` 会自动直连重试。凭据取 `api-key.txt`（豆包/火山 APP ID / Access Token）。

### script.json 里怎么写（★ 2026-07-07 改版：一拍一句短句，见 [[08-script-to-video-rules]] 第 1 步）
```jsonc
{ "id": "p1", "sceneId": "s1", "voice": "narrator", "captions": { "zh": "温故而知新，" } }   // 上句一拍；s1 共图（孩子汉服朗读）
{ "id": "p2", "sceneId": "s1", "voice": "narrator", "captions": { "zh": "可以为师矣。" } }   // 下句一拍，同图
{ "id": "p3", "sceneId": "s2", "voice": "narrator", "captions": { "zh": "常复习旧的，" } }   // 不写「妈妈说」等引述词
{ "id": "p4", "sceneId": "s2", "voice": "narrator", "captions": { "zh": "就能悟出新的。" } }
```
> **文案以用户提供为准**（2026-07-07）：不插任何固定引子/转换句/套话，见 [[08-script-to-video-rules]] 第 1 步。
- **每拍（每句短句）单独合成一个 mp3**：TTS 免费，调用次数变多无所谓；换来逐句精确同步。
- **★ 拍尾留白默认值（2026-07-07 定，取代旧统一 320ms）**：分两档——**同场景内拍尾 `tailPaddingMs = 120ms`**（短句间紧凑衔接、像自然换气）；**场景末拍（转场前）280ms**（换画面前多歇半拍，观众消化）。这是优质短视频节奏的起步值，渲染后按听感微调。
> ✅ 已接线：`build.mjs` 按 `beat.voice` → `settings.audio.voices[...]` 传给 `synth`（默认 `narrator`）。当前全片统一 `narrator`。

## 翻译（当地语言，首发越南语）——意译，不直译
- **金句原句**（孩子朗读的文言文）：越南语行走**意译**（传达意思、自然口语），不逐字直译（文言文直译到越南语生硬难懂，2026-07-03 用户确认）。中文原文照常显示，配拼音。
- **讲解/叙述拍**：现代中文 → 越南语**口语化意译**，儿童/宝妈语气，不要翻译腔。
- 配置驱动：`lang=vi/th/...`，加语言只加翻译目标。

## 拼音
- 带声调（ā á ǎ à），按词分隔。渲染层用 `pinyin-pro` 自动注音（见 `src/Video.tsx` 的 `toRuby`）。
- **多音字坑**：行/重/长/得/和/为/矣 等按词义选音；文言文尤其易错，必要时在 `captions.pinyin` 里人工校正覆盖。

## ★ 多音字发音引导（2026-07-08 用户锁定）
- **TTS 也会读错多音字**（实例：「事多难」的「难」被开朗姐姐读成 nàn，应为 nán），拼音字幕对了不等于读音对。
- **规则：写分镜时凡遇多音字，必须主动引导 TTS 发音**——给该拍加 `ttsZh` 字段（仅供合成、不上屏），把多音字换成**同音无歧义的字**（如 难nán→男、行háng→杭）。
- **死命令：`ttsZh` 的汉字数必须与 `captions.zh` 完全一致**——逐字跳字按汉字序号位置对齐时间戳，字数一变卡拉OK就错位。
- 每条视频出片后**逐句听一遍多音字读音**，读错就补 `ttsZh` 重合成该拍（删该拍 mp3+timings 重跑 build，只烧这一句）。

## ★ 字级时间戳 → 逐字跳字（2026-07-07 用户锁定，真机验证通过）
- 用户要做：读到哪个字，哪个字**放大跳一下**（卡拉OK跟读，教学价值高，尤其适合金句）。
- **✅ 锁定机制：火山 TTS 自带字级时间戳**（开朗姐姐 bigtts 实测可用）：
  - 请求：`request` 里加 **`with_timestamp: 1`**（其余请求体不变）。
  - 响应：`addition.frontend.words[]`，每项 `{ word, start_time, end_time }`（毫秒，相对该拍音频开头），TTS 的自然停顿直接体现为相邻字之间的空隙。
  - ⚠️ **标点挂在前一个字上**（如「新，」「矣。」）：入 manifest 前要把 `word` 剥掉标点、只留汉字，与 `captions.zh` 逐字对齐。
  - 接线规则：`synth`/`build.mjs` 把逐字时间写进 manifest（每拍 `charTimings[]`），渲染层据此驱动跳字（见 [[03-remotion-animation]]）；语速 `speed_ratio` 变了时间戳自动跟着变，无需换算。
- 退路（仅个别音色不返回时间戳时）：按整拍音频真实时长逐字加权估算（标点给停顿权重）。🚫 绝不逐字单独合成。见 [[06-open-questions]] #2。

## 背景音乐 / 音效
- **★ 固定 BGM（2026-07-05 用户调整）**：
  - **当前曲子**：`public/library/audio/bgm/peach_haven.mp3` —— 使用用户最新上传 BGM，`config/settings.json → audio.bgm.volume = 0.08`（8%）。视频短只播开头，渲染层低音量循环垫在旁白下。
  - **★★ 禁止用任何 API/fal 生成音乐（用户 2026-07-05 明令）**：BGM 只能**①下载开源真实录音**（如 Wikimedia/CC0/公有领域，音色地道），或**②本地纯代码合成** `python3 scripts/gen-bgm.py`（numpy 合成禅意古琴+磬，固定种子可复现，产物 `guqin-loop.wav`，作备选）。**绝不调用 fal/任何 API 生成音乐**。（旧的 fal 文生乐脚本 `gen-bgm.mjs` 已删。）⚠️ Claude 听不到声音，纯合成盲调难到位——**优先选真实录音**。
  - 接线：`config/settings.json → audio.bgm = { src, volume:0.08 }`；`build.mjs` 写进 `manifest.meta.bgm`；渲染层 `src/Video.tsx` 用 `<Audio loop volume>` **整片低音量循环**，垫在旁白之下。要换音乐只改 config 或替换文件，**不动脚本/代码**。
- 翻页"唰"音效配合转场（待做，占位 `public/library/audio/sfx/`）。

## 关联
[[00-overview]] · [[01-pipeline]] · [[03-remotion-animation]] · [[06-open-questions]] · [[12-video-folder-spec]]
