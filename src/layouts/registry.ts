// 版式注册表：manifest.meta.layout → LayoutModule。
// 新模板若字幕/版式不同：写 src/layouts/<id>.tsx 导出 LAYOUT(见 types.ts 的 LayoutModule)，在此注册即可，Video.tsx 不用改。
import type { LayoutModule } from "./types";
import { LAYOUT as V2 } from "./v2-3x4";
import { LAYOUT as V1 } from "./v1-legacy";
import { LAYOUT as CHINESE_LEARN } from "./chinese-learn";
import { LAYOUT as CHUANYUE_DRAMA } from "./chuanyue-drama";
import { LAYOUT as HSK_ZIYUAN } from "./hsk-ziyuan";
import { LAYOUT as HSKS_VOCAB } from "./hsks-vocab";
import { LAYOUT as HSKS_GRAMMAR } from "./hsks-grammar";
import { LAYOUT as HSKS_TASK } from "./hsks-task";
import { LAYOUT as HSKS_HANZI } from "./hsks-hanzi";

const LAYOUTS: Record<string, LayoutModule> = {
  [V2.id]: V2,
  [V1.id]: V1,
  [CHINESE_LEARN.id]: CHINESE_LEARN,
  [CHUANYUE_DRAMA.id]: CHUANYUE_DRAMA,
  [HSK_ZIYUAN.id]: HSK_ZIYUAN,
  [HSKS_VOCAB.id]: HSKS_VOCAB,
  [HSKS_GRAMMAR.id]: HSKS_GRAMMAR,
  [HSKS_TASK.id]: HSKS_TASK,
  [HSKS_HANZI.id]: HSKS_HANZI,
};

// 未知/缺省 layout → 旧版式(v1-legacy)：与改造前「非 v2 即旧版式」的兜底一致，旧片渲染不变。
export function getLayout(id?: string): LayoutModule {
  return (id && LAYOUTS[id]) || V1;
}
