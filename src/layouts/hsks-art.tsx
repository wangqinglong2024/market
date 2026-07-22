// hsks 家族·彩色概念/场景/联想插画库(黑线描边 + 多色填充 简笔画,每图轻微自呼吸)。
// 用于 grammar/topic/task/hanzi 每条内容配图。key=概念 id。缺 id → 彩色"概念"占位(★绝不出现汉字,见 GANGLING §七 图标铁律)。
// 新增只加一个 case。viewBox 0 0 100 100。配色丰富,不单一。
import { useCurrentFrame } from "remotion";

const INK = "#1f2733";
const Ico: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
    <g stroke={INK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">{children}</g>
  </svg>
);
const T = (x: number, y: number, s: number, fill: string, txt: string) => (
  <text x={x} y={y} fontSize={s} fontWeight={900} fill={fill} stroke={INK} strokeWidth={1.6} textAnchor="middle" fontFamily="Nunito, sans-serif">{txt}</text>
);

// eslint-disable-next-line complexity
function Glyph(id: string, f: number): React.ReactNode {
  const sin = (p: number, a: number, ph = 0) => Math.sin(f * p + ph) * a;
  switch (id) {
    // ── 语法·时态/体 概念 ──
    case "change": // 变化态：箭头把方块变成三角(状态改变)
      return <Ico><rect x="16" y="40" width="22" height="22" rx="4" fill="#8fd0ff" /><path d="M44 51h16" stroke="#f0a020" strokeWidth="5" /><path d="M56 44l10 7-10 7z" fill="#f0a020" /><path d="M78 40l11 22H67z" fill="#ffb4c6" /></Ico>;
    case "done": // 完成态：绿勾圆
      return <Ico><circle cx="50" cy="50" r="30" fill="#c3f0d8" /><path d="M36 51l10 11 20-24" stroke="#12b886" strokeWidth="7" fill="none" /></Ico>;
    case "progress": // 进行态：转动的进度环
      return <Ico><circle cx="50" cy="50" r="28" fill="#ede7ff" /><g transform={`rotate(${f * 4} 50 50)`}><path d="M50 22a28 28 0 0 1 24 14" stroke="#7048e8" strokeWidth="7" fill="none" /><circle cx="74" cy="36" r="5" fill="#7048e8" stroke="none" /></g></Ico>;
    case "clock8": // 时钟指8点
      return <Ico><circle cx="50" cy="52" r="30" fill="#fff3d6" /><circle cx="50" cy="52" r="30" fill="none" /><line x1="50" y1="52" x2="50" y2="32" stroke="#e8590c" strokeWidth="5" /><line x1="50" y1="52" x2="36" y2="60" stroke="#e8590c" strokeWidth="5" /><path d="M40 20l-8-6M60 20l8-6" /></Ico>;
    case "class": // 上课：黑板+A
      return <Ico><rect x="16" y="22" width="68" height="46" rx="6" fill="#1f6f54" /><rect x="16" y="22" width="68" height="46" rx="6" fill="none" />{T(50, 54, 26, "#fff", "Aa")}<rect x="40" y="70" width="20" height="10" rx="2" fill="#c49a6c" /></Ico>;
    case "movie": // 电影
      return <Ico><rect x="18" y="30" width="64" height="42" rx="6" fill="#8fd0ff" /><path d="M18 40h64" /><circle cx="30" cy="35" r="3" fill={INK} stroke="none" /><circle cx="42" cy="35" r="3" fill={INK} stroke="none" /><path d="M44 44l22 14-22 14z" fill="#ff5a7a" /></Ico>;
    case "sing": // 唱歌：麦克风+音符
      return <Ico><rect x="42" y="20" width="16" height="34" rx="8" fill="#ec4899" /><path d="M34 46a16 16 0 0 0 32 0" fill="none" stroke="#ec4899" strokeWidth="4" /><line x1="50" y1="62" x2="50" y2="76" /><path d="M72 30v18" stroke="#7048e8" strokeWidth="4" /><circle cx="68" cy="50" r="5" fill="#7048e8" stroke="none" /></Ico>;
    case "study": // 学习：书+笔
      return <Ico><path d="M20 62V32l30-8 30 8v30l-30 8z" fill="#ffd9a8" /><path d="M50 24v46" /><g transform={`rotate(${sin(0.2, 6)} 74 40)`}><rect x="70" y="20" width="8" height="30" rx="3" fill="#2b7fff" /><path d="M70 50l4 8 4-8z" fill="#f7b500" /></g></Ico>;
    case "tv": // 看电视
      return <Ico><rect x="18" y="26" width="64" height="44" rx="6" fill="#cdeaff" /><rect x="18" y="26" width="64" height="44" rx="6" fill="none" /><path d="M40 78h20M50 70v8" /><path d="M40 40l14 8-14 8z" fill="#ff7a1a" /></Ico>;

    // ── 话题域 ──
    case "id-card": // 个人信息
      return <Ico><rect x="16" y="26" width="68" height="48" rx="8" fill="#dbeafe" /><rect x="16" y="26" width="68" height="48" rx="8" fill="none" /><circle cx="36" cy="46" r="9" fill="#2b7fff" /><path d="M25 66a11 8 0 0 1 22 0" fill="#2b7fff" /><path d="M56 42h20M56 52h20M56 62h14" stroke="#64748b" strokeWidth="4" /></Ico>;
    case "calendar": // 事件信息
      return <Ico><rect x="20" y="24" width="60" height="54" rx="8" fill="#ffe3ec" /><rect x="20" y="24" width="60" height="54" rx="8" fill="none" /><path d="M20 40h60" /><line x1="34" y1="18" x2="34" y2="30" /><line x1="66" y1="18" x2="66" y2="30" /><circle cx="50" cy="58" r="8" fill="#ec4899" stroke="none" /></Ico>;
    case "box": // 物品信息
      return <Ico><path d="M22 40l28-14 28 14-28 14z" fill="#ffe08a" /><path d="M22 40v26l28 14V54z" fill="#f0b429" /><path d="M78 40v26L50 80V54z" fill="#e8901a" /></Ico>;
    case "weather": // 环境信息：太阳+云
      return <Ico><g transform={`rotate(${f * 0.8} 40 38)`}>{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=a*Math.PI/180;return <line key={i} x1={40+16*Math.cos(r)} y1={38+16*Math.sin(r)} x2={40+24*Math.cos(r)} y2={38+24*Math.sin(r)} stroke="#f7b500" strokeWidth="4" />;})}</g><circle cx="40" cy="38" r="13" fill="#ffcf33" /><path d="M52 66a12 12 0 0 1 0-24 14 14 0 0 1 26 6 10 10 0 0 1-2 18z" fill="#e8eef4" /></Ico>;
    case "book": // 学习/书
      return <Ico><path d="M50 28C40 22 26 22 20 26v42c6-4 20-4 30 2 10-6 24-6 30-2V26c-6-4-20-4-30 2z" fill="#c3f0d8" /><path d="M50 30v44" stroke="#12b886" strokeWidth="4" /></Ico>;
    case "food": // 饮食文化：碗+筷+热气
      return <Ico><g opacity={0.6 + 0.4 * Math.sin(f * 0.2)}>{[42,52].map((x,i)=><path key={i} d={`M${x} ${34-(f*0.6+i*7)%14} q4 -6 0 -10`} stroke="#b7c4cc" strokeWidth="3" />)}</g><path d="M22 50h56a28 20 0 0 1-56 0z" fill="#ff9d5c" /><path d="M20 50h60" /><g transform={`rotate(${sin(0.2,4)} 74 34)`}><line x1="66" y1="20" x2="76" y2="48" stroke="#8a5a2b" strokeWidth="4" /><line x1="74" y1="18" x2="82" y2="46" stroke="#8a5a2b" strokeWidth="4" /></g></Ico>;
    case "school": // 校园
      return <Ico><rect x="24" y="42" width="52" height="34" fill="#ffd9a8" /><path d="M20 42l30-20 30 20z" fill="#e8590c" /><rect x="44" y="56" width="12" height="20" fill="#8a5a2b" /><line x1="50" y1="12" x2="50" y2="22" /><path d="M50 14h12v7H50z" fill="#ff5a7a" stroke="none" /></Ico>;

    // ── 交际技能 ──
    case "ear": // 听
      return <Ico><path d="M38 78c-4-14-14-16-14-34a26 26 0 0 1 52 0c0 10-6 14-14 16" fill="#ffd9a8" /><path d="M40 40a10 10 0 0 1 18 4c0 8-8 8-8 16" fill="none" stroke="#e8590c" strokeWidth="4" /><circle cx="50" cy="70" r="3" fill="#e8590c" stroke="none" /></Ico>;
    case "eye": // 读/看
      return <Ico><path d="M18 50c14-20 50-20 64 0-14 20-50 20-64 0z" fill="#dbeafe" /><circle cx="50" cy="50" r="12" fill="#fff" /><circle cx="50" cy="50" r="7" fill="#2b7fff" stroke="none" /></Ico>;
    case "speak": // 说
      return <Ico><path d="M20 30h48a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H40l-14 12v-12h-6a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6z" fill="#c3f0d8" /><path d="M34 44h34M34 54h22" stroke="#12b886" strokeWidth="4" /></Ico>;
    case "pen": // 写
      return <Ico><path d="M24 74l6-18 34-34 12 12-34 34z" fill="#ffe08a" /><path d="M60 26l12 12" /><path d="M24 74l6-18" /><path d="M64 22l6-6 12 12-6 6z" fill="#7048e8" /></Ico>;

    // ── 汉字·图形联想(具象 or 抽象,绝不写该汉字本身) ──
    case "num1": return <Ico><circle cx="50" cy="50" r="30" fill="#dbeafe" />{T(50, 64, 46, "#2b7fff", "1")}</Ico>;
    case "num3": return <Ico><circle cx="50" cy="50" r="30" fill="#c3f0d8" />{T(50, 64, 46, "#12b886", "3")}</Ico>;
    case "num7": return <Ico><circle cx="50" cy="50" r="30" fill="#ffe3ec" />{T(50, 64, 46, "#ec4899", "7")}</Ico>;
    case "num9": return <Ico><circle cx="50" cy="50" r="30" fill="#ede7ff" />{T(50, 64, 46, "#7048e8", "9")}</Ico>;
    case "up": // 上：向上箭头到架子
      return <Ico><line x1="26" y1="70" x2="74" y2="70" stroke="#94a3b8" strokeWidth="6" /><g transform={`translate(0 ${sin(0.2, 4)})`}><line x1="50" y1="66" x2="50" y2="28" stroke="#12b886" strokeWidth="8" /><path d="M34 40l16-18 16 18z" fill="#12b886" /></g></Ico>;
    case "down": // 下：向下箭头
      return <Ico><line x1="26" y1="30" x2="74" y2="30" stroke="#94a3b8" strokeWidth="6" /><g transform={`translate(0 ${-sin(0.2, 4)})`}><line x1="50" y1="34" x2="50" y2="70" stroke="#e8590c" strokeWidth="8" /><path d="M34 60l16 18 16-18z" fill="#e8590c" /></g></Ico>;
    case "no": // 不：禁止
      return <Ico><circle cx="50" cy="50" r="28" fill="none" stroke="#e03131" strokeWidth="9" /><line x1="30" y1="30" x2="70" y2="70" stroke="#e03131" strokeWidth="9" /></Ico>;
    case "east-sun": // 东：日出地平线
      return <Ico><line x1="16" y1="66" x2="84" y2="66" stroke="#8a5a2b" strokeWidth="5" /><path d="M30 66a20 20 0 0 1 40 0z" fill="#ffcf33" /><g transform={`translate(0 ${-Math.abs(sin(0.15,2))})`}><line x1="50" y1="30" x2="50" y2="40" stroke="#f7b500" strokeWidth="4" /><line x1="30" y1="40" x2="35" y2="48" stroke="#f7b500" strokeWidth="4" /><line x1="70" y1="40" x2="65" y2="48" stroke="#f7b500" strokeWidth="4" /></g></Ico>;
    case "pair": // 两：一对
      return <Ico><circle cx="38" cy="50" r="16" fill="#8fd0ff" /><circle cx="64" cy="50" r="16" fill="#ffb4c6" />{T(38, 57, 18, "#2b7fff", "2")}</Ico>;
    case "one-item": // 个：单个被框
      return <Ico><rect x="30" y="26" width="40" height="48" rx="8" fill="none" stroke="#0ea5a5" strokeWidth="4" strokeDasharray="6 5" /><circle cx="50" cy="46" r="10" fill="#0ea5a5" /><path d="M36 70a14 10 0 0 1 28 0z" fill="#0ea5a5" /></Ico>;
    case "center": // 中：靶心
      return <Ico><circle cx="50" cy="50" r="28" fill="#ffe3ec" /><circle cx="50" cy="50" r="18" fill="#fff" /><circle cx="50" cy="50" r="9" fill="#e03131" stroke="none" /><line x1="50" y1="14" x2="50" y2="86" /><line x1="14" y1="50" x2="86" y2="50" /></Ico>;
    case "question": // 么：问号气泡(什么)
      return <Ico><rect x="22" y="22" width="56" height="44" rx="14" fill="#fff3d6" /><path d="M36 66l0 14 14-14z" fill="#fff3d6" />{T(50, 56, 34, "#e8901a", "?")}</Ico>;
    case "also": // 也：也/同样→两个相同+加号
      return <Ico><circle cx="34" cy="50" r="12" fill="#c3f0d8" /><circle cx="66" cy="50" r="12" fill="#c3f0d8" /><path d="M50 40v20M40 50h20" stroke="#12b886" strokeWidth="5" /></Ico>;
    case "feather": // 习：羽毛(练习)
      return <Ico><path d="M28 74C24 50 44 26 72 22c2 26-12 46-34 50z" fill="#dbeafe" /><path d="M60 34L34 68" stroke="#2b7fff" strokeWidth="3" /><path d="M52 34l-10 6M58 42l-12 8M46 46l-8 6" stroke="#2b7fff" strokeWidth="2.4" /></Ico>;
    case "shopping": // 买：购物袋+币
      return <Ico><path d="M28 40h44l-4 38H32z" fill="#ffe08a" /><path d="M38 40a12 12 0 0 1 24 0" fill="none" stroke={INK} strokeWidth="4" /><circle cx="50" cy="58" r="9" fill="#f0a020" />{T(50, 63, 13, "#fff", "$")}</Ico>;
    case "affair": // 事：公文/事务(齿轮+纸)
      return <Ico><rect x="26" y="22" width="44" height="56" rx="5" fill="#dbeafe" /><path d="M34 36h28M34 48h28M34 60h18" stroke="#64748b" strokeWidth="4" /><g transform={`rotate(${f * 3} 68 66)`}><circle cx="68" cy="66" r="10" fill="#7048e8" />{[0,60,120,180,240,300].map((a,i)=><rect key={i} x={66} y={52} width="4" height="6" fill="#7048e8" stroke="none" transform={`rotate(${a} 68 66)`} />)}<circle cx="68" cy="66" r="4" fill="#fff" stroke="none" /></g></Ico>;

    default:
      return null;
  }
}

