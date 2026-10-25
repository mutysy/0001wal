'use strict';
/* 对线上站点逐个核对 index.html 引用的全部资源，并与本地对比大小 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'https://magical-kitten-26dea1.netlify.app';
const LOCAL = path.join(__dirname, '..');

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { rejectUnauthorized: false, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, len: Buffer.concat(chunks).length }));
    });
    req.on('error', (e) => resolve({ status: 0, err: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, err: 'timeout' }); });
  });
}

(async () => {
  const html = fs.readFileSync(path.join(LOCAL, 'index.html'), 'utf8');
  const refs = [];
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const r = m[1];
    if (/^https?:/.test(r)) continue;
    refs.push(r);
  }

  console.log('线上核对: ' + BASE);
  console.log('本地 index.html 共引用 ' + refs.length + ' 个资源');
  console.log('-'.repeat(72));
  console.log('资源'.padEnd(20) + '线上'.padEnd(10) + '本地'.padEnd(12) + '状态');
  console.log('-'.repeat(72));

  let bad = 0, stale = 0;
  for (const r of refs) {
    const localPath = path.join(LOCAL, r.replace(/\//g, path.sep));
    const localLen = fs.existsSync(localPath) ? fs.statSync(localPath).size : -1;
    const res = await get(BASE.replace(/\/$/, '') + '/' + r);
    let state = '';
    if (res.status !== 200) { state = '✗ HTTP ' + (res.err || res.status); bad++; }
    else if (localLen > 0 && res.len !== localLen) { state = '⚠ 版本落后（线上旧）'; stale++; }
    else state = '✓';
    console.log(
      r.padEnd(20) +
      (res.status === 200 ? (res.len / 1024).toFixed(1) + ' KB' : String(res.err || res.status)).padEnd(14) +
      (localLen > 0 ? (localLen / 1024).toFixed(1) + ' KB' : '—').padEnd(12) +
      state
    );
  }
  console.log('-'.repeat(72));
  console.log('缺失/错误: ' + bad + '　版本不一致: ' + stale);
})();
