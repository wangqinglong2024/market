# 可用 TTS 音色档案（火山引擎）

> 2026-07-12 实测于本账号（api-key.txt 的豆包 APPID 9026810357）。
> 结论先行：**本账号可直接调用火山官方越南语大模型音色，走现有 v1 接口，不需要任何额外开通。**
> 同目录下的 `<voice_type>.mp3` 是每个音色的试听样品（同一句阮姓文案），文件名即 voice_type。

## 一、越南语音色（已实测 ✅）

| voice_type | 性别 | 官方场景 | 状态 |
|---|---|---|---|
| `vi_female_linh_uranus_bigtts` | 女 | 视频配音 | ✅ 可用，**当前 shenfen-jiema 模板在用** |
| `vi_female_ling_uranus_bigtts` | 女 | 通用/视频配音 | ✅ 可用 |
| `vi_female_ruan_uranus_bigtts` | 女 | 通用/有声书/角色扮演 | ✅ 可用 |
| `vi_male_wumg_uranus_bigtts` | 男 | 通用/客服 | ✅ 可用 |

官方越南语音色共 7 个，未测的另外 3 个（大概率同样可用）：
`vi_female_hong_uranus_bigtts`（通用/客服）、`vi_female_partner_uranus_bigtts`（配音/客服）、`vi_female_wu_uranus_bigtts`（通用/配音）。
来源：[火山引擎豆包语音·音色列表](https://www.volcengine.com/docs/6561/1257544)。

## 二、中文音色（已实测 ✅ 2026-07-15，样品=`<中文名>__<voice_type>.mp3`）

| voice_type | 中文名 | 状态/用途 |
|---|---|---|
| `zh_female_kailangjiejie_moon_bigtts` | 开朗姐姐 | ✅ 旧模板在用；读越语慢、非母语感，勿用于越语旁白 |
| `zh_female_wenrouxiaoya_moon_bigtts` | 温柔小雅 | ✅ chinese-drama 女主(说中文+内心思考) |
| `zh_female_roumeinvyou_emo_v2_mars_bigtts` | 柔美女友 | ✅ chinese-drama 小桃（moon 版无此音色） |
| `zh_female_xinlingjitang_moon_bigtts` | 心灵鸡汤 | ✅ chinese-drama 柳梦烟。⚠️ mars 版未开通(3001) |
| `zh_female_zhixingnvsheng_mars_bigtts` | 知性女生 | ✅ chinese-drama 温晚晴。⚠️ **moon 版未开通(3001)，别写 moon** |
| `zh_female_lingling_uranus_bigtts` | 玲玲姐姐 | ✅ chinese-drama 沈玉柔（用户 2026-07-15 给 ID）。⚠️ 不返回字级时间戳→卡拉OK均匀铺字 |
| `zh_male_aojiaobazong_moon_bigtts` | 傲娇霸总 | ✅ chinese-drama 男主顾晏辞（样品在 templates/chinese-drama/_voicetest/） |

## 三、调用方式（与 scripts/tts.mjs 完全一致，无需改代码）

- **接口**：`POST https://openspeech.bytedance.com/api/v1/tts`，cluster `volcano_tts`，鉴权 `Authorization: Bearer;<TOKEN>`（TOKEN = api-key.txt 第 7 行 Access Token）。
- **项目内标准用法**：
  ```js
  import { synth } from "./scripts/tts.mjs";
  await synth("Họ Nguyễn chú ý!", "out.mp3", { voice: "vi_female_linh_uranus_bigtts", speed: 1.08 });
  ```
- **模板配置**：`templates/<模板>/template.json` → `audio.viVoice` 填 voice_type，`audio.viSpeed` 建议 1.0–1.1（母语音色语速正常，不要像中文音色那样拉到 1.2+）。

## 四、坑（都踩过了，别再踩）

1. **越南语音色不返回字级时间戳**（`addition.frontend` 为空）→ 卡拉OK逐字跳字不可用，字幕走整句淡入即可。tts.mjs 会打 `⚠️ 该音色未返回字级时间戳`，属正常，非错误。
2. **碎句会炸引擎**：类似 `"Đây. Chữ Nguyễn. Chính là..."` 的连续超短句会稳定报 `3031 engine process fail`。改成连贯句（逗号/破折号连接）即可。
3. **报 `3001 requested resource not granted`** = 该音色本账号未开通（不是 ID 写错）。BV 系列小语种经典音色本账号基本未开通，不要浪费时间试。
4. `BV421_streaming` 本账号可调用但**官方身份未查明**（文档未收录），慎用。
5. 全部 HTTP 走 curl + 代理 `127.0.0.1:7897`（Node fetch 不走代理），tts.mjs 已封装代理失败直连兜底。
