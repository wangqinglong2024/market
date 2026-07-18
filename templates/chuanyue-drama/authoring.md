# `chuanyue-drama`（《凰谋》）· 作者指南与生产流程

现代顶级女法医穿越成罪臣之女、被送进摄政王府"冲喜"的古装权谋爱情复仇连续剧。
面向越南受众，竖屏 **~30–45s/集（短档，完播率优先，用户 2026-07-18 锁）**，默认**图文 + 动态视频（kling I2V）混搭**（全可灵版另见「生产模式」），前 3 秒必是动态钩子。
旁白越南语、角色对白中文、字幕三行拼音/中文/越南语逐字卡拉OK。

## 唯一事实源（续写/生产只读这些）
1. `story/总纲.md`（整体总述：世界观·主角·人设铁律·结构标准·1200集12卷脉络）
2. `story/卷NN-*/卷总述.md`（该卷 100 集总述）
3. `story/卷NN-*/第MM章-*.md`（每章 10 集内容；卷1第1章 = E001–E010 已写满剧本）
4. `characters/`（角色 canonical + 定妆图：端庄版/露腿版/现代版，全 nano-banana-pro，同脸锁定）
5. `prompts/`（出图/出视频规范：全部 nano-banana-pro，已弃 flux）

旧模板（chinese-drama / 毒嫁 / 灵兰）的角色、故事、图、prompt **一律不得反向污染**。

## 生产模式（混搭 vs 全可灵）· 默认铁律（用户 2026-07-18 锁）
- **用户没点名版本 = 默认走「混搭版」**：图文拍(静态关键帧) + 部分动态拍(kling I2V)交替，前几秒动态钩子。成本低(~$2.5/集)。
- **用户明确说「全可灵版」才走全动态**：12 拍**全部 type:video**、每拍关键帧→kling I2V。成本高(~$4.4/集)。
- 全可灵版做法：新建 `<id>-kling/` 文件夹与 catalog 条目，脚本每拍加 `type:"video"`+`video{motion,camera,durationSec}`，沿用相同 sceneId/关键帧/音频，把已有 clip 复用进去，build 只补缺的 clip（见 [[chuanyue-i2v-keyframe-required]]）。
- 两版并存不互删，供对比。

## 生产链路（一集怎么长成成片）
```
episodes/E***.md  →  script.json(Claude 设计,字段见 prompts/script-rules.md)
  → build(ctx):  每拍 TTS(火山,旁白vi/角色zh) + 每场景关键帧(nano-banana-pro/edit,喂定妆图,3:2)
                 + 动态拍(type:video)用关键帧走 kling I2V(★关原声,喂图裁16:9/收片裁回3:2) → manifest.json
  → Remotion 渲染(layout=chuanyue-drama,上媒体区图/视频 + 下三行字幕) → <中文名>.mp4
  + 海报封面(见下) → <中文名>-封面.png
```
命令：`node scripts/build.mjs <videoId>`（先在 catalog.json 建记录，template=chuanyue-drama）。

## 出图 / 出视频规范（★必读）
- 全部见 `prompts/render-rules.md`（铁律）、`prompts/video.tpl.md`（★I2V 运动提示词）、
  `prompts/image-*.tpl.md`、`prompts/portrait.tpl.md`、`prompts/script-rules.md`。
- 记住三条：① 外观锁在关键帧、视频 prompt 只写运动；② `generate_audio=false` 关原声；
  ③ 一图一正脸、全片≤1 次多人 nano-pro。

## 成本铁律（单次 build 硬卡 $3，用户 2026-07-18 提高）
- 预算表：kling 动态 秒数×$0.084 + 关键帧(nano-banana-pro/edit)×$0.15 + 海报封面(nano 3:4)×$0.15。
- 单集参考：**混搭版 ~$2.5**、**全可灵版 ~$4.4**（★全可灵从零单次构建会撞 $3 硬卡→复用已有关键帧/clip 分次构建，见「生产模式」）。
- build 内置预算硬卡：**单次运行**累计新花费超 `budget.maxUsdPerEpisode`（$3）立即抛错停止（缓存命中不计费）。
- **fal 出问题（黑图/漂移/换脸/画错）禁止自动重试**，先报用户、同意后再调（`/base/04`）。

