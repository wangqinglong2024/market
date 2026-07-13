import { continueRender, delayRender, staticFile } from "remotion";

// ★字体配置化（用户 2026-07-05）：字体清单与字幕字体栈来自 config/settings.json → manifest.meta.fonts。
// 换字体只改 config（放 ttf + 登记 family/file + 调 zhStack/latinStack/zhWeight），不用改这里。
export type FontFileDef = { family: string; file: string; weight?: string };
export type FontsMeta = {
  files?: FontFileDef[];
  zhStack?: string[];
  zhWeight?: number;
  latinStack?: string[];
};

// 兜底默认（manifest 没带 fonts 时、或 Studio 里非视频 Composition 用）
export const DEFAULT_FONTS: FontsMeta = {
  files: [
    { family: "Ma Shan Zheng", file: "library/fonts/MaShanZheng.ttf" },
    { family: "Winter", file: "library/fonts/Winter.ttf" },
    { family: "SimHei", file: "library/fonts/SimHei.ttf" },
    { family: "Nunito", file: "library/fonts/Nunito.ttf", weight: "200 900" },
  ],
  zhStack: ["Ma Shan Zheng", "Winter", "SimHei", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "sans-serif"],
  zhWeight: 400,
  latinStack: ["Nunito", "PingFang SC", "Microsoft YaHei", "sans-serif"],
};

// 带空格的 family 名要加引号，拼成 CSS font-family 栈
const q = (s: string) => (/[\s]/.test(s) ? `"${s}"` : s);
export const stackCss = (stack?: string[]) => (stack && stack.length ? stack.map(q).join(", ") : "sans-serif");

// 注册 FontFace（按文件名幂等，多次调用同一文件不重复加载）
const registered = new Set<string>();
export function loadFonts(fonts: FontsMeta): Promise<void> {
  const files = (fonts.files || []).filter((f) => f && f.file && !registered.has(f.file));
  if (!files.length) return Promise.resolve();
  return Promise.all(
    files.map((f) => {
      registered.add(f.file);
      const ff = new FontFace(
        f.family,
        `url(${staticFile(f.file)}) format("truetype")`,
        f.weight ? { weight: f.weight } : undefined,
      );
      return ff
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        })
        .catch(() => {});
    }),
  ).then(() => {});
}

// 模块加载即预载默认字体（保证 Studio/预览等没有 manifest 的场景也有字体）；
// 视频渲染时 Video.tsx 会再按 manifest.meta.fonts 幂等加载（含用户换的新字体）。
const handle = delayRender("Loading caption fonts");
loadFonts(DEFAULT_FONTS).finally(() => continueRender(handle));

// 兜底导出（非视频 Composition，如特效预览）
export const FONT_ZH = stackCss(DEFAULT_FONTS.zhStack);
export const FONT_LATIN = stackCss(DEFAULT_FONTS.latinStack);
