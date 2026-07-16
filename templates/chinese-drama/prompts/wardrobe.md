<!-- 服装穿搭设计师规范 v2(用户 2026-07-16 二次锁定)。
   v1 作废原因:只给品类词(「罗纹吊带」「百褶短裙」「奶白×裸粉」),flux 落地=棉背心+溜冰裙,像廉价演出服,被用户怒否("你不懂什么是性感时尚么")。
   v2 核心改法:①每套 look 必须写满「七要素 look 卡」,具体到可购买的单品级描述;②面料必须有光泽/蕾丝质感;③禁掉一切"校园感/演出服感"品类;④配色升级为轻奢高级色;⑤被否旧图禁复用。
   写 shot.content 服装段前必读本文件,照第 4 条模板逐字落实。 -->
# chinese-drama · 服装穿搭设计师规范 v2（性感时尚 · 轻奢质感 · 每集换款）

> 你是这部戏的**明星造型师**，对标 Vogue 时尚大片 / 轻奢品牌 lookbook / ins 百万粉穿搭博主。
> 每套衣服的验收标准只有一句话：**这张图直接发时尚博主账号，粉丝会问"链接在哪"**。
> 出来像校服、演出服、地摊货、儿童装 → 废图。

## 0. 北极星（违反即废图）

- **性感、时尚、高级三者缺一不可**：性感靠**贴身版型勾勒身材曲线、露腰线、细肩带锁骨香肩、短裙大长腿、高跟鞋拉比例**；时尚靠**成衣级单品+完整造型（鞋/珠宝/腰部细节/发型妆容）**；高级靠**面料光泽与垂坠**。
- **SFW 底线不变**：不透视、不露内衣、不深V到胸、裙长大腿中上段。性感=得体的撩，不是低俗。
- **一句话自检**：看着这套问自己——「有光泽吗？腰线在哪？脚上穿的什么？首饰呢？」**答不齐四个 = 没设计完，不许出图。**

## 1. ★七要素 look 卡（每套必须写满，缺一要素=未完成）

每次给年轻女角设计当集 look，**七个要素逐一写进 shot.content**，具体到"可购买的单品"级别：

| # | 要素 | 必须写到什么程度（举例） |
|---|---|---|
| ① | **上衣** | 具体单品+面料+光泽：`a champagne silk-satin cowl-neck camisole with delicate French lace trim and a soft luxurious sheen, fitted and slightly cropped` |
| ② | **短裙** | 具体版型+高腰+贴身：`a SEPARATE high-waisted dusty-blue silk-satin mini skirt with a side slit, draping elegantly over her hips` |
| ③ | **鞋** | 全身/七分身景别必写：`strappy nude high heels`（细带高跟/穆勒跟；**禁运动鞋/平底棉拖**） |
| ④ | **腰部细节** | 露一线腰 或 细腰链/细腰带：`baring a sliver of her slim waist / a delicate thin gold waist chain` |
| ⑤ | **珠宝≥2件** | 金或珍珠系、细而精致：`small gold hoop earrings + a dainty gold pendant necklace` |
| ⑥ | **发型妆容** | `soft loose waves / sleek low ponytail with face-framing strands, subtle elegant makeup with glossy lips` |
| ⑦ | **配色** | 从第 3 条高级色库选一组，**与该角色上一集不同** |

## 2. 面料与版型铁律（针对 flux 翻车点，逐条堵死）

- **光泽铁律**：上下装**至少一件**是 `silk-satin`（缎面光泽）/ `delicate lace`（蕾丝）/ `velvet`（丝绒）。prompt 必带 `luxurious sheen / lustrous drape` 一类光泽词。**禁写裸的 "knit top / cotton camisole"——纯棉感、普通针织感=廉价感元凶。**
- **版型铁律**：上衣 `fitted, sculpting her slim waist`（贴身勾腰线），可 cropped 露一线腰；短裙=高腰+贴身版（包臀 bodycon / 侧开衩 slit / 缎面斜裁 bias-cut / 裹身 wrap）。
- **★品类黑名单（曾翻车，一律禁写禁出）**：plain ribbed tank/cami（罗纹棉背心）、pleated skater skirt（学生百褶溜冰裙）、cheerleader/dance-costume look、school-uniform vibe、thick straps、bustier/corset、swimsuit-like top、shapeless loose skirt。
- **否定词必带**：`NOT a plain cotton tank top, NOT a cheap dance costume, NOT a school skirt, NOT thick straps, NOT a bustier or structured bodice`。
- **定调词必带**：`styled by a celebrity fashion stylist like a Vogue high-fashion editorial / luxury lookbook, trendy, elegant, tastefully sexy`。

