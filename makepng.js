'use strict';
/* 生成一张测试 PNG（纯色 + 简单渐变），用于验证立绘插槽能否真正读到图片 */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePNG(w, h, pixelFn) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0;
    for (let x = 0; x < w; x++) {
      const c = pixelFn(x, y, w, h);
      raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const out = process.argv[2] || 'test.png';
const png = makePNG(240, 320, (x, y, w, h) => {
  // 一个粗糙的“人形”色块，方便肉眼确认替换成功
  const cx = w / 2;
  const head = (Math.abs(x - cx) < 26 && y > 30 && y < 96);
  const body = (Math.abs(x - cx) < 44 && y >= 96 && y < 250);
  if (head) return [246, 220, 190];
  if (body) return [60, 110, 200];
  if (y >= 250 && Math.abs(x - cx) < 50) return [40, 50, 80];
  const t = y / h;
  return [10 + t * 30, 16 + t * 40, 28 + t * 60];
});
fs.writeFileSync(out, png);
console.log('wrote ' + out + '  ' + png.length + ' bytes');
