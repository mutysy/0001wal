'use strict';

/* =========================================================================
   青云界 · 世界生成（多地图）
   terrain / 村庄 / 野外 / 锚点 / 草药 / NPC / 怪物点
   ========================================================================= */

const TILE = 40;

const T = {
  DEEP: 0, WATER: 1, SAND: 2, GRASS: 3, FOREST: 4,
  HILL: 5, ROCK: 6, SNOW: 7, PATH: 8, PLAZA: 9, FIELD: 10,
  ARENA: 11, VOID: 12
};

const SOLID_TILE = { 0: true, 1: true, 6: true, 7: true, 12: true };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------ 随机 ------------------------------ */

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iy, seed) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263) + Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

function fbm(x, y, seed, oct, lac, gain) {
  oct = oct || 4; lac = lac || 2; gain = gain || 0.5;
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 131) * amp;
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}

/* --------------------------- 地形绘制工具 --------------------------- */

function paintDisc(tiles, cols, rows, cx, cy, r, val, pred) {
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
  for (let y = y0; y <= y1; y++) {
    if (y < 0 || y >= rows) continue;
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || x >= cols) continue;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const i = y * cols + x;
      if (pred && !pred(tiles[i])) continue;
      tiles[i] = val;
    }
  }
}

function carvePath(tiles, cols, rows, x0, y0, x1, y1, width, val) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist * 1.6));
  const walkable = (t) => t === T.GRASS || t === T.FOREST || t === T.HILL ||
    t === T.SAND || t === T.PATH || t === T.PLAZA || t === T.FIELD;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = lerp(x0, x1, t);
    const y = lerp(y0, y1, t);
    const w = width * (0.85 + valueNoise(x * 0.5, y * 0.5, 91) * 0.3);
    paintDisc(tiles, cols, rows, x, y, w, val, walkable);
  }
}

/* =========================== 试炼场 / 深渊场景 =========================== */

function buildArena(kind, floor) {
  const cfg = (kind === 'abyss') ? ABYSS_CFG
    : (kind === 'sect') ? { name: '宗门擂台', color: '#ffd86a', maxFloor: 1, bossEvery: 99 }
      : TOWER_CFG;
  const isSect = (kind === 'sect');
  const cols = 30, rows = 24;
  const tiles = new Uint8Array(cols * rows);
  const solid = new Uint8Array(cols * rows);
  const objects = [];
  const decals = [];
  const cx = cols / 2, cy = rows / 2 + 0.5;
  const R = 10.2;
  const seed = 4242 + floor * 31 + (kind === 'abyss' ? 777 : 0);
  const rng = makeRng(seed);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const dx0 = Math.abs(x + 0.5 - cx);
      const dy0 = Math.abs(y + 0.5 - cy) * 1.05;
      const d = isSect ? Math.max(dx0, dy0) : Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.05);
      const RR = isSect ? (R * 0.84) : R;
      if (d <= RR) {
        tiles[i] = T.ARENA;
        solid[i] = 0;
      } else {
        tiles[i] = T.VOID;
        solid[i] = 1;
      }
    }
  }

  // 阵心
  decals.push({ type: 'ring', x: cx * TILE, y: cy * TILE, r: 3.6 * TILE });
  decals.push({ type: 'anchor', x: cx * TILE, y: cy * TILE, r: 2.2 * TILE });

  // 环柱
  const pillarN = 8;
  for (let i = 0; i < pillarN; i++) {
    const a = (i / pillarN) * 6.2832 + 0.2;
    const px = cx + Math.cos(a) * (R - 1.6);
    const py = cy + Math.sin(a) * (R - 1.6) * 0.95;
    const tx = Math.round(px), ty = Math.round(py);
    if (tx < 1 || ty < 1 || tx >= cols - 1 || ty >= rows - 1) continue;
    objects.push({
      kind: 'rune',
      x: (tx + 0.5) * TILE, y: (ty + 0.9) * TILE,
      s: 1.15, seed: seed + i * 13,
      sortY: (ty + 0.9) * TILE
    });
    solid[ty * cols + tx] = 1;
  }

  // 火盆
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * 6.2832 + 0.785;
    const px = cx + Math.cos(a) * (R - 4.2);
    const py = cy + Math.sin(a) * (R - 4.2) * 0.95;
    const tx = Math.round(px), ty = Math.round(py);
    if (tx < 1 || ty < 1 || tx >= cols - 1 || ty >= rows - 1) continue;
    objects.push({
      kind: 'lamp',
      x: (tx + 0.5) * TILE, y: (ty + 0.85) * TILE,
      s: 1, seed: seed + i * 7,
      sortY: (ty + 0.85) * TILE
    });
  }

  // 小地图底图
  const mini = document.createElement('canvas');
  mini.width = cols;
  mini.height = rows;
  const mg = mini.getContext('2d');
  const img = mg.createImageData(cols, rows);
  for (let i = 0; i < cols * rows; i++) {
    const on = tiles[i] === T.ARENA;
    const c = on ? (kind === 'abyss' ? [70, 26, 30] : [70, 74, 86]) : [8, 9, 14];
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
  }
  mg.putImageData(img, 0, 0);

  const spawn = { x: cx * TILE, y: (cy + 6.2) * TILE };

  return {
    id: 'arena',
    def: { id: 'arena', name: cfg.name + ' · 第 ' + floor + ' 层' },
    name: cfg.name + ' · 第 ' + floor + ' 层',
    kind: kind, floor: floor,
    cols: cols, rows: rows,
    tiles: tiles, solid: solid,
    objects: objects, buildings: [], decals: decals,
    anchors: [{
      id: 'arena', name: '归阵', map: 'arena',
      tx: Math.round(cx), ty: Math.round(cy + 7),
      x: cx * TILE, y: (cy + 7.4) * TILE
    }],
    npcs: [], herbs: [], chests: [], exits: [],
    points: {}, spawn: spawn, spawnPoints: [],
    village: null, miniCanvas: mini,
    isSolidTile(x, y) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return true;
      return solid[y * cols + x] === 1;
    }
  };
}


