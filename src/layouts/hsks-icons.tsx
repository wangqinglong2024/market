// HSK 词汇卡通图标库（★黑色线条描边 + 配色填充 的简笔画/贴纸风；★每个图标都有专属内部微动画）。
// key=汉字(去同形消歧数字)，跨视频增量复用。抽象词→统一 fallback(黑框彩色瓷砖+大字,轻微脉动)。
// 每图 viewBox 0 0 100 100，动画由帧 f 驱动(useCurrentFrame)。新增词只加一个 case。
import { useCurrentFrame } from "remotion";

const INK = "#1f2733";
const key = (w: string) => (w || "").replace(/\d+$/, "").trim();

const S: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
    <g stroke={INK} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none">{children}</g>
  </svg>
);
const Dot = ({ x, y, r = 2.8 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill={INK} stroke="none" />;

// 黑描边小人脸(可带头部摆动 tilt)
const Face: React.FC<{ skin?: string; hair: string; tilt?: number; children?: React.ReactNode }> = ({ skin = "#ffd9a8", hair, tilt = 0, children }) => (
  <g transform={`rotate(${tilt} 50 55)`}>
    <circle cx="50" cy="52" r="27" fill={skin} />
    <path d="M25 47a25 25 0 0 1 50 0c-6-6-14-8-25-8s-19 2-25 8z" fill={hair} />
    <Dot x={41} y={52} /><Dot x={59} y={52} />
    <path d="M44 62q6 5 12 0" />
    {children}
  </g>
);

// eslint-disable-next-line complexity
function Glyph({ w, accent, f }: { w: string; accent: string; f: number }): React.ReactNode {
  const sin = (period: number, amp: number, ph = 0) => Math.sin(f * period + ph) * amp; // 便捷振荡
  switch (key(w)) {
    case "爱": { // 心跳
      const beat = 1 + Math.abs(Math.sin(f * 0.16)) * 0.1;
      return <S><g transform={`translate(50 54) scale(${beat}) translate(-50 -54)`}><path d="M50 80C22 60 18 38 31 29c8-6 16-2 19 5 3-7 11-11 19-5 13 9 9 31-19 51z" fill="#ff5a7a" /><path d="M39 41q3-4 8-3" stroke="#fff" strokeWidth="3.4" /></g></S>;
    }
    case "八": // 数字8 摇摆
      return <S><g transform={`rotate(${sin(0.18, 5)} 50 50)`}><text x="50" y="72" fontSize="62" fontWeight="900" fill={accent} stroke={INK} strokeWidth="2.4" textAnchor="middle" fontFamily="Nunito, sans-serif">8</text></g></S>;
    case "百": // 100 弹跳
      return <S><g transform={`translate(0 ${sin(0.2, 3)})`}><text x="50" y="64" fontSize="34" fontWeight="900" fill={accent} stroke={INK} strokeWidth="1.6" textAnchor="middle" fontFamily="Nunito, sans-serif">100</text></g></S>;
    case "半": // 半盘缓慢自转(阴晴圆缺感)
      return <S><g transform={`rotate(${f * 1.1} 50 50)`}><circle cx="50" cy="50" r="32" fill="#ffe08a" /><path d="M50 18a32 32 0 0 1 0 64z" fill="#f0b429" stroke="none" /><line x1="50" y1="16" x2="50" y2="84" /></g></S>;
    case "爸爸": // 头部摆动
      return <S><Face hair="#2c2c2c" tilt={sin(0.11, 4)}><path d="M47 78l3 11 3-11z" fill={accent} /></Face></S>;
    case "白天": case "太阳": // 光芒旋转 + 中心脉动
      return <S><g transform={`rotate(${f * 0.9} 50 50)`} stroke={INK} strokeWidth="4">{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=(a*Math.PI)/180;return <line key={i} x1={50+24*Math.cos(r)} y1={50+24*Math.sin(r)} x2={50+37*Math.cos(r)} y2={50+37*Math.sin(r)} />;})}</g><circle cx="50" cy="50" r={18 + sin(0.2, 1.5)} fill="#ffcf33" /></S>;
    case "包子": // 蒸腾(热气上飘) + 轻微起伏
      return <S><g opacity={0.6 + 0.4 * Math.sin(f * 0.2)} strokeWidth="3">{[40,52,60].map((x,i)=><path key={i} d={`M${x} ${20 - (f*0.6+i*7)%14} q4 -6 0 -10`} stroke="#b7c4cc" />)}</g><g transform={`translate(0 ${sin(0.18,1.5)})`}><ellipse cx="50" cy="58" rx="33" ry="25" fill="#fff7ec" /><g strokeWidth="3">{[34,44,54,64].map((x,i)=><path key={i} d={`M${x} 42q3 8 -3 16`} />)}</g><circle cx="50" cy="40" r="4" fill="#e7c9a0" /></g></S>;
    case "杯子": // 轻晃
      return <S><g transform={`rotate(${sin(0.14, 4)} 50 80)`}><path d="M33 30h34l-4 44a6 6 0 0 1-6 6H43a6 6 0 0 1-6-6z" fill="#bfe3ff" /><path d="M35 40h30" /><path d="M67 40h8a8 8 0 0 1 0 16h-7" /></g></S>;
    case "本": case "书": { // 封面轻微翻合
      const a = sin(0.13, 7);
      return <S><path d="M24 24h42a5 5 0 0 1 5 5v53H29a5 5 0 0 1-5-5z" fill={accent} /><g transform={`rotate(${a} 31 82)`}><rect x="31" y="24" width="40" height="58" fill="#fff" /><g strokeWidth="2.6" opacity="0.7">{[38,48,58,68].map((y,i)=><line key={i} x1="39" y1={y} x2="63" y2={y} />)}</g></g></S>;
    }
    case "病": { // 十字脉动
      const s = 1 + Math.abs(Math.sin(f * 0.14)) * 0.12;
      return <S><rect x="30" y="20" width="40" height="60" rx="9" fill="#fff" /><g transform={`translate(50 50) scale(${s}) translate(-50 -50)`}><rect x="45" y="30" width="10" height="40" rx="2" fill="#ff6b6b" /><rect x="30" y="45" width="40" height="10" rx="2" fill="#ff6b6b" /></g></S>;
    }
    case "菜": // 菜品轻跳
      return <S><ellipse cx="50" cy="60" rx="35" ry="13" fill="#eef2f5" /><path d="M18 58a32 12 0 0 0 64 0" /><g transform={`translate(0 ${-Math.abs(sin(0.22,3))})`}><circle cx="40" cy="52" r="9" fill="#4caf50" /><circle cx="56" cy="50" r="10" fill="#66bb6a" /><circle cx="60" cy="57" r="7" fill="#ef5350" /></g></S>;
    case "茶": // 热气升腾
      return <S><g strokeWidth="3">{[43,52].map((x,i)=><path key={i} d={`M${x} ${34 - (f*0.7+i*8)%16} q4 -6 0 -11`} stroke="#b7c4cc" opacity={0.7} />)}</g><path d="M31 42h34v11a17 17 0 0 1-34 0z" fill="#a7d98a" /><path d="M65 45h8a7 7 0 0 1 0 14h-7" /><ellipse cx="48" cy="42" rx="17" ry="3.5" fill="#c8e6a8" stroke="none" /></S>;
    case "唱": case "歌": { // 头摆 + 音符上飘
      const ny = -(f * 0.8) % 22;
      return <S><Face hair="#5a3a6a" tilt={sin(0.14, 5)}><ellipse cx="50" cy="63" rx="5" ry="7" fill="#b0304a" /></Face><g transform={`translate(0 ${ny})`} opacity={1 - Math.abs(ny) / 26}><circle cx="78" cy="40" r="6" fill={accent} /><line x1="84" y1="40" x2="84" y2="22" /><path d="M84 22q8 1 8 8" /></g></S>;
    }
    case "超市": case "商店": // 遮阳篷起伏
      return <S><rect x="24" y="42" width="52" height="40" fill="#fff" /><g transform={`translate(0 ${sin(0.2,1.2)}) scale(1 ${1+sin(0.2,0.04)})`}><path d="M18 42l7-16h50l7 16z" fill={accent} /><g strokeWidth="2.5" stroke="#fff">{[32,46,60].map((x,i)=><line key={i} x1={x} y1="27" x2={x} y2="41" />)}</g></g><rect x="42" y="58" width="16" height="24" fill={`${accent}55`} /></S>;
    case "车": { // 悬挂颠簸 + 轮子转动(白辐条)
      const by = -Math.abs(Math.sin(f * 0.3)) * 3;
      const wheel = (cx: number) => <g><circle cx={cx} cy="76" r="8" fill={INK} stroke="none" /><g transform={`rotate(${f * 8} ${cx} 76)`} stroke="#fff" strokeWidth="2"><line x1={cx-5} y1="76" x2={cx+5} y2="76" /><line x1={cx} y1="71" x2={cx} y2="81" /></g></g>;
      return <S><g transform={`translate(0 ${by})`}><path d="M18 62l7-19a7 7 0 0 1 6-4h38a7 7 0 0 1 6 4l7 19z" fill={accent} /><rect x="16" y="60" width="68" height="14" rx="5" fill={accent} /><path d="M36 43l-4 16h36l-4-16z" fill="#cdeaff" /></g>{wheel(33)}{wheel(67)}</S>;
    }
    case "出租车": { // 颠簸 + 顶灯闪烁
      const by = -Math.abs(Math.sin(f * 0.3)) * 3;
      return <S><rect x="40" y="24" width="20" height="9" rx="2" fill={INK} opacity={0.55 + 0.45 * Math.abs(Math.sin(f * 0.25))} /><g transform={`translate(0 ${by})`}><path d="M18 62l7-19a7 7 0 0 1 6-4h38a7 7 0 0 1 6 4l7 19z" fill="#ffcf33" /><rect x="16" y="60" width="68" height="14" rx="5" fill="#ffcf33" /><path d="M36 43l-4 16h36l-4-16z" fill="#cdeaff" /></g><circle cx="33" cy="76" r="8" fill={INK} stroke="none" /><circle cx="67" cy="76" r="8" fill={INK} stroke="none" /></S>;
    }
    case "吃": { // 筷子夹动
      const cy = sin(0.25, 4);
      return <S><path d="M20 56a30 20 0 0 0 56 0z" fill="#ffd9a0" /><path d="M18 56h60" /><circle cx="42" cy="52" r="5" fill="#ef5350" /><circle cx="56" cy="50" r="6" fill="#66bb6a" /><g transform={`translate(0 ${cy}) rotate(${sin(0.25,4)} 78 35)`} strokeWidth="4"><line x1="70" y1="18" x2="80" y2="52" /><line x1="78" y1="16" x2="86" y2="50" /></g></S>;
    }
    case "穿": // 衣摆轻摆
      return <S><g transform={`rotate(${sin(0.13,3)} 50 28)`}><path d="M36 24l14 9 14-9 15 12-8 11-7-4v37H36V43l-7 4-8-11z" fill={accent} /><path d="M42 31a8 6 0 0 0 16 0" /></g></S>;
    case "打电话": case "电话": { // 震动 + 信号波脉冲
      const shake = sin(0.9, 3.5);
      const wo = 0.3 + 0.7 * Math.abs(Math.sin(f * 0.2));
      return <S><g transform={`rotate(${shake} 50 50)`}><rect x="35" y="16" width="30" height="66" rx="9" fill="#fff" /><rect x="40" y="24" width="20" height="42" rx="2" fill="#8fd0ff" /><Dot x={50} y={74} r={3.4} /></g><g stroke={accent} strokeWidth="4" opacity={wo}><path d="M70 22q10 3 12 13" /><path d="M76 20q13 3 15 17" /></g></S>;
    }
    case "到": case "来": // 箭头往复
      return <S><g transform={`translate(${sin(0.2,5)} 0)`}><line x1="26" y1="50" x2="66" y2="50" stroke={accent} strokeWidth="8" /><path d="M58 36l16 14-16 14z" fill={accent} /></g><circle cx="24" cy="50" r="7" fill="#ff5a7a" /></S>;
    case "大": case "大学": case "大学生": // 学士帽流苏摆
      return <S><path d="M50 22l32 16-32 13-32-13z" fill={accent} /><path d="M32 45v13a18 7 0 0 0 36 0V45" /><g transform={`rotate(${sin(0.16,7)} 82 38)`}><line x1="82" y1="38" x2="82" y2="58" /><circle cx="82" cy="61" r="3.4" fill={accent} /></g></S>;
    default:
      return null;
  }
}

