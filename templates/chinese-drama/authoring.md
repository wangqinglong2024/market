# 模板：chinese-drama · 中文情景剧·图文（越南受众）

> **输入物是「一集情景剧脚本」**（我按 base 设计的 `script.json`），不是现成视频、也不是一句金句。
> 生产方式照 [[guoxue-jinju]]（每拍配音 + 每场景 AI 出图 → manifest），版面比例照 [[chinese-learn]]
> （黑底 / 上图 1080×720 / 下三行字幕 360 / 四周 120）。做本模板前先读 base 的 [[00-底层规律]] 与 [[01-创作准则]]。

## 一、这是什么、赢在哪

一个**固定 AI 人设「阿香」**（越南女孩·中企上班）的连续情景短剧。**中文是主角**（不是配角）：
观众冲着「学中文」点进来，视频本身是**自研中文 App 的试用装**，落点引流到 App。

- **变现口 = 中文学习 App**（不是卖课）。所以选题铁律：**吸来的必须是想学中文的人**，且难度可控（初学者能跟上）。
- **格式骨架（每集都走这条）**：
  1. **钩子(1s)**：第一张卡就是最勾人的一句（好奇缺口＋与我有关＋高唤醒），OCR 字幕即钩子。
  2. **情景冲突**：阿香在真实职场场景遇到一句听不懂/听错的中文。
  3. **3 个核心句**：本集要教的中文，藏在剧情里，难度贴初学者。
  4. **汉越词/声调梗**：把「tân khổ=辛苦」这类**汉越词**当社交货币（"你越南语其实早会"），或声调翻车当笑点。
  5. **CTA＋回环**：「点主页跟我学，明天见」——具体理由的行动号召＋追更钩子。
- **人设/发音/汉越词是零件不是主线**：汉越词当开场钩子、发音纠错当固定小栏目、"越南人常犯的错"当社死梗，
  都塞进剧情当调料，别单独撑一集（novelty 会衰减）。

## 二、女主阿香（★ 用户锁定：要很美）

- 定妆图 `characters/ahxiang/model-sheet.png`（webtoon 半写实、精致五官、白衬衫+深色裙）。**每集每拍都喂它当参考**，锁死同一张脸/发型/衣服——这是 AI 情景剧唯一的真难点，靠定妆图+flux/kontext 解决。
- 外观 canon 在 `characters/ahxiang/canonical.md`，每拍逐字复用防漂移。**换装/换发型**才在该拍 shot 里覆盖描述。
- 世界观：来中国/中企打工 + 慢热恋爱副线（打工线给变现动机、恋爱线给情绪）。选题取之不尽：面试、第一天、被老板骂、点外卖、发工资、暗恋对象加微信……

## 三、版面（固定，照 chinese-learn 比例）

画布 **1080×1440（3:4）**，纯黑底 `#000000`（TikTok FYP 风）：

```
[黑底留白 120]
[AI 图 1080×720  ← cover 裁切，场景内连续运镜]
[间隙 120]
[字幕区 1080×360  ← 拼音行 / 中文行(逐字卡拉OK) / 越南语行]
[黑底留白 120]
```

layout=`chinese-drama`（`src/layouts/chinese-drama.tsx`）。上图场景共图连续运镜，下方拼音+中文逐字跳字卡拉OK（火山字级时间戳驱动）＋越南语一行。

## 四、script.json 格式（一拍=一句短句）

```jsonc
{
  "videoId": "ahxiang-day1", "lang": "vi",
  "beats": [
    {
      "id": "p01", "role": "hook", "voice": "narrator",
      "sceneId": "s1-door",            // 同 sceneId 连续拍共用一张图
      "hasMainCharacter": true, "characters": ["ahxiang"],
      "motion": "push-in",             // 省略则按 motion.json 关键词规则命中
      "transitionIn": "fade",          // 仅场景首拍;段间转场
      "effects": [{ "type": "comicPops", "words": ["?","?!"] }], // 可选,≤2/片
      "shots": [{ "content": "英文画面描述(喂出图)", "model": "flux", "weight": 1 }],
      "captions": {
        "zh": "上班第一天，一句中文差点让她辞职",   // 音频读这句(中文=学习内容)
        "pinyin": "shàng bān dì yī tiān ...",       // 空格分隔,音节数=汉字数才生效,否则自动注音
        "local": "Ngày đầu đi làm, ..."             // 越南语行(受众母语,写成钩子/地道口语)
      }
    }
    // ... 同 sceneId 的后续拍只写 captions(复用首拍的图/运镜)
  ]
}
```