/* =========================================================================
   连通性修复
   河道 / 湖泊 / 山脊会把陆地切成互不相通的孤岛，导致玩家走不过去。
   这里以传送阵为起点做一次可达性搜索，把够大的孤立陆块用「浅滩（SAND）」
   或「山间栈道（PATH）」接回来。
   ========================================================================= */
function repairConnectivity(tiles, solid, cols, rows, anchorDef) {
  const N = cols * rows;
  const walk = new Uint8Array(N);
  for (let i = 0; i < N; i++) walk[i] = solid[i] ? 0 : 1;

  const idx = (x, y) => y * cols + x;
  const ax = Math.max(1, Math.min(cols - 2, anchorDef.tx | 0));
  const ay = Math.max(1, Math.min(rows - 2, anchorDef.ty | 0));
  const start = idx(ax, ay);

  // 1) 从传送阵出发做可达性 BFS
  const reach = new Uint8Array(N);
  const q = new Int32Array(N);
  let qh = 0, qt = 0;
  reach[start] = 1;
  q[qt++] = start;
  while (qh < qt) {
    const c = q[qh++];
    const cx = c % cols, cy = (c / cols) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0);
      const ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const n = idx(nx, ny);
      if (reach[n] || !walk[n]) continue;
      reach[n] = 1;
      q[qt++] = n;
    }
  }

  // 2) 收集所有不可达的可行走格，按连通块分组
  const seen = new Uint8Array(N);
  const comps = [];
  for (let i = 0; i < N; i++) {
    if (!walk[i] || reach[i] || seen[i]) continue;
    // BFS 该连通块
    const members = [];
    let h2 = 0, t2 = 0;
    const q2 = [i];
    seen[i] = 1;
    while (h2 < q2.length) {
      const c = q2[h2++];
      members.push(c);
      const cx = c % cols, cy = (c / cols) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = idx(nx, ny);
        if (reach[n] || seen[n] || !walk[n]) continue;
        seen[n] = 1;
        q2.push(n);
      }
    }
    if (members.length >= 8) comps.push(members);
  }
  if (!comps.length) return;

  // 3) 逐个用最小代价路径接回主陆块
  const MAXC = Math.min(comps.length, 48);
  for (let ci = 0; ci < MAXC; ci++) {
    const members = comps[ci];
    // 若该块已在之前的修复中被接通，跳过
    if (reach[members[0]]) continue;

    const dist = new Int32Array(N).fill(-1);
    const prev = new Int32Array(N).fill(-1);
    const pq = [];
    // 起点：该块所有格子，代价 0
    for (const m of members) {
      dist[m] = 0;
      pq.push(m);
    }
    let head = 0;
    let hit = -1;

    // 简易 Dijkstra（桶式：用数组按代价排序太慢，这里用双层 BFS）
    // 代价：可行走格 1；水面 9；山体 25；VOID 无穷
    const costOf = (t) => {
      if (t === T.VOID) return 1e6;
      if (t === T.WATER || t === T.DEEP) return 9;
      if (t === T.ROCK || t === T.SNOW) return 25;
      return 1;
    };

    // 用简单优先队列（代价范围小，用桶）
    const buckets = [];
    const push = (node, d) => {
      const b = buckets[d] || (buckets[d] = []);
      b.push(node);
    };
    for (const m of members) push(m, 0);
    let budget = 0;
    const MAXD = 40000;
    let done = false;
    while (!done && budget <= MAXD) {
      while (budget <= MAXD) {
        if (buckets[budget] && buckets[budget].length) break;
        budget++;
      }
      if (budget > MAXD) break;
      const list = buckets[budget];
      const c = list.pop();
      if (dist[c] >= 0 && dist[c] < budget) continue;
      dist[c] = budget;
      if (reach[c]) { hit = c; done = true; break; }
      const cx = c % cols, cy = (c / cols) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = idx(nx, ny);
        const w = costOf(tiles[n]);
        if (w >= 1e6) continue;
        const nd = budget + w;
        if (nd > MAXD) continue;
        if (dist[n] >= 0 && dist[n] <= nd) continue;
        dist[n] = nd;
        prev[n] = c;
        push(n, nd);
      }
    }

    if (hit < 0) continue;

    // 4) 沿路径回溯，把水变成浅滩、把山变成栈道
    let cur = hit;
    let guard = 0;
    while (cur >= 0 && guard++ < 4000) {
      const t = tiles[cur];
      if (t === T.WATER || t === T.DEEP) {
        tiles[cur] = T.SAND;          // 浅滩：看起来像可以蹚过去的沙洲
        solid[cur] = 0;
      } else if (t === T.ROCK || t === T.SNOW) {
        tiles[cur] = T.PATH;          // 山间栈道
        solid[cur] = 0;
      }
      // 浅滩两侧再补一格沙，避免一格宽的窄缝看着奇怪
      const cx2 = cur % cols, cy2 = (cur / cols) | 0;
      if (t === T.WATER || t === T.DEEP) {
        for (let d = 0; d < 4; d++) {
          const nx = cx2 + (d === 0 ? 1 : d === 1 ? -1 : 0);
          const ny = cy2 + (d === 2 ? 1 : d === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const n = idx(nx, ny);
          if (tiles[n] === T.WATER) { /* 保留水面外观，不额外扩宽 */ }
        }
      }
      walk[cur] = 1;
      if (prev[cur] < 0) break;
      cur = prev[cur];
    }

    // 5) 重新标记可达，避免重复修同一条路
    const stack = [hit];
    reach[hit] = 1;
    while (stack.length) {
      const c = stack.pop();
      const cx = c % cols, cy = (c / cols) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const ny = cy + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = idx(nx, ny);
        if (reach[n] || !walk[n]) continue;
        reach[n] = 1;
        stack.push(n);
      }
    }
  }
}

