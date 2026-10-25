'use strict';
/* 导出各张地图的文本地形图，检查布局 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
function fakeCanvas() {
  return {
    width: 140, height: 100,
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {}, fillRect() {}, set fillStyle(v) {}
    })
  };
}
const sandbox = {
  document: { createElement: fakeCanvas },
  Math, Object, Array, Uint8Array, Float32Array, Uint8ClampedArray, Set, Map,
  parseInt, parseFloat, isNaN, isFinite, console, JSON
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), sandbox, { filename: 'data.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'world.js'), 'utf8'), sandbox, { filename: 'world.js' });

const CH = ['.', '~', ':', ',', '"', '^', '#', '*', '=', '+', "'"];
const which = process.argv[2] || 'village';

const W = vm.runInContext('generateMap(' + JSON.stringify(which) + ')', sandbox);

const buildAt = {};
for (const b of W.buildings) {
  for (let y = b.ty; y < b.ty + b.th; y++) {
    for (let x = b.tx; x < b.tx + b.tw; x++) buildAt[y + ',' + x] = b.style[0].toUpperCase();
  }
}
for (const n of W.npcs) {
  buildAt[Math.floor(n.y / 40) + ',' + Math.floor(n.x / 40)] = 'N';
}
for (const h of W.herbs) buildAt[h.ty + ',' + h.tx] = 'h';
const an = W.anchors[0];
buildAt[an.ty + ',' + an.tx] = 'A';
for (const sp of W.spawnPoints) buildAt[sp.ty + ',' + sp.tx] = 'm';
for (const k in W.points) buildAt[W.points[k].y / 40 | 0, W.points[k].x / 40 | 0];

console.log('图例: . 深水 ~ 水 : 沙 , 草 " 林 ^ 丘 # 岩 * 雪 = 路 + 石坪 \' 田 | A 锚点 N NPC h 草药 m 怪物');
console.log('地图: ' + W.name + '  ' + W.cols + 'x' + W.rows +
  '  物件 ' + W.objects.length + '  建筑 ' + W.buildings.length +
  '  NPC ' + W.npcs.length + '  草药 ' + W.herbs.length + '  刷怪点 ' + W.spawnPoints.length);
console.log('锚点: ' + an.name + ' @' + an.tx + ',' + an.ty + '  出生点 ' + (W.spawn.x / 40 | 0) + ',' + (W.spawn.y / 40 | 0));

const step = W.rows > 80 ? 2 : 1;
for (let y = 0; y < W.rows; y += step) {
  let line = '';
  for (let x = 0; x < W.cols; x++) {
    const b = buildAt[y + ',' + x];
    line += b || CH[W.tiles[y * W.cols + x]];
  }
  console.log(String(y).padStart(3) + '|' + line);
}
