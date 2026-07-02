# 10 · 锁定画风 & 出图规范(角色圣经)

> 2026-07-02 用户已锁定画风,并把定稿资产**并入 config 控制台**(不再放 temp)。
> - 定妆图(5 个角色):`config/characters/<id>/model-sheet.png`,id = `boy`(哥哥/儿子) `girl`(妹妹/女儿) `dad` `mom` `dog`
> - 风格参考(用户手绘,ASCII 名):`config/style/refs/ref-1.jpg`、`config/style/refs/ref-2.jpg`
> - 全家合照(抱团款):`config/style/family.png`

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

## 三、版式(9:16 竖屏,短视频安全区)

- 顶留白 = 底留白(平台 UI 遮挡安全区)。
- 人物在**中上部**;人物**正下方留一大块空**(放字幕带:拼音 / 中文 / 越南文,3 行**不换行**,见 [[03-remotion-animation]])。
- 左右适当留白。**出图不写任何文字**(字幕后期叠)。

## 四、出图模型 & 调用(关键,见 [[05-cost-and-models]])

按**画面角色数**分流,便宜优先:
- **单角色** → `fal-ai/flux-pro/kontext`(**~$0.04**),`image_url` 喂**该角色 1 张 model-sheet**。
- **多角色** → `fal-ai/nano-banana-pro/edit`(**~$0.15**),`image_urls[]` 喂**多张 model-sheet**。
- **新角色/纯风格**(如首次画 dog) → `nano-banana-pro/edit` 喂 `config/style/refs/*` 当风格锚。
- 若 $0.04 出来长相/画风不对 → 升到 `nano-banana-pro/edit`。
- **链路**:一律 **curl + 代理 `http://127.0.0.1:7897`**(Node fetch 直连会超时)。Key 取 `api-key.txt` 第 2 行。参数含 `aspect_ratio:"9:16"`(定妆用 `3:4`)、`num_images:1`、`output_format:"png"`。
- ⚠️ **坑**:node 读中文文件名在 .sh 里会 ENOENT → 参考图用 ASCII 名(已放 `config/style/refs/`)。

## 五、提示词模板(拼接:STYLE + CAST/POSE + LAYOUT + NOTEXT)

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
**单角色 kontext 用**：`Keep the EXACT same character (same face/hair/clothing/body type) and same STYLE. Scene: <动作/场景>.`

**LAYOUT(版式,固定)**
```
Vertical 9:16 frame: subject in the UPPER-MIDDLE, EQUAL empty margins top and bottom,
a LARGE clean EMPTY area BELOW the subject (keep empty for subtitles), empty left/right
margins, plain light paper background, lots of breathing room.
```
**NOTEXT(固定)**：`Absolutely NO text, NO letters, NO words, NO watermark, NO logo.`

## 六、复现命令(curl + 代理)

```bash
KEY=$(sed -n '2p' api-key.txt | tr -d '\r'); PROXY=http://127.0.0.1:7897
# 多角色: nano-banana-pro/edit, 喂多张 model-sheet
node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
  const refs=["dad","mom","boy","girl"].map(d=>u("config/characters/"+d+"/model-sheet.png"));
  fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_urls:refs,aspect_ratio:"9:16",num_images:1,output_format:"png"}))' "$PROMPT"
curl -s -m 180 -x $PROXY -X POST "https://fal.run/fal-ai/nano-banana-pro/edit" \
  -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json -o temp/resp.json
URL=$(node -e "console.log(require('./temp/resp.json')?.images?.[0]?.url||'')"); curl -s -m 90 -x $PROXY "$URL" -o out.png

# 单角色: flux-pro/kontext, 喂单张 model-sheet
node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
  fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_url:u("config/characters/boy/model-sheet.png"),aspect_ratio:"9:16",num_images:1,output_format:"png"}))' "$PROMPT"
curl -s -m 150 -x $PROXY -X POST "https://fal.run/fal-ai/flux-pro/kontext" \
  -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json -o temp/resp.json
```

## 七、Demo 已落地(2026-07-02)

- 用锁定形象重出了 `public/videos/2026-07/demo/` 的 7 张图(p1..p7,单角色走 kontext、多角色走 pro)。
- 渲染:`src/Video.tsx` 数据驱动——字幕三行**不换行自适配**、组合运镜(`config/motion.json` 预设)、`@remotion/transitions` 转场、按 `beat.effects[]` 叠特效(`src/fx/` 的 Sparkles/LightLeak/Confetti/ThreeParticles)。
- 上量成本优化:用定妆一致图在 fal 云训角色 LoRA,单张压到 ~$0.025。见记忆 [fal 用 curl 走代理]。
