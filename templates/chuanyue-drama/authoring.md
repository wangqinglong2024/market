# `chuanyue-drama`（《凰谋》· 12秒全可灵中越）· 作者指南与生产流程

现代顶级女法医穿越成罪臣之女、被送进摄政王府"冲喜"的古装权谋爱情复仇连续剧。面向越南受众，竖屏 3:4。
**本模板自包含（2026-07-19 由 chuanyue-drama 独立而来，不依赖任何其它模板）。★只有一个模式：12 秒全可灵中越。**

## ★唯一模式：12s 全可灵中越（不带任何其它模式）
- **6 拍全动态**：每拍 `type:"video"`（kling I2V，关原声）。build 会校验，出现图文软拍直接抛错。
- **12 秒短档**：时长由每拍真实 TTS 总和（减转场重叠）自然得出，落 10–14s；每 3 秒都要有开场级视觉冲击（不是只有开头）。
- **语言=中越**：旁白越南语（`narrator`/vi 音色，读 `captions.local`）；角色对白+女主内心中文（zh 音色，读 `captions.zh`，内心 `inner:true`→💭）。**对白永远中文**。
- **语速加快**：中文 `speed=1.2`、越南语 `viSpeed=1.2`（template.json 默认；`script.speed`/`script.viSpeed` 可本片再覆盖）。
- **前 3 秒引导标**：顶部留白处「看短剧学中文」对话框气泡（**越南语大字在上、中文小字在下、逐字对照**），由 `script.badge`（textVi/textZh/pairs/durationMs）注入。
- **字幕安全区**：左右各留白 12%（`captions.sidePad=130`），避开平台点赞/分享按钮遮挡。

> 混搭 / 30s / 中英 / 纯图文等模式**本模板一律不做**。要那些去别的模板。

## 唯一事实源（续写/生产只读这些，全在本模板目录内）
1. `story/总纲.md`（世界观·主角·人设铁律·结构标准·1200集12卷脉络）
2. `story/卷NN-*/卷总述.md`（该卷 100 集总述）
3. `story/卷NN-*/第MM章-*.md`（每章 10 集内容）
4. `characters/`（角色 canonical + 定妆图：端庄版 model-sheet / 露腿版 model-sheet-legs / 现代版 model-sheet-modern，全 nano-banana-pro，同脸锁定）
5. `prompts/`（出图/出视频规范：全部 nano-banana-pro，已弃 flux）

## 生产链路（一集怎么长成成片）
```
每章 md 选一集 → Claude 设计 script.json(6拍全动态,字段见 prompts/script-rules.md)
  → build(ctx): 每拍 TTS(火山,旁白vi/角色zh) + 每场景关键帧(nano-banana-pro/edit,喂定妆图,3:2)
                + 每拍 kling I2V(关原声,喂图裁16:9/收片裁回3:2) + 注入 badge → manifest.json
  → Remotion 渲染(layout=chuanyue-drama) → <中文名>.mp4  + 海报封面(cover-drama) → <中文名>-封面.png
```
命令：`node scripts/build.mjs <videoId>`（先在 catalog.json 建记录，`template: "chuanyue-drama"`）。
**★花钱前先只出关键帧图片人工审：`KEYFRAMES_ONLY=1 node scripts/build.mjs <videoId>`（跳过 kling），审图通过后去掉该变量再跑（图缓存不重扣）。**

## 出图 / 出视频规范（★必读）
- 全部见 `prompts/`：`render-rules.md`(铁律)、`video.tpl.md`(★I2V 运动提示词)、`image-*.tpl.md`、`script-rules.md`。
- 三条铁律：① 外观锁在关键帧、视频 prompt 只写运动；② `generate_audio=false` 关原声；③ 一图一正脸、全片 ≤1 次多人 nano-pro（抓腕/同框优先单脸+另一人只入手/背影）。
- 关键帧参考图：露腿场景喂 `model-sheet-legs.png`、现代闪回喂 `model-sheet-modern.png`、其余端庄 `model-sheet.png`（`shot.refVariant: "legs"|"modern"|"default"`）。

## 成本铁律（单次 build 硬卡 $3）
- 12s 全可灵参考：关键帧 6×$0.15=$0.90 + kling 6×3s=$1.51 + 海报 $0.15 ≈ **$2.56 ✅**。
- build 内置预算硬卡：单次运行累计新花费超 `budget.maxUsdPerEpisode`（$3）立即抛错停（缓存命中不计费）。
- **fal 出问题（黑图/漂移/换脸/画错）禁止自动重试**，先报用户、同意后再调；每个付费资产最多试 1 次。

## 双人工闸门（花钱前）
1. 设计阶段（免费）：写 script.json、prompt、成本预检——止于此，等用户审。
2. **关键帧阶段（新）：`KEYFRAMES_ONLY=1` 只出关键帧图片，人工看脸/服装/构图/景别，满意后才出 kling。**
3. 生产阶段：用户批准后出 kling 动态 + 渲染成片。

## 封面规则（★海报式，与正片不重复）
每集封面=一张海报式竖图。① 出底图 `images/poster.png`（`nano-banana-pro/edit` 喂女主定妆图，`aspect_ratio="3:4"`，本集主题关键视觉，露腿服从场景合理化，**prompt 绝不写任何文字/边框**）→ ② 写 `cover.json`（放视频目录，字段照抄 E02）→ ③ 渲染：
```
node_modules/.bin/remotion still src/index.ts cover-drama "<dir>/<中文名>-封面.png" --props=<dir>/cover.json
```

## 交付命名
- 文件夹用英文 id；成片 `<中文名>.mp4`、封面 `<中文名>-封面.png`（如「凰谋E02·装病的王爷-全可灵12秒版」）。mp4 一律 gitignore，只本地生成/交付。

## 出片前逐句体检（免费必做）
- 逐句听多音字读音，读错补 `ttsZh` 引导字段重合成该拍（只烧这一句）。
- 过一遍：3 秒钩子、每 3 秒变化、悬念后置、末尾追更钩、本地化三关。