function generateMap(mapId) {
  const def = MAPS[mapId];
  if (!def) throw new Error('未知地图 ' + mapId);

  const cols = def.cols, rows = def.rows;
  const seed = def.seed;
  const rng = makeRng(seed);
  const tiles = new Uint8Array(cols * rows);
  const solid = new Uint8Array(cols * rows);
  const raw = new Float32Array(cols * rows);
  const objects = [];
  const buildings = [];
  const decals = [];

  const isVillage = def.type === 'village';
  const vx = Math.round(cols * 0.46);
  const vy = Math.round(rows * 0.64);

  /* ---------- 1. 高度场 ---------- */
  const cxT = cols / 2, cyT = rows / 2;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const nx = (x - cxT) / (cols * 0.5);
      const ny = (y - cyT) / (rows * 0.5);
      const d = Math.hypot(nx, ny);
      const island = 1 - Math.pow(Math.min(1, d * 1.06), 2.4);

      let e = fbm(x * 0.030, y * 0.030, seed, 5) * 0.80 + island * 0.46;

      const ridge = fbm(x * 0.021 + 11.5, y * 0.048 + 3.2, seed + 991, 4);
      const northBias = clamp(1 - y / (rows * 0.38), 0, 1);
      e += ridge * northBias * northBias * 0.34;

      const sw = clamp(1 - Math.hypot(x - cols * 0.14, y - rows * 0.78) / 30, 0, 1);
      e += fbm(x * 0.05, y * 0.05, seed + 55, 3) * sw * sw * 0.16;

      if (isVillage) {
        const basin = clamp(1 - Math.hypot(x - vx, y - vy) / 24, 0, 1);
        e -= basin * basin * 0.34;
      }
      raw[i] = e;
    }
  }

  /* ---------- 2. 分位归一化 + 地形分带 ---------- */
  const band = def.band;
  const samples = [];
  for (let i = 0; i < raw.length; i += 7) samples.push(raw[i]);
  samples.sort((a, b) => a - b);
  const pLo = samples[Math.floor(samples.length * 0.015)] || 0;
  const pHi = samples[Math.floor(samples.length * 0.985)] || 1;
  const span = Math.max(0.0001, pHi - pLo);

  for (let i = 0; i < raw.length; i++) {
    const n = clamp((raw[i] - pLo) / span, 0, 1);
    let t;
    if (n < band.deep) t = T.DEEP;
    else if (n < band.water) t = T.WATER;
    else if (n < band.sand) t = T.SAND;
    else if (n < band.grass) t = T.GRASS;
    else if (n < band.forest) t = T.FOREST;
    else if (n < band.hill) t = T.HILL;
    else if (n < band.rock) t = T.ROCK;
    else t = T.SNOW;
    tiles[i] = t;
  }

  /* ---------- 3. 湖泊（河流已移除，避免水路把陆地切开） ---------- */
  const waterishWater = (t) => t !== T.PLAZA && t !== T.PATH && t !== T.FIELD;

  const lakeCount = isVillage ? 2 : 1;
  for (let li = 0; li < lakeCount; li++) {
    const lx = (isVillage ? vx - 30 : cols * 0.25) + li * 44 + (rng() - 0.5) * 4;
    const ly = (isVillage ? vy - 5 : rows * 0.32) + li * 18 + (rng() - 0.5) * 4;
    const lr = 8 + rng() * 3;
    for (let y = Math.floor(ly - lr - 2); y <= Math.ceil(ly + lr + 2); y++) {
      for (let x = Math.floor(lx - lr - 2); x <= Math.ceil(lx + lr + 2); x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const d = Math.hypot(x - lx, y - ly);
        const wob = valueNoise(x * 0.22, y * 0.22, seed + 31) * 2.6;
        const i = y * cols + x;
        if (d + wob - 1.3 < lr - 1.6) tiles[i] = T.WATER;
        else if (d + wob - 1.3 < lr + 1.0) {
          if (tiles[i] !== T.WATER) tiles[i] = T.SAND;
        }
      }
    }
  }

  /* ---------- 4. 村庄 ---------- */
  if (isVillage) {
    const clearR = 19, fadeR = 33;
    for (let y = vy - fadeR - 2; y <= vy + fadeR + 2; y++) {
      for (let x = vx - fadeR - 2; x <= vx + fadeR + 2; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const d = Math.hypot(x - vx, y - vy);
        if (d > fadeR) continue;
        const nz = valueNoise(x * 0.19, y * 0.19, seed + 313);
        const w = clamp((fadeR - d) / (fadeR - clearR), 0, 1);
        const i = y * cols + x;
        if (d < clearR || w * (0.55 + nz * 0.95) > 0.52) {
          tiles[i] = (nz > 0.74 && d > clearR) ? T.FOREST : T.GRASS;
        }
      }
    }

    carvePath(tiles, cols, rows, vx, vy + 26, vx, vy - 6, 1.0, T.PATH);
    carvePath(tiles, cols, rows, vx - 22, vy + 5, vx + 20, vy + 5, 0.95, T.PATH);
    carvePath(tiles, cols, rows, vx - 22, vy - 3, vx + 20, vy - 3, 0.85, T.PATH);
    const lanes = [
      [vx - 19, vy + 5, vx - 19, vy - 2],
      [vx + 17, vy + 5, vx + 17, vy - 2],
      [vx - 19, vy + 5, vx - 19, vy + 12],
      [vx + 17, vy + 5, vx + 17, vy + 12],
      [vx - 9, vy + 5, vx - 9, vy + 10],
      [vx + 6, vy + 5, vx + 6, vy + 10]
    ];
    for (const L of lanes) carvePath(tiles, cols, rows, L[0], L[1], L[2], L[3], 0.62, T.PATH);

    for (let y = vy - 4; y <= vy + 3; y++) {
      for (let x = vx - 7; x <= vx + 7; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        tiles[y * cols + x] = T.PLAZA;
      }
    }

    // 灵田
    const fieldTL = { x: vx - 26, y: vy + 8, w: 7, h: 6 };
    for (let y = fieldTL.y; y < fieldTL.y + fieldTL.h; y++) {
      for (let x = fieldTL.x; x < fieldTL.x + fieldTL.w; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        tiles[y * cols + x] = T.FIELD;
      }
    }

    // 建筑：规整分区、左右两列错落排布
    const BUILD = [
      { style: 'hall', tx: -7, ty: -15, tw: 13, th: 6 },
      { style: 'house', tx: -25, ty: -10, tw: 6, th: 4 },
      { style: 'house', tx: -24, ty: -2, tw: 6, th: 4 },
      { style: 'house', tx: -25, ty: 6, tw: 6, th: 4 },
      { style: 'house', tx: 18, ty: -11, tw: 6, th: 4 },
      { style: 'house', tx: 19, ty: -3, tw: 6, th: 4 },
      { style: 'house', tx: 18, ty: 5, tw: 6, th: 4 },
      { style: 'house', tx: -10, ty: 9, tw: 5, th: 4 },
      { style: 'house', tx: 6, ty: 8, tw: 5, th: 4 },
      { style: 'pavilion', tx: -17, ty: 13, tw: 4, th: 4 },
      { style: 'house', tx: 13, ty: 13, tw: 5, th: 4 },
      { style: 'gate', tx: -5, ty: 22, tw: 11, th: 3 }
    ];
    for (const B of BUILD) {
      for (let y = B.ty; y < B.ty + B.th; y++) {
        for (let x = B.tx; x < B.tx + B.tw; x++) {
          const wx = vx + x, wy = vy + y;
          if (wx < 0 || wy < 0 || wx >= cols || wy >= rows) continue;
          const i = wy * cols + wx;
          if (tiles[i] === T.WATER || tiles[i] === T.DEEP) tiles[i] = T.GRASS;
        }
      }
    }

    // 屋间小路：把每排房子串成街巷
    const streets = [
      [vx - 27, vy - 9, vx + 27, vy - 9],
      [vx - 27, vy - 1, vx + 27, vy - 1],
      [vx - 27, vy + 7, vx + 27, vy + 7],
      [vx - 20, vy - 13, vx - 20, vy + 12],
      [vx + 21, vy - 13, vx + 21, vy + 12],
      [vx - 1, vy - 5, vx - 1, vy + 14]
    ];
    for (const s of streets) {
      carvePath(tiles, cols, rows, s[0], s[1], s[2], s[3], 0.72, T.PATH);
    }
    BUILD.forEach((B, idx) => {
      const b = {
        kind: 'building', style: B.style,
        tx: vx + B.tx, ty: vy + B.ty, tw: B.tw, th: B.th,
        seed: seed + idx * 977,
        x: (vx + B.tx + B.tw / 2) * TILE,
        y: (vy + B.ty + B.th) * TILE,
        sortY: (vy + B.ty + B.th) * TILE
      };
      buildings.push(b);
      objects.push(b);
    });

    // 广场环纹
    decals.push({
      type: 'ring',
      x: (vx + 0.5) * TILE,
      y: (vy - 0.5) * TILE,
      r: 4.4 * TILE
    });

    // 香炉
    objects.push({
      kind: 'censer', x: (vx + 0.5) * TILE, y: (vy - 1.5) * TILE, s: 1,
      sortY: (vy - 1.5) * TILE
    });

    // 广场四角石灯
    for (const [lx, ly] of [[vx - 6, vy - 3], [vx + 6, vy - 3], [vx - 6, vy + 2], [vx + 6, vy + 2]]) {
      objects.push({
        kind: 'lamp', x: (lx + 0.5) * TILE, y: (ly + 0.85) * TILE, s: 1,
        seed: seed + lx * 31 + ly, sortY: (ly + 0.85) * TILE
      });
    }
    // 主道石灯
    for (let k = 6; k <= 22; k += 4) {
      for (const dx of [-3, 3]) {
        const tx = vx + dx, ty = vy + k;
        const i = ty * cols + tx;
        if (tiles[i] === T.PATH || tiles[i] === T.PLAZA || tiles[i] === T.GRASS) {
          objects.push({
            kind: 'lamp', x: (tx + 0.5) * TILE, y: (ty + 0.85) * TILE, s: 1,
            seed: seed + k, sortY: (ty + 0.85) * TILE
          });
        }
      }
    }
    // 旗幡
    for (const dx of [-6.5, 6.5]) {
      const tx = Math.round(vx + dx), ty = vy + 21;
      objects.push({
        kind: 'banner', x: (tx + 0.5) * TILE, y: (ty + 0.9) * TILE, s: 1,
        phase: rng() * 6.283, sortY: (ty + 0.9) * TILE
      });
    }
    // 水井
    objects.push({
      kind: 'well', x: (vx + 6.5) * TILE, y: (vy + 1.5) * TILE, s: 1,
      sortY: (vy + 1.5) * TILE
    });
    // 铁匠铺（可进入的房屋 · 修补 / 升级装备）
    objects.push({
      kind: 'smithy',
      x: (vx - 18.5) * TILE, y: (vy + 9) * TILE,
      s: 1, seed: seed + 9177, sortY: (vy + 9) * TILE,
      door: true
    });
    // 炼丹炉
    objects.push({
      kind: 'cauldron',
      x: (vx + 19.5) * TILE, y: (vy + 9) * TILE,
      s: 1, seed: seed + 4471, sortY: (vy + 9) * TILE
    });
    // 宗门山门（问宗 / 宗门商店）
    objects.push({
      kind: 'sectgate',
      x: (vx - 30.5) * TILE, y: (vy - 2) * TILE,
      s: 1, seed: seed + 3319, sortY: (vy - 2) * TILE
    });
    // 灵田围栏与稻苗
    for (let x = fieldTL.x; x < fieldTL.x + fieldTL.w; x++) {
      objects.push({
        kind: 'fence', x: (x + 0.5) * TILE, y: (fieldTL.y + fieldTL.h) * TILE,
        s: 1, sortY: (fieldTL.y + fieldTL.h) * TILE
      });
    }
    for (let y = fieldTL.y; y < fieldTL.y + fieldTL.h; y += 2) {
      for (let x = fieldTL.x; x < fieldTL.x + fieldTL.w; x++) {
        objects.push({
          kind: 'crop', x: (x + 0.5) * TILE + (rng() - 0.5) * 10,
          y: (y + 0.9) * TILE, s: 0.8 + rng() * 0.4,
          phase: rng() * 6.283, sortY: (y + 0.9) * TILE
        });
      }
    }
    // 山门石碑（任务点）
    objects.push({
      kind: 'stela', x: (vx - 4.5) * TILE, y: (vy + 23.5) * TILE,
      s: 1, sortY: (vy + 23.5) * TILE
    });
  }

  /* ---------- 5. 碰撞 ---------- */
  for (let i = 0; i < cols * rows; i++) solid[i] = SOLID_TILE[tiles[i]] ? 1 : 0;

  for (const b of buildings) {
    for (let y = b.ty; y < b.ty + b.th; y++) {
      for (let x = b.tx; x < b.tx + b.tw; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        if (b.style === 'gate') {
          const mid = b.tx + b.tw / 2;
          if (Math.abs(x + 0.5 - mid) < 2.2) continue;
        }
        if (b.style === 'pavilion') {
          const isEdge = (x === b.tx || x === b.tx + b.tw - 1 || y === b.ty || y === b.ty + b.th - 1);
          if (!isEdge) continue;
        }
        solid[y * cols + x] = 1;
      }
    }
  }

  /* ---------- 6. 锚点（传送阵） ---------- */
  const anchorDef = def.anchor;
  const anchors = [{
    id: mapId,
    name: anchorDef.name,
    map: mapId,
    tx: anchorDef.tx,
    ty: anchorDef.ty,
    x: (anchorDef.tx + 0.5) * TILE,
    y: (anchorDef.ty + 0.9) * TILE
  }];
  // 清出锚点周围空地
  paintDisc(tiles, cols, rows, anchorDef.tx, anchorDef.ty, 3.4, T.PLAZA,
    (t) => t !== T.WATER && t !== T.DEEP);
  for (let y = anchorDef.ty - 4; y <= anchorDef.ty + 4; y++) {
    for (let x = anchorDef.tx - 4; x <= anchorDef.tx + 4; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (tiles[y * cols + x] === T.WATER || tiles[y * cols + x] === T.DEEP) {
        tiles[y * cols + x] = T.GRASS;
      }
      solid[y * cols + x] = 0;
    }
  }
  decals.push({ type: 'anchor', x: anchors[0].x, y: anchors[0].y - TILE * 0.4, r: 2.6 * TILE });
  // 传送石碑（立于阵心北侧）
  objects.push({
    kind: 'stele',
    mapId: mapId,
    x: anchors[0].x,
    y: anchors[0].y - TILE * 1.35,
    s: 1,
    sortY: anchors[0].y - TILE * 1.35
  });
  solid[Math.round(anchorDef.ty - 1.35) * cols + anchorDef.tx] = 1;
  // 阵角立石
  for (const [ox, oy] of [[-3.4, -1.6], [3.4, -1.6], [-3.4, 2.0], [3.4, 2.0]]) {
    objects.push({
      kind: 'rune', x: (anchorDef.tx + 0.5 + ox) * TILE, y: (anchorDef.ty + 0.5 + oy) * TILE,
      s: 1, seed: seed + Math.floor(ox * 13 + oy * 7),
      sortY: (anchorDef.ty + 0.5 + oy) * TILE
    });
  }

  /* ---------- 6b. 地图出入口 ---------- */
  const exits = [];
  for (const ex of (def.exits || [])) {
    const exx = (ex.tx + 0.5) * TILE;
    const exy = (ex.ty + 0.5) * TILE;
    paintDisc(tiles, cols, rows, ex.tx, ex.ty, 2.6, T.PATH,
      (t) => t !== T.WATER && t !== T.DEEP);
    for (let y = ex.ty - 3; y <= ex.ty + 3; y++) {
      for (let x = ex.tx - 3; x <= ex.tx + 3; x++) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const i = y * cols + x;
        if (tiles[i] === T.WATER || tiles[i] === T.DEEP) tiles[i] = T.GRASS;
        solid[i] = 0;
      }
    }
    exits.push({ x: exx, y: exy, tx: ex.tx, ty: ex.ty, to: ex.to, name: ex.name });
    objects.push({
      kind: 'signpost', x: exx, y: exy - TILE * 0.15, s: 1,
      seed: seed + ex.tx * 7 + ex.ty, sortY: exy - TILE * 0.15
    });
  }

  /* ---------- 6c. 连通性修复：被水域/山体隔断的陆地打通 ---------- */
  try {
    repairConnectivity(tiles, solid, cols, rows, anchorDef);
  } catch (e) { /* 修复失败不影响主流程 */ }

  /* ---------- 7. 树木 / 山岩 / 碎石 / 灌木 ---------- */
  const nearVillage = (x, y, r) => isVillage && Math.hypot(x - vx, y - vy) < r;
  const nearPath = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const tt = tiles[ny * cols + nx];
        if (tt === T.PATH || tt === T.PLAZA) return true;
      }
    }
    return false;
  };
  const nearAnchor = (x, y) => Math.hypot(x - anchorDef.tx, y - anchorDef.ty) < 6;

  for (let y = 2; y < rows - 2; y++) {
    for (let x = 2; x < cols - 2; x++) {
      const i = y * cols + x;
      const t = tiles[i];
      if (solid[i]) continue;
      if (t !== T.GRASS && t !== T.FOREST && t !== T.HILL) continue;
      if (nearPath(x, y) || nearAnchor(x, y)) continue;

      const clump = valueNoise(x * 0.30, y * 0.30, seed + 21);
      let dens;
      if (t === T.FOREST) dens = 0.30 * (0.45 + clump * 1.15);
      else if (t === T.HILL) dens = 0.055 * (0.3 + clump * 1.3);
      else dens = 0.045 * (0.25 + clump * 1.4);

      if (nearVillage(x, y, 19)) dens *= 0.42;
      if (nearVillage(x, y, 9)) dens = 0;
      if (rng() > dens) continue;

      const roll = rng();
      let v;
      if (t === T.FOREST) v = roll < 0.62 ? 'pine' : roll < 0.88 ? 'leaf' : 'willow';
      else if (t === T.HILL) v = roll < 0.5 ? 'pine' : 'leaf';
      else v = roll < 0.30 ? 'pine' : roll < 0.78 ? 'leaf' : roll < 0.92 ? 'blossom' : 'willow';

      objects.push({
        kind: 'tree', v: v,
        x: (x + 0.5) * TILE + (rng() - 0.5) * 22,
        y: (y + 0.9) * TILE,
        s: 0.82 + rng() * 0.55,
        phase: rng() * 6.283,
        seed: Math.floor(rng() * 1e9),
        sortY: (y + 0.9) * TILE
      });
      solid[i] = 1;
    }
  }

  // 村周老树
  if (isVillage) {
    const vRng = makeRng(seed + 4242);
    let placed = 0, tries = 0;
    while (placed < 14 && tries < 600) {
      tries++;
      const a = vRng() * 6.283;
      const r = 10.5 + vRng() * 7;
      const tx = Math.round(vx + Math.cos(a) * r);
      const ty = Math.round(vy + Math.sin(a) * r);
      if (tx < 1 || ty < 1 || tx >= cols - 1 || ty >= rows - 1) continue;
      const i = ty * cols + tx;
      if (tiles[i] !== T.GRASS || solid[i] || nearPath(tx, ty)) continue;
      let ok = true;
      for (const b of buildings) {
        if (tx >= b.tx - 1 && tx <= b.tx + b.tw && ty >= b.ty - 1 && ty <= b.ty + b.th) {
          ok = false; break;
        }
      }
      if (!ok) continue;
      const roll = vRng();
      const v = roll < 0.34 ? 'pine' : roll < 0.70 ? 'leaf' : roll < 0.92 ? 'blossom' : 'willow';
      objects.push({
        kind: 'tree', v: v,
        x: (tx + 0.5) * TILE + (vRng() - 0.5) * 16,
        y: (ty + 0.9) * TILE,
        s: 1.0 + vRng() * 0.45,
        phase: vRng() * 6.283,
        seed: Math.floor(vRng() * 1e9),
        sortY: (ty + 0.9) * TILE
      });
      solid[i] = 1;
      placed++;
    }
  }

  // 山岩
  for (let y = 1; y < rows - 1; y += 3) {
    for (let x = 1; x < cols - 1; x += 3) {
      const i = y * cols + x;
      const t = tiles[i];
      if (t !== T.ROCK && t !== T.SNOW) continue;
      if (rng() > 0.72) continue;
      const jx = x + (rng() - 0.5) * 2.4;
      const jy = y + (rng() - 0.5) * 2.4;
      const big = t === T.SNOW || rng() < 0.45;
      const w = (big ? 78 : 44) * (0.7 + rng() * 0.8);
      const h = (big ? 96 : 48) * (0.7 + rng() * 0.9);
      objects.push({
        kind: 'mountain',
        x: (jx + 0.5) * TILE, y: (jy + 1) * TILE,
        w: w, h: h,
        snowy: t === T.SNOW || rng() < 0.22,
        seed: Math.floor(rng() * 1e9),
        sortY: (jy + 1) * TILE
      });
    }
  }

  // 碎石与灌木
  for (let y = 2; y < rows - 2; y += 2) {
    for (let x = 2; x < cols - 2; x += 2) {
      const i = y * cols + x;
      if (solid[i]) continue;
      const t = tiles[i];
      const r = rng();
      if ((t === T.GRASS || t === T.HILL || t === T.FOREST) && r < 0.10) {
        objects.push({
          kind: 'rock', x: (x + rng()) * TILE, y: (y + 0.9) * TILE,
          s: 0.5 + rng() * 0.7, seed: Math.floor(rng() * 1e9),
          sortY: (y + 0.9) * TILE
        });
      } else if ((t === T.GRASS || t === T.FOREST) && r < 0.26) {
        objects.push({
          kind: 'bush', x: (x + rng()) * TILE, y: (y + 0.9) * TILE,
          s: 0.6 + rng() * 0.7, blossom: rng() < 0.35,
          seed: Math.floor(rng() * 1e9), sortY: (y + 0.9) * TILE
        });
      }
    }
  }

  /* ---------- 8. 草药 ---------- */
  const herbs = [];
  {
    const hr = makeRng(seed + 5150);
    let placed = 0, tries = 0;
    while (placed < def.herbs && tries < 4000) {
      tries++;
      const tx = 2 + Math.floor(hr() * (cols - 4));
      const ty = 2 + Math.floor(hr() * (rows - 4));
      const i = ty * cols + tx;
      const t = tiles[i];
      if (solid[i]) continue;
      if (t !== T.GRASS && t !== T.FOREST && t !== T.HILL) continue;
      if (nearAnchor(tx, ty)) continue;
      if (isVillage && Math.hypot(tx - vx, ty - vy) < 8) continue;
      // 不与其他草药重叠
      let tooClose = false;
      for (const h of herbs) {
        if (Math.hypot(h.tx - tx, h.ty - ty) < 4) { tooClose = true; break; }
      }
      if (tooClose) continue;
      herbs.push({
        kind: 'herb',
        id: mapId === 'forest' ? 'mat_bamboo' : 'mat_herb',
        tx: tx, ty: ty,
        x: (tx + 0.5) * TILE + (hr() - 0.5) * 14,
        y: (ty + 0.9) * TILE,
        phase: hr() * 6.283,
        sortY: (ty + 0.9) * TILE
      });
      placed++;
    }
  }

  /* ---------- 8c. 奖励宝箱 ---------- */
  const chests = [];
  {
    const cr = makeRng(seed + 7777);
    const want = def.chests || (isVillage ? 4 : 6);
    let placed = 0, tries = 0;
    while (placed < want && tries < 5000) {
      tries++;
      const tx = 3 + Math.floor(cr() * (cols - 6));
      const ty = 3 + Math.floor(cr() * (rows - 6));
      const i = ty * cols + tx;
      if (solid[i]) continue;
      const t = tiles[i];
      if (t !== T.GRASS && t !== T.FOREST && t !== T.HILL && t !== T.SAND && t !== T.SNOW) continue;
      if (nearAnchor(tx, ty)) continue;
      let bad = false;
      for (const h of herbs) if (Math.hypot(h.tx - tx, h.ty - ty) < 3) { bad = true; break; }
      if (!bad) for (const c of chests) if (Math.hypot(c.tx - tx, c.ty - ty) < 7) { bad = true; break; }
      if (bad) continue;
      chests.push({
        kind: 'chest',
        id: 'chest_' + mapId + '_' + placed,
        tx: tx, ty: ty,
        x: (tx + 0.5) * TILE,
        y: (ty + 0.9) * TILE,
        opened: false,
        seed: Math.floor(cr() * 1e9),
        sortY: (ty + 0.9) * TILE
      });
      placed++;
    }
  }

  /* ---------- 9. NPC ---------- */  const npcs = [];
  for (const id in NPCS) {
    const n = NPCS[id];
    if (n.map !== mapId) continue;
    npcs.push({
      id: id, kind: 'npc',
      x: (n.tx + 0.5) * TILE,
      y: (n.ty + 0.9) * TILE,
      homeX: (n.tx + 0.5) * TILE,
      homeY: (n.ty + 0.9) * TILE,
      tx: (n.tx + 0.5) * TILE,
      ty: (n.ty + 0.9) * TILE,
      range: n.range || 86,
      speed: n.speed || 34,
      moving: false, moveTime: 0,
      waitTimer: Math.random() * 3,
      facing: Math.PI / 2,
      phase: 0,
      def: n,
      sortY: (n.ty + 0.9) * TILE
    });
  }

  /* ---------- 10. 任务触发点 ---------- */
  const points = {};
  for (const k in QUEST_POINTS) {
    const p = QUEST_POINTS[k];
    if (p.map !== mapId) continue;
    points[k] = { x: (p.tx + 0.5) * TILE, y: (p.ty + 0.5) * TILE, name: p.name };
  }

  /* ---------- 11. 出生点 ---------- */
  const spawn = { x: anchors[0].x - TILE * 1.2, y: anchors[0].y + TILE * 1.4 };

  /* ---------- 12. 小地图底图 ---------- */
  const mini = document.createElement('canvas');
  mini.width = cols;
  mini.height = rows;
  const mg = mini.getContext('2d');
  const MINI_COLORS = {
    0: '#1d4a78', 1: '#2f7bb0', 2: '#cbb98c', 3: '#5d9050',
    4: '#3c6b3a', 5: '#7d9455', 6: '#7c7c86', 7: '#dfe9f2',
    8: '#a89170', 9: '#a9a596', 10: '#9fa95a'
  };
  const img = mg.createImageData(cols, rows);
  for (let i = 0; i < cols * rows; i++) {
    const c = MINI_COLORS[tiles[i]] || '#000';
    img.data[i * 4] = parseInt(c.slice(1, 3), 16);
    img.data[i * 4 + 1] = parseInt(c.slice(3, 5), 16);
    img.data[i * 4 + 2] = parseInt(c.slice(5, 7), 16);
    img.data[i * 4 + 3] = 255;
  }
  mg.putImageData(img, 0, 0);
  mg.fillStyle = 'rgba(220,120,80,0.95)';
  for (const b of buildings) mg.fillRect(b.tx, b.ty, b.tw, b.th);

  /* ---------- 13. 怪物刷新点 ---------- */
  const spawnPoints = [];
  {
    const mr = makeRng(seed + 9090);
    for (const cfg of (def.monsters || [])) {
      for (let n = 0; n < cfg.n; n++) {
        let tries = 0;
        while (tries < 400) {
          tries++;
          const tx = 3 + Math.floor(mr() * (cols - 6));
          const ty = 3 + Math.floor(mr() * (rows - 6));
          const i = ty * cols + tx;
          if (solid[i]) continue;
          const t = tiles[i];
          if (t !== T.GRASS && t !== T.FOREST && t !== T.HILL && t !== T.SAND) continue;
          if (Math.hypot(tx - anchorDef.tx, ty - anchorDef.ty) < 14) continue;
          spawnPoints.push({
            type: cfg.type,
            tx: tx, ty: ty,
            x: (tx + 0.5) * TILE,
            y: (ty + 0.5) * TILE,
            lv: (function () {
              const r = MONSTER_LV[mapId] || [1, 2];
              return r[0] + Math.floor(mr() * (r[1] - r[0] + 1));
            })()
          });
          break;
        }
      }
    }
  }

  return {
    id: mapId, def: def, name: def.name,    cols: cols, rows: rows,
    tiles: tiles, solid: solid, objects: objects, buildings: buildings,
    decals: decals, anchors: anchors, npcs: npcs, herbs: herbs, chests: chests, exits: exits,
    points: points, spawn: spawn, spawnPoints: spawnPoints,
    village: isVillage ? { tx: vx, ty: vy, x: (vx + 0.5) * TILE, y: (vy + 0.5) * TILE } : null,
    miniCanvas: mini,
    isSolidTile(x, y) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return true;
      return solid[y * cols + x] === 1;
    }
  };
}
