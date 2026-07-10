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
const hexToRgb = (h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// 词卡图预处理(★不做透明化，用户禁止)：
//  ① 边界背景归一：从四边 flood fill 把「flux 画出的底色(可能有漂移)」重涂成整页精确底色 bg，
//     保证每张图的底和大背景像素级一致 → 小图晃动时无方框边(参考视频效果)。这是重涂底色、不是抠透明。
//  ② 裁到主体外框 + 均匀留白(用精确 bg 补边)：让 flux 把人画大画小都统一，每格显示尺寸一致。
async function prepImage(inPath, outPath, bgHex, padFrac = 0.08) {
  const { data, info } = await sharp(inPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const ch = info.channels; // 3
  const [R, G, B] = hexToRgb(bgHex);
  // 以四角实际颜色为 flux 底色基准(自适应漂移/残留白)
  const cor = (x, y) => { const i = (y * width + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const s0 = cor(2, 2), s1 = cor(width - 3, 2), s2 = cor(2, height - 3), s3 = cor(width - 3, height - 3);
  const bgSrc = [0, 1, 2].map((k) => Math.round((s0[k] + s1[k] + s2[k] + s3[k]) / 4));
  const nearBg = (i, tol) => Math.abs(data[i] - bgSrc[0]) <= tol && Math.abs(data[i + 1] - bgSrc[1]) <= tol && Math.abs(data[i + 2] - bgSrc[2]) <= tol;
  // ① flood fill 边界底色 → 精确 bg
  const visited = new Uint8Array(width * height);
  const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x; if (visited[p]) return; visited[p] = 1;
    if (nearBg(p * ch, 32)) stack.push(p);
  };
  for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
  for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }
  while (stack.length) {
    const p = stack.pop(); const i = p * ch;
    data[i] = R; data[i + 1] = G; data[i + 2] = B;
    const x = p % width, y = (p / width) | 0;
    seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1);
  }
  // ② 内容 bbox(离 bg 较远的像素) → 裁框 + 均匀留白
  const isContent = (i) => Math.abs(data[i] - R) > 42 || Math.abs(data[i + 1] - G) > 42 || Math.abs(data[i + 2] - B) > 42;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (isContent((y * width + x) * ch)) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const base = sharp(Buffer.from(data), { raw: { width, height, channels: ch } });
  if (maxX < 0) { await base.png().toFile(outPath); return; } // 全底色兜底
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const pad = Math.round(Math.max(bw, bh) * padFrac);
  await base
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: bgHex })
    .png()
    .toFile(outPath);
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
  // 答句模板『我在』也要发音(用户要求)：读原文去掉占位下划线，如『我在＿＿』→『我在』
  const ansText = (script.answer.zh || "").replace(/[＿_＿\s]/g, "") || "我在";
  const ansa = await synth(ansText, ensure(join(dir, "audio", "answer.mp3")), { voice, speed });
  const qGap = settings.audio.questionGapMs ?? 220;    // 问句读完→『我在』出现的停顿
  const ansTail = settings.audio.answerTailMs ?? 280;  // 『我在』读完的停顿
  const answerRevealMs = qa.ms + qGap;                 // 『我在』出现并同步发音的时刻
  const openingHold = Math.max(settings.audio.openingHoldMs ?? 1600, answerRevealMs + ansa.ms + ansTail);
  console.log(`== 问句:${q.zh} ${qa.ms}ms  我在:${ansText} ${ansa.ms}ms@${answerRevealMs}ms  openingHold=${openingHold}ms`);

  const beats = [{
    id: "q",
    role: "question",
    audio: rel("audio", "q.mp3"),
    answerAudio: rel("audio", "answer.mp3"),
    answerRevealMs,
    durationMs: openingHold,
    question: q,
    answer: script.answer, // { zh:"我在＿＿", pinyin:"Wǒ zài" }
  }];

  // ── 2) 逐词：先全部配音拿到真实时长 → 按『目标总时长』反推每词间隙 ──────────
  //   ★加『我在』不许拉长总片长(用户要求)：总时长固定=19s(照参考)，多出的开场用『压缩每词间隙』来吸收。
  //   总时长 = 开场(问句+我在) + Σ(间隙 + 词配音)；词配音是 TTS 定值，故 间隙=(目标总时长-开场-Σ词配音)/词数。
  const items = script.items; // [{ id, zh, pinyin, viet, shot:{content} }]
  const wordAudioMs = [];
  for (const it of items) {
    const a = await synth(it.zh, ensure(join(dir, "audio", `${it.id}.mp3`)), { voice, speed });
    wordAudioMs.push(a.ms);
  }
  const sumWordAudio = wordAudioMs.reduce((s, v) => s + v, 0);
  const targetTotal = settings.audio.totalTargetMs ?? 19000;
  const minGap = settings.audio.minWordGapMs ?? 260;
  const gap = Math.max(minGap, Math.round((targetTotal - openingHold - sumWordAudio) / items.length));
  console.log(`== 目标总时长${targetTotal}ms = 开场${openingHold} + Σ词配音${sumWordAudio} + ${items.length}×间隙${gap}(实得${openingHold + sumWordAudio + gap * items.length}ms)`);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const rawImg = ensure(join(dir, "images", `${it.id}.png`));
    const img = await genImage({ outPath: rawImg, prompt: fluxPrompt(it.shot.content), refPaths: [charRef], settings, model: "flux" });
    if (!img.cached) {
      const usd = MODEL_USD[img.model] ?? 0;
      logImageCost({ beatId: `${it.id}(${it.zh})`, model: img.model ?? "flux", usd });
    }
    // 预处理(缓存)：边界底色归一到精确 bg + 裁框统一尺寸(非透明化)
    const cellImg = ensure(join(dir, "images", `${it.id}-cell.png`));
    if (!existsSync(cellImg)) await prepImage(rawImg, cellImg, settings.image.bg);

    console.log(`== ${it.id} ${it.zh}(${it.viet}) 配音${wordAudioMs[i]}ms 图${img.cached ? "cached" : "gen"}`);
    beats.push({
      id: it.id,
      role: "item",
      gridIndex: i,
      zh: it.zh,
      pinyin: it.pinyin,
      viet: it.viet,
      image: rel("images", `${it.id}-cell.png`),
      audio: rel("audio", `${it.id}.mp3`),
      gapMs: gap,               // 词前『摆动→滑走』过渡；过渡末词卡出现并发音
      durationMs: gap + wordAudioMs[i],
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
