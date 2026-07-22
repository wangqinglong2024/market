// hsks-vocab 图标『同案词组』：这些同义/近义词在 hsks-icons.tsx 的 Glyph 里共用同一个 case(渲染出同一张 SVG)。
// ★铁律(用户 2026-07-23)：同一条视频里两张 SVG 不得相同 → build 用本表检测；一批词里若出现同组的两个词,报错,需给其一画专属图。
// 有专属独立 case 的词彼此天然不同;抽象词 fallback 已按词派生变体(各不相同)。所以冲突只可能来自本表列出的共享 case。
// 维护:在 hsks-icons.tsx 里给多个词共用一个 case 时,同步把这些词加进下面某个数组。
export const SHARED_CASES = [
  ["白天", "太阳"],
  ["本", "书"],
  ["唱", "歌"],
  ["超市", "商店"],
  ["打电话", "电话"],
  ["到", "来"],
  ["大", "大学", "大学生"],
  ["吧", "呢", "吗", "啊"],
  ["边", "旁边"],
  ["不客气", "谢谢"],
];

const clean = (w) => (w || "").replace(/\d+$/, "").trim();

// 返回该词的"图标签名"：属于某共享组→组号(同组词签名相同);否则 null(有专属图或按词变体的 fallback,天然唯一)。
export function iconSigOf(word) {
  const c = clean(word);
  const i = SHARED_CASES.findIndex((g) => g.includes(c));
  return i === -1 ? null : `shared:${i}`;
}
