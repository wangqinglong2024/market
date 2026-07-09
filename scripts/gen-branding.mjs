// 一次性：生成 TikTok 品牌图（头像 1:1 + 背景墙 9:16），输出到 templates/guoxue-jinju/branding/。
// 两张均为多角色 → nano-banana-pro/edit（喂定妆图保一致），共 2 次调用 ~$0.30。
import { mkdirSync } from "node:fs";
import { genImage } from "./gen-image.mjs";

const STYLE = `Bold rough hand-drawn black crayon outlines with varying thickness. LOOSE crayon coloring: each colored area is a soft fill that does NOT reach the outline, leaving clear white around the edges (never a solid flat fill). Very simple minimal shapes, few details, no clothing seams. Watercolor / crayon children's picture-book feel, multicolored, soft warm light. Keep the characters EXACTLY as shown in the reference images (same faces, hair, clothes, proportions).`;

const BOY = `The boy: chubby cartoon little boy, short tousled golden-blond hair, round pudgy face, rosy cheeks, small round black dot eyes, GREEN short-sleeve t-shirt and BLUE shorts, fair light skin.`;
const GIRL = `The girl: chubby cartoon little girl, light golden-blond hair in two small high pigtails with PINK ties, short bangs, rosy cheeks, PINK sleeveless dress, fair light skin.`;
const DAD = `The dad: slim gentle cartoon dad, short tousled brown hair, no glasses, BLUE long-sleeve button-up shirt, BROWN trousers.`;
const MOM = `The mom: chubby kind cartoon mom, dark brown hair in a small messy top bun, ORANGE long-sleeve top, WHITE trousers.`;
const DOG = `The small cartoon dog exactly as in its reference image.`;

const CH = (id) => `templates/guoxue-jinju/characters/${id}/model-sheet.png`;

mkdirSync("templates/guoxue-jinju/branding", { recursive: true });

// ① 头像 1:1（上传 TikTok 后会被裁成圆形 → 两个孩子居中、四角只留背景）
const avatar = await genImage({
  outPath: "templates/guoxue-jinju/branding/avatar.png",
  model: "nano-pro",
  refPaths: [CH("boy"), CH("girl")],
  settings: { image: { aspectRatio: "1:1" } },
  prompt: `${STYLE}
${BOY} ${GIRL}
Cheerful square profile-picture composition: the two kids side by side, shoulder-to-shoulder, heads close together, both smiling brightly at the viewer. The boy playfully holds up one small red book with the two Chinese characters "中文" written clearly on the cover. Upper-body framing, both faces large and centered.
IMPORTANT: this will be cropped to a CIRCLE — keep both children fully inside the central circular safe area, nothing important near the corners or edges. Background: a single soft warm pale-yellow watercolor wash circle glow, plain and minimal, no other objects, no text besides the book cover, no frames or boxes.`,
});
console.log("avatar:", avatar.path, avatar.cached ? "(cached)" : "(new)");

// ② 背景墙 9:16 竖屏（1080x1920 直播/主页背景），一家人一起学中文
const wall = await genImage({
  outPath: "templates/guoxue-jinju/branding/background-wall.png",
  model: "nano-pro",
  refPaths: [CH("boy"), CH("girl"), CH("dad"), CH("mom"), CH("dog")],
  settings: { image: { aspectRatio: "9:16" } },
  prompt: `${STYLE}
${BOY} ${GIRL} ${DAD} ${MOM} ${DOG}
Tall vertical 9:16 cozy scene: the whole family learning Chinese together in a warm living room. They sit on the floor around a low round wooden table. The dad holds up a big white flashcard with one large clear Chinese character "家" on it; the mom points at it gently; the boy and girl sit side by side looking up excitedly, the girl raising one hand; the little dog lies beside the kids. On the table: an open picture book and a cup. A warm floor lamp glows softly behind them.
Composition: the family group occupies the middle of the tall frame, with generous plain breathing space at the top and bottom (soft warm cream watercolor wash, a few faint hand-drawn Chinese characters floating lightly in the top area like 你好, 爱). Minimal sketched scene, no frames or boxes, no other text.`,
});
console.log("wall:", wall.path, wall.cached ? "(cached)" : "(new)");