// 抽象词 fallback：黑框彩色圆角瓷砖 + 大号字 + 强调色装饰点(轻微脉动)
const Fallback: React.FC<{ w: string; accent: string; f: number }> = ({ w, accent, f }) => {
  const ch = key(w).charAt(0);
  const s = 1 + Math.abs(Math.sin(f * 0.1)) * 0.05;
  return (
    <S>
      <g transform={`translate(50 50) scale(${s}) translate(-50 -50)`}>
        <rect x="14" y="14" width="72" height="72" rx="18" fill={`${accent}26`} />
        <circle cx="74" cy="26" r="6" fill={accent} />
        <text x="50" y="52" fontSize="42" fontWeight="900" fill={accent} stroke={INK} strokeWidth="1.4" textAnchor="middle" dominantBaseline="central" fontFamily="'PingFang SC','Microsoft YaHei',sans-serif">{ch}</text>
      </g>
    </S>
  );
};

export const HskIcon: React.FC<{ word: string; accent: string }> = ({ word, accent }) => {
  const f = useCurrentFrame();
  const g = Glyph({ w: word, accent, f });
  // 整体只做极轻上下浮动(内部各自有专属动效)
  const bob = Math.sin(f * 0.1) * 1.4;
  return (
    <div style={{ width: "100%", height: "100%", transform: `translateY(${bob}px)` }}>
      {g ?? <Fallback w={word} accent={accent} f={f} />}
    </div>
  );
};
