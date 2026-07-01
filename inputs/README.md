# inputs/ — 你的输入区

每条视频一个原始中文文案文件：`inputs/<videoId>.txt`（纯旁白，一句一行或整段皆可）。

## 出片流程
1. 你：把文案放进 `inputs/<videoId>.txt`，并在 `catalog.json` 加一条（或让我加）。
2. 我（会话内）：切句 + 分镜 + 翻译 + 拼音 → 写 `public/videos/<shard>/<videoId>/script.json`。
3. 引擎：`node scripts/run.mjs <videoId> --render`
   → 配音(火山) + 出图(fal) + `manifest.json` + 渲染 `成片.mp4`（全程缓存，改一句不重烧整片）。

## 你能调的旋钮（都在 config/）
- `config/characters/` 角色圣经（增/改角色）
- `config/prompts/` 所有提示词（分镜/翻译/出图模板/画风/构图/负面词）
- `config/motion.json` 运镜预设与选取规则
- `config/settings.json` 画幅/音色/默认语言/出图模型/字幕配色

默认这些我都替你写好、维护；你想改哪个文件，下次跑就生效。
