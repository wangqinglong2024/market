# Image-to-Video 提示词

把已人工验收的《毒嫁》关键帧转换为 3—5 秒连续动作。关键帧中的身份、服装、场景、光向和道具数量都是不可变条件。

每条提示词只写一个连续因果链：

`起始状态 → 第一个可见动作 → 权力/信息变化 → 结束状态`

动作要求：

- 第一项关键动作尽量在源片前 0.8 秒完成，尤其是下毒、喝酒、扣腕、拔簪、落闩。
- 清楚写眼神落点和手与道具的接触关系，避免角色“看见”画外不可见信息。
- 台词镜头只写一句短台词所需的克制口型；无台词镜头写 `no speaking`。
- 摄影机运动用可执行尺度描述，例如 `10 cm push-in`、`12-degree half arc`、`locked close-up`。
- 结束状态必须能与下一个 shot 连续，并能从 `mediaWindow` 截取足够时长。

固定参数：

- 模型：`fal-ai/kling-video/v3/standard/image-to-video`（除非已批准使用模板白名单内的 economy model）。
- `durationSec` 只能是 3、4 或 5。
- `generateAudio=false`。
- `maxAttempts=1`，失败不自动重试。

禁止：凭空换脸换装、增加人物或道具、烘焙文字、过度慢动作、无动作漂移、血腥表现、未授权吻戏升级。

输出字段：`id`、`kind=ai-video`、`model`、`keyframeId`、`durationSec`、`generateAudio=false`、`prompt`、`output`、`maxAttempts=1`。
