# 脚本（script.json）编写规范（chuanyue-drama）

> Claude 按 `story/episodes/E**.md` + `00-bible.md` 把一集设计成 `script.json`（beats 数组），
> build.mjs 逐拍配音 + 出关键帧 +（动态拍）出 I2V 视频 → manifest。上位法 `/base/01`、`/base/03`。

## 一、混合语言（★用户 2026-07-18 锁）
- **旁白 = 越南文**：`voice:"narrator"`（vi_ 音色），读 `captions.local`。
- **角色对白 / 女主内心 = 中文**：`voice:"<角色id>"`（zh_ 音色），读 `captions.zh`；
  内心拍加 `inner:true`（字幕加 💭，音色同该角色）。
- build 按音色前缀 `vi_`/`zh_` 自动判定合成哪种语言，无需在脚本另标。

## 二、beat 字段
```jsonc
{
  "id": "b01",
  "sceneId": "s1-hongtou",        // 同 sceneId 共用一张关键帧(省钱);首拍带 shots
  "type": "video",                 // ★动态拍=video(kling I2V);缺省=图文(静态关键帧)
  "voice": "narrator",             // narrator=vi旁白 / 角色id=zh对白
  "inner": false,                  // 中文内心独白拍=true(字幕💭)
  "hasMainCharacter": true,
  "characters": ["zhaohua"],       // 出场角色id(决定喂哪张定妆图/出图人数路由)
  "motion": "push-in",             // 图文拍的 Remotion 运镜预设(motion.json)
  "transitionIn": "fade",
  "shots": [                        // 仅"场景首拍"必带(生成关键帧用)
    { "content": "英文画面描述:动作+服装+场景+机位(露腿场景化)", "model": "flux" }
  ],
  "video": {                        // 仅 type:"video" 带:I2V 运动描述
    "motion": "英文运动描述(只写动作/表情/环境动态,不重描外观)",
    "camera": "push-in",
    "durationSec": 4,               // 3–5 整数秒
    "keyframeFrom": "b01"           // 用哪一拍的关键帧作输入图(缺省=本拍)
  },
  "captions": {
    "zh": "你不怕我，为什么",        // 中文行(与中文配音逐字一致)
    "pinyin": "nǐ bú pà wǒ ,wèi shén me",
    "local": "Sao cô không sợ ta"   // 越南文行(意译口语)
  },
  "ttsZh": "你不怕我为什么"          // 可选:多音字/断句引导,汉字数须=captions.zh
}
```

## 二·五、★多维度留人（用户 2026-07-18 锁，最高优先级）
**留人不只靠台词/剧情，画面设计 + 动作设计 + 情绪设计要一起上，逐拍制造"想看下一拍"的理由。**
写每一拍时，三个维度都要问一遍：
- **剧情维度**：这拍有没有钩子/悬念/反转/信息升级？观众凭什么不划走？
- **画面维度（写进 `shot.content` / `video.motion`）**：构图有没有冲击力？特写/怼脸/极端机位/强光影/名场面？
  第一帧就要抓眼——不给平淡过场，不给"两人站着说话"的呆板中景。
- **动作维度（尤其动态拍）**：有没有一个**强动作/强反应**制造惊讶或紧张？（掀盖头、骤睁眼、抓腕、
  拦毒、护身、瞳孔收缩、手一颤……）动态拍的价值就在动作，别浪费成"轻微飘动"。
- **情绪目标**：每拍标一个想激起的情绪（惊恐/好奇/危险/心动/爽/愤怒/揪心），没有情绪目标的拍=流失点。
- 开场前 3 秒尤其要三维叠加（画面冲击 + 强动作 + 高唤醒情绪 + 旁白钩子），单维不够。

## 三、动态 vs 图文分配（落地 bible 六）
- **前 3 秒必是 `type:"video"`**（开场钩子）。
- 每集动态拍 **≥3 段**（钩子 + 反转/情绪高点 + 末尾钩），**禁止连续 >2 拍纯图文**。
- 动态拍的关键帧优先**复用**邻近图文拍的关键帧（`video.keyframeFrom`），少出一张图省钱。
- 动态 `generate_audio=false`（关声，见 render-rules 7 / video.tpl.md）。

## 三·五、关键帧参考图选择（★露腿/正常/现代，用户 2026-07-18 锁）
每个出场角色按**本拍场景**选喂哪张定妆图作 nano-banana-pro/edit 的参考（`shot.refVariant` 或 `characters` 项）：
- **需要露腿的场景**（沐浴/寝衣薄纱/涉水/受伤裹伤/习武短打/舞姬/高开衩骑装）→ 传该角色 **`model-sheet-legs.png`**（露腿版）作标准。
- **正常场景**（正式/朝堂/见长辈/日常）→ 传 **`model-sheet.png`**（端庄版）。
- **女主现代闪回/冷开场** → 传 **`model-sheet-modern.png`**（现代法医版）。
- 字段：`shot.refVariant: "default" | "legs" | "modern"`（缺省 default）。build 按此解析参考图路径。
- 三版脸已锁同一人（edit 保脸），换版不换脸；`{shot}` 里仍现写该场景的服装/动作/机位。

## 四、共图与切拍
- 长句拆多拍，同一画面的连续拍共用 `sceneId`（只出一张关键帧）。
- 一屏一句短句；中文↔越南文逐句对应；三行卡拉OK。

## 五、成本自检（写完脚本先算，必 ≤$2）
- 统计：动态总秒数×$0.084 + 独立关键帧数×$0.04 + 定妆(若新角色)×$0.06 + 封面$0.04。
- 超预算：先砍/降级一段动态为图文推镜，再谈。多人拍收敛到 ≤1 次 nano-pro。