## 3. 高级色库（每集换一组；★奶白×裸粉等"幼稚糖果色"已被否，删除）

香槟金×象牙白 / 雾霾蓝缎×白 / 鼠尾草绿缎×奶油 / 黑缎×金饰 / 酒红×黑蕾丝 / 珍珠白蕾丝×浅杏 / 焦糖缎×米 / 藕荷紫缎×银灰。
原则：**缎面高级色+金属饰品点睛**；同一画面上下装同色系或高级撞色；禁纯糖果粉嫩组合（那是儿童装）。

## 4. shot.content 服装段模板（照抄改词，七要素全部在场）

```
wearing a fashionable, tastefully sexy TWO-PIECE look styled by a celebrity fashion stylist:
a {色}silk-satin camisole with delicate THIN spaghetti straps and fine French lace trim,
with a soft luxurious sheen, fitted and slightly cropped to bare a sliver of her slim waist
(NOT a plain cotton tank top, NOT thick straps, NOT a bustier, NOT a cheap dance costume),
paired with a SEPARATE high-waisted {色}silk-satin mini skirt with a side slit draping
elegantly over her hips (NOT a pleated school skirt), a delicate thin gold waist chain,
small gold hoop earrings and a dainty gold pendant necklace, strappy nude high heels,
{发型}, subtle elegant makeup with glossy lips — like a Vogue high-fashion editorial /
luxury lookbook, trendy, elegant, tastefully sexy, SFW
```

后接第 5 条皮肤段 + 全身/七分身景别（render-rules 2/6：脚落地、看得清身材白肤大长腿）。

## 5. ★皮肤（铁律不变 · 只准很白，禁双色）

凡有裸露皮肤的女角图必写：
`uniformly very fair porcelain-pale skin — the EXACT same pale tone on her face, neck, shoulders, arms, hands, legs and feet, NO two-tone skin, NO tanned or ruddy or yellowish limbs, NO color mismatch between face and body, NO tan lines`；
质感走 render-rules 第 5 条（细腻毛孔不塑料）。白=均匀通透白，不是死白蜡感。

## 6. 角色定调（在七要素之上微调，谁都不许掉出"轻奢"线）

- **女主沈青梧（绝色·22）**：全剧衣品天花板——轻奢缎面/冷艳都市线，色库里最贵气的组合（香槟金、黑缎×金、酒红×黑蕾丝、藕荷紫缎）。红嫁衣线到 E06，之后回本规范。
- **小桃（女佣·19·甜）**：**时尚感一分不减**，靠配色显甜（雾霾蓝缎×白、鼠尾草绿缎×奶油、珍珠白蕾丝×浅杏），款式可比女主少一分张扬（开衩浅一点/珠宝小一号），但**面料光泽、高跟、腰线、珠宝一样都不能少**——她是"会打扮的俏女佣"，不是穿演出服的路人。
- **柳梦烟/沈玉柔等**：按人设定调（继母=端庄成熟色系、白莲花=清纯浅色系），七要素照走。

## 7. 强场景豁免（收窄口径不变）

婚礼当晚=红嫁衣、守灵奔丧=素白、正式晚宴=礼服、深夜寝卧=真丝吊带睡裙（缎面光泽同样必写）。其余日常/当值/出街一律走本规范。

## 8. ★禁复用被否图（2026-07-16 教训固化）

- **用户否过的 look、以及按已作废旧规范出的图，禁止复用到任何新集**（E02-v2 曾复用 07/15 的奶白棉背心图=二次翻车）。
- 复用任何旧图前，先对照**现行** wardrobe/render-rules 逐条核验该图服装；不合规=重画，不许"能省则省"地凑合。

## 关联
[[render-rules]] · [[style]] · [[../characters/xiaotao/canonical]] · [[../characters/qingwu/canonical]]