- **voice**：`narrator`(旁白/钩子/CTA,speed=narratorSpeed) / `ahxiang`(女主) / `boss`(经理) / `colleague`。映射在 `template.json → audio.voices`。
- **出图路由**：`hasMainCharacter=false`→空镜(喂风格锚图,flux)；1 个角色→flux(喂定妆图 $0.04)；≥2 角色同框→nano-pro($0.15，**一条视频最多 1 次**)。省钱：多用单人特写/空镜。
- **场景共图**：出图数 = 场景数，不是拍数。
- **多音字**：给该拍加 `ttsZh`（只供合成、不上屏；汉字数必须与 `captions.zh` 一致），出片后逐句听。
- **翻译**：越南语一律**意译、地道口语**，非直译（[[01-创作准则]] 六）。汉越词/文化梗写进 `local` 当社交货币。

## 五、特效（克制，≤2/片）

`src/fx/` 开放可扩展。情景剧常用：`comicPops`(困惑/惊讶的 ?!)、`emojiRain`(顿悟的 ✨💡)。落在情绪高点，别抢字幕主视觉。

## 六、制作步骤

1. 建 `public/videos/<shard>/<id>/`，按第四节写 `script.json`（**这是最关键的一步**：按 base 设计钩子/悬念/落点）。
2. `catalog.json` 加条目（`template: "chinese-drama"`）。
3. 新角色需先出定妆图：`characters/<id>/model-sheet.png`（flux-text 出一张干净参考，见下「出图链路」）。
4. `FAL_PROXY=http://127.0.0.1:7897 node scripts/build.mjs <id>` → TTS + 出图 + manifest。
5. Remotion Studio(:3000) 预览，逐句听多音字，走 [[01-创作准则]] 八自检。
6. **出封面**（[[03-流水线与manifest]] 七）：挑最有戏的一张场景图 → `cover.json`（中文钩子大字＋越南语钩子）→ 渲染 `<中文名>-封面.png`。
7. **渲染成片** → `mv` 成 `<中文名>.mp4`（交付物用中文名，文件夹用英文 id，见 [[02-系统架构]] 五）。

## 七、出图/下载链路（★ 本机注意）

- **fal 走 curl + 代理**，但本机 Clash 端口是 **7897**（不是 gen-image.mjs 默认的 7890）→ build 时加 `FAL_PROXY=http://127.0.0.1:7897`。
- **fal 结果图在 CDN 主机 `fal.media`**：Windows curl 走 schannel 无法完成该主机 TLS 握手 → 已改 `scripts/gen-image.mjs` 用 **node fetch 直连**下载（带多次重试）。下载非计费，此修不违反 fal 铁律。
- **fal 花钱铁律**（[[04-成本与铁律]]）：出图不满意**禁止擅自重试**，先问用户。TTS/ASR/渲染/改脚本免费可重跑。
- 成本：单人 flux $0.04 × 场景数 + 定妆图一次。首集 5 场景≈$0.20 + 定妆图 $0.06。

## 八、可调项（template.json）

- `source.region` / `subtitle`：图区与字幕区位置高度。
- `captions`：三行颜色/字号/间距、`karaokeColor` 跳字高亮、`dimColor` 未读色。
- `audio.voices` / `speed` / `narratorSpeed` / `tailPaddingMs`。
- `fonts`：中文默认 SimHei（情景剧走现代感，非毛笔体）。
- `image.styleAnchor`：空镜借画风的风格锚图（默认阿香定妆图）。

## 关联
[[00-底层规律]] · [[01-创作准则]] · [[02-系统架构]] · [[03-流水线与manifest]] · [[04-成本与铁律]]
