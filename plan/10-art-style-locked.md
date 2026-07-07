# 10 · 锁定画风 & 出图规范(角色圣经)

> 2026-07-02 用户已锁定画风,并把定稿资产**并入 config 控制台**(不再放 temp)。
> - 定妆图(5 个角色):`config/characters/<id>/model-sheet.png`,id = `boy`(哥哥/儿子) `girl`(妹妹/女儿) `dad` `mom` `dog`
> - **风格锚图**:空镜出图借画风用,取 `settings.image.styleAnchor`(现指向 `config/characters/girl/model-sheet.png`,任一定妆图即可)。

## 一、锁定的画风(治愈系手绘)

- **线条**:粗糙、略毛躁的手绘炭笔/铅笔线,有颗粒、不规整(**不是**干净矢量线)。
- **上色**:暖色蜡笔 / 彩铅填充,笔触可见、不均匀。
- **脸**:极简可爱——小圆点眼睛 + 一点腮红,五官极少,克制、治愈。
- **底**:微纸纹底,白 / 极浅。
- **气质**:温暖、治愈、家庭向。适合越南/泰国、宝妈为核心的日常/道理/短剧。

## 二、角色设定(固定 IP)

| id | 角色 | 体型 | 备注 |
|---|---|---|---|
| `dad` | 爸爸 | 正常身材 | 短发、蓝衬衫、棕裤 |
| `mom` | 妈妈 | **偏胖** | 丸子头、橙上衣 |
| `girl` | 女儿/妹妹 | **偏胖圆脸** | 双马尾、粉裙 |
| `boy` | 儿子/哥哥 | **偏胖** | 金棕短发、绿短袖 + 蓝短裤 |
| `dog` | 小狗 | 圆胖 | 灰白小奶狗 |

- **肤色:白皙(fair light skin,不要小麦色)** ← 用户 2026-07-02 明确要求。
- **合规**:妈妈/女儿/儿子必须胖、爸爸正常;**所有人穿戴整齐,不得露肚/露肤**。

## 三、版式(3:4 竖屏,2026-07-07 改版,取代旧 9:16)

- 画幅 **3:4(1080×1440)**;出图 **3:2 横图**,渲染层合成到 3:4 **上半区**,**下半区放字幕**(拼音/中文/越南文,见 [[03-remotion-animation]])。
- 横图内:主体**居中**,四周留白呼吸感;**不需要**再给字幕留下方空(字幕在图外的下半区)。
- **出图不写任何文字**(字幕后期叠)。

## 四、出图模型 & 调用(关键,见 [[05-cost-and-models]])

**先定"画面里有几个人":严格依据文案/分镜(`script.json` 的 `characters[]`)——文案说几个人就画几个人,不得自己臆造增删。** 角色数决定走哪个模型:

| 画面角色数 | 模型 | fal id | $/张 | 参考 |
|---|---|---|---|---|
| **空镜(0 人)** | FLUX.1 Kontext [pro] | `fal-ai/flux-pro/kontext` | **~$0.04** | `image_url` 喂**风格锚图**(`settings.image.styleAnchor`)，只借画风、绝对不要人；模板 `image-scene.tpl.md` |
| **单角色(1 人/仅 1 个主体)** | FLUX.1 Kontext [pro] | `fal-ai/flux-pro/kontext` | **~$0.04** | `image_url` 喂**该角色 1 张 model-sheet** |
| **多角色(≥2)** | Nano Banana Pro edit | `fal-ai/nano-banana-pro/edit` | **~$0.15** | `image_urls[]` 喂**多张 model-sheet** |

> 🚫 **空镜不要用 nano-banana / flux-dev 文生图**（无锚 → 画风漂移、乱加人）。空镜也走 kontext，喂风格锚图（2026-07-03 实测确定）。

- 🚫 **硬规矩(用户 2026-07-02 锁定)**:**画面里只有单个人物时,禁止使用 nano-banana(pro)——一律走 flux `fal-ai/flux-pro/kontext`。** nano-banana-pro **只**允许在**多角色同框**时用。理由:实测单角色下 flux kontext 更还原定妆图、背景更干净、便宜近 4 倍;单角色即使 $0.04 出得不理想,也**在 flux 内重抽/调提示词**,不许升 nano。
- **新角色/纯风格**(如首次画 dog,画面就它一个)仍属单角色 → 走 flux;确需多张风格锚才走 pro。
- **链路**:一律 **curl + 代理 `http://127.0.0.1:7897`**(Node fetch 直连会超时,见记忆 [[fal-use-curl-proxy]])。Key 取 `api-key.txt` 第 2 行。参数含 `aspect_ratio:"3:2"`(2026-07-07 改版,场景/单人/多人出图一律横图;定妆仍用 `3:4`)、`num_images:1`、`output_format:"png"`。
- ⚠️ **坑**:node 读中文文件名在 .sh 里会 ENOENT → 参考图用 ASCII 名(已放 `config/style/refs/`)。

