'use strict';
/* 采样截图像素，打印指定区域的实际 RGB 与更精细的 ASCII */
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG');
  let pos = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const ch = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * ch);
  const stride = w * ch;
  let rp = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++];
    const line = Buffer.from(raw.slice(rp, rp + stride));
    rp += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 255;
      }
      line[i] = v;
    }
    line.copy(out, y * stride);
    prev = line;
  }
  return { w, h, ch, data: out };
}

const img = decodePNG(fs.readFileSync(process.argv[2]));
const px = (x, y) => {
  const i = (y * img.w + x) * img.ch;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

console.log('尺寸 ' + img.w + 'x' + img.h);
console.log('\n--- 横向取样 y=450 ---');
for (let x = 0; x < img.w; x += 160) {
  const c = px(x, 450);
  console.log('x=' + String(x).padStart(4) + ' rgb(' + c.join(',') + ')');
}
console.log('\n--- 纵向取样 x=800 ---');
for (let y = 0; y < img.h; y += 90) {
  const c = px(800, y);
  console.log('y=' + String(y).padStart(4) + ' rgb(' + c.join(',') + ')');
}

// 精细 ASCII：只看中央 960x540
function cls(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const v = mx / 255, s = mx === 0 ? 0 : (mx - mn) / mx;
  if (v < 0.10) return ' ';
  if (s < 0.14) return v > 0.82 ? '@' : v > 0.62 ? 'O' : v > 0.40 ? 'o' : v > 0.24 ? ':' : '.';
  const d = mx - mn;
  let hue;
  if (mx === r) hue = ((g - b) / d + 6) % 6;
  else if (mx === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue >= 170 && hue < 265) return v > 0.45 ? 'W' : 'w';
  if (hue >= 75 && hue < 170) return v > 0.45 ? 'G' : 'g';
  if (hue >= 45 && hue < 75) return v > 0.5 ? 'Y' : 'y';
  if (hue >= 15 && hue < 45) return v > 0.55 ? 'S' : 's';
  return v > 0.5 ? 'R' : 'r';
}

const box = [320, 180, 1280, 720];
const cols = 100, rows = 44;
const bw = (box[2] - box[0]) / cols, bh = (box[3] - box[1]) / rows;
console.log('\n===== 中央区域精细图 (' + box.join(',') + ') 100x44 =====');
for (let j = 0; j < rows; j++) {
  let line = '';
  for (let i = 0; i < cols; i++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = Math.floor(box[1] + j * bh); y < Math.ceil(box[1] + (j + 1) * bh); y += 2) {
      for (let x = Math.floor(box[0] + i * bw); x < Math.ceil(box[0] + (i + 1) * bw); x += 2) {
        const c = px(x, y); r += c[0]; g += c[1]; b += c[2]; n++;
      }
    }
    line += cls(r / n, g / n, b / n);
  }
  console.log(String(j).padStart(2, '0') + '|' + line);
}
console.log('G/g 草木 · W/w 水与青瓦 · Y/y 黄绿 · S/s 土沙木 · R/r 红褐 · O/o 石白 · @ 极亮');
