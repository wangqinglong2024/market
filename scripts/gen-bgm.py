#!/usr/bin/env python3
# 本地合成固定「禅意 · 国学」背景音乐（用户 2026-07-05 定：禁止调用任何 API/fal，纯本地代码合成）。
# 空灵古琴单音 + 低音持续泛音垫 + 禅钵(磬)点缀，五声音阶(宫商角徵羽)，留白多、长混响，配「每日金句」治愈短片。
# 用法: python3 scripts/gen-bgm.py [outPath]   默认 public/library/audio/bgm/guqin-loop.wav
import sys, wave
import numpy as np

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/library/audio/bgm/guqin-loop.wav"
rng = np.random.default_rng(20260705)  # 固定种子 → 每次同一首，可复现
LEN = 40.0

def hz(semi): return 261.63 * (2 ** (semi / 12))   # 相对 C4
PENTA = [0, 2, 4, 7, 9]                              # 宫商角徵羽
def note_hz(octave, deg): return hz(12 * octave + PENTA[deg])

buf = np.zeros(int((LEN + 4) * SR))                 # 尾部留混响余量
def place(sig, at):
    i = int(at * SR); buf[i:i + len(sig)] += sig

# ── 古琴单音：暖、少高频、长衰减，带一点点揉弦(慢颤+微滑音)，空灵 ───────────
def guqin(freq, dur=3.0, amp=0.5, vibrato=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + vibrato * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.6)  # 起音后才揉弦
    phase = 2 * np.pi * freq * np.cumsum(vib) / SR
    sig = np.sin(phase) + 0.5 * np.sin(2 * phase) + 0.22 * np.sin(3 * phase) + 0.08 * np.sin(4 * phase)
    env = np.exp(-t / (dur * 0.55))                 # 拨弦长衰减
    env[:int(0.006 * SR)] *= np.linspace(0, 1, int(0.006 * SR))
    return amp * sig * env

# ── 禅钵/磬：两个极近频率拍频(嗡嗡回旋) + 慢起音长尾，非常禅 ────────────────
def bowl(freq, dur=4.5, amp=0.32):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * freq * t) + np.sin(2 * np.pi * (freq * 1.003) * t)  # 拍频
    sig += 0.3 * np.sin(2 * np.pi * freq * 2.76 * t)                            # 金属泛音
    env = np.exp(-t / (dur * 0.5))
    atk = int(0.08 * SR); env[:atk] *= np.linspace(0, 1, atk)
    return amp * 0.5 * sig * env

# ── 低音持续泛音垫：根音+五度，很轻，缓慢"呼吸"，给国学/沉静的底 ─────────────
def drone():
    n = int(LEN * SR); t = np.arange(n) / SR
    breath = 0.55 + 0.45 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 9))  # 9s 一次起伏
    root = np.sin(2 * np.pi * note_hz(-2, 0) * t)
    fifth = 0.6 * np.sin(2 * np.pi * note_hz(-2, 3) * t)
    pad = np.zeros(len(buf)); seg = 0.09 * (root + fifth) * breath
    pad[:len(seg)] = seg
    return pad

# ── 极简混响：长尾脉冲响应卷积，空间大、余韵长 ──────────────────────────────
def reverb(x, mix=0.3):
    ir = np.zeros(int(0.85 * SR))
    for d, g in [(0.037, 0.6), (0.053, 0.5), (0.079, 0.42), (0.113, 0.32), (0.17, 0.24), (0.27, 0.15)]:
        ir[int(d * SR)] += g
    ir *= np.exp(-np.arange(len(ir)) / (0.42 * SR))
    return (1 - mix) * x + mix * np.convolve(x, ir)[:len(x)]

# ── 谱曲：留白很多的散板，古琴单音一句句飘出，钵声点在起始与中段 ────────────
buf += drone()
bowl_sig = bowl(note_hz(-1, 0));  place(bowl_sig, 0.2)      # 开场一记钵
place(bowl(note_hz(-1, 3)), 20.5)                           # 中段一记钵
# 古琴乐句：时值长、间隔留白（禅在呼吸之间），五声级进小跳，收在宫
seq = [(0.8, -1, 0), (3.6, -1, 2), (6.8, 0, 0), (10.2, 0, 4), (13.6, 0, 2),
       (17.4, -1, 3), (21.5, 0, 0), (25.0, 0, 2), (28.6, 0, 4), (32.2, 0, 2),
       (35.6, -1, 4), (38.4, -1, 0)]
for i, (at, oc, deg) in enumerate(seq):
    place(guqin(note_hz(oc, deg), dur=3.4, amp=0.42, vibrato=0.006 if i % 3 == 2 else 0.0), at)
    if i % 4 == 1:  # 偶尔上方五声邻音做轻应答，更弱更远
        place(guqin(note_hz(oc + 1, deg), dur=2.2, amp=0.16), at + 0.9)

# 归一化 + 混响 + 立体声微延迟展宽
buf = buf[:int(LEN * SR)]
buf = reverb(buf, mix=0.3)
buf = buf / (np.max(np.abs(buf)) or 1.0) * 0.8
d = int(0.014 * SR)
stereo = np.stack([buf, np.concatenate([np.zeros(d), buf])[:len(buf)]], axis=1)
fade = int(0.25 * SR)
stereo[:fade] *= np.linspace(0, 1, fade)[:, None]
stereo[-fade:] *= np.linspace(1, 0, fade)[:, None]

pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"✅ 本地合成 禅意/国学 BGM（无 API）: {OUT}  {LEN:.0f}s  {SR}Hz/16bit/stereo")
