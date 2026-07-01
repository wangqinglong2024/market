# 下一次会话交接 & 开场提示词

## ① 直接复制下面这段发给我(开场提示词)

```
先读 temp/NEXT-SESSION.md 和 plan/09-effects-and-svg.md，接上上次的进度，别重新问方向。

已锁定的最终方向（不要再动摇、不要再提 3D / AI视频 / 逐帧生成 / 描摹抠图）：
- 纯 2D。角色的“生成器”是你（LLM）本人，用代码手写【结构化、可绑骨骼的 SVG】。
- 每一拍：基于固定角色模板（体型/样式固定），现生成一个新的角色 SVG 木偶，
  衣服/神态/动作可变（站/走/挥手/坐/换装等）；部件要拆好命名好（头/眼/嘴/上臂/前臂/手/腿/脚），
  这样胳膊、嘴、眼能用代码逐帧驱动（动画本身不花 token，渲染时算）。
- 每次都新生成，不复用同一个木偶。不要背景（角色透明/纯色即可）。
- 不靠运镜制造“动”，要部件真动。

第一件事（务必先做）：替换掉当前所有 SVG！现在 config/characters/boy/drawn.svg 太丑了，
recraft.svg / character.svg（矢量化那版）也都废弃。重新按“更好看 + 拆件可绑”的标准，
先手写重画 boy 模板，让我确认颜值后再画 girl/dad/mom/dog。参考长相看 config/characters/<id>/ref-front.png。

然后：把“每拍生成可动角色 SVG”这套闭环搭起来（生成器 + 骨骼驱动 rig.ts + 在 Remotion 里演），
先做 boy 一个垂直切片（换装/挥手/眨眼/张嘴真动），我在 :3000 看，认可再铺开到 5 角色 + 全 beat。
```

---

## ② 背景：我们反复拉扯后最终确定的东西（给新会话看）

用户要做“输入文案→自动生成 2D 动画短视频”的批量流水线。经过多轮澄清，**最终方案**：

- **角色 = 我（LLM）手写的结构化 SVG 木偶**，不是图像模型出的散路径（那种没法绑骨骼）。
- **每拍现生成**一个角色 SVG（体型固定、衣服/神态/动作可变），**部件拆好 → 胳膊/嘴/眼能动**。
- **成本**：生成 1 个木偶 ≈ 2,000–4,000 输出 token（现有 drawn.svg 5,489 字符≈2k+ token）；
  一条视频 5–8 拍 ≈ 1.5万–3万 token ≈ 几分钱~¥1.5/条。动画渲染不额外花钱。
- **画质上限**：我手写的绘本扁平级（简单姿势稳；骑车这类复杂动态姿势会糙、不稳）——用户已知情并接受。
- **不要**：3D、AI 视频、逐帧图像生成、描摹/抠图、背景。**不靠运镜**制造动感。

### 为什么排除了其它路（别再走回头路）
- 矢量化现有 AI 图（@neplex/vectorizer + sharp 抠白）→ 用户否决：那是“描摹处理图片”，不是生成，且不适配任意新场景。**已废弃**。
- fal Recraft 能生成真 SVG（实测 content_type=image/svg+xml），**但输出是 50 条散路径、0 分组 0 id → 不能绑骨骼**。所以“AI 生成高质量 SVG”和“胳膊嘴能动”不可兼得。**作为角色方案已废弃**。
- 3D 卡通 / AI 视频 / 逐帧生成 → 用户明确拒绝（换画风 / 不是矢量 / 太烧钱）。

---

## ③ 已经做完的（别重复造）

- **config/ 控制台**：characters/_registry.json、prompts/*（storyboard/translate/image.tpl/style/composition/negative）、motion.json、settings.json。
- **流水线脚本**：scripts/lib/config.mjs（读 config）、lib/media.mjs（@remotion/media-parser 跨平台时长）、tts.mjs（火山，已去 macOS 依赖）、gen-image.mjs（fal，出图，**角色方案变更后可能不再需要**）、build.mjs、run.mjs。
- **结构**：按月份分片 public/videos/2026-07/demo/（含 script.json + manifest.json + images + audio）；catalog.json 总账；产物入 git。
- **Remotion 数据驱动**：src/Video.tsx（通用组件，calculateMetadata 读 manifest，motion 预设驱动运镜）；Root.tsx 按 catalog 挂载 + 一个 fx-slice 演示 composition。
- **特效层（确定性、逐帧）**：src/fx/Sparkles.tsx、LightLeak.tsx、BackdropParallax.tsx。
- **角色/骨骼骨架**：src/characters/Character.tsx（Img+整体二级动作）、src/characters/rig.ts（眨眼/挥手/张嘴的逐帧驱动器，可复用）。
- **演示场景**：src/scenes/FxSlice.tsx（目前用 recraft boy，透明）。
- plan/09-effects-and-svg.md 记录了视觉升级方向（部分需按最终方案修正）。

## ④ 还没做的（“好多事情没做”的清单）

1. **替换所有 SVG**（第一优先）：boy 太丑，重画 boy 模板 + 其余 4 角色，标准=更好看 + 拆件可绑。
2. **角色生成器**：把“基于模板生成一个变体角色 SVG（换装/神态/动作）”做成可复用的生成规范/组件（我写 SVG 的固定套路 + 命名部件约定）。
3. **骨骼动画接入真流水线**：每拍的角色 SVG → 用 rig.ts 驱动胳膊/嘴/眼真动，塞进 Video.tsx 的 beat 时间窗，和语音同步。
4. **manifest/Video 升级为分层+特效模型**（task #11）：beat 带 characters[]（含 pose/action/motion）、effects[]、transitionIn。
5. **特效整合**：Sparkles/LightLeak 等接进真视频（task #8 剩余：物理引擎未做）。
6. **three.js 3D / Pixi**：之前用户提过要用，但最终 2D 方向下**优先级降低甚至不需要**；以最终方向为准，别盲目做。
7. **无背景**：用户要求不要背景 → 场景 = 会动的角色（+可选特效），去掉 BackdropParallax 那种场景背景。
8. **运镜引擎升级**（task #10）：最终方向弱化运镜，别过度投入。

## ⑤ 环境坑（重要）

- **联网调用（fal 等）必须关闭沙箱**（Bash 用 dangerouslyDisableSandbox: true），否则走用户 7897 代理会连接超时。
- **不要主动渲染视频自检**；靠用户的实时 Studio :3000 看。角色 SVG 想自检可用 sharp 栅格成 PNG 再 Read（脚本要放在项目目录内，否则 node 找不到 node_modules）。
- Windows + PowerShell 主；Bash 走 Git Bash（/tmp 参数会被 MSYS 转成 AppData 临时路径，node 内硬编码 /tmp 读不到——临时文件放项目内）。
- 平台无 ffmpeg/ffprobe；音频时长用 @remotion/media-parser。
- git 提交只在用户明确要求时做；当前一堆改动都还没 commit。

## ⑥ 关键文件锚点
- 角色长相参考：config/characters/<id>/ref-front.png（boy/girl/dad/mom/dog）
- 当前（要替换的）SVG：config/characters/boy/drawn.svg、recraft.svg、各 character.svg
- 骨骼驱动：src/characters/rig.ts
- 演示：src/scenes/FxSlice.tsx（fx-slice composition）
- 方案文档：plan/00~09