## 双人工闸门（花钱前）
1. 设计阶段（免费）：写故事、script.json、prompt、成本预检——本轮止于此，等用户审。
2. 定妆阶段：出角色定妆图（nano-banana-pro 文生图），**逐张人工验脸**锁定后才继续。
3. 生产阶段：用户明确批准后才出关键帧 + kling 动态 + 渲染成片。
4. 每个付费资产**最多尝试一次**，失败重新向用户说明、经同意再调。

## 封面规则（★海报式·完整自足流程，用户 2026-07-18 锁；本节即唯一事实源，不要再翻旧版本）

每集封面 = **一张海报式竖图**（不是抽视频帧）。三步：出海报底图 → 写 cover.json → 渲染。

**① 出海报底图 `images/poster.png`（fal 付费，~$0.15，计入预算，一次不重试）**
- 模型 `nano-banana-pro/edit`，**喂女主定妆图**（`characters/zhaohua/model-sheet.png`）保脸；`aspect_ratio="3:4"` 竖版。
- 用 `scripts/gen-image.mjs` 的 `genImage({ outPath, prompt, refPaths:[女主定妆图], settings:{image:{aspectRatio:"3:4"}}, model:"nano-edit" })`。
- prompt：**紧扣本集主题的关键视觉**，女主+核心道具/场景，电影级真人质感、暖烛光、浅景深；**绝不与正片某一帧重复**；露腿服从场景合理化。
- ★铁律：prompt 里**绝不写任何文字/字幕/边框/留白**（文字全靠 cover.json 后期叠）；单张一正脸。

**② 写 `cover.json`（放视频目录；下面是 E01 实拍值当范例，字段照抄）**
```jsonc
{
  "image": "videos/<shard>/<id>/images/poster.png",
  "focusY": 0.3,                                  // 底图纵向裁切锚点，让女主脸落在安全区
  "tag": "凰谋",                                   // 系列名(中文)
  "tagVi": "Vương Phi Pháp Y",                    // 系列名(越南语,底部小字)
  "seal": "E01",                                  // 红印章集号
  "volume":  { "zh": "卷一 · 冲喜入府", "vi": "Quyển 1 · Xung Hỷ Nhập Phủ" },  // 卷标题
  "chapter": { "py": "dòng fáng jīng hún", "zh": "洞房惊魂", "vi": "Kinh hồn đêm tân hôn" }, // 章主题名(金色大字·三语;此为 E01 实拍值)
  "episode": { "py": "...", "zh": "当集钩子(红条大字)", "vi": "..." }             // 当集钩子(底部红条·三语)
}
```

**③ 渲染成图**
```
node_modules/.bin/remotion still src/index.ts cover-drama "<dir>/<中文名>-封面.png" --props=<dir>/cover.json
```
- ★组件=`src/CoverDrama.tsx`、composition id=**`cover-drama`**（就是上面 volume/chapter/episode/seal 这套 schema）。
- **别用**简版 `cover`/`src/Cover.tsx`（那套只有 title/subtitle，不是本模板的封面）。
- 版面层级：系列名+红印章E号 / 卷标题 / 章主题(三语·金字) / 当集钩子(三语·红条)。

**产物**：`cover.json` + `images/poster.png` + `<中文名>-封面.png`，放该视频目录。
**★两版视频(混搭 / 全可灵)共用同一封面**：底图/cover.json/封面PNG 拷一份到 `<id>-kling/` 即可，不重出。

## 交付命名（全局规则 /base/02 五）
- 文件夹用英文 id；成片 `<中文名>.mp4`、封面 `<中文名>-封面.png`（如「凰谋E01·洞房惊魂」）。
- mp4 一律 gitignore，只本地生成/预览/交付。

## 出片前逐句体检（免费必做）
- 逐句听多音字读音，读错补 `ttsZh` 引导字段重合成该拍（只烧这一句）。
- 过一遍 `/base/01` 自检清单：3 秒钩子、悬念后置、每 3 秒变化、回环、本地化三关。
