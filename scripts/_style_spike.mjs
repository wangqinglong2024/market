// 画风 spike：用小王子参考图做风格迁移，5 个角色分开各出一张
import { readFileSync, writeFileSync } from "node:fs";

const KEY = readFileSync("api-key.txt", "utf8").split("\n")[1].trim();
const toDataUri = (p) =>
  "data:image/jpeg;base64," + readFileSync(p).toString("base64");

// 唯一画风锚点：小王子简笔画
const styleRef = toDataUri("plan/temp/a450f2022577cf8a8413d4a172285759.jpg");

// 所有角色共享的画风后缀（写死，保证一致）
const STYLE = `Copy ONLY the line and coloring STYLE from the reference image (not its background): bold ROUGH hand-drawn black crayon outlines with clearly VARYING line thickness — some strokes thick and heavy, some thin and tapered, with natural pressure variation, wobble, broken strokes and crayon texture (absolutely NOT uniform clean vector lines). COLORING — THIS IS THE MOST IMPORTANT RULE: fill each area with ONE single soft, fairly even crayon color as a whole (a coherent flat fill, NOT a mess of separate streaks or stacked individual strokes). BUT the color is colored casually and does NOT reach the black outline — it stops a little short of the lines, leaving a clear thin band of plain WHITE between the color and the outline all around each shape, plus a few small white gaps. The coloring slightly under-fills and occasionally drifts just outside the line. So: smooth overall color in the middle, white showing along the edges. (Exactly like how the scarf, pants, fox and planet are colored in the reference — whole soft fills with white left around the edges.) Do NOT fill all the way to the outline, and do NOT scribble many tiny strokes. Colors stay vivid.
BACKGROUND: a PLAIN PURE WHITE background, completely empty. Do NOT use any paper texture, do NOT add any background lighting, glow, shadow, stars or scenery — just clean white behind the character.
HAIR: draw the hair as ONE simple clean shape filled with loose crayon color — a soft brown crayon fill with a few lighter highlight gaps where the white shows through and just a few rough outline strokes. Do NOT draw many individual hair strands or messy scribbles, and do NOT use a solid flat dead-black fill — keep it a simple lively colored hair shape.
Keep everything FLAT and loose like a quick crayon doodle — minimal shading, NO heavy rendering or thick painted gradients (that looks muddy). Crisp loose crayon look.
Keep it EXTREMELY SIMPLE and MINIMAL — a quick cute doodle with very few lines, simplified shapes. OMIT all small clothing details: no seams, no stitches, no pockets, no drawstrings, no buttons, no cuff ribbing, no waistbands — clothing is just plain simple shapes. Tiny dot eyes, tiny pink blush, minimal face.
Composition: ONE single character only. Show the ENTIRE FULL BODY from head to feet COMPLETELY INSIDE the frame with a comfortable margin around it — nothing cropped or cut off at any edge. Centered, drawn reasonably large but fully contained.
CRITICAL: copy ONLY the style/line/coloring from the reference. Do NOT include the little prince, fox, rose, crown, planet, stars or any object from the reference. No text, no letters, no numbers, no logo, no watermark.`;

