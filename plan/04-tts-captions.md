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
- 全部 HTTP **走 curl + 代理 7897**（Node fetch 不走代理，见记忆 [[fal-use-curl-proxy]]）。凭据取 `api-key.txt`（豆包/火山 APP ID / Access Token）。

### script.json 里怎么写
```jsonc
{ "id": "p1", "voice": "narrator", "captions": { "zh": "温故而知新，可以为师矣。" } }   // 画面：女儿古装朗读；声音仍是旁白
{ "id": "p2", "voice": "narrator", "captions": { "zh": "常复习旧的，就能悟出新的。" } }   // 不写「妈妈说」等引述词
{ "id": "p3", "voice": "narrator", "captions": { "zh": "夜里，他又翻开那本旧书……" } }
```
> ⚠️ **待改代码**：`build.mjs` 现在 `synth(zh, path, { voice: undefined })` 恒用开朗姐姐；改为读 `beat.voice` → `settings.voices[beat.voice]` 传给 `synth`。

## 翻译（当地语言，首发越南语）——意译，不直译
- **金句原句**（孩子朗读的文言文）：越南语行走**意译**（传达意思、自然口语），不逐字直译（文言文直译到越南语生硬难懂，2026-07-03 用户确认）。中文原文照常显示，配拼音。
- **讲解/叙述拍**：现代中文 → 越南语**口语化意译**，儿童/宝妈语气，不要翻译腔。
- 配置驱动：`lang=vi/th/...`，加语言只加翻译目标。

## 拼音
- 带声调（ā á ǎ à），按词分隔。渲染层用 `pinyin-pro` 自动注音（见 `src/Video.tsx` 的 `toRuby`）。
- **多音字坑**：行/重/长/得/和/为/矣 等按词义选音；文言文尤其易错，必要时在 `captions.pinyin` 里人工校正覆盖。

## 关键待查：字级时间戳
- 火山 TTS 是否返回**字/词级时间戳**：有 → 中文逐字高亮（卡拉OK跟读，教学价值高，尤其适合金句）；无 → 整句淡入淡出。见 [[06-open-questions]]。

## 背景音乐 / 音效
- 轻柔国风/治愈 BGM（可商用/无版权源）。翻页"唰"音效配合转场。

## 关联
[[00-overview]] · [[01-pipeline]] · [[03-remotion-animation]] · [[06-open-questions]] · [[12-video-folder-spec]]