## 4.4 ★★ 死命令：提示词里绝对不许出现"框/字幕/底部留白"字眼(用户 2026-07-03 锁定)
**画面绝不能出现方框/边框/圆角框/虚线框/字幕占位框。** 根因不是模型爱画框，而是**提示词里提到了它**：
- 扩散模型"**提到什么就画什么**"。写 `box / frame / border / rectangle / panel / subtitle / caption / "empty area at the bottom for subtitles" / "留白给字幕"`，甚至写 `no box / no frame`（负面词），都会诱导它**真的画出一个框或虚线框**。
- ✅ **正确做法**：提示词**根本不提**框、不提字幕、不提"底部留白"。留白靠 **"只画一个不大的主体 + 大片纯色纸背景 + 四周留足边距"** 自然得到。位置用"upper part / upper two-thirds"表达，不描述底部区域。
- 也**不要**放身体部位负面词（`no extra fingers` 等）→ 触发 fal nsfw 黑图。
- 落地：`config/prompts/image-flux.tpl.md`、`image-scene.tpl.md` 已按此重写。**改这两个模板时严禁把上述词加回去。**

## 4.5 场景规矩(★ 用户 2026-07-02 锁定,最重要)

Demo 旧图三大毛病,已废:
1. **背景过度具象/复杂**(如旧 p1 卧室全画满、全上色)→ ❌。
2. **画面里多出方框/圆角框/画框/边框** → ❌ 一个都不许有。
3. **只是把定妆图换个动作、没有场景**(如旧 p3 站着几乎等于定妆图)→ ❌。

**正确做法**:把人物**放进一个具体场景**里(卧室/厨房/客厅…按文案),但**背景只做极简勾勒**——
- 只用**几根松散、很淡的铅笔线**暗示环境(如一条床沿 + 一个窗),**稀疏**,**几乎不上色**,大片留白纸面。
- 背景**必须比人物简单得多**,不得整块painted/铺满细节。
- **人物**照常按治愈手绘风上色、当画面唯一主体焦点。
- 场景要"像人物一样简洁":够点明地点即可,克制。
- 依旧遵守版式:横图主体居中、四周留白(字幕在渲染层下半区,出图不用管,见 三)。

> 已验证:该规矩下 `flux-pro/kontext`($0.04)出图最贴需求(见 `temp/compare/p3-flux.png`)。

## 4.6 ★★ 人物尺寸：所有拍人物一样大(=p6)，靠尺寸归一化(用户 2026-07-03 锁定)
毛病:flux **单人物天生比 p6 双人图里的人大，且每张出图大小都不一样**(实测 80% / 89% / 87% 各不同),纯靠提示词做不到「每个人物都和 p6 完全一样大」。
- ⚠️ **提示词控不住尺寸**:写 "two-thirds / same size / small / wide" flux 照样各画各的大小。**别指望文字统一尺寸。**
- ✅ **真正的机制 = 出图后用 sharp 量+缩(尺寸归一化，确定性、完全一致)**:
  - 出图**一律纯白底**(见 4.8),`build.mjs` 用 `sharp` 把图转 raw 像素,扫出**非白内容的纵向高度占比**(=人物身高占画面比)。
  - 算 `imgScale = charTargetHeight / 实测占比`(`settings.image.charTargetHeight` 默认 **0.66**),写进 manifest。含人物拍(`charIds.length>=1`,含 p6)都归一化到同一目标占比→**所有人物一样大**;空镜(0 人)不缩。
  - `Video.tsx` 把出图 `scale` 乘 `imgScale`,四周露纯白画布(`bgColor #ffffff`)、无缝。
  - **调统一尺寸只改 `config/settings.json` → `image.charTargetHeight` 一个数**。⚠️ 2026-07-07 改 3:2 横图后,旧值 0.66 是按 1:1 方图标定的,**第一条新视频要重新标定**。
- 前提是**白底**:白底才能干净地量出人物轮廓;所以人物拍背景道具别高过人头/低过人脚(否则撑大量到的高度)。

