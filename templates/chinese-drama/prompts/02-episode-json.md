# Episode JSON 生成提示词

把已通过总编审查的单集脚本转换为 `schema.mjs` 的严格 JSON。不得添加 schema 外字段，不得用 JSON 注释，不得把剧情信息藏在 prompt 里逃避 fact 校验。

顶层固定：

- `schemaVersion: "1.0.0"`
- `seriesId: "poisoned-wedding"`
- `storyVersion: "1.0.0"`
- `status: "designed-awaiting-user-approval"`
- `durationTargetMs` 在 22000—26000，所有 shot 在 30fps 下必须是整数帧。
- `generationPolicy.stopBeforeFal=true`
- `generationPolicy.requireUserApprovalFile=true`
- `generationPolicy.minimumDynamicCoverageRatio>=0.8`
- `budget.maxPaidAttemptsPerAsset=1`，`automaticPaidRetries=0`

第一镜固定为 `modern-anchor`：`sourceType="ai-video"`，绑定虚构角色 `linwan`、现代关键帧和现代 I2V 资产；`audio.originalClipAudio=false`，普通话使用后期 TTS。不得要求用户录制或提供肖像。

`hookContract.requiredDeliveries` 必须覆盖：

- 至少两个 `first-frame-trigger`
- `danger-or-stakes`
- `ancient-match`
- `irreversible-action`
- 唯一一个 `main-question`

每个 fact 都必须由对应 shot 的 `drama.emitsFacts` 明确交付给 `audience`，不能只写在动作描述里。

`plotContract` 必须声明：

- `mainQuestionFactId`
- `answerFactId`
- `answerRevealShotId`（该 shot 的 role 必须是 `reveal`）
- `nextDangerFactId`（只能在答案之后由 `tail-hook` 发出）

每个 shot 必须含：`id`、`sceneId`、`role`、`durationMs`、`sourceType`、`asset`、`visibleFaceCount`、`drama`、`utterances`、`overlays`、`audio`。AI 视频另含 `generationPromptId`、`fallbackAsset`、`mediaWindow`。

每句 utterance 同时含：

```json
{
  "speakerId": "xiaojue",
  "mode": "whisper",
  "pinyin": "dú fàng shǎo le",
  "textZh": "毒放少了。",
  "subtitleVi": "Nàng bỏ ít độc quá.",
  "startOffsetMs": 0,
  "estimatedDurationMs": 1000
}
```

角色行动所需信息写入 `requiresFacts`；获得信息写入 `emitsFacts` 并指明 recipients 与 channel。观众知道不等于角色知道。

生成后必须运行：

`node templates/chinese-drama/preflight.mjs public/videos/<日期>/<episode-id>`

只要 schema、状态哈希、事实因果、80%答案、动态覆盖或成本有一项失败，就退回文本修改；不能进入媒体生成。
