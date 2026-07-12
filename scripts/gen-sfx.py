# 程序合成基础音效 → public/library/audio/sfx/*.wav
# 无外部依赖(纯 stdlib)。每个音效短促(0.3~0.9s)、44.1kHz 单声道 16bit。
import math, random, struct, wave, os

SR = 44100
OUT = "public/library/audio/sfx"
os.makedirs(OUT, exist_ok=True)
random.seed(42)

def write_wav(name, samples):
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in samples))
    print(path)

def env(i, n, a=0.005, r=0.4):
    t = i / n
    at = a * SR / n
    if t < at: return t / at
    return math.exp(-(t - at) / r)

def noise(): return random.uniform(-1, 1)

# 碎裂: 高频噪声爆 + 玻璃铃振
n = int(0.7 * SR)
prev = 0.0
buf = []
for i in range(n):
    t = i / SR
    hp = noise() - prev; prev = noise()  # 简易高通感
    ring = 0.3 * math.sin(2 * math.pi * 2800 * t) * math.exp(-t * 9) + 0.2 * math.sin(2 * math.pi * 4100 * t) * math.exp(-t * 12)
    buf.append((hp * 0.6 * env(i, n, r=0.12) + ring) * 0.8)
write_wav("shatter.wav", buf)

# 撕裂: 中频粗噪声, 幅度锯齿抖动
n = int(0.5 * SR)
buf = []
for i in range(n):
    t = i / SR
    rip = noise() * (0.5 + 0.5 * math.sin(2 * math.pi * 33 * t))
    buf.append(rip * env(i, n, a=0.02, r=0.25) * 0.7)
write_wav("tear.wav", buf)

# 风散/whoosh: 噪声 + 移动带通(简化为幅度扫频调制)
n = int(0.8 * SR)
buf = []
lp = 0.0
for i in range(n):
    t = i / SR
    a = 0.15 + 0.5 * math.exp(-((t - 0.35) ** 2) / 0.02)
    lp = lp * 0.92 + noise() * 0.08
    buf.append(lp * a * 6)
write_wav("whoosh.wav", buf)

# 金币: 一串金属高频plink
n = int(0.9 * SR)
buf = [0.0] * n
for k in range(10):
    st = int((0.05 + k * 0.07 + random.uniform(0, 0.02)) * SR)
    f = random.choice([5200, 6100, 6900, 7600])
    for j in range(int(0.12 * SR)):
        if st + j < n:
            tt = j / SR
            buf[st + j] += 0.35 * math.sin(2 * math.pi * f * tt) * math.exp(-tt * 28)
write_wav("coins.wav", buf)

# 钟磬: 基频+泛音长衰减
n = int(0.9 * SR)
buf = []
for i in range(n):
    t = i / SR
    s = 0.5 * math.sin(2 * math.pi * 880 * t) * math.exp(-t * 3.5) + 0.25 * math.sin(2 * math.pi * 1320 * t) * math.exp(-t * 5) + 0.15 * math.sin(2 * math.pi * 1760 * t) * math.exp(-t * 6)
    buf.append(s * 0.8)
write_wav("chime.wav", buf)

# 低鼓/落地: 低频正弦下滑 + 短噪声打击
n = int(0.45 * SR)
buf = []
for i in range(n):
    t = i / SR
    f = 120 * math.exp(-t * 6) + 40
    s = math.sin(2 * math.pi * f * t) * math.exp(-t * 7)
    if i < 0.01 * SR: s += noise() * 0.3
    buf.append(s * 0.9)
write_wav("boom.wav", buf)

# 盖章: 双段厚重敲击
n = int(0.35 * SR)
buf = []
for i in range(n):
    t = i / SR
    s = math.sin(2 * math.pi * (90 * math.exp(-t * 10) + 55) * t) * math.exp(-t * 12)
    if i < 0.008 * SR: s += noise() * 0.5
    buf.append(s)
write_wav("stamp.wav", buf)

# 心跳一拍
n = int(0.5 * SR)
buf = []
for i in range(n):
    t = i / SR
    b1 = math.sin(2 * math.pi * 55 * t) * math.exp(-((t - 0.05) ** 2) / 0.0008)
    b2 = 0.7 * math.sin(2 * math.pi * 50 * t) * math.exp(-((t - 0.22) ** 2) / 0.0008)
    buf.append((b1 + b2) * 0.9)
write_wav("heartbeat.wav", buf)