## 4.8 ★★ 死命令：出图一律纯白底(用户 2026-07-03 锁定)
**所有出图背景必须是纯白 `#ffffff`**,不许暖纸/米色/奶油色/纸纹底色。根因:旧 `styleShort` 末尾带 "textured paper"、`composition.md` 写 "very light background"、模板写 "warm off-white paper" → nano/flux 出成奶油色。已全部改成 "clean solid PURE WHITE background"。
- 落地:`scripts/lib/config.mjs` 的 `styleShort`、`config/prompts/{image-flux,image-scene,composition}` 均已锁纯白;`settings.captions.bgColor=#ffffff`。**改这些别把暖纸/米色写回去。**
- 白底同时是尺寸归一化(4.6)的前提——白底才能量出人物轮廓。

## 4.9 ★ 背景按场景设计、极简、别傻(用户 2026-07-03 锁定)
背景要**贴合该拍内容**设计，但**极简克制**，且**永远纯白底**(4.8)。
- ✅ 诵读经典 → 一张矮桌 + 书卷/毛笔几笔淡线;顿悟 → 干净纯白;空镜 → 该比喻的意象(车马/舟)。
- ❌ **别搞傻背景**(用户明确点名):不堆室内桌椅家具(挤、丑)、不无脑套户外草地(傻)、不画四角透视线的"空盒子房间"(傻)。
- 原则:背景**远比人物简单**,一两个小道具点到为止;宁可干净纯白,也别乱塞。道具**别高过人头、别低过人脚**(否则撑大尺寸归一化量到的高度,见 4.6)。

## 4.7 ★★ 死命令：人是"现代小孩穿汉服 + 戴古风小帽",不是古代人/古代场景(用户 2026-07-03 锁定,帽子 2026-07-05 加锁,每日金句方向)
金句短片里朗读的孩子是**当代小孩打扮成汉服**,**不是生活在古代**。
- ❌ 不许写 "ancient Chinese person / ancient times",不许画古代书房、矮几、旧竹简/卷轴那种**古代年代感**场景。
- ✅ 写法:`a MODERN/present-day kid simply dressed up in a hanfu robe (a traditional costume worn for fun over everyday clothes; NOT an ancient person, NOT ancient times)`;道具用**翻开的书**而非旧卷轴;背景**简洁中性**(几笔松散铅笔线 + 大片留白),别做成古代屋子。
- **★ 汉服(全身长袍)+古代书生方帽(2026-07-05 用户锁定,帽型/袍型已明确)**:
  - **★ 帽子只戴在开场朗读金句拍(`role=read-quote`)**:用户 2026-07-05 明令——**只有最开始念古文那(几)拍戴书生方帽**;其它穿汉服的拍(如收尾 payoff)**一律不戴帽、光头露发,只穿长袍**(`shot.content` 写 `bare-headed, NO hat`)。
  - 下面两条只对**戴帽的朗读拍**生效,`shot.content` 必须写清两点：
  - **全身长袍汉服**:`a FULL-LENGTH crossed-collar hanfu robe reaching down to the ankles that completely replaces the everyday clothes`——**点名盖住日常粉裙/T恤短裤**。⚠️ flux 单人易被定妆图(日常装)带偏画回日常衣服(实测 p2 第一版就画成了绿T恤蓝短裤),所以必须强调"长袍到脚踝、替换掉日常衣服"。
  - **方顶书生帽**:`a flat-topped SQUARE black scholar's cap — like a graduation mortarboard / Chinese fāngjīn 方巾 scholar cap that pairs with hanfu, the top-scholar 'graduation' hat`。**方形平顶、像毕业帽/进士方巾**,男孩女孩都戴这一款(别画成圆帽/发冠/珠饰)。
  - 定妆参考图**没帽子且是日常装**,帽子和长袍都靠 `shot.content` 描述补上(kontext/nano-pro 会据此加)。收尾拍若也穿汉服,同样戴、同样长袍。
- 空镜演示(如车马、舟)仍可是古典意象(那是金句比喻本身),但**人物一律现代小孩穿汉服戴书生帽**。
- 落地:`script.json` 各朗读/汉服拍 `shot.content` 已按此改;规则同步进 `config/prompts/storyboard.md` 铁律 9/14。

## 五、提示词模板(拼接:STYLE + CHAR/POSE + SCENE + LAYOUT + NOTEXT)

