// 统一读取「全局基建 + 模板」控制台：settings / characters / prompts / motion。
// 生成脚本只从这里拿规则。全局默认在 config/settings.json，模板专属在 templates/<id>/，
// 加载时深合并(模板覆盖全局)。改 config 或 template.json 即改行为，无需动脚本。
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const C = (...p) => join(ROOT, "config", ...p);
const T = (templateId, ...p) => join(ROOT, "templates", templateId, ...p);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const readText = (p) => readFileSync(p, "utf8");
// 去掉 md 里的 <!-- ... --> 注释块，只留真正拼进提示词的正文
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

// 深合并：普通对象递归合并，数组/标量由 override 覆盖。用于「全局 settings + 模板 template.json」。
const isPlainObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function deepMerge(base, override) {
  if (!isPlainObj(base) || !isPlainObj(override)) return override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = isPlainObj(out[k]) && isPlainObj(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

// 全局 config/settings.json 深合并模板 templates/<id>/template.json → 该模板生效的 settings。
export function loadSettings(templateId) {
  const global = readJson(C("settings.json"));
  if (!templateId) return global;
  const tpl = readJson(T(templateId, "template.json"));
  return deepMerge(global, tpl);
}

export function loadMotion(templateId) {
  return readJson(T(templateId, "motion.json"));
}

// id -> { id, name, main, refPath(绝对), refHatPath, canon(文本), canonHat }
export function loadCharacters(templateId) {
  const base = (...p) => T(templateId, "characters", ...p);
  const reg = readJson(base("_registry.json"));
  const map = {};
  for (const c of reg.characters) {
    map[c.id] = {
      id: c.id,
      name: c.name,
      main: !!c.main,
      refPath: base(c.id, c.ref),
      // 戴书生方帽+汉服的样板图(可选)；仅朗读古文拍(read-quote)喂它，见模板 build.mjs
      refHatPath: c.refHat ? base(c.id, c.refHat) : null,
      canon: stripComments(readText(base(c.id, c.canonical))),
      // 朗读拍专用 canon(可选)：描述汉服+书生帽、不提日常衣服，避免 flux 画回日常装
      canonHat: c.canonicalHat ? stripComments(readText(base(c.id, c.canonicalHat))) : null,
    };
  }
  return map;
}

export function loadPrompts(templateId) {
  const p = (...x) => T(templateId, "prompts", ...x);
  return {
    imageTpl: readText(p("image.tpl.md")),
    imageFluxTpl: readText(p("image-flux.tpl.md")),
    imageSceneTpl: readText(p("image-scene.tpl.md")),
    imageStoryTpl: readText(p("image-story.tpl.md")),
    style: stripComments(readText(p("style.md"))),
    composition: stripComments(readText(p("composition.md"))),
    negative: stripComments(readText(p("negative.md"))),
    storyboard: stripComments(readText(p("storyboard.md"))),
    translate: stripComments(readText(p("translate.md"))),
  };
}

// ── 共享的 prompt 构造器（模板 build.mjs 按需调用；纯函数、无副作用）───────────────
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
// canonOverride：该拍换装(如故事重演里成人穿长袍)时整段替换 canon
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

// 古代典故故事重演：喂风格锚图只借画风，人物是典故里的古人、按 shot 描述画(不用定妆、不保 IP)。
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