// 彩色"概念"占位(无 id 匹配时)：彩瓷砖 + 旋转虚线环 + 三连点 + 星光。★无汉字。
const Concept: React.FC<{ accent: string; f: number }> = ({ accent, f }) => {
  const d = Math.floor((f / 8) % 4);
  return (
    <Ico>
      <rect x="16" y="16" width="68" height="68" rx="18" fill={`${accent}22`} stroke="none" />
      <g transform={`rotate(${f * 1.1} 50 50)`}><circle cx="50" cy="50" r="24" fill="none" stroke={accent} strokeWidth="3.2" strokeDasharray="7 8" /></g>
      {[38, 50, 62].map((x, i) => <circle key={i} cx={x} cy="50" r="4.4" fill={accent} stroke="none" opacity={i <= d ? 1 : 0.3} />)}
    </Ico>
  );
};

export const Art: React.FC<{ id?: string; accent?: string; seed?: number }> = ({ id, accent = "#ff7a1a", seed = 0 }) => {
  const f = useCurrentFrame();
  // ★明显动态(用户要求):呼吸缩放 + 轻摆 + 上下浮动;seed 错开各图相位,不整齐划一。
  const ph = seed * 1.3;
  const bob = Math.sin(f * 0.12 + ph) * 3;
  const breathe = 1 + Math.sin(f * 0.16 + ph) * 0.055;
  const tilt = Math.sin(f * 0.09 + ph) * 2.4;
  const g = id ? Glyph(id, f) : null;
  return (
    <div style={{ width: "100%", height: "100%", transform: `translateY(${bob}px) rotate(${tilt}deg) scale(${breathe})` }}>
      {g ?? <Concept accent={accent} f={f} />}
    </div>
  );
};
