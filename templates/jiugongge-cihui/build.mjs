// 模板『九宫格词汇·中文教学』构建流水线。由通用编排器 scripts/build.mjs 调用 build()，返回 manifest。
// 流水线：script.json → 问句+逐词配音(火山·小女孩) + 逐词出图(单角色 flux 喂贴纸小女儿) + 抠白底成透明(浮到米色格) → grid-9 manifest。
// 节奏：openingHold(开场读问句+搭头) + 每词(wordGap 摆动→滑走 + 词配音)；总时长≈19s(9词)。全程缓存。
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { synth } from "../../scripts/tts.mjs";
import { genImage, MODEL_USD } from "../../scripts/gen-image.mjs";
import sharp from "sharp";

const ID = "jiugongge-cihui";
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

// 抠白底：从四边对「近白」像素做 flood fill 置透明，只掉外部背景白，保留内部白(眼睛高光等)。
// 让 flux 的纯白底贴纸图浮到九宫格暖米色格里、无白框(参考视频效果)。
async function knockoutWhite(inPath, outPath, thresh = 236) {
  const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const ch = info.channels; // 4
  const isWhite = (i) => data[i] >= thresh && data[i + 1] >= thresh && data[i + 2] >= thresh;
  const visited = new Uint8Array(width * height);
  const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isWhite(p * ch)) stack.push(p);
  };
  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
  for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    data[p * ch + 3] = 0; // alpha=0
    const x = p % width, y = (p / width) | 0;
    seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1);
  }
  await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } }).png().toFile(outPath);
}

export async function build({ videoId, dir, ROOT, settings, rel, ensure }) {
  const T = (...p) => join(ROOT, "templates", ID, ...p);
  const style = stripComments(readFileSync(T("prompts", "style.md"), "utf8"));
  const fluxTpl = readFileSync(T("prompts", "image-flux.tpl.md"), "utf8");
  const canon = stripComments(readFileSync(T("characters", "girl", "canonical.md"), "utf8"));
  const charRef = T(settings.image.charRef);

  const script = JSON.parse(readFileSync(join(dir, "script.json"), "utf8"));
  const voice = settings.audio.voice;
  const speed = settings.audio.speed ?? 1.0;

  // 成本日志(真实调用出图才记，缓存$0)
  const costLog = join(dir, "cost", "coast.md");
  function logImageCost({ beatId, model, usd }) {
    ensure(costLog);
    if (!existsSync(costLog)) {
      writeFileSync(costLog, `# 出图成本日志 · ${videoId}\n\n每次**真实调用**出图记一行：\`时间 | 词 | 模型 | 花费\`。缓存命中不计($0)。\n\n`);
    }
    appendFileSync(costLog, `- ${new Date().toLocaleString("sv-SE")} | ${beatId} | ${model} | $${usd.toFixed(2)}\n`);
  }

  const fluxPrompt = (shotContent) =>
    stripComments(fluxTpl)
      .replace("{shot}", shotContent)
      .replace("{canon}", canon)
      .replace("{style_short}", style);

  // ── 1) 开场问句配音(顶部问句，内容来自 script.question、非固定；示例『你在做什么？』) ──
  const q = script.question; // { zh, pinyin, viet } —— 每条视频自定，不是模板写死的句子
  const qa = await synth(q.zh, ensure(join(dir, "audio", "q.mp3")), { voice, speed });
  const openingHold = Math.max(settings.audio.openingHoldMs ?? 1600, qa.ms + 160);
  console.log(`== 问句: ${q.zh}  ${qa.ms}ms  openingHold=${openingHold}ms`);

  const beats = [{
    id: "q",
    role: "question",
    audio: rel("audio", "q.mp3"),
    durationMs: openingHold,
    question: q,
    answer: script.answer, // { zh:"我在＿＿", pinyin:"Wǒ zài" }
  }];

  // ── 2) 逐词：配音 + 出图(单角色 flux) + 抠白底 ───────────────────────
  const gap = settings.audio.wordGapMs ?? 670;
  const items = script.items; // [{ id, zh, pinyin, viet, shot:{content} }]
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const a = await synth(it.zh, ensure(join(dir, "audio", `${it.id}.mp3`)), { voice, speed });

    const rawImg = ensure(join(dir, "images", `${it.id}.png`));
    const img = await genImage({ outPath: rawImg, prompt: fluxPrompt(it.shot.content), refPaths: [charRef], settings, model: "flux" });
    if (!img.cached) {
      const usd = MODEL_USD[img.model] ?? 0;
      logImageCost({ beatId: `${it.id}(${it.zh})`, model: img.model ?? "flux", usd });
    }
    // 抠白底成透明(缓存)
    const cutImg = ensure(join(dir, "images", `${it.id}-cut.png`));
    if (!existsSync(cutImg)) await knockoutWhite(rawImg, cutImg);

    console.log(`== ${it.id} ${it.zh}(${it.viet}) 配音${a.ms}ms 图${img.cached ? "cached" : "gen"}`);
    beats.push({
      id: it.id,
      role: "item",
      gridIndex: i,
      zh: it.zh,
      pinyin: it.pinyin,
      viet: it.viet,
      image: rel("images", `${it.id}-cut.png`),
      audio: rel("audio", `${it.id}.mp3`),
      gapMs: gap,               // 词前『摆动→滑走』过渡；过渡末词卡出现并发音
      durationMs: gap + a.ms,
    });
  }

  const manifest = {
    meta: {
      ...settings.meta,
      layout: "grid-9",
      bg: settings.colors.bg,
      colors: settings.colors,
      grid: settings.grid,
      fonts: settings.fonts,
      ...(settings.audio.bgm?.src && { bgm: settings.audio.bgm }),
    },
    beats,
  };
  return manifest;
}
