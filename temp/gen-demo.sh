#!/bin/bash
# 重出 demo 7 张图 + dog 定妆。单角色→flux-pro/kontext($0.04);多角色→nano-banana-pro/edit($0.15)。
# 全程 curl 走代理 7897。产物落 public/videos/2026-07/demo/images/ 和 chars/。
set -u
cd "C:/Datas/Project/market"
KEY=$(sed -n '2p' api-key.txt | tr -d '\r')
CH=temp/style-tests/chars
OUT=public/videos/2026-07/demo/images
mkdir -p "$OUT"
PROXY="http://127.0.0.1:7897"

STYLE="hand-drawn healing art style: rough grainy charcoal/pencil outlines, warm uneven crayon/colored-pencil coloring with visible strokes, subtly textured paper background, minimal cute faces (tiny dot eyes, small blush), FAIR LIGHT skin, gentle cozy mood."
LAYOUT="Vertical 9:16 frame: subject in the UPPER-MIDDLE, EQUAL empty margins top and bottom, a LARGE clean EMPTY area BELOW the subject (keep empty for subtitles), empty left/right margins, plain light paper background, lots of breathing room."
NOTEXT="Absolutely NO text, NO letters, NO words, NO watermark, NO logo."

# 单角色: flux-pro/kontext, 单参考图
kontext () {
  local out="$1"; local ref="$2"; local scene="$3"
  local prompt="Keep the EXACT same character (same face, hair, clothing, body type) and the same ${STYLE} Scene: ${scene} ${LAYOUT} ${NOTEXT}"
  node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
    fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_url:u(process.argv[2]),aspect_ratio:"9:16",num_images:1,output_format:"png"}))' "$prompt" "$ref"
  echo "== $out (kontext \$0.04) =="
  curl -s -m 150 -x "$PROXY" -X POST "https://fal.run/fal-ai/flux-pro/kontext" \
    -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json \
    -o temp/resp.json -w "  http=%{http_code} time=%{time_total}\n"
  local url=$(node -e "const d=require('./temp/resp.json');console.log(d?.images?.[0]?.url||'')")
  if [ -z "$url" ]; then echo "  !! $out 无URL:"; head -c 400 temp/resp.json; echo; return 1; fi
  curl -s -m 90 -x "$PROXY" "$url" -o "$out" -w "  dl=%{http_code} size=%{size_download}\n"
}

# 多角色: nano-banana-pro/edit, 多参考图 (参数: out, scene, ref1 ref2 ...)
pro () {
  local out="$1"; local scene="$2"; shift 2
  local prompt="Using the reference images as the EXACT characters (keep each one's face, hair, clothing, FAIR LIGHT skin and body type). Same ${STYLE} Scene: ${scene} ${LAYOUT} ${NOTEXT}"
  node -e 'const fs=require("fs");const u=p=>"data:image/png;base64,"+fs.readFileSync(p).toString("base64");
    const refs=process.argv.slice(2).map(u);
    fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_urls:refs,aspect_ratio:"9:16",num_images:1,output_format:"png"}))' "$prompt" "$@"
  echo "== $out (pro \$0.15) =="
  curl -s -m 180 -x "$PROXY" -X POST "https://fal.run/fal-ai/nano-banana-pro/edit" \
    -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json \
    -o temp/resp.json -w "  http=%{http_code} time=%{time_total}\n"
  local url=$(node -e "const d=require('./temp/resp.json');console.log(d?.images?.[0]?.url||'')")
  if [ -z "$url" ]; then echo "  !! $out 无URL:"; head -c 400 temp/resp.json; echo; return 1; fi
  curl -s -m 90 -x "$PROXY" "$url" -o "$out" -w "  dl=%{http_code} size=%{size_download}\n"
}

# 0) 先补 dog 定妆(风格参考=用户两张手绘图),$0.15 一次性
DOGPROMPT="Draw in this exact ${STYLE} Subject: a cute chubby little puppy (grey and white), round body, big sweet eyes, sitting, adorable. Single character only, full body, front view, centered on plain white paper. ${NOTEXT}"
node -e 'const fs=require("fs");const u=p=>"data:image/jpeg;base64,"+fs.readFileSync(p).toString("base64");
  fs.writeFileSync("temp/req.json",JSON.stringify({prompt:process.argv[1],image_urls:[u("temp/mine/微信图片_20260702140601_526_10.jpg"),u("temp/mine/微信图片_20260702140630_528_10.jpg")],aspect_ratio:"3:4",num_images:1,output_format:"png"}))' "$DOGPROMPT"
echo "== char-dog (pro \$0.15) =="
curl -s -m 180 -x "$PROXY" -X POST "https://fal.run/fal-ai/nano-banana-pro/edit" \
  -H "Authorization: Key $KEY" -H "Content-Type: application/json" --data @temp/req.json \
  -o temp/resp.json -w "  http=%{http_code} time=%{time_total}\n"
DURL=$(node -e "console.log(require('./temp/resp.json')?.images?.[0]?.url||'')")
[ -n "$DURL" ] && curl -s -m 90 -x "$PROXY" "$DURL" -o "$CH/char-dog.png" -w "  dl=%{http_code} size=%{size_download}\n" || { echo "!! dog无URL"; head -c 300 temp/resp.json; }

# 1..7 分镜
pro "$OUT/p1.png" "a cozy little bedroom in soft warm morning sunlight; the chubby boy and the chubby girl just waking up, rubbing their eyes and stretching, sleepy happy and cute, together." "$CH/char-son.png" "$CH/char-daughter.png"
kontext "$OUT/p2.png" "$CH/char-son.png" "the chubby boy holding a smartphone in both hands, mouth open speaking happily and confidently, cheerful and proud, in a cozy bedroom."
kontext "$OUT/p3.png" "$CH/char-daughter.png" "the chubby little girl standing cutely, mouth open speaking sweetly, little hands together, adorable and proud, in a cozy bedroom."
pro "$OUT/p4.png" "the dad giving a big thumbs up with a warm proud smile, next to the chubby mom carrying a tray with steaming breakfast bowls, in a simple cozy kitchen." "$CH/char-dad.png" "$CH/char-mom.png"
kontext "$OUT/p5.png" "$CH/char-dog.png" "the cute chubby puppy tilting its head curiously to one side, big sweet eyes, as if listening and eager to learn."
pro "$OUT/p6.png" "the whole happy family together — dad, chubby mom, chubby boy, chubby girl and the little puppy — all smiling warmly side by side, cozy togetherness." "$CH/char-dad.png" "$CH/char-mom.png" "$CH/char-son.png" "$CH/char-daughter.png" "$CH/char-dog.png"
pro "$OUT/p7.png" "the chubby boy and the chubby girl waving happily at the viewer, joyful and inviting, cheerful celebratory mood with a few simple sparkle dots around them." "$CH/char-son.png" "$CH/char-daughter.png"

echo "=== done ==="
ls -la "$OUT"