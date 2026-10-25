'use strict';
/* 分析立绘拼图：找出每个格子的内容分布，并对单个格子输出高分辨率 ASCII */
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(buf) {
  let pos = 8, w = 0, h = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; }
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
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
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

// 扫描出所有“非背景”格子：以 8px 步长找亮块边界
console.log('图像 ' + img.w + 'x' + img.h);

// 按行找包含内容的高度带
const rows = [];
for (let y = 0; y < img.h; y += 4) {
  let cnt = 0;
  for (let x = 0; x < img.w; x += 4) {
    const c = px(x, y);
    if (c[0] + c[1] + c[2] > 90) cnt++;
  }
  rows.push(cnt);
}
let bands = [], cur = null;
rows.forEach((c, i) => {
  const y = i * 4;
  if (c > 6) { if (!cur) cur = { y0: y, y1: y }; else cur.y1 = y; }
  else if (cur) { bands.push(cur); cur = null; }
});
if (cur) bands.push(cur);
console.log('内容横带: ' + JSON.stringify(bands));

const box = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
if (box) {
  const [bx0, by0, bx1, by1] = box;
  const cols = Number(process.argv[4] || 60);
  const rowsN = Number(process.argv[5] || 40);
  const bw = (bx1 - bx0) / cols, bh = (by1 - by0) / rowsN;
  for (let j = 0; j < rowsN; j++) {
    let line = '';
    for (let i = 0; i < cols; i++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = Math.floor(by0 + j * bh); y < Math.ceil(by0 + (j + 1) * bh); y++) {
        for (let x = Math.floor(bx0 + i * bw); x < Math.ceil(bx0 + (i + 1) * bw); x++) {
          const c = px(x, y); r += c[0]; g += c[1]; b += c[2]; n++;
        }
      }
      line += cls(r / n, g / n, b / n);
    }
    console.log(String(j).padStart(2) + '|' + line);
  }
  console.log('R/r 红肤褐 · S/s 土金 · G/g 绿 · W/w 蓝 · Y/y 黄绿 · O/o 石白 · @ 亮');
}