const characters = [
  {
    name: "boy",
    desc: "An EXTREMELY CHUBBY, very fat and round little boy about 5 years old, huge round belly, very pudgy round cheeks, short stubby arms and legs, short messy brown hair, sparkly happy eyes, the CUTEST most adorable lovable face, wearing a plain warm YELLOW hoodie and shorts (no details on the clothes). Butterball round, irresistibly cute.",
  },
  {
    name: "girl",
    desc: "An EXTREMELY CHUBBY, very fat and round little girl about 4 years old, huge round belly, very pudgy round cheeks, short stubby arms and legs, brown bob with tiny pigtails, big sparkly happy eyes, the CUTEST most adorable lovable face, wearing a plain coral-red dress (no details). Butterball round, irresistibly cute.",
  },
  {
    name: "dad",
    desc: "An ordinary, plain-looking, gentle young father (average everyday looks, not handsome — mild contrast with the pretty mom, but NOT silly or idiotic), a bit lanky, messy brown hair, simple round glasses, a normal warm friendly closed smile, wearing a plain olive-green tee and dark trousers. Kind and down-to-earth.",
  },
  {
    name: "mom",
    desc: "A YOUNG, youthful, fresh and beautiful sexy mom (looks in her mid twenties, pretty and lively, definitely NOT old, and NOT a plain teenage student). A slender OVAL face with a delicate pointed chin (classic pretty oval face shape), big lovely eyes, a charming smile. Attractive curvy figure with a slim waist and long legs, long wavy brown hair. Wearing a pretty, flattering and sexy fitted short dress in a stylish ROSE-PINK color with a nice neckline, and heels. Fashionable, youthful and alluring. Drawn as a simple cute crayon doodle.",
  },
  {
    name: "dog",
    desc: "The CUTEST, most adorable tiny round fluffy puppy — chibi proportions with a big round head and a small chubby round body, HUGE sparkly watery puppy eyes (very big and shiny), tiny floppy ears, a teeny pink nose, a tiny happy open smile with a little pink tongue, short stubby legs, a small wagging tail. Soft fluffy WHITE fur (use a few light grey/cream shading touches and a bold black outline so the white puppy reads clearly on the white background). Irresistibly cute, sweet and lovable, melt-your-heart adorable, sitting.",
  },
  // --- 3 个不同设计的妈妈，供挑选 ---
  {
    name: "momA",
    desc: "A youthful, beautiful and sexy young mom, slender OVAL face (melon-seed face) with a pointed chin and big bright eyes, sweet charming smile, slim curvy figure with long legs, long wavy chestnut-brown hair down. Wearing an elegant sexy ROSE-PINK fitted bodycon mini dress and high heels. Glamorous, pretty and youthful. Her dress is colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momB",
    desc: "A youthful, beautiful and sexy young mom, slender OVAL face (melon-seed face) with a pointed chin and big bright eyes, confident charming smile, slim curvy figure with long legs, dark brown hair in a sleek high ponytail. Wearing a chic off-shoulder little RED dress and high heels. Bold, stylish and alluring. Her dress is colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momC",
    desc: "A youthful, beautiful and sexy young mom, slender OVAL face (melon-seed face) with a pointed chin and big bright eyes, fresh sweet smile, slim curvy figure with long legs, shoulder-length wavy light-brown hair. Wearing a trendy cropped top with a high-waist LIGHT-BLUE denim short skirt and heels. Fresh, youthful and stylish. Her clothes are colored loosely with white left around the edges (color not reaching the outline).",
  },
  // --- 妈妈：3 个全新不同设计（脸型/发型/衣服/短裙都不同，均性感+瓜子脸） ---
  {
    name: "momN1",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, high cheekbones, big alluring eyes, red lips. Hair: long, straight, glossy dark-brown hair with a center part. Body: slim and curvy with long legs. Outfit: a sexy BLACK halter-neck short mini dress and black high heels. Elegant, hot and beautiful. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momN2",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big sweet sparkling eyes, soft pink lips. Hair: wavy shoulder-length light-brown hair with curtain bangs. Body: slim and curvy with long legs. Outfit: a sexy LAVENDER-PURPLE wrap short mini dress showing the legs, with strappy heels. Sweet, charming and sexy. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momN3",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy EMERALD-GREEN fitted bodycon short dress and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  // --- N3 同款（高发髻+修身短裙+瓜子脸），换裙色 ---
  {
    name: "momN3red",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy RED fitted bodycon short dress and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momN3blue",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy SAPPHIRE-BLUE fitted bodycon short dress and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momN3black",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy BLACK fitted bodycon short dress and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  // --- 3 个全新设计（瓜子脸+性感+短裙，发型裙型都不同） ---
  {
    name: "momD1",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big alluring eyes, soft lips. Hair: long loose wavy caramel-brown hair. Body: slim and curvy with long legs. Outfit: a sexy deep-V WRAP short dress in WINE-RED with strappy high heels. Hot, charming and beautiful. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momD2",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big sparkling eyes. Hair: dark-brown hair in a sleek long high ponytail. Body: slim and curvy with long legs. Outfit: a sexy ONE-SHOULDER short dress in CHAMPAGNE-GOLD with high heels. Glamorous and elegant. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momD3",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big eyes, cute bangs. Hair: a chin-length sleek bob with straight bangs. Body: slim and curvy with long legs. Outfit: a sexy fitted cream top tucked into a short BLACK leather mini skirt, with ankle heels. Trendy, chic and sexy. Her clothes colored loosely with white left around the edges (color not reaching the outline).",
  },
  // --- 斗牛犬（可爱版）2 个 ---
  {
    name: "dogBull1",
    desc: "An adorable CUTE chubby FRENCH BULLDOG puppy: big upright bat ears, a cute wrinkly flat little face, huge sparkly round eyes, a small stocky round body, short stubby legs, fawn / light-tan fur with a cream belly, a happy little smile, sitting. Cute and lovable (chibi cute, NOT ugly or scary). Loose edge-white crayon coloring on white background.",
  },
  {
    name: "dogBull2",
    desc: "An adorable CUTE chubby BULLDOG puppy with a different look: floppy folded ears, soft droopy cheeks, big sweet eyes, a stocky low muscular round body, short legs, GREY-AND-WHITE patched fur, a goofy happy smile with a little tongue, standing in a cute pose. Cute and lovable (chibi cute, NOT ugly or scary). Loose edge-white crayon coloring on white background.",
  },
  {
    name: "dogBull3",
    desc: "An adorable CUTE French bulldog puppy: big upright bat ears, wrinkly cute flat face, huge sparkly eyes, stocky round body, BLACK-AND-WHITE patched fur (black back, white chest and face), standing in a playful happy pose, tongue out. Cute and lovable (chibi cute, NOT ugly). Loose edge-white crayon coloring on white background.",
  },
  {
    name: "dogBull4",
    desc: "An adorable CUTE French bulldog puppy: big bat ears, wrinkly cute face, big soft eyes, chubby round body, warm BRINDLE-BROWN / chocolate fur, lying down relaxed with front paws stretched forward, sleepy happy smile. Cute and lovable (chibi cute, NOT ugly). Loose edge-white crayon coloring on white background.",
  },
  {
    name: "dogBull5",
    desc: "An adorable CUTE chubby English bulldog puppy: folded droopy ears, soft jowls, big sweet round eyes, very stocky round body, CREAM / pale-golden fur, sitting with its head tilted cutely and a little pink tongue. Cute and lovable (chibi cute, NOT ugly). Loose edge-white crayon coloring on white background.",
  },
  // --- 3 个全新不同设计的狗狗（品种/颜色/形态/姿势都不同） ---
  {
    name: "dogA",
    desc: "A super cute fluffy WHITE bichon / maltese puppy: a very round fluffy cloud-like body, big sparkly round eyes, small floppy ears, a tiny black nose, sitting upright. Soft and poofy. (Use light grey/cream shading and a bold black outline so the white puppy reads on the white background.) Irresistibly adorable.",
  },
  {
    name: "dogB",
    desc: "A super cute CARAMEL-ORANGE shiba-inu style puppy: pointed upright triangle ears, a fluffy curled-up tail, a slim alert little body, cream-colored cheeks and belly, a cheeky happy smile with tongue out, standing on all fours in a playful pose. Different shape and color from a fluffy white dog. Adorable and lively.",
  },
  {
    name: "dogC",
    desc: "A super cute BROWN-AND-WHITE beagle / spaniel style puppy: long droopy floppy ears, big soulful puppy eyes, a chubby low body with short legs, brown patches over white fur, lying down with paws forward in a relaxed cute pose. Different breed, color and pose. Heart-meltingly adorable.",
  },
  // --- N3red 同款（高发髻+修身吊带短裙+瓜子脸），换裙色：粉/肉/白 ---
  {
    name: "momPink",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted bodycon spaghetti-strap short mini dress in PINK and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momNude",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted bodycon spaghetti-strap short mini dress in NUDE / SKIN-TONE BEIGE and nude high heels. Classy, elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momWhite",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, refined elegant features, big eyes. Hair: dark-brown hair styled up in an elegant high bun with a few loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted bodycon spaghetti-strap short mini dress in WHITE and nude high heels. Classy, elegant and hot. Her dress colored loosely with thin grey shading so the white dress reads, white left around the edges (color not reaching the outline).",
  },
  // --- 3 个高发簪 + 短裙（瓜子脸+性感） ---
  {
    name: "momZan1",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big alluring eyes. Hair: an elegant high updo bun held with a decorative ornamental HAIRPIN / hair stick (hair-zan), a few soft loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted short mini dress in CHAMPAGNE-GOLD with high heels. Elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momZan2",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big sweet eyes. Hair: an elegant high updo bun held with a decorative ornamental HAIRPIN / hair stick (hair-zan), a few soft loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted short mini dress in LAVENDER-PURPLE with strappy high heels. Elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  {
    name: "momZan3",
    desc: "A gorgeous youthful sexy young mom. Face: a clear, sharp, slender MELON-SEED oval face with a delicate V-line pointed chin, big eyes. Hair: an elegant high updo bun held with a decorative ornamental HAIRPIN / hair stick (hair-zan), a few soft loose strands. Body: slim and curvy with long legs. Outfit: a sexy fitted short mini dress in DEEP-RED with high heels. Elegant and hot. Her dress colored loosely with white left around the edges (color not reaching the outline).",
  },
  // --- 爸爸重画（修留白），设计不变 ---
  {
    name: "dad2",
    desc: "An ordinary, plain-looking, gentle young father (average everyday looks, not handsome, not silly), a bit lanky, messy brown hair, simple round glasses, a normal warm friendly closed smile, wearing a plain OLIVE-GREEN tee and dark trousers. IMPORTANT: color the olive tee and the trousers LOOSELY with a clear band of white left between the color and the black outline (do NOT fill the clothes all the way to the lines). Kind and down-to-earth.",
  },
];

const only = process.argv[2]; // 可选：只画指定角色，如 `node scripts/_style_spike.mjs boy`
const count = parseInt(process.argv[3] || "1", 10); // 可选：出几张，如 `... mom 3`
const todo = only ? characters.filter((c) => c.name === only) : characters;

for (const c of todo) {
  const res = await fetch("https://fal.run/fal-ai/nano-banana/edit", {
    method: "POST",
    headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: `Subject: ${c.desc}\n\n${STYLE}`,
      image_urls: [styleRef],
      num_images: count,
      output_format: "png",
      aspect_ratio: "3:4",
    }),
  });
  const data = await res.json();
  const imgs = data?.images || [];
  if (!imgs.length) {
    console.log(c.name, "FAILED", JSON.stringify(data).slice(0, 200));
    continue;
  }
  for (let i = 0; i < imgs.length; i++) {
    const img = await fetch(imgs[i].url);
    const buf = Buffer.from(await img.arrayBuffer());
    const suffix = imgs.length > 1 ? `-v${i + 1}` : "";
    const out = `plan/temp/_char-${c.name}${suffix}.png`;
    writeFileSync(out, buf);
    console.log("saved", out, buf.length, "bytes");
  }
}
