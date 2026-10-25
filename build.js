'use strict';
/* 一键生成发布包：_publish/ 目录 + qingyun-site.zip
   纯 Node 实现（自带 zip 写入，不依赖任何外部命令）
   用法: node _dev/build.js
*/
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, '_publish');
const ZIP_PATH = path.join(ROOT, 'qingyun-site.zip');

/* 需要发布的文件（相对路径） */
const FILES = [
  'index.html',
  'style.css',
  'js/data.js',
  'js/data2.js',
  'js/gear.js',
  'js/root.js',
  'js/artsys.js',
  'js/world.js',
  'js/render.js',
  'js/portrait.js',
  'js/vfx.js',
  'js/tranfx.js',
  'js/skillcg.js',
  'js/audio.js',
  'js/rank.js',
  'js/tower.js',
  'js/icons.js',
  'js/gearart.js',
  'js/touch.js',
  'js/dialogue.js',
  'js/account.js',
  'js/ui.js',
  'js/panels.js',
  'js/codex.js',
  'js/bigmap.js',
  'js/menu.js',
  'js/game.js'
];
const EXTRA = ['上传说明.txt'];

/* assets/ 下的图片与说明一并打包（玩家自定义立绘） */
function listAssets() {
  const out = [];
  const base = path.join(ROOT, 'assets');
  if (!fs.existsSync(base)) return out;
  const walk = (dir, rel) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const r = rel ? rel + '/' + name : name;
      if (fs.statSync(full).isDirectory()) walk(full, r);
      else out.push('assets/' + r);
    }
  };
  walk(base, '');
  return out.sort();
}

/* ------------------------------ CRC32 ------------------------------ */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

/* ------------------------------ ZIP 写入 ------------------------------ */
function buildZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name.replace(/\\/g, '/'), 'utf8');
    const data = e.data;
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const payload = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(data);
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);           // UTF-8 flag
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, payload);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(dosTime, 12);
    cd.writeUInt16LE(dosDate, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(payload.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + payload.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([Buffer.concat(chunks), centralBuf, eocd]);
}

/* ------------------------------ 主流程 ------------------------------ */

function copyPublish() {
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, 'js'), { recursive: true });
  for (const rel of FILES) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) throw new Error('缺少文件: ' + rel);
    const dst = path.join(OUT_DIR, rel);
    fs.copyFileSync(src, dst);
  }
  for (const rel of EXTRA) {
    const src = path.join(ROOT, rel);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT_DIR, rel));
  }
  // assets/ 下的图片与说明
  fs.mkdirSync(path.join(OUT_DIR, 'assets'), { recursive: true });
  for (const rel of listAssets()) {
    const src = path.join(ROOT, rel);
    const dst = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

function main() {
  console.log('青云界 · 发布打包');
  console.log('='.repeat(52));

  copyPublish();
  console.log('已同步到 _publish/');

  const entries = [];
  let total = 0;
  const list = FILES.concat(EXTRA).concat(listAssets()).sort();
  for (const rel of list) {
    const file = path.join(OUT_DIR, rel);
    if (!fs.existsSync(file)) continue;
    const data = fs.readFileSync(file);
    entries.push({ name: rel.replace(/\\/g, '/'), data });
    total += data.length;
    console.log('  + ' + rel.padEnd(22) + (data.length / 1024).toFixed(1).padStart(7) + ' KB');
  }

  const zip = buildZip(entries);
  fs.writeFileSync(ZIP_PATH, zip);

  console.log('-'.repeat(52));
  console.log('文件数: ' + entries.length + '　原始大小: ' + (total / 1024).toFixed(1) + ' KB');
  console.log('压缩包: qingyun-site.zip  ' + (zip.length / 1024).toFixed(1) + ' KB');
  console.log('='.repeat(52));
  console.log('');
  console.log('更新线上站点（网址不变）：');
  console.log('  1. 打开 https://app.netlify.com → 进入你的站点');
  console.log('  2. 点左侧 Deploys');
  console.log('  3. 把 qingyun-site.zip 拖进页面，等几秒');
  console.log('');
  console.log('注意：不要再拖到 app.netlify.com/drop —— 那里会新建一个站点（新网址）。');
}

try {
  main();
} catch (e) {
  console.error('打包失败: ' + e.message);
  process.exit(1);
}