**STYLE(画风,固定)**
```
hand-drawn healing art style: rough grainy charcoal/pencil outlines, warm uneven
crayon/colored-pencil coloring with visible strokes, subtly textured paper background,
minimal cute faces (tiny dot eyes, small blush), FAIR LIGHT skin, gentle cozy mood.
```

**CAST(多角色 nano-banana-pro/edit 用)**
```
Using the reference images as the EXACT characters (keep each one's face, hair, clothing,
FAIR LIGHT skin and body type): dad normal build; mom, girl and boy all clearly CHUBBY;
+ the grey-and-white puppy dog. Everyone fully clothed and decent.
```
**SCENE(场景,固定 —— 极简勾勒背景,见 4.5)**
```
Place the character INSIDE a real scene: <地点,如 a cozy little bedroom in soft morning light>.
Render the background as an EXTREMELY SIMPLE, LOOSE, MINIMAL rough pencil sketch — only a few
suggestive light outlines (e.g. a bed edge and a window), very sparse, mostly bare off-white
paper, almost NO color in the background. The background must stay FAR simpler than the
character and must NOT be fully painted or detailed. Absolutely NO panel, NO frame, NO border,
NO box, NO rounded rectangle anywhere.
```

**★ 单角色 flux `fal-ai/flux-pro/kontext` 完整提示词(已验证,拼这一串)**
```
Keep the EXACT same character from the reference (same face, hair, clothing, chubby body type)
and the same {STYLE} {CHAR/POSE} {SCENE} {LAYOUT} {NOTEXT}
```
- `{CHAR/POSE}` = 该角色一句话 + 动作,如:`The chubby little girl in a pink sleeveless dress with two small pigtails, standing and speaking sweetly with her little hands together, adorable and proud.`
- 请求体:`image_url`=该角色 model-sheet 的 base64 data URI;`aspect_ratio:"3:2"`、`num_images:1`、`output_format:"png"`。
- 可复现脚本模板:见根 `temp/gen-demo.sh`(单角色 `kontext()`)与本会话 `temp/compare/` 脚本。

**LAYOUT(版式,固定 —— 2026-07-07 改 3:2 横图)**
```
Landscape 3:2 frame: subject in the CENTER, generous empty margins on all sides,
clean solid PURE WHITE background, lots of breathing room.
```
> 旧 9:16 版 LAYOUT(subject upper-middle + empty area below for subtitles)已废——字幕移到画面外下半区,不再需要图内留字幕空;且 "keep empty for subtitles" 本就踩 4.4 红线。
**NOTEXT(固定)**：`Absolutely NO text, NO letters, NO words, NO watermark, NO logo.`

## 六、复现命令(curl + 代理)

```bash
KEY=$(sed -n '2p' api-key.txt | tr -d '\r'); PROXY=http://127.0.0.1:7897
# 多角色: nano-banana-pro/edit, 喂多张 model-sheet
node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
  const refs=["dad","mom","boy","girl"].map(d=>u("config/characters/"+d+"/model-sheet.png"));
  fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_urls:refs,aspect_ratio:"3:2",num_images:1,output_format:"png"}))' "$PROMPT"
curl -s -m 180 -x $PROXY -X POST "https://fal.run/fal-ai/nano-banana-pro/edit" \
  -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json -o temp/resp.json
URL=$(node -e "console.log(require('./temp/resp.json')?.images?.[0]?.url||'')"); curl -s -m 90 -x $PROXY "$URL" -o out.png

# 单角色: flux-pro/kontext, 喂单张 model-sheet
node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
  fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_url:u("config/characters/boy/model-sheet.png"),aspect_ratio:"3:2",num_images:1,output_format:"png"}))' "$PROMPT"
curl -s -m 150 -x $PROXY -X POST "https://fal.run/fal-ai/flux-pro/kontext" \
  -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json -o temp/resp.json
```

## 七、Demo 已落地(2026-07-02)

- 用锁定形象重出了 `public/videos/2026-07/demo/` 的 7 张图(p1..p7,单角色走 kontext、多角色走 pro)。
- 渲染:`src/Video.tsx` 数据驱动——字幕三行**不换行自适配**、组合运镜(`config/motion.json` 预设)、`@remotion/transitions` 转场、按 `beat.effects[]` 叠特效(`src/fx/` 的 Sparkles/LightLeak/Confetti/ThreeParticles)。
- 上量成本优化:用定妆一致图在 fal 云训角色 LoRA,单张压到 ~$0.025。见记忆 [fal 用 curl 走代理]。
