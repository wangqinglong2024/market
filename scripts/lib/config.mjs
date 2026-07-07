// 统一读取 config/ 控制台：settings / characters / prompts / motion。
// 所有生成脚本只从这里拿规则，改 config 即改行为，无需动脚本。
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const C = (...p) => join(ROOT, "config", ...p);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const readText = (p) => readFileSync(p, "utf8");
// 去掉 md 里的 <!-- ... --> 注释块，只留真正拼进提示词的正文
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

export function loadSettings() {
  return readJson(C("settings.json"));
}

export function loadMotion() {
  return readJson(C("motion.json"));
}

// id -> { id, name, main, refPath(绝对), canon(文本) }
export function loadCharacters() {
  const reg = readJson(C("characters", "_registry.json"));
  const map = {};
  for (const c of reg.characters) {
    map[c.id] = {
      id: c.id,
      name: c.name,
      main: !!c.main,
      refPath: C("characters", c.id, c.ref),
      // 戴书生方帽+汉服的样板图(可选)；仅朗读古文拍(read-quote)喂它，见 build.mjs
      refHatPath: c.refHat ? C("characters", c.id, c.refHat) : null,
      canon: stripComments(readText(C("characters", c.id, c.canonical))),
      // 朗读拍专用 canon(可选)：描述汉服+书生帽、不提日常衣服，避免 flux 画回日常装
      canonHat: c.canonicalHat ? stripComments(readText(C("characters", c.id, c.canonicalHat))) : null,
    };
  }
  return map;
}

export function loadPrompts() {
  return {
    imageTpl: readText(C("prompts", "image.tpl.md")),
    imageFluxTpl: readText(C("prompts", "image-flux.tpl.md")),
    imageSceneTpl: readText(C("prompts", "image-scene.tpl.md")),
    imageStoryTpl: readText(C("prompts", "image-story.tpl.md")),
    style: stripComments(readText(C("prompts", "style.md"))),
    composition: stripComments(readText(C("prompts", "composition.md"))),
    negative: stripComments(readText(C("prompts", "negative.md"))),
    storyboard: stripComments(readText(C("prompts", "storyboard.md"))),
    translate: stripComments(readText(C("prompts", "translate.md"))),
  };
}

// 多角色 nano-banana-pro 用完整模板
export function buildImagePrompt({ shotContent, charIds, prompts, characters }) {
  const canon = (charIds || [])
    .map((id) => characters[id]?.canon)
    .filter(Boolean)
    .join("\n");
  return stripComments(prompts.imageTpl)
    .replace("{shot}", shotContent)
    .replace("{canon}", canon || "(no fixed character in this shot)")
    .replace("{style}", prompts.style)
    .replace("{composition}", prompts.composition)
    .replace("{negative}", prompts.negative);
}

// 单角色 flux-pro/kontext 用精简模板（长 prompt 含 negative 会触发 fal nsfw 黑图）
// useHat=true(朗读古文拍)时用 canonHat(汉服+书生帽、不提日常衣服)，避免 flux 画回粉裙/短裤
// canonOverride：该拍换装（如故事重演里成人穿长袍）时整段替换 canon，写法沿用「长袍替换日常衣服」经验
export function buildFluxPrompt({ shotContent, charIds, prompts, characters, useHat = false, canonOverride = null }) {
  const canon = canonOverride || (charIds || [])
    .map((id) => (useHat && characters[id]?.canonHat) ? characters[id].canonHat : characters[id]?.canon)
    .filter(Boolean)
    .join(" ");
  const styleShort = "rough hand-drawn crayon outlines, warm crayon coloring, minimal cute cartoon faces, children's picture-book feel, on a clean solid PURE WHITE background (flat white, no paper texture, no cream/beige tint)";
  return stripComments(prompts.imageFluxTpl)
    .replace("{shot}", shotContent)
    .replace("{canon}", canon || "")
    .replace("{style_short}", styleShort);
}

// 空镜(无人物)：flux-pro/kontext 喂风格锚图，只借画风、不要人。不拼 negative/canon。
export function buildScenePrompt({ shotContent, prompts }) {
  return stripComments(prompts.imageSceneTpl).replace("{shot}", shotContent);
}

// ★ 古代典故故事重演（2026-07-07，plan/10 4.10）：喂风格锚图只借画风，
// 人物是典故里的古人、按 shot 描述画（不用定妆、不保 IP），几个人就画几个人。
export function buildStoryPrompt({ shotContent, prompts }) {
  return stripComments(prompts.imageStoryTpl).replace("{shot}", shotContent);
}

// 按句意选运镜预设：beat.motion 优先，否则按 motion.json 的关键词规则命中，默认 default
export function pickMotion(beat, motion) {
  if (beat.motion && motion.presets[beat.motion]) return beat.motion;
  const zh = beat?.captions?.zh ?? "";
  for (const [pattern, preset] of Object.entries(motion.rules.byKeyword || {})) {
    if (new RegExp(pattern).test(zh)) return preset;
  }
  return motion.rules.default;
}
