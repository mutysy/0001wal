'use strict';
/* 扫描一线像素，输出颜色行程长度，用于判断图块实际屏幕尺寸 */
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
const lineY = Number(process.argv[3] || 450);
const px = (x, y) => {
  const i = (y * img.w + x) * img.ch;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

function runs(y) {
  const out = [];
  let cur = px(0, y), start = 0;
  for (let x = 1; x < img.w; x++) {
    const c = px(x, y);
    const diff = Math.abs(c[0] - cur[0]) + Math.abs(c[1] - cur[1]) + Math.abs(c[2] - cur[2]);
    if (diff > 26) {
      out.push({ from: start, to: x - 1, len: x - start, c: cur });
      cur = c; start = x;
    }
  }
  out.push({ from: start, to: img.w - 1, len: img.w - start, c: cur });
  return out;
}

const r = runs(lineY);
console.log('y=' + lineY + ' 行程数 ' + r.length);
for (const s of r) {
  console.log('x ' + String(s.from).padStart(4) + '..' + String(s.to).padStart(4) +
    ' 宽' + String(s.len).padStart(4) + '  rgb(' + s.c.join(',') + ')');
}
