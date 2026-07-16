<!-- 会话生产提示词(用户 2026-07-16 锁定)。起因:E01-v2 重写时 Claude 没严格对照规范,写出了与锁定人设矛盾的"一句中文都不会",且漏交了封面。
   本文件=用户每次让 Claude 生成《铃兰穿越记》视频时贴的标准提示词 + Claude 必须逐条执行的开工/交付闸门。
   规则:只引用规范、不复制规范内容(单一事实源);规范有更新时本文件无需跟着改。 -->
# chinese-drama · 会话生产提示词（每次生成视频必用）

## 一、给用户：直接复制这段发给 Claude（把 N 换成集数）

```
按 templates/chinese-drama/prompts/session-prompt.md 的完整流程，生产《铃兰穿越记》第 N 集。
开工前先列出你已读完的规范清单和本集「💣爆点+中文课+尾钩」，再动手。
交付物必须齐：script.json、成片.mp4、海报底图 poster.png、cover.json、铃兰穿越记-EXX-封面.png、cost 日志。
```

（一次做多集就写「第 N–M 集」；只重写某集就写「重写第 N 集」，其余流程完全一样。）

## 二、给 Claude：开工闸门（不过闸不许写一个字）

**第 1 步·必读清单**（按顺序全部读完，缺一不可）：
1. `base/00-底层规律.md` + `base/01-创作准则.md`（全项目最高事实来源）
2. `base/04-成本与铁律.md`（fal 花钱红线：出图不满意禁止擅自重试，先问用户）
3. `templates/chinese-drama/prompts/script-rules.md`（剧本铁律，**第 1–2 条=女主人设口径，最容易写错**）
4. `templates/chinese-drama/prompts/render-rules.md`（出图/字幕/音色/封面铁律，**第 10 条=每集必交海报式封面**）
5. `templates/chinese-drama/prompts/wardrobe.md` + `prompts/style.md`（服装设计师规范+统一画风）
6. `templates/chinese-drama/story/00-bible.md`（v3「识字眼」版故事圣经）+ `story/arc-XX.md` 本集条目
7. 本集涉及角色的 `characters/<id>/canonical.md`
8. **前 1–3 集已产出的 script.json**（public/videos/…/linglan-epXX*，核对既成事实：已学中文/服装/道具/时间线）

**第 2 步·开工自证**（读完后先输出给用户看，再写正文）：
- 本集「💣爆点 / ⚡第1秒引爆句 / 本集中文 / 头钩=上集尾钩 / 尾钩」各一行；
- 女主人设口径复述一行（★2026-07-16 最终锁定 v4）：**看=懂（表情/动作/场景，但汉字不认识！）/听=不懂（噪音，全靠猜；只有会说的词单独慢速时听得出）/说=零碎词（游客词老底+逐集新学，单词·≤4字）/写=完全不会/可装失忆/内心自由**——她的每个正确反应只能来自：看到的/比划的/猜的/会说的词；
- 本集女角服装设计一行（wardrobe.md 挑的 look，与上集不重样；红嫁衣等强场景除外）。

## 三、给 Claude：生产步骤（固定流水线，一步不许跳）

1. 写 `public/videos/<今日shard>/<id>/script.json`：`_comment` 第一行必是「💣本集爆点：…」；逐条过 script-rules 第 6 节自检清单（黄金3秒/反应=听懂程度/画面=台词/>10字拆拍/三行单行/行尾无标点/音色锁定表）。
2. `catalog.json` 加条目（`template: "chinese-drama"`）。
3. `FAL_PROXY=http://127.0.0.1:7897 node scripts/build.mjs <id>`（TTS+出图+manifest；新出的图逐张肉眼查一遍：脸/服装/肤色均匀白/单正脸/无脑补听众）。
4. **封面（render-rules 第 10 条，绝不许漏）**：
   a. fal 新出 3:4 竖版海报底图 `images/poster.png`（不与视频画面重复、紧扣本集主题，遵守出图铁律 1–6，计入 cost 日志）；
   b. 写 `cover.json`（系列名/印章 EXX/卷标题/章主题名/当集钩子标题，拼音+中文+越南语三行齐全，行尾无标点）；
   c. `npx remotion still src/index.ts cover-drama "<视频目录>/铃兰穿越记-EXX-封面.png" --props=<视频目录>/cover.json`。
5. 渲染成片：`npx remotion render <id> "<视频目录>/成片.mp4"`。
6. 交付前清点（少一样=没做完）：**script.json / manifest.json / 成片.mp4 / images/poster.png / cover.json / 铃兰穿越记-EXX-封面.png / cost/coast.md**。

## 四、最容易忘的三件事（历史翻车实录，交付前再看一眼）

1. **人设口径**：v4「又聋又哑」版（看=懂但不识字/听=不懂全靠猜/说=零碎词/写=不会）。历史翻车三次：写成"零中文"、写成"听得懂高频词"、又发明"能读汉字的识字眼"——现行唯一口径见 script-rules 1-2，别再自创设定。
2. **封面**：每集一张海报式封面是用户锁定交付物（E01-v2 曾漏交）。
3. **成本**：fal 每一次调用都花钱；结果不满意先报告用户，禁止自作主张重摇；能复用已验收旧图就复用（$0）。

## 关联
[[script-rules]] · [[render-rules]] · [[wardrobe]] · [[style]] · [[../story/00-bible]] · [[../authoring]] · base/[[../../../base/04-成本与铁律]]
