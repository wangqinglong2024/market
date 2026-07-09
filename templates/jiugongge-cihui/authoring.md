# 模板：jiugongge-cihui · 九宫格词汇 · 中文教学（越南受众）

> 完全参照 `temp/TikTok.mp4`：3:4 暖米色底、3×3 九宫格贴纸卡、顶部问答框、小女孩配音逐词读、
> 小图摆动→滑走变中文词并发音。主角=重绘成贴纸画风的小女儿。
> 工作流：用户说「用 jiugongge-cihui 模板 + 词表」→ 我扩写 `script.json` → `node scripts/build.mjs <videoId>` → `npx remotion render`。

## 1. 玩法（照搬参考）
- 顶部：中文问句「你在做什么？」+ 拼音 + 越南语译（左上），答句模板「我在＿＿ / Wǒ zài」（右上），**开场分步滑入/弹入**。
- 下方 **3×3 九宫格**，每格：小女儿做某动作的贴纸图 + 该词的**越南语标签**（青色气泡字）。
- 开场小女孩读「你在做什么？」；随后**一个词一个词**读：轮到某格时，该格小图**先轻微摆动几下**，然后**滑走**、原地换成**中文词+拼音**（青绿手写体），**滑走换字那一刻同时发音**。
- 顺序：从左到右、从上到下。读完最后一个词（如「看书」）**直接结束**。

## 2. 节奏（19 秒 · 数据驱动）
- 由 `build.mjs` 按真实配音时长排：`总时长 = openingHold + Σ(wordGap + 该词配音)`。
- 默认（template.json.audio）：`openingHoldMs=1600`（开场读问句+搭头），`wordGapMs=670`（每词前摆动→滑走过渡）。
- 参考实测：问句 1440ms、9 词共约 11376ms、间隙平摊约 670ms/个 → 9 词≈19s。词数变则总时长随之变（节奏不变）。

## 3. script.json 结构
```jsonc
{
  "videoId": "...",
  "lang": "vi",
  "question": { "zh": "你在做什么？", "pinyin": "Nǐ zài zuò shénme?", "viet": "BẠN ĐANG LÀM GÌ?" },
  "answer":   { "zh": "我在＿＿", "pinyin": "Wǒ zài" },
  "items": [                      // 词表；数量应=grid.cols*rows(默认9)，按九宫格顺序(左→右, 上→下)
    {
      "id": "w1",
      "zh": "起床",               // 中文词(词卡大字)
      "pinyin": "qǐ chuáng",      // 拼音(带声调)
      "viet": "THỨC DẬY",         // 越南语标签(常驻格子下方)
      "shot": { "content": "The chubby girl just waking up, sitting on a bed, stretching, sleepy happy face, an alarm clock beside; on pure white background." }
      // shot.content=该动作画面英文描述，只画小女儿做这个动作(可带必要道具)，纯白底。真正传给 flux 的主体。
    }
    // …共 9 个
  ]
}
```

## 4. 出图 / 配音（build 自动）
- 每个词 = 一张小女儿做该动作图：**单角色 → flux**（喂 `characters/girl/model-sheet.png` 贴纸定妆图），纯白底；出图后 build **抠白底成透明**，浮到暖米色格里（无白框）。
- 🚫 一律 flux（$0.04），本模板不用 nano-pro；prompt 不写 box/frame/负面词（防 fal 黑图）。
- 🚫🚫 **fal 出问题禁止擅自重调**，先告知用户、同意后再调。
- 配音：小女孩声（火山 `zh_female_yingtaowanzi_mars_bigtts` 樱桃小丸子，备选佩奇 `zh_female_peiqi_mars_bigtts`），speed 1.0；问句 + 每个词各单独合成。

## 5. 样式（照搬参考，全在 template.json，可改）
- 画幅 1080×1440，背景 `#fee8c9`。
- 中文青绿描边字 `chineseFill/#17b3c2 + chineseStroke/#083b45`；越南语青色气泡 `vietFill/#53dbf5 + vietStroke/#1a7fb8`；拼音深灰。
- 字体：中文手写 Winter、拉丁/越南语 Nunito（参考确切字体如需精确复刻，放 ttf 到 public/library/fonts 再改 template.json）。

## 6. 主角
只有小女儿(girl)一个角色，贴纸画风、胖乎乎可爱。所有格子都是她做不同动作。见 `characters/girl/canonical.md`。
