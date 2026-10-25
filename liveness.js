'use strict';
/* 线上站点体检：抓首页与全部静态资源，检查状态码/大小/关键标记 */
const https = require('https');

const BASE = process.argv[2];
const ASSETS = ['/', '/style.css',
  '/js/data.js', '/js/world.js', '/js/render.js', '/js/portrait.js', '/js/vfx.js',
  '/js/audio.js', '/js/dialogue.js', '/js/ui.js', '/js/bigmap.js', '/js/menu.js', '/js/game.js'];

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { rejectUnauthorized: false, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        resolve(get(next));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        type: res.headers['content-type'] || '',
        len: Buffer.concat(chunks).length,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    req.on('error', (e) => resolve({ status: 0, err: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, err: 'timeout' }); });
  });
}

(async () => {
  console.log('体检目标: ' + BASE);
  console.log('-'.repeat(64));
  let ok = 0, bad = 0;
  const results = {};
  for (const path of ASSETS) {
    const r = await get(BASE + path);
    results[path] = r;
    const name = path.padEnd(20);
    if (r.status === 200 && r.len > 0) {
      console.log('✓ ' + name + ' ' + String(r.status) + '  ' + (r.len / 1024).toFixed(1) + ' KB  ' + r.type.split(';')[0]);
      ok++;
    } else {
      console.log('✗ ' + name + ' ' + (r.err || r.status));
      bad++;
    }
  }
  console.log('-'.repeat(64));
  console.log('资源: ' + ok + ' 正常 / ' + bad + ' 异常');

  const home = results['/'];
  if (home && home.status === 200) {
    const b = home.body;
    const checks = [
      ['标题「青云界」', b.indexOf('青云界') >= 0],
      ['canvas#scene', b.indexOf('id="scene"') >= 0],
      ['脚本 portrait.js', b.indexOf('js/portrait.js') >= 0],
      ['脚本 game.js', b.indexOf('js/game.js') >= 0],
      ['HUD 面板', b.indexOf('panel-tl') >= 0],
      ['活动按钮', b.indexOf('btnActivity') >= 0],
      ['传送图志', b.indexOf('mapPanel') >= 0],
      ['菜单面板', b.indexOf('menuPanel') >= 0]
    ];
    console.log('\n首页内容检查:');
    for (const [label, pass] of checks) console.log((pass ? '  ✓ ' : '  ✗ ') + label);

    // JS 关键符号抽查
    const g = results['/js/game.js'];
    if (g && g.status === 200) {
      const sigs = ['drawEffects2', 'bindStele', 'startChallenge', 'claimCheckin', 'fastTravel'];
      console.log('\ngame.js 关键词:');
      for (const s of sigs) console.log((g.body.indexOf(s) >= 0 ? '  ✓ ' : '  ✗ ') + s);
    }
    const p = results['/js/portrait.js'];
    if (p && p.status === 200) {
      console.log('\nportrait.js: ' + (p.body.indexOf('PORTRAIT_SPECS') >= 0 ? '✓ 立绘系统就位' : '✗ 缺立绘'));
      const specs = (p.body.match(/npc_\w+:/g) || []).length;
      console.log('  NPC 立绘规格数: ' + specs);
    }
  }
})();
