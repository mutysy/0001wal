'use strict';
/* 把 PNG 截图解码并降采样成 ASCII 图，用于无图像输入时的人工核对 */
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
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error('仅支持 8bit，实际 ' + bitDepth);
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!ch) throw new Error('不支持的 colorType ' + colorType);
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
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 255; break;
        case 2: v = (v + b) & 255; break;
        case 3: v = (v + ((a + b) >> 1)) & 255; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pr) & 255;
          break;
        }
        default: throw new Error('未知滤波器 ' + filter);
      }
      line[i] = v;
    }
    line.copy(out, y * stride);
    prev = line;
  }
  return { w, h, ch, data: out };
}

function px(img, x, y) {
  const i = (y * img.w + x) * img.ch;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

function classify(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const v = mx / 255, s = mx === 0 ? 0 : (mx - mn) / mx;
  if (v < 0.12) return ' ';
  if (s < 0.12) return v > 0.80 ? '@' : v > 0.55 ? 'o' : v > 0.30 ? ':' : '.';
  let hue;
  const d = mx - mn;
  if (mx === r) hue = ((g - b) / d + 6) % 6;
  else if (mx === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  if (hue >= 180 && hue < 260) return v > 0.5 ? '~' : '-';   // 水
  if (hue >= 75 && hue < 180) return v > 0.45 ? 'g' : ',';    // 草木
  if (hue >= 45 && hue < 75) return v > 0.5 ? 'y' : ';';      // 黄绿/土
  if (hue >= 15 && hue < 45) return v > 0.5 ? 'p' : '%';      // 土/沙/木
  return v > 0.5 ? 'R' : '#';                                  // 红/灰
}

function ascii(img, cols, rows, box) {
  const [x0, y0, x1, y1] = box || [0, 0, img.w, img.h];
  const bw = (x1 - x0) / cols, bh = (y1 - y0) / rows;
  const lines = [];
  const hist = {};
  for (let j = 0; j < rows; j++) {
    let line = '';
    for (let i = 0; i < cols; i++) {
      let r = 0, g = 0, b = 0, n = 0;
      const sx = Math.floor(x0 + i * bw), ex = Math.min(img.w, Math.ceil(x0 + (i + 1) * bw));
      const sy = Math.floor(y0 + j * bh), ey = Math.min(img.h, Math.ceil(y0 + (j + 1) * bh));
      for (let y = sy; y < ey; y += 2) {
        for (let x = sx; x < ex; x += 2) {
          const c = px(img, x, y);
          r += c[0]; g += c[1]; b += c[2]; n++;
        }
      }
      r /= n; g /= n; b /= n;
      const ch = classify(r, g, b);
      hist[ch] = (hist[ch] || 0) + 1;
      line += ch;
    }
    lines.push(line);
  }
  return { lines, hist };
}

const file = process.argv[2];
const img = decodePNG(fs.readFileSync(file));
console.log('图像 ' + img.w + 'x' + img.h + ' 通道 ' + img.ch);

// 整体统计
let rSum = 0, gSum = 0, bSum = 0, n = 0;
const uniq = new Set();
for (let y = 0; y < img.h; y += 3) {
  for (let x = 0; x < img.w; x += 3) {
    const c = px(img, x, y);
    rSum += c[0]; gSum += c[1]; bSum += c[2]; n++;
    uniq.add((c[0] >> 3) + ',' + (c[1] >> 3) + ',' + (c[2] >> 3));
  }
}
console.log('平均色 rgb(' + (rSum / n).toFixed(0) + ',' + (gSum / n).toFixed(0) + ',' + (bSum / n).toFixed(0) +
  ') | 色彩种类(5bit量化) ' + uniq.size);

const full = ascii(img, 96, 42);
console.log('\n===== 全屏 ASCII（96x42）=====');
full.lines.forEach((l, i) => console.log(String(i).padStart(2, '0') + '|' + l));
console.log('图例: g/,草木  ~/-水  p/%土石木  y/;黄绿  R红  #灰 @亮 o中 .暗 空格黑');
console.log('字符分布: ' + JSON.stringify(full.hist));
