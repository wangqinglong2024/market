import { continueRender, delayRender, staticFile } from "remotion";

// 漫画中文体（站酷快乐体）+ 覆盖拼音声调/越南语的圆体（Nunito）
const zcool = new FontFace(
  "ZCOOL KuaiLe",
  `url(${staticFile("library/fonts/ZCOOLKuaiLe-Regular.ttf")}) format("truetype")`,
);

const nunito = new FontFace(
  "Nunito",
  `url(${staticFile("library/fonts/Nunito.ttf")}) format("truetype")`,
  { weight: "200 900" },
);

const handle = delayRender("Loading comic fonts");
Promise.all([zcool.load(), nunito.load()])
  .then((loaded) => {
    loaded.forEach((f) => document.fonts.add(f));
    continueRender(handle);
  })
  .catch(() => continueRender(handle));

// 中文用漫画体，拼音/越南语用圆体，均带系统兜底
export const FONT_ZH =
  '"ZCOOL KuaiLe", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
export const FONT_LATIN =
  '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif';
