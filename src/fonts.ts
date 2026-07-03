import { continueRender, delayRender, staticFile } from "remotion";

// 中文用黑体（粗、清晰，视频字幕首选）+ 覆盖拼音声调/越南语的圆体（Nunito）
const simhei = new FontFace(
  "SimHei",
  `url(${staticFile("library/fonts/SimHei.ttf")}) format("truetype")`,
);

const nunito = new FontFace(
  "Nunito",
  `url(${staticFile("library/fonts/Nunito.ttf")}) format("truetype")`,
  { weight: "200 900" },
);

const handle = delayRender("Loading caption fonts");
Promise.all([simhei.load(), nunito.load()])
  .then((loaded) => {
    loaded.forEach((f) => document.fonts.add(f));
    continueRender(handle);
  })
  .catch(() => continueRender(handle));

// 中文用黑体，拼音/越南语用圆体，均带系统兜底
export const FONT_ZH =
  '"SimHei", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif';
export const FONT_LATIN =
  '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif';
