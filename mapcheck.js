'use strict';
/* 地图连通性检查：每张图从传送阵出发，统计可达陆地比例，
   并检查出入口 / 草药 / 宝箱 / NPC 是否都能走到 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* 最小 canvas / document 替身（世界生成会画一张小地图缓存） */
function makeCtx() {
  const grad = { addColorStop() { } };
  const ctx = {
    canvas: { width: 256, height: 256 },
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    setTransform() { }, resetTransform() { },
    clearRect() { }, fillRect() { }, strokeRect() { },
    beginPath() { }, closePath() { }, moveTo() { }, lineTo() { },
    arc() { }, arcTo() { }, ellipse() { }, rect() { }, quadraticCurveTo() { },
    bezierCurveTo() { }, fill() { }, stroke() { }, clip() { },
    save() { }, restore() { }, translate() { }, scale() { }, rotate() { },
    drawImage() { }, measureText: () => ({ width: 10 }), fillText() { }, strokeText() { },
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() { },
    imageSmoothingEnabled: true,
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textAlign: 'left', textBaseline: 'alphabetic',
    shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, lineCap: 'butt', lineJoin: 'miter', filter: 'none'
  };
  return ctx;
}
const fakeCanvas = () => ({
  width: 256, height: 256,
  getContext: () => makeCtx(),
  style: {},
  classList: { add() { }, remove() { }, toggle() { }, contains: () => false }
});
const fakeEl = () => ({
  style: {}, className: '', id: '', innerHTML: '', textContent: '',
  children: [], appendChild() { }, removeChild() { }, addEventListener() { },
  setAttribute() { }, getAttribute: () => null, querySelector: () => null,
  querySelectorAll: () => [], classList: { add() { }, remove() { }, toggle() { }, contains: () => false },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 })
});

const sandbox = {
  console, Math, Object, Array, JSON, Date, String, Number,
  parseInt, parseFloat, isNaN, isFinite,
  Uint8Array, Uint16Array, Int32Array, Uint8ClampedArray, Float32Array, Map, Set,
  document: {
    createElement: (tag) => (tag === 'canvas' ? fakeCanvas() : fakeEl()),
    getElementById: () => fakeEl(),
    body: fakeEl(),
    addEventListener() { }
  },
  window: { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, addEventListener() { } }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['data.js', 'data2.js', 'world.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: f });
}

const MAPS = vm.runInContext('MAPS', sandbox);
const generateMap = vm.runInContext('generateMap', sandbox);
const TILE = vm.runInContext('TILE', sandbox);

function analyze(mapId) {
  const w = generateMap(mapId);
  const cols = w.cols, rows = w.rows;
  const a = w.anchors[0];
  const sx = Math.max(1, Math.min(cols - 2, a.tx | 0));
  const sy = Math.max(1, Math.min(rows - 2, a.ty | 0));

  const N = cols * rows;
  const reach = new Uint8Array(N);
  const idx = (x, y) => y * cols + x;
  const walkable = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !w.isSolidTile(x, y);

  const q = [idx(sx, sy)];
  reach[q[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    const cx = c % cols, cy = (c / cols) | 0;
    const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of nb) {
      if (!walkable(nx, ny)) continue;
      const n = idx(nx, ny);
      if (reach[n]) continue;
      reach[n] = 1;
      q.push(n);
    }
  }

  let land = 0, landReach = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!walkable(x, y)) continue;
      land++;
      if (reach[idx(x, y)]) landReach++;
    }
  }

  const checkPoint = (x, y, r) => {
    // 世界坐标 → 找附近可达格
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (reach[idx(nx, ny)]) return true;
      }
    }
    return false;
  };

  const bad = [];
  for (const ex of (w.exits || [])) if (!checkPoint(ex.x, ex.y, 2)) bad.push('出口:' + ex.name);
  for (const h of (w.herbs || [])) if (!checkPoint(h.x, h.y, 2)) bad.push('草药@' + h.tx + ',' + h.ty);
  for (const c of (w.chests || [])) if (!checkPoint(c.x, c.y, 2)) bad.push('宝箱@' + c.tx + ',' + c.ty);
  for (const n of (w.npcs || [])) if (!checkPoint(n.x, n.y, 2)) bad.push('NPC:' + n.id);

  return {
    id: mapId, name: w.name, cols, rows,
    land, landReach,
    pct: land ? (landReach / land * 100) : 100,
    bad
  };
}

const ids = Object.keys(MAPS).filter((id) => !MAPS[id].dungeon || true);
console.log('地图连通性检查');
console.log('='.repeat(72));
let fail = 0;
for (const id of ids) {
  let r;
  try { r = analyze(id); } catch (e) {
    console.log(id.padEnd(12) + ' 生成失败: ' + e.message);
    fail++;
    continue;
  }
  const flag = (r.pct >= 98.0 && r.bad.length === 0) ? '✓' : '✗';
  if (flag === '✗') fail++;
  console.log(
    flag + ' ' + r.id.padEnd(11) +
    String(r.cols + 'x' + r.rows).padEnd(9) +
    '可达 ' + r.pct.toFixed(1).padStart(5) + '%' +
    '  (' + r.landReach + '/' + r.land + ')' +
    (r.bad.length ? '  不可达: ' + r.bad.slice(0, 6).join('、') + (r.bad.length > 6 ? ' …共' + r.bad.length : '') : '')
  );
}
console.log('='.repeat(72));
console.log(fail ? ('✗ ' + fail + ' 张地图存在问题') : '✓ 全部地图连通');
process.exit(fail ? 1 : 0);
