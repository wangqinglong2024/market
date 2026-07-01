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
      canon: stripComments(readText(C("characters", c.id, c.canonical))),
    };
  }
  return map;
}

export function loadPrompts() {
  return {
    imageTpl: readText(C("prompts", "image.tpl.md")), // 保留占位符，含说明注释
    style: stripComments(readText(C("prompts", "style.md"))),
    composition: stripComments(readText(C("prompts", "composition.md"))),
    negative: stripComments(readText(C("prompts", "negative.md"))),
    storyboard: stripComments(readText(C("prompts", "storyboard.md"))),
    translate: stripComments(readText(C("prompts", "translate.md"))),
  };
}

// 确定性组装出图 prompt：模板占位符替换，单一来源、每次相同
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

// 按句意选运镜预设：beat.motion 优先，否则按 motion.json 的关键词规则命中，默认 default
export function pickMotion(beat, motion) {
  if (beat.motion && motion.presets[beat.motion]) return beat.motion;
  const zh = beat?.captions?.zh ?? "";
  for (const [pattern, preset] of Object.entries(motion.rules.byKeyword || {})) {
    if (new RegExp(pattern).test(zh)) return preset;
  }
  return motion.rules.default;
}
