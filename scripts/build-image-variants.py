# 为本地镜像的 CMS 图片生成响应式变体
# 说明：国内访问不到 cdn.sanity.io，图片走 public/media/cms 本地镜像；
#      为了让手机 / 高分屏都能拿到合适尺寸，这里按 400/800/1200/1600 生成变体。
# 用法：python scripts/build-image-variants.py
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'src', 'cms-images.json')
VARIANTS = os.path.join(ROOT, 'src', 'cms-image-variants.json')
MEDIA_DIR = os.path.join(ROOT, 'public', 'media', 'cms')

WIDTHS = [400, 800, 1200, 1600]
QUALITY = 80

with open(MANIFEST, encoding='utf-8') as f:
    images = json.load(f)
with open(VARIANTS, encoding='utf-8') as f:
    existing = json.load(f)

made = 0
result = {}
for hash_id, filename in images.items():
    src = os.path.join(MEDIA_DIR, filename)
    if not os.path.exists(src):
        print(f'⚠ 缺少镜像文件 {filename}')
        continue
    ext = os.path.splitext(filename)[1].lower()
    with Image.open(src) as im:
        width, height = im.size
        avail = [w for w in WIDTHS if w < width]
        # 原图本身作为最大档
        if width <= max(WIDTHS):
            avail.append(width)
        avail = sorted(set(avail))
        for w in avail:
            dest = os.path.join(MEDIA_DIR, f'{hash_id}-w{w}{ext}')
            if os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(src):
                continue
            h = max(1, round(height * w / width))
            out = im.convert('RGB').resize((w, h), Image.LANCZOS) if ext in ('.jpg', '.jpeg') else im.resize((w, h), Image.LANCZOS)
            if ext in ('.jpg', '.jpeg'):
                out.save(dest, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
            elif ext == '.png':
                out.save(dest, 'PNG', optimize=True)
            elif ext == '.webp':
                out.save(dest, 'WEBP', quality=QUALITY, method=5)
            else:
                out.save(dest)
            made += 1
        result[hash_id] = avail
        print(f'✔ {filename} → {avail}')

with open(VARIANTS, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'\n新生成 {made} 个变体；清单共 {len(result)} 项 → src/cms-image-variants.json')
