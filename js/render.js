'use strict';

/* =========================================================================
   青云界 · 渲染层
   ========================================================================= */

const TILE_VARIANTS = 6;
const TILE_SPRITES = {};

const PAL = {
  grass: ['#6f9f57', '#77a95d', '#679651'],
  forest: ['#4f7c46', '#47733f', '#578449'],
  hill: ['#87a05a', '#90a962', '#7e9753'],
  sand: ['#dccb9d', '#e5d5aa', '#d2c191'],
  path: ['#bda98a', '#c6b391', '#b29e7f'],
  plaza: ['#b5b1a3', '#c0bcae', '#a9a598'],
  field: ['#a4b25c', '#9aa953', '#aeb96a'],
  waterTop: '#4c8cc4', waterBot: '#2c6199',
  deepTop: '#2f6ba3', deepBot: '#1b4472',
  rock: ['#8e8e98', '#98989f', '#83838d'],
  snow: ['#e9f1f9', '#f3f8fd', '#dde8f3']
};

function rr(g, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.lineTo(x + w - rad, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rad);
  g.lineTo(x + w, y + h - rad);
  g.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  g.lineTo(x + rad, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - rad);
  g.lineTo(x, y + rad);
  g.quadraticCurveTo(x, y, x + rad, y);
  g.closePath();
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ============================ 地表贴图 ============================ */

function buildTileSprites() {
  const makeVariants = (type, drawFn) => {
    const arr = [];
    for (let v = 0; v < TILE_VARIANTS; v++) {
      const c = newCanvas(TILE, TILE);
      drawFn(c.getContext('2d'), v, makeRng(9973 + v * 613 + type * 17));
      arr.push(c);
    }
    TILE_SPRITES[type] = arr;
  };

  const grassLike = (colors, blade, flowerChance) => (g, v, rnd) => {
    g.fillStyle = colors[v % colors.length];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 7 + rnd() * 12, 5 + rnd() * 8, rnd() * 3.1, 0, 6.283);
      g.fillStyle = 'rgba(255,255,255,' + (0.022 + rnd() * 0.045).toFixed(3) + ')';
      g.fill();
    }
    g.lineWidth = 1;
    g.strokeStyle = blade;
    for (let k = 0; k < 18; k++) {
      const x = rnd() * TILE, y = rnd() * TILE;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 1, y - 3, x + (rnd() - 0.5) * 5, y - 5 - rnd() * 4);
      g.stroke();
    }
    if (rnd() < flowerChance) {
      const fx = 6 + rnd() * (TILE - 12), fy = 6 + rnd() * (TILE - 12);
      const cols = ['#f2e7a0', '#eab7c8', '#f0f0e0', '#d8b6ea'];
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.arc(fx + (rnd() - 0.5) * 9, fy + (rnd() - 0.5) * 9, 1.2 + rnd() * 0.7, 0, 6.283);
        g.fill();
      }
    }
  };

  makeVariants(T.GRASS, grassLike(PAL.grass, 'rgba(48,88,40,0.45)', 0.30));
  makeVariants(T.FOREST, grassLike(PAL.forest, 'rgba(30,60,28,0.5)', 0.16));
  makeVariants(T.HILL, grassLike(PAL.hill, 'rgba(70,92,40,0.4)', 0.22));

  makeVariants(T.SAND, (g, v, rnd) => {
    g.fillStyle = PAL.sand[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 30; k++) {
      g.fillStyle = 'rgba(160,138,95,' + (0.06 + rnd() * 0.14).toFixed(3) + ')';
      g.fillRect(rnd() * TILE, rnd() * TILE, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 6 + rnd() * 10, 2 + rnd() * 4, 0, 0, 6.283);
      g.fillStyle = 'rgba(255,250,225,0.10)';
      g.fill();
    }
  });

  makeVariants(T.PATH, (g, v, rnd) => {
    g.fillStyle = PAL.path[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 26; k++) {
      g.fillStyle = 'rgba(120,100,72,' + (0.05 + rnd() * 0.13).toFixed(3) + ')';
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 1.5 + rnd() * 3.5, 1 + rnd() * 2.2, rnd() * 3, 0, 6.283);
      g.fill();
    }
    g.strokeStyle = 'rgba(90,74,54,0.18)';
    g.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const y = rnd() * TILE;
      g.beginPath();
      g.moveTo(0, y);
      g.quadraticCurveTo(TILE / 2, y + (rnd() - 0.5) * 6, TILE, y + (rnd() - 0.5) * 4);
      g.stroke();
    }
  });

  makeVariants(T.PLAZA, (g, v, rnd) => {
    g.fillStyle = PAL.plaza[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(88,84,76,0.30)';
    g.lineWidth = 1.2;
    for (const c of [[0, 0, 20, 20], [20, 0, 20, 20], [0, 20, 20, 20], [20, 20, 20, 20]]) {
      g.strokeRect(c[0] + 0.5, c[1] + 0.5, c[2] - 1, c[3] - 1);
      g.fillStyle = 'rgba(255,255,255,' + (0.015 + rnd() * 0.05).toFixed(3) + ')';
      g.fillRect(c[0] + 1, c[1] + 1, c[2] - 2, c[3] - 2);
    }
    for (let k = 0; k < 12; k++) {
      g.fillStyle = 'rgba(70,68,62,' + (0.04 + rnd() * 0.08).toFixed(3) + ')';
      g.fillRect(rnd() * TILE, rnd() * TILE, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  });

  makeVariants(T.FIELD, (g, v, rnd) => {
    g.fillStyle = PAL.field[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(112,96,58,0.30)';
    g.lineWidth = 2;
    for (let k = 1; k < 4; k++) {
      g.beginPath(); g.moveTo(0, k * 10); g.lineTo(TILE, k * 10); g.stroke();
    }
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(120,150,60,0.55)';
    for (let k = 0; k < 14; k++) {
      const x = rnd() * TILE, y = Math.floor(rnd() * 4) * 10 + 3;
      g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x + (rnd() - 0.5) * 3, y - 2); g.stroke();
    }
  });

  makeVariants(T.WATER, (g, v, rnd) => {
    const grd = g.createLinearGradient(0, 0, 0, TILE);
    grd.addColorStop(0, PAL.waterTop);
    grd.addColorStop(1, PAL.waterBot);
    g.fillStyle = grd;
    g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(180,225,255,0.18)';
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const y = rnd() * TILE;
      g.beginPath();
      g.moveTo(rnd() * 10, y);
      g.quadraticCurveTo(TILE / 2, y - 2.5, TILE - rnd() * 10, y);
      g.stroke();
    }
  });

  makeVariants(T.DEEP, (g, v, rnd) => {
    const grd = g.createLinearGradient(0, 0, 0, TILE);
    grd.addColorStop(0, PAL.deepTop);
    grd.addColorStop(1, PAL.deepBot);
    g.fillStyle = grd;
    g.fillRect(0, 0, TILE, TILE);
    g.strokeStyle = 'rgba(150,200,240,0.10)';
    g.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const y = rnd() * TILE;
      g.beginPath();
      g.moveTo(rnd() * 14, y);
      g.lineTo(TILE - rnd() * 14, y + (rnd() - 0.5) * 3);
      g.stroke();
    }
  });

  makeVariants(T.ROCK, (g, v, rnd) => {
    g.fillStyle = PAL.rock[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 5; k++) {
      const x = rnd() * TILE, y = rnd() * TILE, s = 7 + rnd() * 12;
      g.beginPath();
      g.moveTo(x - s / 2, y + s / 3);
      g.lineTo(x - s / 5, y - s / 2);
      g.lineTo(x + s / 2, y - s / 4);
      g.lineTo(x + s / 3, y + s / 2);
      g.closePath();
      g.fillStyle = rnd() < 0.5 ? 'rgba(210,215,225,0.16)' : 'rgba(50,50,60,0.20)';
      g.fill();
    }
    g.strokeStyle = 'rgba(45,45,55,0.28)';
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const x = rnd() * TILE, y = rnd() * TILE;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rnd() - 0.5) * 20, y + (rnd() - 0.5) * 20);
      g.stroke();
    }
  });

  makeVariants(T.SNOW, (g, v, rnd) => {
    g.fillStyle = PAL.snow[v % 3];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 8 + rnd() * 12, 5 + rnd() * 8, 0, 0, 6.283);
      g.fillStyle = 'rgba(180,205,235,0.16)';
      g.fill();
    }
    g.strokeStyle = 'rgba(160,185,215,0.35)';
    g.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const x = rnd() * TILE, y = rnd() * TILE;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rnd() - 0.5) * 22, y + (rnd() - 0.5) * 16);
      g.stroke();
    }
  });

  /* ---------- 试炼场地砖 ---------- */
  makeVariants(T.ARENA, (g, v, rnd) => {
    g.fillStyle = ['#4a4f5c', '#525764', '#434856'][v % 3];
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 8 + rnd() * 12, 5 + rnd() * 9, 0, 0, 6.283);
      g.fillStyle = 'rgba(255,255,255,' + (0.015 + rnd() * 0.04).toFixed(3) + ')';
      g.fill();
    }
    g.strokeStyle = 'rgba(20,22,30,0.55)';
    g.lineWidth = 1.5;
    g.strokeRect(0.75, 0.75, TILE - 1.5, TILE - 1.5);
    // 灵石纹
    if (rnd() < 0.4) {
      g.strokeStyle = 'rgba(150,205,255,0.20)';
      g.lineWidth = 1.3;
      g.beginPath();
      g.arc(TILE / 2, TILE / 2, 6 + rnd() * 5, rnd() * 3, 2 + rnd() * 3);
      g.stroke();
    }
    for (let k = 0; k < 8; k++) {
      g.fillStyle = 'rgba(30,32,40,' + (0.05 + rnd() * 0.1).toFixed(3) + ')';
      g.fillRect(rnd() * TILE, rnd() * TILE, 1 + rnd() * 3, 1 + rnd() * 3);
    }
  });

  /* ---------- 虚空 ---------- */
  makeVariants(T.VOID, (g, v, rnd) => {
    const grd = g.createLinearGradient(0, 0, 0, TILE);
    grd.addColorStop(0, '#0a0d15');
    grd.addColorStop(1, '#05070c');
    g.fillStyle = grd;
    g.fillRect(0, 0, TILE, TILE);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = 'rgba(150,185,235,' + (0.05 + rnd() * 0.22).toFixed(3) + ')';
      g.beginPath();
      g.arc(rnd() * TILE, rnd() * TILE, 0.5 + rnd() * 1.3, 0, 6.283);
      g.fill();
    }
    if (rnd() < 0.18) {
      g.fillStyle = 'rgba(120,160,255,0.10)';
      g.beginPath();
      g.ellipse(rnd() * TILE, rnd() * TILE, 10 + rnd() * 14, 4 + rnd() * 6, 0, 0, 6.283);
      g.fill();
    }
  });
}

/* ============================== 地表 ============================== */

function drawTerrain(g, world, x0, y0, x1, y1, time) {
  const tiles = world.tiles, cols = world.cols, rows = world.rows;
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= rows) continue;
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || tx >= cols) continue;
      const t = tiles[ty * cols + tx];
      const set = TILE_SPRITES[t];
      if (!set) continue;
      const v = (hash2(tx, ty, 4241) * TILE_VARIANTS) | 0;
      g.drawImage(set[v % set.length], tx * TILE, ty * TILE, TILE + 1, TILE + 1);
    }
  }

  g.save();
  g.lineCap = 'round';
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= rows) continue;
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || tx >= cols) continue;
      const t = tiles[ty * cols + tx];
      if (t !== T.WATER && t !== T.DEEP) continue;
      const ph = hash2(tx, ty, 777) * 6.283;
      const px = tx * TILE, py = ty * TILE;
      g.strokeStyle = 'rgba(200,235,255,' + (0.10 + 0.10 * Math.sin(time * 1.6 + ph)).toFixed(3) + ')';
      g.lineWidth = 1.4;
      const ox = Math.sin(time * 0.7 + ph) * 4;
      g.beginPath();
      g.moveTo(px + 6 + ox, py + 14);
      g.quadraticCurveTo(px + 20, py + 10, px + 34 + ox, py + 15);
      g.stroke();
      const s2 = 0.06 + 0.08 * Math.sin(time * 1.1 + ph + 2);
      g.strokeStyle = 'rgba(230,248,255,' + Math.max(0, s2).toFixed(3) + ')';
      g.beginPath();
      g.moveTo(px + 10 - ox, py + 29);
      g.quadraticCurveTo(px + 24, py + 25, px + 33 - ox, py + 30);
      g.stroke();
    }
  }
  g.restore();
}

/* ============================== 贴花 ============================== */

function drawDecals(g, world, time) {
  const decals = world.decals || [];
  for (const d of decals) {
    if (d.type === 'ring') {
      g.save();
      g.translate(d.x, d.y);
      g.strokeStyle = 'rgba(238,232,214,0.30)';
      g.lineWidth = 6;
      g.beginPath(); g.arc(0, 0, d.r, 0, 6.283); g.stroke();
      g.strokeStyle = 'rgba(120,112,96,0.20)';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(0, 0, d.r + 4, 0, 6.283); g.stroke();
      g.strokeStyle = 'rgba(238,232,214,0.24)';
      g.lineWidth = 3;
      g.beginPath(); g.arc(0, 0, d.r * 0.55, 0, 6.283); g.stroke();
      g.strokeStyle = 'rgba(238,232,214,0.16)';
      g.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.283;
        g.beginPath();
        g.moveTo(Math.cos(a) * d.r * 0.58, Math.sin(a) * d.r * 0.58);
        g.lineTo(Math.cos(a) * d.r * 0.97, Math.sin(a) * d.r * 0.97);
        g.stroke();
      }
      g.strokeStyle = 'rgba(238,232,214,0.28)';
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, d.r * 0.22, 0, 6.283); g.stroke();
      g.restore();
    } else if (d.type === 'anchor') {
      const pulse = 0.35 + Math.sin(time * 1.8) * 0.16;
      g.save();
      g.translate(d.x, d.y);
      const grd = g.createRadialGradient(0, 0, d.r * 0.15, 0, 0, d.r);
      grd.addColorStop(0, 'rgba(130,220,255,' + (pulse * 0.5).toFixed(3) + ')');
      grd.addColorStop(0.55, 'rgba(90,170,255,' + (pulse * 0.22).toFixed(3) + ')');
      grd.addColorStop(1, 'rgba(60,120,200,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(0, 0, d.r, 0, 6.283); g.fill();
      g.strokeStyle = 'rgba(150,225,255,' + (0.4 + pulse).toFixed(3) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, d.r * 0.82, 0, 6.283); g.stroke();
      g.lineWidth = 1.2;
      g.beginPath(); g.arc(0, 0, d.r * 0.55, 0, 6.283); g.stroke();
      // 旋转符文
      for (let i = 0; i < 6; i++) {
        const a = time * 0.5 + (i / 6) * 6.283;
        const r = d.r * 0.68;
        g.fillStyle = 'rgba(190,240,255,' + (0.5 + pulse).toFixed(3) + ')';
        g.beginPath();
        g.arc(Math.cos(a) * r, Math.sin(a) * r * 0.62, 2.2, 0, 6.283);
        g.fill();
      }
      g.restore();
    }
  }
}

/* ============================ 人形绘制 ============================ */
/* 玩家 / NPC 共用：可按流派换色换兵器，支持走路、攻击、受击、八向朝向 */

/* 八向朝参：0=东 1=东南 2=南 3=西南 4=西 5=西北 6=北 7=东北 */
const DIR8 = [
  { flip: 1, bodyW: 0.80, faceShift: 3.0, faceShow: 0.55, lean: 1 },   // 东
  { flip: 1, bodyW: 0.90, faceShift: 1.8, faceShow: 0.90, lean: 0.6 }, // 东南
  { flip: 1, bodyW: 1.00, faceShift: 0.0, faceShow: 1.00, lean: 0 },   // 南
  { flip: -1, bodyW: 0.90, faceShift: 1.8, faceShow: 0.90, lean: 0.6 },// 西南
  { flip: -1, bodyW: 0.80, faceShift: 3.0, faceShow: 0.55, lean: 1 },  // 西
  { flip: -1, bodyW: 0.90, faceShift: 1.6, faceShow: 0.35, lean: 0.8 },// 西北
  { flip: 1, bodyW: 1.00, faceShift: 0.0, faceShow: 0.00, lean: 0 },   // 北
  { flip: 1, bodyW: 0.90, faceShift: 1.6, faceShow: 0.35, lean: 0.8 }  // 东北
];

function dirParams(facing) {
  let a = facing % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return DIR8[Math.round(a / (Math.PI / 4)) % 8];
}

function drawFigure(g, x, y, o) {
  const t = o.t || 0;
  const facing = o.facing === undefined ? Math.PI / 2 : o.facing;
  const moving = !!o.moving;
  const phase = o.phase || 0;
  const scale = o.scale || 1;

  const robe = o.robe || '#f4f8fd';
  const robeDark = o.robeDark || '#c3d6e8';
  const accent = o.accent || '#5f9ad2';
  const sashCol = o.sash || '#b8453c';
  const hairCol = o.hair || '#262230';
  const glow = o.glow || 'rgba(150,215,255,';
  const weapon = o.weapon || 'sword';

  const fx = Math.cos(facing);
  const fy = Math.sin(facing);
  const D = dirParams(facing);
  const flip = D.flip;
  const back = D.faceShow <= 0.12;
  const bodyW = D.bodyW;

  const walkS = Math.sin(phase * 6.2832);
  const bob = moving ? Math.abs(walkS) * 1.9 : Math.sin(t * 1.9) * 0.9;
  const sway = moving ? walkS * 1.7 : Math.sin(t * 1.3) * 0.6;

  /* ---------- 若玩家提供了角色图片，直接用它 ---------- */
  const spr = (typeof Art !== 'undefined' && o.spriteKey) ? Art.sprite(o.spriteKey) : null;
  if (spr) {
    const iw = spr.naturalWidth || spr.width;
    const ih = spr.naturalHeight || spr.height;
    if (iw > 0 && ih > 0) {
      g.save();
      g.translate(x, y);
      g.scale(scale, scale);

      // 影子
      g.fillStyle = 'rgba(24,34,20,0.28)';
      g.beginPath();
      g.ellipse(0, 0, 12.5, 4.8, 0, 0, 6.283);
      g.fill();

      // 灵气环
      const auraPulse = 0.30 + Math.sin(t * 2.0) * 0.10;
      g.strokeStyle = glow + auraPulse.toFixed(3) + ')';
      g.lineWidth = 1.3;
      g.beginPath();
      g.ellipse(0, 0, 15.5, 5.8, 0, 0, 6.283);
      g.stroke();

      const H = o.spriteH || 66;
      const W = H * (iw / ih);
      g.translate(0, -bob);
      if (flip < 0) g.scale(-1, 1);

      // 走动时轻微倾斜与上下压
      if (moving) g.rotate(walkS * 0.03);

      g.drawImage(spr, -W / 2, -H, W, H);

      // 受击闪白
      if (o.flash > 0) {
        g.globalAlpha = Math.min(0.6, o.flash);
        g.globalCompositeOperation = 'lighter';
        g.drawImage(spr, -W / 2, -H, W, H);
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
      }
      g.restore();
      return;
    }
  }

  g.save();
  g.translate(x, y);
  g.scale(scale, scale);

  // 影子
  g.fillStyle = 'rgba(24,34,20,0.26)';
  g.beginPath();
  g.ellipse(0, 0, 11.5, 4.6, 0, 0, 6.283);
  g.fill();

  // 灵气环
  const auraPulse = 0.30 + Math.sin(t * 2.0) * 0.10;
  g.strokeStyle = glow + auraPulse.toFixed(3) + ')';
  g.lineWidth = 1.3;
  g.beginPath();
  g.ellipse(0, 0, 15.5, 5.8, 0, 0, 6.283);
  g.stroke();

  g.translate(0, -bob);
  g.scale(flip * bodyW, 1);

  const legSwing = moving ? walkS * 3.6 : 0;
  const legSX = moving ? walkS * 2.2 : 0;

  /* ---- 腿与靴 ---- */
  // 后腿
  g.save();
  g.translate(-1.4 - legSX * 0.5, -9 - Math.max(0, legSwing) * 0.9);
  g.rotate(moving ? walkS * 0.16 : 0);
  g.fillStyle = '#2b2934';
  g.beginPath(); rr(g, -2.6, 0, 5.0, 9.4, 2.2); g.fill();
  g.fillStyle = '#3d3b49';
  g.beginPath(); rr(g, -3.2, 6.2, 6.2, 3.6, 1.6); g.fill();
  g.restore();

  // 前腿
  g.save();
  g.translate(1.4 + legSX * 0.5, -9 + Math.max(0, legSwing) * 0.9);
  g.rotate(moving ? -walkS * 0.16 : 0);
  g.fillStyle = '#33313d';
  g.beginPath(); rr(g, -2.6, 0, 5.0, 9.4, 2.2); g.fill();
  g.fillStyle = '#4a4757';
  g.beginPath(); rr(g, -3.2, 6.2, 6.2, 3.6, 1.6); g.fill();
  // 靴尖
  g.fillStyle = '#57556a';
  g.beginPath(); g.ellipse(1.1, 9.4, 3.4, 1.5, 0, 0, 6.283); g.fill();
  g.restore();

  /* ---- 兵器（背后） ---- */
  g.save();
  g.translate(-1, -27);
  g.rotate(-0.62);
  if (weapon === 'sword') {
    g.fillStyle = '#4a3a2e';
    g.beginPath(); rr(g, -2.6, -23, 5.2, 31, 2.4); g.fill();
    g.fillStyle = '#c8a24a';
    g.fillRect(-4.4, -1.5, 8.8, 2.6);
    g.beginPath(); g.arc(0, -24, 2.8, 0, 6.283); g.fill();
  } else if (weapon === 'staff') {
    g.strokeStyle = '#7a5a3a';
    g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 30); g.stroke();
    g.fillStyle = '#9fd6ff';
    g.beginPath(); g.arc(0, -28, 3.6, 0, 6.283); g.fill();
  } else if (weapon === 'gourd') {
    g.fillStyle = '#b8873f';
    g.beginPath(); g.arc(0, 4, 5, 0, 6.283); g.fill();
    g.beginPath(); g.arc(0, -4, 3.4, 0, 6.283); g.fill();
    g.strokeStyle = '#6b4a28';
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-4, 4); g.lineTo(4, 4); g.stroke();
  }
  g.restore();

  /* ---- 外袍 ---- */
  const robeGrad = g.createLinearGradient(0, -37, 0, -2);
  robeGrad.addColorStop(0, robe);
  robeGrad.addColorStop(0.6, robe);
  robeGrad.addColorStop(1, robeDark);
  g.beginPath();
  g.moveTo(-7, -35);
  g.lineTo(7, -35);
  g.quadraticCurveTo(10.5 + sway * 0.3, -22, 13 + sway, -3.4);
  g.quadraticCurveTo(0, 1, -13 + sway, -3.4);
  g.quadraticCurveTo(-10.5 + sway * 0.3, -22, -7, -35);
  g.closePath();
  g.fillStyle = robeGrad;
  g.fill();
  g.strokeStyle = 'rgba(80,110,150,0.45)';
  g.lineWidth = 0.9;
  g.stroke();

  // 内衬（中路浅色）
  g.beginPath();
  g.moveTo(-2.6, -34);
  g.lineTo(2.6, -34);
  g.quadraticCurveTo(4, -20, 5.2 + sway * 0.4, -5);
  g.quadraticCurveTo(0, -2.6, -5.2 + sway * 0.4, -5);
  g.quadraticCurveTo(-4, -20, -2.6, -34);
  g.closePath();
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fill();

  // 下摆滚边
  g.beginPath();
  g.moveTo(-12.8 + sway, -3.6);
  g.quadraticCurveTo(0, 0.6, 12.8 + sway, -3.6);
  g.strokeStyle = accent;
  g.lineWidth = 1.8;
  g.stroke();

  // 腰带
  g.fillStyle = sashCol;
  g.beginPath(); rr(g, -8.6, -24, 17.2, 4.4, 1.8); g.fill();
  g.fillStyle = 'rgba(255,225,170,0.85)';
  g.fillRect(-2.2, -23.4, 4.4, 1.3);
  // 腰坠飘带
  g.strokeStyle = sashCol;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(2, -20);
  g.quadraticCurveTo(4 + sway * 0.8, -14, 2.6 + sway, -7);
  g.stroke();

  // 交领
  g.strokeStyle = accent;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-4.8, -35);
  g.lineTo(0, -28);
  g.lineTo(4.8, -35);
  g.stroke();

  /* ---- 衣袖 ---- */
  const armSwing = moving ? -walkS * 2.6 : Math.sin(t * 1.4) * 0.8;
  const atk = o.attack || 0;   // 0..1 攻击动作进度
  for (const side of [-1, 1]) {
    g.save();
    let armRot = side * (0.28 + armSwing * 0.035);
    let armLift = 0;
    if (atk > 0) {
      if (side === 1) { armRot = -0.9 - atk * 1.5; armLift = -3; }
      else { armRot = 0.5 + atk * 0.6; }
    }
    g.translate(side * 7.8, -30 + armLift);
    g.rotate(armRot);
    const sleeveGrad = g.createLinearGradient(0, 0, 0, 17);
    sleeveGrad.addColorStop(0, robe);
    sleeveGrad.addColorStop(1, robeDark);
    g.fillStyle = sleeveGrad;
    g.beginPath();
    g.moveTo(-2.8, 0);
    g.quadraticCurveTo(side * 5.8, 6, side * 4.4, 15);
    g.quadraticCurveTo(0, 18, -3.6, 13);
    g.quadraticCurveTo(-4.2, 5, -2.8, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(80,110,150,0.40)';
    g.lineWidth = 0.8;
    g.stroke();
    g.fillStyle = '#f3d6b8';
    g.beginPath(); g.arc(side * 2.6, 15.5, 2.3, 0, 6.283); g.fill();
    g.restore();
  }

  /* ---- 头（真人比例：颅顶弧度 + 收窄下颌 + 颈部斜度） ---- */
  const headY = -42.5;
  const faceX = D.faceShow > 0.05 ? D.faceShift : 0;
  const showFace = D.faceShow > 0.12;
  const front = D.faceShow >= 0.85;

  const skin = '#f7dcbf';
  const skinShade = '#e3b995';
  const skinDeep = '#cf9d78';

  // 脖子（略带斜度，两侧有阴影）
  g.fillStyle = skinShade;
  g.beginPath();
  g.moveTo(-2.9, headY + 4.6);
  g.lineTo(2.9, headY + 4.6);
  g.lineTo(3.4, headY + 10.4);
  g.lineTo(-3.4, headY + 10.4);
  g.closePath();
  g.fill();
  g.fillStyle = skin;
  g.beginPath();
  g.moveTo(-2.2, headY + 4.6);
  g.lineTo(2.2, headY + 4.6);
  g.lineTo(2.4, headY + 10.2);
  g.lineTo(-2.4, headY + 10.2);
  g.closePath();
  g.fill();
  // 下颌投影
  g.fillStyle = 'rgba(150,100,70,0.22)';
  g.beginPath();
  g.ellipse(0, headY + 5.2, 3.2, 1.3, 0, 0, 6.283);
  g.fill();

  // 后发（脑后的发团，带体积）
  const hairGrad = g.createLinearGradient(0, headY - 10, 0, headY + 8);
  hairGrad.addColorStop(0, hairCol);
  hairGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = hairCol;
  g.beginPath();
  g.ellipse(0, headY - 0.6, 8.1, 8.5, 0, 0, 6.283);
  g.fill();
  // 后颈长发（背身时更明显）
  if (!showFace) {
    g.beginPath();
    g.moveTo(-6.6, headY + 2);
    g.quadraticCurveTo(-7.8, headY + 10, -4.6, headY + 13);
    g.lineTo(4.6, headY + 13);
    g.quadraticCurveTo(7.8, headY + 10, 6.6, headY + 2);
    g.closePath();
    g.fill();
  }

  // 发髻 + 发簪
  g.beginPath(); g.ellipse(0, headY - 9.4, 4.0, 3.4, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.10)';
  g.lineWidth = 0.7;
  g.beginPath(); g.arc(-1.2, headY - 10.2, 2.6, 3.4, 5.2); g.stroke();
  g.fillStyle = '#c8a24a';
  g.fillRect(-4.6, headY - 10.4, 9.2, 1.5);
  g.beginPath(); g.arc(0, headY - 10.2, 1.5, 0, 6.283); g.fill();

  /* -------- 脸部 -------- */
  if (showFace) {
    const faceW = 6.0 * (0.58 + 0.42 * D.faceShow);
    const cxp = faceX * 0.85;

    // 脸型：额宽 → 颧骨 → 收下颌 → 下巴
    g.save();
    g.beginPath();
    g.moveTo(cxp - faceW * 0.92, headY - 3.6);
    g.bezierCurveTo(cxp - faceW * 1.06, headY + 0.4,
      cxp - faceW * 0.92, headY + 3.6, cxp - faceW * 0.52, headY + 5.6);
    g.bezierCurveTo(cxp - faceW * 0.24, headY + 6.9,
      cxp + faceW * 0.24, headY + 6.9, cxp + faceW * 0.52, headY + 5.6);
    g.bezierCurveTo(cxp + faceW * 0.92, headY + 3.6,
      cxp + faceW * 1.06, headY + 0.4, cxp + faceW * 0.92, headY - 3.6);
    g.bezierCurveTo(cxp + faceW * 0.7, headY - 7.4,
      cxp - faceW * 0.7, headY - 7.4, cxp - faceW * 0.92, headY - 3.6);
    g.closePath();
    const fg = g.createLinearGradient(cxp - faceW, headY - 6, cxp + faceW, headY + 6);
    fg.addColorStop(0, skin);
    fg.addColorStop(0.55, '#fbe3c9');
    fg.addColorStop(1, skinShade);
    g.fillStyle = fg;
    g.fill();
    g.clip();

    // 颧骨高光 / 侧脸阴影
    g.fillStyle = 'rgba(255,255,255,0.28)';
    g.beginPath();
    g.ellipse(cxp + faceW * 0.34, headY + 1.4, faceW * 0.4, 1.9, -0.2, 0, 6.283);
    g.fill();

    // 下巴以下的暗面
    const jawG = g.createLinearGradient(0, headY + 2.6, 0, headY + 7);
    jawG.addColorStop(0, 'rgba(180,120,90,0)');
    jawG.addColorStop(1, 'rgba(150,95,65,0.30)');
    g.fillStyle = jawG;
    g.fillRect(cxp - faceW, headY + 2.6, faceW * 2, 5);

    // 眼窝阴影
    g.fillStyle = 'rgba(190,140,110,0.18)';
    g.beginPath();
    g.ellipse(cxp - faceW * 0.42, headY - 0.2, faceW * 0.34, 1.9, 0, 0, 6.283);
    g.fill();
    g.beginPath();
    g.ellipse(cxp + faceW * 0.42, headY - 0.2, faceW * 0.34, 1.9, 0, 0, 6.283);
    g.fill();

    // ---- 眼睛 ----
    const eyeR = Math.max(1.15, faceW * 0.2);
    const drawEye = (ex, ey, scaleEye) => {
      const er = eyeR * scaleEye;
      // 眼白
      g.fillStyle = '#fdfaf6';
      g.beginPath();
      g.moveTo(ex - er * 1.5, ey);
      g.quadraticCurveTo(ex, ey - er * 1.25, ex + er * 1.5, ey);
      g.quadraticCurveTo(ex, ey + er * 0.95, ex - er * 1.5, ey);
      g.closePath();
      g.fill();
      // 虹膜
      const eyeCol = o.eye || '#4a3a30';
      g.fillStyle = eyeCol;
      g.beginPath();
      g.arc(ex, ey + er * 0.1, er * 0.78, 0, 6.283);
      g.fill();
      // 瞳孔
      g.fillStyle = 'rgba(20,14,12,0.92)';
      g.beginPath();
      g.arc(ex, ey + er * 0.12, er * 0.4, 0, 6.283);
      g.fill();
      // 高光
      g.fillStyle = 'rgba(255,255,255,0.92)';
      g.beginPath();
      g.arc(ex - er * 0.32, ey - er * 0.28, er * 0.3, 0, 6.283);
      g.fill();
      // 上眼睑（压住上缘，让眼型更真）
      g.fillStyle = skin;
      g.beginPath();
      g.moveTo(ex - er * 1.6, ey - er * 0.1);
      g.quadraticCurveTo(ex, ey - er * 1.5, ex + er * 1.6, ey - er * 0.1);
      g.quadraticCurveTo(ex, ey - er * 0.55, ex - er * 1.6, ey - er * 0.1);
      g.closePath();
      g.fill();
      // 上眼线
      g.strokeStyle = 'rgba(60,40,34,0.85)';
      g.lineWidth = Math.max(0.55, er * 0.2);
      g.beginPath();
      g.moveTo(ex - er * 1.55, ey - er * 0.05);
      g.quadraticCurveTo(ex, ey - er * 1.32, ex + er * 1.55, ey - er * 0.05);
      g.stroke();
      // 下眼线（很淡）
      g.strokeStyle = 'rgba(150,110,90,0.4)';
      g.lineWidth = Math.max(0.35, er * 0.12);
      g.beginPath();
      g.moveTo(ex - er * 1.2, ey + er * 0.7);
      g.quadraticCurveTo(ex, ey + er * 1.0, ex + er * 1.2, ey + er * 0.7);
      g.stroke();
    };

    if (front) {
      drawEye(cxp - faceW * 0.42, headY + 0.5, 1);
      drawEye(cxp + faceW * 0.42, headY + 0.5, 1);
      // 眉毛
      g.strokeStyle = 'rgba(60,45,40,0.62)';
      g.lineWidth = 0.68;
      for (const sgn of [-1, 1]) {
        g.beginPath();
        g.moveTo(cxp + sgn * faceW * 0.18, headY - 2.15);
        g.quadraticCurveTo(cxp + sgn * faceW * 0.46, headY - 2.95,
          cxp + sgn * faceW * 0.72, headY - 2.1);
        g.stroke();
      }
      // 鼻：鼻梁高光 + 鼻头 + 鼻翼
      g.fillStyle = 'rgba(255,255,255,0.3)';
      g.beginPath();
      g.ellipse(cxp, headY + 1.3, 0.62, 1.9, 0, 0, 6.283);
      g.fill();
      g.fillStyle = skinShade;
      g.beginPath();
      g.ellipse(cxp, headY + 3.0, 1.15, 0.95, 0, 0, 6.283);
      g.fill();
      g.fillStyle = 'rgba(140,95,70,0.5)';
      g.beginPath();
      g.ellipse(cxp - 0.95, headY + 3.15, 0.42, 0.3, 0, 0, 6.283);
      g.fill();
      g.beginPath();
      g.ellipse(cxp + 0.95, headY + 3.15, 0.42, 0.3, 0, 0, 6.283);
      g.fill();
      // 嘴
      g.strokeStyle = 'rgba(150,80,70,0.7)';
      g.lineWidth = 0.62;
      g.beginPath();
      g.moveTo(cxp - 1.25, headY + 4.5);
      g.quadraticCurveTo(cxp, headY + 4.95, cxp + 1.25, headY + 4.5);
      g.stroke();
      // 腮红
      g.fillStyle = 'rgba(226,150,140,0.26)';
      g.beginPath();
      g.ellipse(cxp - faceW * 0.62, headY + 3.1, 1.7, 1.0, 0, 0, 6.283);
      g.fill();
      g.beginPath();
      g.ellipse(cxp + faceW * 0.62, headY + 3.1, 1.7, 1.0, 0, 0, 6.283);
      g.fill();
      // 耳朵
      g.fillStyle = skinShade;
      g.beginPath();
      g.ellipse(cxp - faceW * 0.98, headY + 0.6, 1.1, 1.8, 0.1, 0, 6.283);
      g.fill();
      g.beginPath();
      g.ellipse(cxp + faceW * 0.98, headY + 0.6, 1.1, 1.8, -0.1, 0, 6.283);
      g.fill();
    } else {
      // 侧面：一只眼 + 突出的鼻梁 + 唇线
      drawEye(cxp + Math.max(1.5, faceW * 0.34), headY + 0.5, 1.05);
      g.strokeStyle = 'rgba(60,45,40,0.6)';
      g.lineWidth = 0.66;
      g.beginPath();
      g.moveTo(cxp + faceW * 0.05, headY - 2.2);
      g.quadraticCurveTo(cxp + faceW * 0.45, headY - 2.9,
        cxp + faceW * 0.72, headY - 2.0);
      g.stroke();
      // 鼻梁（凸出）
      g.fillStyle = skin;
      g.beginPath();
      g.moveTo(cxp + faceW * 0.66, headY - 1.6);
      g.quadraticCurveTo(cxp + faceW * 1.28, headY + 2.0,
        cxp + faceW * 0.92, headY + 3.3);
      g.quadraticCurveTo(cxp + faceW * 0.82, headY + 2.2,
        cxp + faceW * 0.64, headY + 2.6);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(150,100,75,0.35)';
      g.beginPath();
      g.ellipse(cxp + faceW * 0.86, headY + 3.1, 0.55, 0.34, 0, 0, 6.283);
      g.fill();
      // 唇
      g.strokeStyle = 'rgba(150,80,70,0.66)';
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(cxp + faceW * 0.52, headY + 4.5);
      g.quadraticCurveTo(cxp + faceW * 0.78, headY + 4.7,
        cxp + faceW * 0.9, headY + 4.4);
      g.stroke();
      // 耳
      g.fillStyle = skinShade;
      g.beginPath();
      g.ellipse(cxp - faceW * 0.15, headY + 0.8, 1.0, 1.7, 0.1, 0, 6.283);
      g.fill();
    }
    g.restore();

    // 刘海（三缕，带体积与分缝）
    const bangDrop = (1 - D.faceShow) * 3.0;
    g.fillStyle = hairCol;
    g.beginPath();
    g.moveTo(cxp - 7.0, headY - 1.0 + bangDrop * 0.2);
    g.quadraticCurveTo(cxp - 5.2, headY - 6.4, cxp - 1.4, headY - 6.9);
    g.quadraticCurveTo(cxp + 2.6, headY - 6.6, cxp + 4.4, headY - 3.4 + bangDrop * 0.7);
    g.quadraticCurveTo(cxp + 2.0, headY - 4.6, cxp + 0.2, headY - 4.2);
    g.quadraticCurveTo(cxp - 2.4, headY - 4.0, cxp - 4.0, headY - 1.4 + bangDrop * 0.5);
    g.quadraticCurveTo(cxp - 5.6, headY - 3.0, cxp - 7.0, headY - 1.0 + bangDrop * 0.2);
    g.closePath();
    g.fill();
    // 发丝高光
    g.strokeStyle = 'rgba(255,255,255,0.13)';
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(cxp - 4.4, headY - 5.4);
    g.quadraticCurveTo(cxp - 1.0, headY - 6.4, cxp + 1.6, headY - 5.0);
    g.stroke();
    g.beginPath();
    g.moveTo(cxp - 5.6, headY - 3.4);
    g.quadraticCurveTo(cxp - 3.0, headY - 4.8, cxp - 1.2, headY - 4.3);
    g.stroke();

    // 发带
    g.strokeStyle = sashCol;
    g.lineWidth = 1.25;
    g.beginPath();
    g.moveTo(-7.2, headY - 3.2);
    g.quadraticCurveTo(0, headY - 6.6, 7.2, headY - 3.4);
    g.stroke();
    // 发带尾
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-7.0, headY - 3.2);
    g.quadraticCurveTo(-8.6, headY + 1.0 - swapSway(t, moving), -7.0, headY + 5.0);
    g.stroke();
  } else {
    /* -------- 完全背对：后脑勺与发缝 -------- */
    g.strokeStyle = 'rgba(255,255,255,0.12)';
    g.lineWidth = 0.9;
    g.beginPath(); g.arc(-2.4, headY - 1.8, 6.2, 2.4, 4.6); g.stroke();
    g.beginPath(); g.arc(2.4, headY - 1.8, 6.2, 3.7, 5.9); g.stroke();
    // 发缝
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(0, headY - 7.4);
    g.quadraticCurveTo(0.6, headY - 2, 0, headY + 3);
    g.stroke();
    // 耳朵（背面只露一点）
    g.fillStyle = skinShade;
    g.beginPath(); g.ellipse(-7.2, headY + 0.8, 1.0, 1.6, 0, 0, 6.283); g.fill();
    g.beginPath(); g.ellipse(7.2, headY + 0.8, 1.0, 1.6, 0, 0, 6.283); g.fill();
    g.strokeStyle = sashCol;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-7.2, headY - 3.4);
    g.quadraticCurveTo(0, headY - 6.8, 7.2, headY - 3.6);
    g.stroke();
  }

  g.restore();
}

/* 发带/衣角的随风摆动 */
function swapSway(t, moving) {
  return (Math.sin(t * 2.2) * 0.9 + (moving ? Math.sin(t * 8) * 0.7 : 0));
}

/* ============================== 怪物 ============================== */

function drawMonster(g, m, time) {
  const def = MONSTERS[m.type];
  if (def && def.human) { drawHumanEnemy(g, m, time, def); return; }
  const s = def.size || 1;
  const bob = Math.sin(time * 3 + m.phase) * 0.8;
  const flip = m.facing && Math.cos(m.facing) < 0 ? -1 : 1;

  g.save();
  g.translate(m.x, m.y);

  g.fillStyle = 'rgba(20,16,14,0.28)';
  g.beginPath();
  g.ellipse(0, 0, 15 * s, 5 * s, 0, 0, 6.283);
  g.fill();

  if (def.ghost) {
    // 幽魂：飘浮，下摆成雾
    g.translate(0, -8 + bob * 2);
    const grd = g.createLinearGradient(0, -30 * s, 0, 14 * s);
    grd.addColorStop(0, 'rgba(200,245,255,0.92)');
    grd.addColorStop(0.6, 'rgba(130,215,240,0.55)');
    grd.addColorStop(1, 'rgba(120,200,235,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, -30 * s);
    g.quadraticCurveTo(13 * s, -24 * s, 11 * s, -4 * s);
    g.quadraticCurveTo(6 * s, 10 * s, 0, 16 * s);
    g.quadraticCurveTo(-6 * s, 10 * s, -11 * s, -4 * s);
    g.quadraticCurveTo(-13 * s, -24 * s, 0, -30 * s);
    g.closePath();
    g.fill();
    // 眼
    g.fillStyle = '#0d2733';
    g.beginPath(); g.ellipse(-4 * s, -20 * s, 1.9 * s, 2.6 * s, 0, 0, 6.283); g.fill();
    g.beginPath(); g.ellipse(4 * s, -20 * s, 1.9 * s, 2.6 * s, 0, 0, 6.283); g.fill();
  } else if (m.type === 'wolf') {
    g.scale(flip, 1);
    g.translate(0, bob * 0.5);
    // 腿
    g.strokeStyle = def.body;
    g.lineWidth = 3.4 * s;
    g.lineCap = 'round';
    const gait = Math.sin(time * 8 + m.phase) * 3;
    for (const lx of [-8, -3, 4, 9]) {
      g.beginPath();
      g.moveTo(lx * s, -12 * s);
      g.lineTo(lx * s + (lx < 0 ? gait : -gait), -1);
      g.stroke();
    }
    // 身
    g.fillStyle = def.body;
    g.beginPath();
    g.ellipse(0, -18 * s, 15 * s, 9 * s, 0, 0, 6.283);
    g.fill();
    g.fillStyle = def.belly;
    g.beginPath();
    g.ellipse(0, -14 * s, 11 * s, 5 * s, 0, 0, 6.283);
    g.fill();
    // 头
    g.fillStyle = def.body;
    g.beginPath();
    g.ellipse(13 * s, -24 * s, 8 * s, 7 * s, 0, 0, 6.283);
    g.fill();
    // 吻
    g.beginPath();
    g.moveTo(18 * s, -24 * s);
    g.lineTo(25 * s, -21 * s);
    g.lineTo(18 * s, -18 * s);
    g.closePath();
    g.fill();
    // 耳
    g.beginPath();
    g.moveTo(10 * s, -30 * s);
    g.lineTo(12 * s, -37 * s);
    g.lineTo(16 * s, -30 * s);
    g.closePath();
    g.fill();
    // 眼
    g.fillStyle = def.eye;
    g.beginPath(); g.arc(15 * s, -26 * s, 1.7 * s, 0, 6.283); g.fill();
    // 尾
    g.strokeStyle = def.body;
    g.lineWidth = 3.6 * s;
    g.beginPath();
    g.moveTo(-14 * s, -21 * s);
    g.quadraticCurveTo(-24 * s, -26 * s + Math.sin(time * 4 + m.phase) * 3, -26 * s, -16 * s);
    g.stroke();
  } else if (m.type === 'golem') {
    g.scale(flip, 1);
    g.translate(0, bob * 0.3);
    g.fillStyle = def.body;
    g.beginPath(); rr(g, -14 * s, -36 * s, 28 * s, 30 * s, 6 * s); g.fill();
    g.fillStyle = def.belly;
    g.beginPath(); rr(g, -9 * s, -32 * s, 18 * s, 14 * s, 4 * s); g.fill();
    // 手臂
    g.fillStyle = def.body;
    g.beginPath(); rr(g, -22 * s, -34 * s, 9 * s, 24 * s, 4 * s); g.fill();
    g.beginPath(); rr(g, 13 * s, -34 * s, 9 * s, 24 * s, 4 * s); g.fill();
    // 腿
    g.beginPath(); rr(g, -11 * s, -8 * s, 9 * s, 9 * s, 3 * s); g.fill();
    g.beginPath(); rr(g, 2 * s, -8 * s, 9 * s, 9 * s, 3 * s); g.fill();
    // 核心
    g.fillStyle = def.eye;
    g.beginPath(); g.arc(0, -24 * s, 4 * s, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.arc(-1 * s, -25 * s, 1.4 * s, 0, 6.283); g.fill();
    // 裂纹
    g.strokeStyle = 'rgba(140,230,255,0.5)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-10 * s, -12 * s); g.lineTo(-4 * s, -18 * s); g.lineTo(-8 * s, -24 * s);
    g.stroke();
  } else {
    // 山魈：壮实的人形
    g.scale(flip, 1);
    g.translate(0, bob * 0.4);
    g.fillStyle = def.body;
    g.beginPath(); rr(g, -11 * s, -32 * s, 22 * s, 26 * s, 8 * s); g.fill();
    g.fillStyle = def.belly;
    g.beginPath(); rr(g, -7 * s, -26 * s, 14 * s, 16 * s, 6 * s); g.fill();
    // 长臂
    g.fillStyle = def.body;
    const sw = Math.sin(time * 5 + m.phase) * 3;
    g.beginPath(); rr(g, -19 * s, -30 * s + sw, 8 * s, 26 * s, 4 * s); g.fill();
    g.beginPath(); rr(g, 11 * s, -30 * s - sw, 8 * s, 26 * s, 4 * s); g.fill();
    // 腿
    g.beginPath(); rr(g, -9 * s, -8 * s, 8 * s, 9 * s, 3 * s); g.fill();
    g.beginPath(); rr(g, 1 * s, -8 * s, 8 * s, 9 * s, 3 * s); g.fill();
    // 头
    g.beginPath(); g.arc(0, -36 * s, 8 * s, 0, 6.283); g.fill();
    g.fillStyle = def.eye;
    g.beginPath(); g.arc(-3 * s, -37 * s, 1.6 * s, 0, 6.283); g.fill();
    g.beginPath(); g.arc(3 * s, -37 * s, 1.6 * s, 0, 6.283); g.fill();
    // 獠牙
    g.fillStyle = '#f0e8dc';
    g.beginPath();
    g.moveTo(-4 * s, -32 * s); g.lineTo(-2.4 * s, -29 * s); g.lineTo(-1 * s, -32 * s);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(4 * s, -32 * s); g.lineTo(2.4 * s, -29 * s); g.lineTo(1 * s, -32 * s);
    g.closePath(); g.fill();
  }

  // 受击闪白
  if (m.flash > 0) {
    g.globalAlpha = Math.min(0.75, m.flash * 2.4);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(0, -20 * s, 24 * s, 0, 6.283);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  g.restore();
}

/* ============================== 特效 ============================== */

function drawEffects(g, effects, time) {
  for (const e of effects) {
    const k = e.life / e.maxLife;         // 1 → 0
    const a = Math.max(0, Math.min(1, k));

    if (e.type === 'slash') {
      g.save();
      g.translate(e.x, e.y);
      g.rotate(e.angle);
      const p = 1 - k;
      const sweep = -e.arc / 2 + e.arc * p;
      g.strokeStyle = e.color || 'rgba(210,240,255,';
      g.globalAlpha = a * 0.9;
      g.lineWidth = e.w || 4;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(0, 0, e.r, sweep - e.arc * 0.42, sweep + 0.08);
      g.stroke();
      g.globalAlpha = a * 0.35;
      g.lineWidth = (e.w || 4) * 2.6;
      g.beginPath();
      g.arc(0, 0, e.r, sweep - e.arc * 0.32, sweep + 0.04);
      g.stroke();
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'ring') {
      g.save();
      g.translate(e.x, e.y);
      const r = e.r * (0.35 + (1 - k) * 0.75);
      g.strokeStyle = e.color || 'rgba(255,220,160,';
      g.globalAlpha = a * 0.8;
      g.lineWidth = 3 + (1 - k) * 7;
      g.beginPath(); g.ellipse(0, 0, r, r * 0.42, 0, 0, 6.283); g.stroke();
      g.globalAlpha = a * 0.3;
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, 0, r * 0.7, r * 0.3, 0, 0, 6.283); g.stroke();
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'proj') {
      g.save();
      g.translate(e.x, e.y);
      g.rotate(e.angle);
      const grd = g.createRadialGradient(0, 0, 1, 0, 0, e.w * 1.6);
      grd.addColorStop(0, e.color || 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.4, e.color2 || 'rgba(140,210,255,0.75)');
      grd.addColorStop(1, 'rgba(90,160,230,0)');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(0, 0, e.w * 1.7, e.h * 1.7, 0, 0, 6.283); g.fill();
      g.fillStyle = '#ffffff';
      g.globalAlpha = a;
      g.beginPath(); g.ellipse(0, 0, e.w * 0.42, e.h * 0.42, 0, 0, 6.283); g.fill();
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'strike') {
      // 落雷：先画预警圈，再劈落
      g.save();
      g.translate(e.x, e.y);
      if (e.delay > 0) {
        g.strokeStyle = 'rgba(190,160,255,0.65)';
        g.lineWidth = 2;
        g.beginPath(); g.ellipse(0, 0, e.r, e.r * 0.42, 0, 0, 6.283); g.stroke();
        g.fillStyle = 'rgba(190,160,255,0.12)';
        g.beginPath(); g.ellipse(0, 0, e.r, e.r * 0.42, 0, 0, 6.283); g.fill();
      } else {
        g.globalAlpha = a;
        g.strokeStyle = 'rgba(225,205,255,0.95)';
        g.lineWidth = 5;
        g.beginPath();
        let lx = 0;
        g.moveTo(0, -280);
        for (let i = 1; i <= 6; i++) {
          lx = (Math.random() - 0.5) * 34;
          g.lineTo(lx, -280 + i * 46);
        }
        g.stroke();
        g.fillStyle = 'rgba(200,175,255,0.4)';
        g.beginPath(); g.ellipse(0, 0, e.r, e.r * 0.45, 0, 0, 6.283); g.fill();
        g.globalAlpha = 1;
      }
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'dmg') {
      g.save();
      g.globalAlpha = a;
      g.font = 'bold ' + (e.big ? 20 : 15) + 'px "STKaiti","KaiTi",serif';
      g.textAlign = 'center';
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(20,14,10,0.8)';
      g.strokeText(e.text, e.x, e.y);
      g.fillStyle = e.color || '#ffe9a8';
      g.fillText(e.text, e.x, e.y);
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'spark') {
      g.save();
      g.globalAlpha = a;
      g.fillStyle = e.color || '#fff0c0';
      g.beginPath();
      g.arc(e.x, e.y, e.r * k, 0, 6.283);
      g.fill();
      g.restore();
      g.globalAlpha = 1;
    } else if (e.type === 'heal') {
      g.save();
      g.translate(e.x, e.y);
      g.globalAlpha = a * 0.85;
      g.strokeStyle = 'rgba(150,255,190,0.9)';
      g.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        const rr2 = e.r * (0.3 + i * 0.24) * (0.6 + (1 - k) * 0.6);
        g.beginPath(); g.ellipse(0, 0, rr2, rr2 * 0.4, 0, 0, 6.283); g.stroke();
      }
      g.restore();
      g.globalAlpha = 1;
    }
  }
}

/* ============================== 物件 ============================== */

function ensureTreeDetail(o) {
  if (o.blobs) return o.blobs;
  const rnd = makeRng(o.seed || 1);
  const blobs = [];
  const n = 4 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    blobs.push({
      dx: (rnd() - 0.5) * 26,
      dy: (rnd() - 0.5) * 16 - 4,
      r: 8 + rnd() * 8,
      light: rnd()
    });
  }
  o.blobs = blobs;
  return blobs;
}

function drawTree(g, o, time) {
  const s = o.s;
  const sway = Math.sin(time * 1.15 + o.phase) * 1.5;
  const blobs = ensureTreeDetail(o);

  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,40,20,0.22)';
  g.beginPath();
  g.ellipse(0, 0, 15 * s, 5 * s, 0, 0, 6.283);
  g.fill();

  const topX = sway * 0.9;
  const topY = -42 * s;

  g.strokeStyle = '#5b4231';
  g.lineCap = 'round';
  g.lineWidth = 5.5 * s;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(sway * 0.25, -22 * s, topX, topY);
  g.stroke();
  g.strokeStyle = 'rgba(120,88,62,0.55)';
  g.lineWidth = 2 * s;
  g.beginPath();
  g.moveTo(-1.2 * s, -2 * s);
  g.quadraticCurveTo(sway * 0.2 - 1, -22 * s, topX - 1, topY);
  g.stroke();

  if (o.v === 'pine') {
    for (let i = 0; i < 3; i++) {
      const ly = topY + 12 * s + i * 13 * s;
      const lw = (13 + i * 6.5) * s;
      const lh = 22 * s;
      g.beginPath();
      g.moveTo(topX * (1 - i * 0.2) - lw, ly + lh * 0.45);
      g.quadraticCurveTo(topX * (1 - i * 0.2) - lw * 0.35, ly + lh * 0.1, topX * (1 - i * 0.2), ly - lh * 0.5);
      g.quadraticCurveTo(topX * (1 - i * 0.2) + lw * 0.35, ly + lh * 0.1, topX * (1 - i * 0.2) + lw, ly + lh * 0.45);
      g.quadraticCurveTo(topX * (1 - i * 0.2), ly + lh * 0.62, topX * (1 - i * 0.2) - lw, ly + lh * 0.45);
      g.closePath();
      const grd = g.createLinearGradient(-lw, ly, lw, ly + lh);
      grd.addColorStop(0, '#4d7a45');
      grd.addColorStop(0.45, '#39603a');
      grd.addColorStop(1, '#26452c');
      g.fillStyle = grd;
      g.fill();
      g.strokeStyle = 'rgba(20,40,24,0.35)';
      g.lineWidth = 0.8;
      g.stroke();
    }
  } else if (o.v === 'willow') {
    const cx0 = topX, cy0 = topY + 4 * s;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283;
      const sx = cx0 + Math.cos(a) * 12 * s;
      const sy = cy0 + Math.sin(a) * 6 * s;
      const len = (26 + (i % 3) * 9) * s;
      g.strokeStyle = i % 2 ? 'rgba(110,160,90,0.85)' : 'rgba(90,140,78,0.85)';
      g.lineWidth = 1.6 * s;
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(sx + 5 * s + sway * 0.6, sy + len * 0.55, sx - 2 * s + sway, sy + len);
      g.stroke();
    }
    g.fillStyle = '#5d8b52';
    g.beginPath();
    g.ellipse(cx0, cy0 - 2 * s, 13 * s, 8 * s, 0, 0, 6.283);
    g.fill();
  } else {
    const palette = o.v === 'blossom'
      ? ['#f0b8cd', '#e7a0bb', '#f7cfdd', '#dd90ae']
      : ['#4f8a46', '#3f7a3d', '#5f9c52', '#356b36'];
    for (const b of blobs) {
      const bx = topX + b.dx * s + sway * 0.35;
      const by = topY + 8 * s + b.dy * s;
      const r = b.r * s;
      g.beginPath();
      g.arc(bx, by, r, 0, 6.283);
      g.fillStyle = palette[Math.floor(b.light * palette.length) % palette.length];
      g.fill();
    }
    for (const b of blobs) {
      if (b.light < 0.45) continue;
      g.beginPath();
      g.arc(topX + b.dx * s + sway * 0.35 - b.r * 0.28 * s,
        topY + 8 * s + b.dy * s - b.r * 0.3 * s, b.r * 0.5 * s, 0, 6.283);
      g.fillStyle = 'rgba(255,255,255,0.13)';
      g.fill();
    }
    if (o.v === 'blossom') {
      const rnd = makeRng(o.seed + 5);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        g.arc(topX + (rnd() - 0.5) * 34 * s, topY + 8 * s + (rnd() - 0.5) * 22 * s, 1.1, 0, 6.283);
        g.fill();
      }
    }
  }
  g.restore();
}

function drawRock(g, o) {
  const s = o.s;
  const rnd = makeRng(o.seed || 3);
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.20)';
  g.beginPath(); g.ellipse(0, 0, 11 * s, 4 * s, 0, 0, 6.283); g.fill();
  const w = (9 + rnd() * 6) * s;
  const h = (7 + rnd() * 6) * s;
  g.beginPath();
  g.moveTo(-w, 0);
  g.lineTo(-w * 0.55, -h * 0.95);
  g.lineTo(w * 0.15, -h);
  g.lineTo(w * 0.85, -h * 0.5);
  g.lineTo(w, 0);
  g.closePath();
  const grd = g.createLinearGradient(-w, -h, w, 0);
  grd.addColorStop(0, '#a8aab2');
  grd.addColorStop(1, '#6d6e78');
  g.fillStyle = grd;
  g.fill();
  g.strokeStyle = 'rgba(50,50,60,0.4)';
  g.lineWidth = 0.8;
  g.stroke();
  g.restore();
}

function drawBush(g, o, time) {
  const s = o.s;
  const rnd = makeRng(o.seed || 5);
  const sway = Math.sin(time * 1.6 + (o.seed % 100) * 0.1) * 0.7;
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.16)';
  g.beginPath(); g.ellipse(0, 0, 9 * s, 3.4 * s, 0, 0, 6.283); g.fill();
  const cols = o.blossom
    ? ['#e79fbb', '#d98aa8', '#f0b8cd']
    : ['#456f3f', '#3b6136', '#538049'];
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc((rnd() - 0.5) * 16 * s + sway, -5 * s - rnd() * 6 * s, (4 + rnd() * 4) * s, 0, 6.283);
    g.fillStyle = cols[i % cols.length];
    g.fill();
  }
  g.restore();
}

function ensureMountainShape(o) {
  if (o.shape) return o.shape;
  const rnd = makeRng(o.seed || 7);
  const w = o.w, h = o.h;
  const pts = [
    [-w * 1.02, 0],
    [-w * 0.66, -h * (0.34 + rnd() * 0.14)],
    [-w * 0.38, -h * (0.62 + rnd() * 0.12)],
    [-w * 0.10, -h * (0.86 + rnd() * 0.10)],
    [w * 0.10, -h * (0.80 + rnd() * 0.16)],
    [w * 0.42, -h * (0.56 + rnd() * 0.14)],
    [w * 0.72, -h * (0.28 + rnd() * 0.14)],
    [w * 1.04, 0]
  ];
  o.shape = { pts, snowLine: -h * (0.52 + rnd() * 0.14) };
  return o.shape;
}

function drawMountain(g, o) {
  const shape = ensureMountainShape(o);
  const pts = shape.pts;
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(40,50,60,0.18)';
  g.beginPath(); g.ellipse(0, 0, o.w * 0.92, o.h * 0.09, 0, 0, 6.283); g.fill();

  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  const grd = g.createLinearGradient(-o.w, -o.h, o.w, 0);
  grd.addColorStop(0, '#9aa4b0');
  grd.addColorStop(0.42, '#77828f');
  grd.addColorStop(1, '#4f5a68');
  g.fillStyle = grd;
  g.fill();

  g.save();
  g.clip();
  g.strokeStyle = 'rgba(45,55,68,0.30)';
  g.lineWidth = 1.4;
  const rnd = makeRng(o.seed + 11);
  for (let i = 0; i < 7; i++) {
    const sx = (rnd() - 0.5) * o.w * 1.8;
    g.beginPath();
    g.moveTo(sx, 4);
    g.quadraticCurveTo(sx + (rnd() - 0.5) * 30, -o.h * 0.5, sx + (rnd() - 0.5) * 44, -o.h);
    g.stroke();
  }
  if (o.snowy) {
    const sl = shape.snowLine;
    g.beginPath();
    g.moveTo(-o.w * 1.2, sl);
    let x = -o.w * 1.2;
    while (x < o.w * 1.2) {
      const nx = x + 10 + rnd() * 14;
      g.lineTo(nx, sl - rnd() * 12);
      x = nx;
    }
    g.lineTo(o.w * 1.2, sl);
    g.lineTo(o.w * 1.2, -o.h * 1.5);
    g.lineTo(-o.w * 1.2, -o.h * 1.5);
    g.closePath();
    const sg = g.createLinearGradient(0, -o.h, 0, sl);
    sg.addColorStop(0, '#ffffff');
    sg.addColorStop(1, '#d3e2f0');
    g.fillStyle = sg;
    g.fill();
  }
  g.restore();

  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.strokeStyle = 'rgba(40,50,64,0.35)';
  g.lineWidth = 1.2;
  g.stroke();
  g.restore();
}

function drawLamp(g, o) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.22)';
  g.beginPath(); g.ellipse(0, 0, 9, 3.6, 0, 0, 6.283); g.fill();
  g.fillStyle = '#9a9689';
  g.beginPath(); rr(g, -7, -6, 14, 6, 2); g.fill();
  g.fillStyle = '#8b8779';
  g.fillRect(-3, -20, 6, 15);
  g.fillStyle = '#a8a496';
  g.beginPath(); rr(g, -7, -34, 14, 14, 2); g.fill();
  g.fillStyle = 'rgba(255,214,130,0.95)';
  g.fillRect(-4.5, -31.5, 9, 9);
  const gl = g.createRadialGradient(0, -27, 1, 0, -27, 26);
  gl.addColorStop(0, 'rgba(255,210,120,0.35)');
  gl.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = gl;
  g.beginPath(); g.arc(0, -27, 26, 0, 6.283); g.fill();
  g.fillStyle = '#7d796e';
  g.beginPath();
  g.moveTo(-10, -34); g.lineTo(0, -42); g.lineTo(10, -34);
  g.closePath();
  g.fill();
  g.restore();
}

function drawBanner(g, o, time) {
  const sway = Math.sin(time * 2.1 + o.phase) * 3;
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.2)';
  g.beginPath(); g.ellipse(0, 0, 7, 3, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#6b4f36';
  g.lineWidth = 3.2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -62); g.stroke();
  g.fillStyle = '#c8a24a';
  g.beginPath(); g.arc(0, -64, 3.4, 0, 6.283); g.fill();
  g.beginPath();
  g.moveTo(1.6, -58);
  g.quadraticCurveTo(16 + sway, -54, 13 + sway, -44);
  g.quadraticCurveTo(11 + sway, -34, 14 + sway, -26);
  g.lineTo(1.6, -30);
  g.closePath();
  const bg = g.createLinearGradient(0, -58, 16, -26);
  bg.addColorStop(0, '#b8453c');
  bg.addColorStop(1, '#8d2f2a');
  g.fillStyle = bg;
  g.fill();
  g.strokeStyle = 'rgba(255,220,150,0.5)';
  g.lineWidth = 1;
  g.stroke();
  g.restore();
}

function drawWell(g, o) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.22)';
  g.beginPath(); g.ellipse(0, 0, 15, 5.5, 0, 0, 6.283); g.fill();
  g.fillStyle = '#9d998c';
  g.beginPath(); g.ellipse(0, -6, 14, 8, 0, 0, 6.283); g.fill();
  g.fillStyle = '#7d7a6f';
  g.beginPath(); g.ellipse(0, -8, 10, 5.4, 0, 0, 6.283); g.fill();
  g.fillStyle = '#1e3f5c';
  g.beginPath(); g.ellipse(0, -8, 8, 4.2, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#6b4f36';
  g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-11, -8); g.lineTo(-11, -26); g.lineTo(11, -26); g.lineTo(11, -8); g.stroke();
  g.restore();
}

function drawFence(g, o) {
  g.save();
  g.translate(o.x, o.y);
  g.strokeStyle = '#8a6a48';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-TILE / 2, -12); g.lineTo(TILE / 2, -12);
  g.moveTo(-TILE / 2, -5); g.lineTo(TILE / 2, -5);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(-TILE / 2, 0); g.lineTo(-TILE / 2, -14); g.stroke();
  g.beginPath(); g.moveTo(TILE / 2, 0); g.lineTo(TILE / 2, -14); g.stroke();
  g.restore();
}

function drawCrop(g, o, time) {
  const sway = Math.sin(time * 2.2 + o.phase) * 1.4;
  g.save();
  g.translate(o.x, o.y);
  g.strokeStyle = '#7d9c46';
  g.lineWidth = 1.6;
  g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const dx = (i - 1.5) * 3.2;
    g.beginPath();
    g.moveTo(dx, 0);
    g.quadraticCurveTo(dx + sway * 0.5, -7 * o.s, dx + sway, -13 * o.s);
    g.stroke();
  }
  g.fillStyle = '#c8d47a';
  g.beginPath(); g.ellipse(sway, -13 * o.s, 3.2 * o.s, 2 * o.s, 0, 0, 6.283); g.fill();
  g.restore();
}

function drawCenser(g, o, time) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.24)';
  g.beginPath(); g.ellipse(0, 0, 20, 7, 0, 0, 6.283); g.fill();
  g.fillStyle = '#5d5344';
  for (const dx of [-11, 0, 11]) {
    g.beginPath(); rr(g, dx - 2.5, -10, 5, 11, 2); g.fill();
  }
  const bg = g.createLinearGradient(-18, -34, 18, -6);
  bg.addColorStop(0, '#b8a06a');
  bg.addColorStop(0.5, '#8a7442');
  bg.addColorStop(1, '#5d4c2c');
  g.fillStyle = bg;
  g.beginPath();
  g.moveTo(-17, -32);
  g.quadraticCurveTo(-19, -14, -9, -8);
  g.lineTo(9, -8);
  g.quadraticCurveTo(19, -14, 17, -32);
  g.closePath();
  g.fill();
  g.fillStyle = '#c9b078';
  g.beginPath(); g.ellipse(0, -33, 18, 6, 0, 0, 6.283); g.fill();
  g.fillStyle = '#3a3226';
  g.beginPath(); g.ellipse(0, -33, 14, 4.2, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#8a7442';
  g.lineWidth = 3;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(s * 19, -30, 5.5, s > 0 ? -1.2 : 1.9, s > 0 ? 1.2 : 4.4);
    g.stroke();
  }
  g.strokeStyle = 'rgba(40,32,18,0.35)';
  g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-14, -24); g.quadraticCurveTo(0, -19, 14, -24); g.stroke();
  for (let i = 0; i < 6; i++) {
    const p = ((time * 0.32 + i / 6) % 1);
    const y = -36 - p * 56;
    const x = Math.sin(time * 1.1 + i * 1.7 + p * 5) * (3 + p * 9);
    g.fillStyle = 'rgba(238,244,255,' + ((1 - p) * 0.28).toFixed(3) + ')';
    g.beginPath();
    g.arc(x, y, 2.5 + p * 9, 0, 6.283);
    g.fill();
  }
  g.restore();
}

function drawStela(g, o) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.3)';
  g.beginPath(); g.ellipse(0, 0, 20, 7, 0, 0, 6.283); g.fill();
  const grd = g.createLinearGradient(-14, -56, 14, 0);
  grd.addColorStop(0, '#9a9a94');
  grd.addColorStop(0.5, '#7d7d76');
  grd.addColorStop(1, '#5a5a54');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(-14, 0);
  g.lineTo(-13, -48);
  g.quadraticCurveTo(0, -60, 13, -48);
  g.lineTo(14, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(40,40,36,0.5)';
  g.lineWidth = 1.2;
  g.stroke();
  // 刻字
  g.fillStyle = 'rgba(230,225,205,0.55)';
  g.font = '9px "STKaiti","KaiTi",serif';
  g.textAlign = 'center';
  for (let i = 0; i < 4; i++) {
    g.fillText('道法自然'[i] || '', 0, -40 + i * 9);
  }
  g.restore();
}

function drawRune(g, o, time) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.26)';
  g.beginPath(); g.ellipse(0, 0, 11, 4, 0, 0, 6.283); g.fill();
  const grd = g.createLinearGradient(-8, -46, 8, 0);
  grd.addColorStop(0, '#8e8e98');
  grd.addColorStop(1, '#565660');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(-7, 0);
  g.lineTo(-6, -34);
  g.lineTo(0, -42);
  g.lineTo(6, -34);
  g.lineTo(7, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(150,225,255,' + (0.5 + Math.sin(time * 2 + o.seed) * 0.25).toFixed(3) + ')';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-2, -14); g.lineTo(2, -18); g.lineTo(-2, -24); g.lineTo(2, -28);
  g.stroke();
  g.restore();
}

function drawHerb(g, o, time) {
  const sway = Math.sin(time * 2 + o.phase) * 2;
  g.save();
  g.translate(o.x, o.y);
  const glow = g.createRadialGradient(0, -8, 1, 0, -8, 22);
  glow.addColorStop(0, 'rgba(180,255,200,0.28)');
  glow.addColorStop(1, 'rgba(150,255,190,0)');
  g.fillStyle = glow;
  g.beginPath(); g.arc(0, -8, 22, 0, 6.283); g.fill();

  g.strokeStyle = '#4f8a4a';
  g.lineWidth = 1.8;
  g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const dx = (i - 1) * 4;
    g.beginPath();
    g.moveTo(dx * 0.4, 0);
    g.quadraticCurveTo(dx + sway * 0.4, -8, dx * 1.6 + sway, -17);
    g.stroke();
  }
  g.fillStyle = '#bfe8a0';
  for (let i = 0; i < 3; i++) {
    const dx = (i - 1) * 6 + sway;
    g.beginPath();
    g.ellipse(dx, -18, 3.4, 2.2, 0.4, 0, 6.283);
    g.fill();
  }
  g.fillStyle = 'rgba(240,255,220,0.9)';
  g.beginPath(); g.arc(sway, -21, 2, 0, 6.283); g.fill();
  g.restore();
}

/* ------------------------------ 房屋 ------------------------------ */

const BUILDING_STYLE = {
  hall: { wall: 0.52, roof: 0.40, eave: 20, wallTop: '#f3ecdc', wallBot: '#d6c9ad', beam: '#9d3b34', col: '#8a2f2b', roofTop: '#7f8d9b', roofBot: '#3f4a58', ridge: '#9d3b34', plaque: '青云殿' },
  house: { wall: 0.56, roof: 0.40, eave: 12, wallTop: '#efe7d5', wallBot: '#d3c6aa', beam: '#7c583c', col: '#6b4a33', roofTop: '#6e7c8c', roofBot: '#3a4453', ridge: '#5a4a3c', plaque: '' },
  pavilion: { wall: 0.62, roof: 0.46, eave: 18, wallTop: '#f0e9d8', wallBot: '#d8cbb0', beam: '#9d3b34', col: '#8a2f2b', roofTop: '#7f8d9b', roofBot: '#414d5b', ridge: '#9d3b34', plaque: '' },
  gate: { wall: 0.60, roof: 0.34, eave: 16, wallTop: '#efe7d5', wallBot: '#d3c6aa', beam: '#9d3b34', col: '#8a2f2b', roofTop: '#7f8d9b', roofBot: '#3f4a58', ridge: '#9d3b34', plaque: '青云宗' }
};

function drawRoof(g, left, right, eaveY, width, roofH, eave, S, seed) {
  const midX = (left + right) / 2;
  const tipY = eaveY - Math.min(12, roofH * 0.32);
  const ridgeY = eaveY - roofH;
  const ridgeInset = Math.min(width * 0.22, 46);

  g.beginPath();
  g.moveTo(left - eave, tipY);
  g.quadraticCurveTo(midX, eaveY + 16, right + eave, tipY);
  g.lineTo(right - ridgeInset, ridgeY);
  g.quadraticCurveTo(midX, ridgeY - 6, left + ridgeInset, ridgeY);
  g.closePath();
  const grd = g.createLinearGradient(0, ridgeY, 0, eaveY + 14);
  grd.addColorStop(0, S.roofTop);
  grd.addColorStop(1, S.roofBot);
  g.fillStyle = grd;
  g.fill();

  g.save();
  g.clip();
  g.strokeStyle = 'rgba(20,28,38,0.20)';
  g.lineWidth = 1.4;
  const rnd = makeRng(seed || 3);
  for (let i = -1; i < 26; i++) {
    const t = i / 24;
    g.beginPath();
    g.moveTo(lerp(left + ridgeInset, right - ridgeInset, t), ridgeY - 4);
    g.lineTo(lerp(left - eave, right + eave, t), eaveY + 22);
    g.stroke();
  }
  // 横向瓦垄（弧线，让屋面有层叠感）
  g.strokeStyle = 'rgba(255,255,255,0.09)';
  g.lineWidth = 1.2;
  for (let r = 0; r < 5; r++) {
    const yy = ridgeY + (roofH * (r + 0.6)) / 5.6;
    const spread = (yy - ridgeY) / Math.max(1, roofH);
    g.beginPath();
    g.moveTo(left - eave * spread + ridgeInset * (1 - spread), yy);
    g.quadraticCurveTo(midX, yy + 6 * (1 - spread), right + eave * spread - ridgeInset * (1 - spread), yy);
    g.stroke();
  }
  g.strokeStyle = 'rgba(20,28,38,0.16)';
  g.lineWidth = 1;
  for (let r = 0; r < 5; r++) {
    const yy = ridgeY + (roofH * (r + 0.95)) / 5.6;
    const spread = (yy - ridgeY) / Math.max(1, roofH);
    g.beginPath();
    g.moveTo(left - eave * spread + ridgeInset * (1 - spread), yy);
    g.quadraticCurveTo(midX, yy + 6 * (1 - spread), right + eave * spread - ridgeInset * (1 - spread), yy);
    g.stroke();
  }
  g.strokeStyle = 'rgba(230,242,255,0.14)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(left + ridgeInset * 1.2, ridgeY + 4);
  g.lineTo(left - eave * 0.4, eaveY + 4);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    g.fillStyle = 'rgba(255,255,255,' + (0.02 + rnd() * 0.05).toFixed(3) + ')';
    g.fillRect(left - eave + rnd() * (width + eave * 2), ridgeY + rnd() * roofH, 20, 6);
  }
  g.restore();

  g.beginPath();
  g.moveTo(left - eave, tipY);
  g.quadraticCurveTo(midX, eaveY + 16, right + eave, tipY);
  g.strokeStyle = S.ridge;
  g.lineWidth = 4.5;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = 'rgba(255,225,170,0.35)';
  g.lineWidth = 1.4;
  g.stroke();

  g.beginPath();
  g.moveTo(left + ridgeInset, ridgeY);
  g.quadraticCurveTo(midX, ridgeY - 7, right - ridgeInset, ridgeY);
  g.strokeStyle = S.ridge;
  g.lineWidth = 6;
  g.stroke();

  g.fillStyle = S.ridge;
  for (const sgn of [-1, 1]) {
    const bx = sgn < 0 ? left + ridgeInset : right - ridgeInset;
    g.beginPath();
    g.moveTo(bx, ridgeY + 2);
    g.quadraticCurveTo(bx - sgn * 3, ridgeY - 12, bx - sgn * 11, ridgeY - 8);
    g.quadraticCurveTo(bx - sgn * 5, ridgeY - 6, bx - sgn * 4, ridgeY + 3);
    g.closePath();
    g.fill();
  }

  for (const sgn of [-1, 1]) {
    const lx = sgn < 0 ? left + width * 0.26 : right - width * 0.26;
    const ly = eaveY + 6;
    g.strokeStyle = 'rgba(60,40,30,0.7)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(lx, ly - 8); g.lineTo(lx, ly); g.stroke();
    const lg = g.createRadialGradient(lx, ly + 5, 1, lx, ly + 5, 14);
    lg.addColorStop(0, 'rgba(255,170,120,0.45)');
    lg.addColorStop(1, 'rgba(255,150,100,0)');
    g.fillStyle = lg;
    g.beginPath(); g.arc(lx, ly + 5, 14, 0, 6.283); g.fill();
    g.fillStyle = '#d94f42';
    g.beginPath(); g.ellipse(lx, ly + 5, 4.2, 5.2, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,220,170,0.8)';
    g.beginPath(); g.ellipse(lx - 1, ly + 3.5, 1.3, 2, 0, 0, 6.283); g.fill();
  }
}

function drawBuilding(g, b) {
  const S = BUILDING_STYLE[b.style] || BUILDING_STYLE.house;
  const left = b.tx * TILE;
  const right = (b.tx + b.tw) * TILE;
  const groundY = (b.ty + b.th) * TILE;
  const width = right - left;
  const wallH = Math.min(b.th * TILE * S.wall, 190);
  const roofH = Math.min(width * S.roof, 170);
  const eave = S.eave;
  const eaveY = groundY - wallH;

  g.fillStyle = 'rgba(20,26,18,0.22)';
  g.beginPath();
  g.ellipse(left + width / 2, groundY + 2, width * 0.56, Math.min(18, b.th * TILE * 0.12), 0, 0, 6.283);
  g.fill();

  g.fillStyle = '#a9a496';
  g.fillRect(left - 5, groundY - 10, width + 10, 14);
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.fillRect(left - 5, groundY - 10, width + 10, 2.5);
  g.fillStyle = 'rgba(60,58,50,0.22)';
  g.fillRect(left - 5, groundY + 1, width + 10, 3);

  if (b.style === 'pavilion') {
    const py0 = groundY - 10;
    g.fillStyle = '#a9a496';
    g.fillRect(left + 4, py0 - 4, width - 8, 8);
    for (const px of [left + 8, right - 8, left + width * 0.5]) {
      g.fillStyle = S.col;
      g.fillRect(px - 3, eaveY, 6, wallH + 2);
      g.fillStyle = 'rgba(255,200,160,0.22)';
      g.fillRect(px - 3, eaveY, 2, wallH + 2);
    }
    g.strokeStyle = S.col;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(left + 6, groundY - 22); g.lineTo(right - 6, groundY - 22);
    g.moveTo(left + 6, groundY - 14); g.lineTo(right - 6, groundY - 14);
    g.stroke();
    g.lineWidth = 2;
    for (let x = left + 6; x <= right - 6; x += 12) {
      g.beginPath(); g.moveTo(x, groundY - 26); g.lineTo(x, groundY - 10); g.stroke();
    }
    drawRoof(g, left + 6, right - 6, eaveY - 4, width - 12, roofH, eave, S, b.seed);
    return;
  }

  if (b.style === 'gate') {
    const pw = 26;
    g.fillStyle = S.col;
    g.fillRect(left + 4, eaveY, pw, wallH + 8);
    g.fillRect(right - 4 - pw, eaveY, pw, wallH + 8);
    g.fillStyle = 'rgba(255,200,160,0.20)';
    g.fillRect(left + 4, eaveY, 7, wallH + 8);
    g.fillRect(right - 4 - pw, eaveY, 7, wallH + 8);
    g.fillStyle = 'rgba(40,26,20,0.25)';
    g.fillRect(left + 4 + pw - 7, eaveY, 7, wallH + 8);
    g.fillRect(right - 11, eaveY, 7, wallH + 8);
    g.fillStyle = S.beam;
    g.fillRect(left + 4, eaveY + 6, width - 8, 16);
    g.fillStyle = 'rgba(255,220,160,0.25)';
    g.fillRect(left + 4, eaveY + 6, width - 8, 3);
    const plaqueW = Math.min(120, width * 0.5);
    g.fillStyle = '#3b2a22';
    g.fillRect(left + width / 2 - plaqueW / 2, eaveY + 26, plaqueW, 26);
    g.strokeStyle = '#c8a24a';
    g.lineWidth = 1.6;
    g.strokeRect(left + width / 2 - plaqueW / 2 + 2, eaveY + 28, plaqueW - 4, 22);
    g.fillStyle = '#f3dfae';
    g.font = '17px "STKaiti","KaiTi",serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(S.plaque || '山门', left + width / 2, eaveY + 40);
    drawRoof(g, left, right, eaveY, width, roofH, eave, S, b.seed);
    return;
  }

  const wallGrad = g.createLinearGradient(0, eaveY, 0, groundY);
  wallGrad.addColorStop(0, S.wallTop);
  wallGrad.addColorStop(1, S.wallBot);
  g.fillStyle = wallGrad;
  g.fillRect(left, eaveY - 2, width, wallH + 2);

  g.strokeStyle = 'rgba(150,130,100,0.12)';
  g.lineWidth = 1;
  for (let y = eaveY + 8; y < groundY - 4; y += 11) {
    g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke();
  }

  const colCount = Math.max(2, Math.round(width / 78));
  for (let i = 0; i <= colCount; i++) {
    const cx = left + (width * i) / colCount;
    const w = i === 0 || i === colCount ? 9 : 6;
    g.fillStyle = S.col;
    g.fillRect(cx - w / 2, eaveY - 2, w, wallH + 2);
    g.fillStyle = 'rgba(255,205,160,0.20)';
    g.fillRect(cx - w / 2, eaveY - 2, Math.max(2, w * 0.35), wallH + 2);
  }

  g.fillStyle = S.beam;
  g.fillRect(left, eaveY + 2, width, 11);
  g.fillStyle = 'rgba(255,225,170,0.22)';
  g.fillRect(left, eaveY + 2, width, 2);

  const doorW = Math.min(62, width * 0.3);
  const doorH = wallH * 0.62;
  const doorX = left + width / 2 - doorW / 2;
  g.fillStyle = '#4e3324';
  g.fillRect(doorX - 3, groundY - doorH, doorW + 6, doorH);
  const dg = g.createLinearGradient(doorX, groundY - doorH, doorX, groundY);
  dg.addColorStop(0, '#6b4630');
  dg.addColorStop(1, '#3d2618');
  g.fillStyle = dg;
  g.fillRect(doorX, groundY - doorH, doorW, doorH);
  g.strokeStyle = 'rgba(30,18,10,0.6)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(doorX + doorW / 2, groundY - doorH);
  g.lineTo(doorX + doorW / 2, groundY);
  g.stroke();
  g.fillStyle = '#c8a24a';
  g.beginPath(); g.arc(doorX + doorW / 2 - 5, groundY - doorH * 0.52, 1.8, 0, 6.283); g.fill();
  g.beginPath(); g.arc(doorX + doorW / 2 + 5, groundY - doorH * 0.52, 1.8, 0, 6.283); g.fill();
  g.fillStyle = S.beam;
  g.fillRect(doorX - 8, groundY - doorH - 8, doorW + 16, 7);

  const winW = Math.min(38, width * 0.17);
  const winH = wallH * 0.32;
  const winY = groundY - doorH * 0.92;
  for (const sgn of [-1, 1]) {
    const wx = left + width / 2 + sgn * (doorW / 2 + 16 + winW / 2);
    if (wx - winW / 2 < left + 12 || wx + winW / 2 > right - 12) continue;
    g.fillStyle = '#3b2618';
    g.fillRect(wx - winW / 2 - 2, winY - 2, winW + 4, winH + 4);
    const wgd = g.createLinearGradient(wx, winY, wx, winY + winH);
    wgd.addColorStop(0, '#f7e9bd');
    wgd.addColorStop(1, '#d9c48c');
    g.fillStyle = wgd;
    g.fillRect(wx - winW / 2, winY, winW, winH);
    g.strokeStyle = 'rgba(90,60,36,0.75)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(wx, winY); g.lineTo(wx, winY + winH);
    g.moveTo(wx - winW / 2, winY + winH / 2); g.lineTo(wx + winW / 2, winY + winH / 2);
    g.stroke();
  }

  if (S.plaque) {
    const pw = Math.min(140, width * 0.42);
    const py = eaveY + 18;
    g.fillStyle = '#3b2a22';
    g.fillRect(left + width / 2 - pw / 2, py, pw, 26);
    g.strokeStyle = '#c8a24a';
    g.lineWidth = 1.6;
    g.strokeRect(left + width / 2 - pw / 2 + 2, py + 2, pw - 4, 22);
    g.fillStyle = '#f3dfae';
    g.font = '17px "STKaiti","KaiTi",serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(S.plaque, left + width / 2, py + 14);
  }

  const sh = g.createLinearGradient(0, eaveY, 0, eaveY + 22);
  sh.addColorStop(0, 'rgba(20,26,36,0.28)');
  sh.addColorStop(1, 'rgba(20,26,36,0)');
  g.fillStyle = sh;
  g.fillRect(left, eaveY, width, 22);

  drawRoof(g, left, right, eaveY, width, roofH, eave, S, b.seed);
}

/* ============================ 物件派发 ============================ */

function drawObject(g, o, time) {
  switch (o.kind) {
    case 'building': drawBuilding(g, o); break;
    case 'tree': drawTree(g, o, time); break;
    case 'mountain': drawMountain(g, o); break;
    case 'rock': drawRock(g, o); break;
    case 'bush': drawBush(g, o, time); break;
    case 'lamp': drawLamp(g, o); break;
    case 'banner': drawBanner(g, o, time); break;
    case 'well': drawWell(g, o); break;
    case 'fence': drawFence(g, o); break;
    case 'crop': drawCrop(g, o, time); break;
    case 'censer': drawCenser(g, o, time); break;
    case 'stela': drawStela(g, o); break;
    case 'rune': drawRune(g, o, time); break;
    case 'signpost': drawSignpost(g, o, time); break;
    case 'smithy': drawSmithy(g, o, time); drawSiteMark(g, o, '铁匠铺', '255,176,102', time); break;
    case 'cauldron': drawCauldron(g, o, time); drawSiteMark(g, o, '炼丹炉', '150,240,180', time); break;
    case 'sectgate': drawSectGate(g, o, time); drawSiteMark(g, o, '青云宗', '150,220,255', time); break;
    case 'stele': drawStele(g, o, time, o.bound); break;
    case 'herb': drawHerb(g, o, time); break;
    case 'chest': drawChest(g, o, time); break;
    case 'drop': drawDrop(g, o, time); break;
    case 'npc':
      drawFigure(g, o.x, o.y, {
        t: time, facing: o.facing === undefined ? Math.PI / 2 : o.facing,
        moving: !!o.moving, phase: o.phase || 0,
        robe: o.def.robe, robeDark: o.def.robeDark, accent: o.def.accent,
        sash: o.def.sash, hair: o.def.hair, glow: o.def.glow,
        spriteKey: o.id,
        weapon: PATHS[o.def.path] ? PATHS[o.def.path].weapon : 'sword'
      });
      break;
    case 'monster': drawMonster(g, o, time); break;
    default: break;
  }
}

/* ============================== 称号悬浮徽章 ============================== */

/**
 * 角色头顶的称号：金属边小徽牌（参考王者荣耀称号风格）
 * 以 (x, y) 为徽牌底部的指示尖角处
 */
function drawTitlePlaque(g, x, y, ti, t) {
  if (!ti) return;
  const tier = Math.max(1, Math.min(10, ti.rare || 1));
  const rare = (typeof TITLE_RARE !== 'undefined')
    ? TITLE_RARE[tier - 1]
    : { c1: '#ffdf9a', c2: '#a8791c' };
  const c1 = rare.c1;
  const c2 = rare.c2;

  const float = Math.sin(t * 1.9) * 1.1;

  const text = ti.name || '';
  g.save();
  g.font = '11px "STKaiti","KaiTi",serif';
  let tw = 46;
  try { tw = g.measureText(text).width; } catch (e) { }
  const padX = 11;
  const W = Math.max(46, tw + padX * 2);
  const H = 17 + (tier >= 7 ? 2 : 0);
  const x0 = -W / 2;
  const y0 = -H - 6;      // 尖角占 6px

  g.translate(x, y + float);

  /* ---- 底部辉光（品阶越高越亮） ---- */
  const glowA = 0.18 + tier * 0.035;
  const bgl = g.createRadialGradient(0, 0, 1, 0, 0, W * (0.7 + tier * 0.02));
  bgl.addColorStop(0, hexA(c1, Math.min(0.6, glowA)));
  bgl.addColorStop(1, hexA(c1, 0));
  g.fillStyle = bgl;
  g.beginPath();
  g.ellipse(0, -2, W * 0.72, 16 + tier * 0.7, 0, 0, 6.283);
  g.fill();

  /* ---- 高品阶：顶部冠饰 ---- */
  if (tier >= 7) {
    const cw = 8 + tier * 0.9;
    g.beginPath();
    g.moveTo(-cw, y0 - 0.5);
    g.lineTo(-cw * 0.5, y0 - 5 - tier * 0.3);
    g.lineTo(0, y0 - 1.5);
    g.lineTo(cw * 0.5, y0 - 5 - tier * 0.3);
    g.lineTo(cw, y0 - 0.5);
    g.closePath();
    g.fillStyle = c1;
    if (g.shadowColor !== undefined) { g.shadowColor = hexA(c1, 0.9); g.shadowBlur = 8; }
    g.fill();
    if (g.shadowColor !== undefined) g.shadowBlur = 0;
  }

  /* ---- 指示尖角 ---- */
  g.beginPath();
  g.moveTo(-4.5, y0 + H - 0.5);
  g.lineTo(0, 0);
  g.lineTo(4.5, y0 + H - 0.5);
  g.closePath();
  g.fillStyle = 'rgba(12,16,24,0.94)';
  g.fill();
  g.strokeStyle = hexA(c1, 0.85);
  g.lineWidth = 1;
  g.stroke();

  /* ---- 圆角牌面路径 ---- */
  const plate = () => {
    g.beginPath();
    if (g.roundRect) { g.roundRect(x0, y0, W, H, 4); return; }
    const r = 4;
    g.moveTo(x0 + r, y0);
    g.arcTo(x0 + W, y0, x0 + W, y0 + H, r);
    g.arcTo(x0 + W, y0 + H, x0, y0 + H, r);
    g.arcTo(x0, y0 + H, x0, y0, r);
    g.arcTo(x0, y0, x0 + W, y0, r);
    g.closePath();
  };

  /* ---- 牌面填充（带外发光） ---- */
  g.save();
  if (g.shadowColor !== undefined) {
    g.shadowColor = hexA(c1, 0.9);
    g.shadowBlur = 6 + tier * 1.2;
  }
  plate();
  const pg = g.createLinearGradient(x0, y0, x0 + W, y0 + H);
  pg.addColorStop(0, 'rgba(18,24,34,0.95)');
  pg.addColorStop(0.5, 'rgba(30,40,54,0.96)');
  pg.addColorStop(1, 'rgba(14,19,28,0.95)');
  g.fillStyle = pg;
  g.fill();
  g.restore();

  /* ---- 双层金属描边（品阶越高越粗） ---- */
  plate();
  g.strokeStyle = hexA(c2, 0.95);
  g.lineWidth = 1.4 + tier * 0.14;
  g.stroke();

  g.save();
  plate();
  g.clip();
  plate();
  g.strokeStyle = hexA(c1, 0.9);
  g.lineWidth = 0.8 + tier * 0.08;
  g.stroke();
  // 两端斜切装饰
  g.strokeStyle = hexA(c1, 0.5);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x0 + 3, y0 + H - 3.5);
  g.lineTo(x0 + 3 + 7, y0 + 3.5);
  g.moveTo(x0 + W - 3, y0 + H - 3.5);
  g.lineTo(x0 + W - 3 - 7, y0 + 3.5);
  g.stroke();
  g.restore();

  /* ---- 四角菱形（高品阶更大更亮） ---- */
  const ornS = 1.4 + tier * 0.13;
  const orn = (ox, oy) => {
    g.save();
    g.translate(ox, oy);
    g.rotate(Math.PI / 4);
    g.fillStyle = c1;
    if (g.shadowColor !== undefined) { g.shadowColor = hexA(c1, 0.9); g.shadowBlur = tier >= 4 ? 6 : 0; }
    g.fillRect(-ornS, -ornS, ornS * 2, ornS * 2);
    g.restore();
  };
  if (tier >= 3) {
    orn(x0 + 1.2, y0 + 1.2);
    orn(x0 + W - 1.2, y0 + 1.2);
    orn(x0 + 1.2, y0 + H - 1.2);
    orn(x0 + W - 1.2, y0 + H - 1.2);
  }

  /* ---- 称号文字 ---- */
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = (tier >= 7 ? '600 11.5px' : '11px') + ' "STKaiti","KaiTi",serif';
  if (g.shadowColor !== undefined) {
    g.shadowColor = hexA(c1, 0.95);
    g.shadowBlur = 6 + tier;
  }
  g.fillStyle = tier >= 9 ? '#ffffff' : c1;
  g.fillText(text, 0, y0 + H / 2 + 0.5);
  if (g.shadowColor !== undefined) g.shadowBlur = 0;

  /* ---- 底缘品阶刻度（越稀有越多格） ---- */
  const pips = Math.min(5, Math.ceil(tier / 2));
  const pw = 3.2, gap = 2.2;
  const totalW = pips * pw + (pips - 1) * gap;
  g.fillStyle = hexA(c1, 0.85);
  for (let i = 0; i < pips; i++) {
    const px = -totalW / 2 + i * (pw + gap);
    g.fillRect(px, y0 + H - 2.6, pw, 1.2);
  }

  g.restore();
}

function hexA(hex, a) {
  const s = String(hex || '#ffffff').replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

/* ============================== 花瓣 ============================== */

function drawPetals(g, petals) {
  for (const p of petals) {
    if (p.a <= 0.01) continue;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.globalAlpha = p.a;
    g.fillStyle = p.color;
    g.beginPath();
    g.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.283);
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

/* ============================ 水墨 CG ============================ */

const CG_PALETTE = {
  village: { sky0: '#1d2e3c', sky1: '#3f5866', fog: 'rgba(200,220,235,', mtn: '#26404e', mtn2: '#3a5768', moon: '#f5e7c0' },
  valley: { sky0: '#3a1f1c', sky1: '#8a3a26', fog: 'rgba(255,190,150,', mtn: '#2e1a18', mtn2: '#4d2a22', moon: '#ffb070' },
  forest: { sky0: '#0f1f1c', sky1: '#20463c', fog: 'rgba(180,240,220,', mtn: '#12302a', mtn2: '#1c443a', moon: '#a8f0d0' },
  peak: { sky0: '#101a2c', sky1: '#2a3f66', fog: 'rgba(210,230,255,', mtn: '#1a2740', mtn2: '#2b3d5c', moon: '#dfeaff' }
};

/** 在给定 canvas 上绘制一张水墨风格剧情图 */
function drawCGScene(canvas, mapId, time) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  if (!W || !H) return;                       // 画布尺寸为 0 时直接跳过，避免死循环
  const P = CG_PALETTE[mapId] || CG_PALETTE.village;

  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, P.sky0);
  sky.addColorStop(1, P.sky1);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // 月/日
  const mx = W * 0.74, my = H * 0.26, mr = Math.min(W, H) * 0.075;
  const mg = g.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 3);
  mg.addColorStop(0, P.moon);
  mg.addColorStop(0.12, P.moon);
  mg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = mg;
  g.beginPath(); g.arc(mx, my, mr * 3, 0, 6.283); g.fill();

  // 远山三层
  const layers = [
    { y: H * 0.62, amp: H * 0.13, col: P.mtn2, n: 5, seed: 11 },
    { y: H * 0.72, amp: H * 0.16, col: P.mtn, n: 6, seed: 27 },
    { y: H * 0.84, amp: H * 0.20, col: P.sky0, n: 4, seed: 43 }
  ];
  for (const L of layers) {
    const rnd = makeRng(L.seed);
    g.fillStyle = L.col;
    g.beginPath();
    g.moveTo(-10, H);
    g.lineTo(-10, L.y);
    let x = -10;
    while (x < W + 10) {
      const w = Math.max(8, W / L.n * (0.6 + rnd() * 0.8));
      const peakH = L.amp * (0.45 + rnd() * 0.9);
      g.quadraticCurveTo(x + w * 0.5, L.y - peakH, x + w, L.y + rnd() * L.amp * 0.2);
      x += w;
    }
    g.lineTo(W + 10, H);
    g.closePath();
    g.fill();
  }

  // 前景剪影
  g.fillStyle = 'rgba(6,10,12,0.92)';
  if (mapId === 'village') {
    // 屋舍剪影
    for (const [bx, bw, bh] of [[0.05, 0.16, 0.10], [0.24, 0.13, 0.08], [0.40, 0.10, 0.06]]) {
      const x = W * bx, w = W * bw, h = H * bh;
      g.beginPath();
      g.moveTo(x, H);
      g.lineTo(x, H - h);
      g.lineTo(x + w * 0.12, H - h);
      g.lineTo(x + w * 0.5, H - h * 1.75);
      g.lineTo(x + w * 0.88, H - h);
      g.lineTo(x + w, H - h);
      g.lineTo(x + w, H);
      g.closePath();
      g.fill();
    }
    // 灯笼
    g.fillStyle = 'rgba(230,140,90,0.75)';
    g.beginPath(); g.arc(W * 0.16, H * 0.80, 5, 0, 6.283); g.fill();
    // 松枝
    g.strokeStyle = 'rgba(6,10,12,0.92)';
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(W * 0.86, H);
    g.quadraticCurveTo(W * 0.9, H * 0.72, W * 0.99, H * 0.6);
    g.stroke();
  } else if (mapId === 'forest') {
    // 竹影
    g.strokeStyle = 'rgba(6,10,12,0.92)';
    for (let i = 0; i < 9; i++) {
      const x = W * (0.05 + i * 0.11);
      const w = 6 + (i % 3) * 3;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x, H);
      g.quadraticCurveTo(x + 8, H * 0.5, x - 4, -10);
      g.stroke();
      g.lineWidth = 3;
      for (let k = 0; k < 4; k++) {
        const ly = H * (0.2 + k * 0.18);
        g.beginPath();
        g.moveTo(x, ly);
        g.quadraticCurveTo(x + 26, ly - 10, x + 46, ly - 2);
        g.stroke();
      }
    }
  } else if (mapId === 'valley') {
    // 断崖
    g.beginPath();
    g.moveTo(0, H);
    g.lineTo(0, H * 0.5);
    g.lineTo(W * 0.12, H * 0.62);
    g.lineTo(W * 0.18, H);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(W, H);
    g.lineTo(W, H * 0.42);
    g.lineTo(W * 0.86, H * 0.6);
    g.lineTo(W * 0.8, H);
    g.closePath();
    g.fill();
  } else {
    // 冰峰与冰棱
    g.beginPath();
    g.moveTo(0, H);
    g.lineTo(0, H * 0.42);
    g.lineTo(W * 0.2, H * 0.58);
    g.lineTo(W * 0.3, H);
    g.closePath();
    g.fill();
    for (let i = 0; i < 12; i++) {
      const x = W * (0.05 + i * 0.085);
      const h = H * (0.1 + (i % 4) * 0.05);
      g.beginPath();
      g.moveTo(x, H);
      g.lineTo(x + 5, H - h);
      g.lineTo(x + 10, H);
      g.closePath();
      g.fill();
    }
  }

  // 雾带
  for (let i = 0; i < 3; i++) {
    const y = H * (0.55 + i * 0.14) + Math.sin(time * 0.4 + i) * 6;
    const fg = g.createLinearGradient(0, y - 40, 0, y + 50);
    fg.addColorStop(0, P.fog + '0)');
    fg.addColorStop(0.5, P.fog + (0.16 - i * 0.04).toFixed(3) + ')');
    fg.addColorStop(1, P.fog + '0)');
    g.fillStyle = fg;
    g.fillRect(0, y - 40, W, 90);
  }

  // 飘动粒子
  for (let i = 0; i < 26; i++) {
    const px = ((i * 137.5 + time * (12 + (i % 5) * 6)) % (W + 60)) - 30;
    const py = (i * 71.3 + Math.sin(time * 0.7 + i) * 18) % H;
    g.fillStyle = P.fog + (0.10 + (i % 3) * 0.06).toFixed(3) + ')';
    g.beginPath();
    g.arc(px, py, 1.4 + (i % 3), 0, 6.283);
    g.fill();
  }

  // 水墨暗角
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.72)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
}

/* ============================== 铁匠铺 ============================== */

function drawSmithy(g, o, time) {
  const s = o.s || 1;
  const x = o.x, y = o.y;
  const seed = o.seed || 1;
  g.save();
  g.translate(x, y);
  g.scale(s, s);

  // 影子
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath();
  g.ellipse(0, 2, 58, 14, 0, 0, 6.283);
  g.fill();

  // 石墙主体
  const w = 104, h = 66;
  const wg = g.createLinearGradient(-w / 2, -h, w / 2, 0);
  wg.addColorStop(0, '#8e8b84');
  wg.addColorStop(0.5, '#76736c');
  wg.addColorStop(1, '#5b5850');
  g.fillStyle = wg;
  rr(g, -w / 2, -h, w, h, 3);
  g.fill();

  // 石砖缝
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const yy = -h + 6 + row * 11;
    g.beginPath();
    g.moveTo(-w / 2, yy);
    g.lineTo(w / 2, yy);
    g.stroke();
    for (let col = 0; col < 7; col++) {
      const xx = -w / 2 + 8 + col * 15 + (row % 2) * 7;
      if (xx > w / 2 - 4) continue;
      g.beginPath();
      g.moveTo(xx, yy);
      g.lineTo(xx, yy + 11);
      g.stroke();
    }
  }

  // 屋顶（深色瓦 + 烟囱）
  const rg = g.createLinearGradient(0, -h - 40, 0, -h);
  rg.addColorStop(0, '#3b3a44');
  rg.addColorStop(1, '#26252d');
  g.fillStyle = rg;
  g.beginPath();
  g.moveTo(-w / 2 - 12, -h + 4);
  g.lineTo(0, -h - 40);
  g.lineTo(w / 2 + 12, -h + 4);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(150,150,170,0.35)';
  g.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) {
    const t2 = i / 5;
    g.beginPath();
    g.moveTo(-w / 2 - 12 + (w / 2 + 12) * t2, -h + 4 - 40 * t2);
    g.lineTo(w / 2 + 12 - (w / 2 + 12) * t2, -h + 4 - 40 * t2);
    g.stroke();
  }

  // 烟囱与烟
  g.fillStyle = '#4a4852';
  rr(g, 26, -h - 36, 14, 26, 2);
  g.fill();
  for (let i = 0; i < 4; i++) {
    const p = ((time * 0.35 + i * 0.25) % 1);
    const sy = -h - 40 - p * 54;
    const sx = 33 + Math.sin(p * 5 + i) * 9;
    g.fillStyle = 'rgba(190,190,200,' + (0.24 * (1 - p)).toFixed(3) + ')';
    g.beginPath();
    g.arc(sx, sy, 5 + p * 9, 0, 6.283);
    g.fill();
  }

  // 炉火门（发光）
  const flick = 0.7 + Math.sin(time * 7.3) * 0.3;
  g.save();
  g.shadowColor = 'rgba(255,150,60,0.9)';
  g.shadowBlur = 22 * flick;
  const dg = g.createRadialGradient(0, -16, 2, 0, -16, 26);
  dg.addColorStop(0, 'rgba(255,240,190,' + (0.95 * flick).toFixed(2) + ')');
  dg.addColorStop(0.45, 'rgba(255,150,50,0.8)');
  dg.addColorStop(1, 'rgba(120,40,10,0.1)');
  g.fillStyle = dg;
  g.beginPath();
  g.ellipse(0, -16, 20, 22, 0, 0, 6.283);
  g.fill();
  g.restore();

  // 门洞（可进入）
  g.fillStyle = '#181410';
  g.beginPath();
  g.moveTo(-13, 0);
  g.lineTo(-13, -30);
  g.quadraticCurveTo(0, -40, 13, -30);
  g.lineTo(13, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(220,170,90,0.6)';
  g.lineWidth = 1.6;
  g.stroke();

  // 招牌：锤与砧
  g.save();
  g.translate(-40, -h - 6);
  g.rotate(-0.06);
  g.fillStyle = '#5a3f24';
  rr(g, -20, -12, 40, 22, 2);
  g.fill();
  g.strokeStyle = '#c8a25a';
  g.lineWidth = 1.2;
  rr(g, -20, -12, 40, 22, 2);
  g.stroke();
  // 锤子图形
  g.strokeStyle = '#f0e2c0';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-6, 2);
  g.lineTo(4, -6);
  g.stroke();
  g.fillStyle = '#f0e2c0';
  rr(g, 3, -11, 10, 7, 1.5);
  g.fill();
  g.restore();

  // 门口铁砧
  g.save();
  g.translate(30, -4);
  g.fillStyle = '#4a4a52';
  g.beginPath();
  g.moveTo(-10, 0);
  g.lineTo(-7, -12);
  g.lineTo(8, -12);
  g.lineTo(12, -6);
  g.lineTo(6, -6);
  g.lineTo(6, 0);
  g.closePath();
  g.fill();
  g.fillStyle = '#63636d';
  rr(g, -12, -16, 26, 6, 2);
  g.fill();
  g.restore();

  // 火星
  for (let i = 0; i < 5; i++) {
    const p = ((time * (0.9 + i * 0.13) + i * 0.37) % 1);
    g.fillStyle = 'rgba(255,' + (150 + i * 15) + ',80,' + (0.85 * (1 - p)).toFixed(2) + ')';
    g.beginPath();
    g.arc(28 + Math.sin(p * 9 + i) * 10, -24 - p * 26, 1.4, 0, 6.283);
    g.fill();
  }

  g.restore();
}

/* ============================== 炼丹炉 ============================== */

function drawCauldron(g, o, time) {
  const s = o.s || 1;
  g.save();
  g.translate(o.x, o.y);
  g.scale(s, s);

  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath();
  g.ellipse(0, 2, 26, 8, 0, 0, 6.283);
  g.fill();

  // 三足
  g.strokeStyle = '#3d3228';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-11, -12); g.lineTo(-15, 1);
  g.moveTo(11, -12); g.lineTo(15, 1);
  g.moveTo(0, -12); g.lineTo(0, 3);
  g.stroke();

  // 炉身
  const bg = g.createLinearGradient(-20, -34, 20, -10);
  bg.addColorStop(0, '#8a6a3a');
  bg.addColorStop(0.45, '#5c4426');
  bg.addColorStop(1, '#33240f');
  g.fillStyle = bg;
  g.beginPath();
  g.moveTo(-20, -32);
  g.quadraticCurveTo(-24, -14, -10, -10);
  g.lineTo(10, -10);
  g.quadraticCurveTo(24, -14, 20, -32);
  g.closePath();
  g.fill();

  // 炉沿
  g.fillStyle = '#9c7a44';
  g.beginPath();
  g.ellipse(0, -32, 21, 7, 0, 0, 6.283);
  g.fill();
  g.fillStyle = '#2a1c0c';
  g.beginPath();
  g.ellipse(0, -32, 16, 5, 0, 0, 6.283);
  g.fill();

  // 炉中灵液
  const pulse = 0.6 + Math.sin(time * 2.6) * 0.4;
  g.save();
  g.shadowColor = 'rgba(150,255,200,0.9)';
  g.shadowBlur = 20 * pulse;
  const lg = g.createRadialGradient(0, -32, 1, 0, -32, 15);
  lg.addColorStop(0, 'rgba(230,255,240,' + (0.9 * pulse).toFixed(2) + ')');
  lg.addColorStop(0.5, 'rgba(120,240,180,0.75)');
  lg.addColorStop(1, 'rgba(40,120,90,0.1)');
  g.fillStyle = lg;
  g.beginPath();
  g.ellipse(0, -32, 15, 4.6, 0, 0, 6.283);
  g.fill();
  g.restore();

  // 蒸汽
  for (let i = 0; i < 4; i++) {
    const p = ((time * 0.42 + i * 0.27) % 1);
    g.fillStyle = 'rgba(200,255,225,' + (0.20 * (1 - p)).toFixed(3) + ')';
    g.beginPath();
    g.arc(Math.sin(p * 4 + i) * 8, -38 - p * 40, 4 + p * 9, 0, 6.283);
    g.fill();
  }

  // 符文环
  g.save();
  g.globalAlpha = 0.5 + 0.3 * Math.sin(time * 1.8);
  g.strokeStyle = 'rgba(160,255,210,0.85)';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0, -32, 23 + Math.sin(time * 2) * 1.5, 7.5, 0, 0, 6.283);
  g.stroke();
  g.restore();

  // 炉底火
  for (let i = 0; i < 6; i++) {
    const p = ((time * 2.1 + i * 0.31) % 1);
    g.fillStyle = 'rgba(255,' + (130 + i * 18) + ',60,' + (0.8 * (1 - p)).toFixed(2) + ')';
    g.beginPath();
    g.arc(Math.sin(time * 6 + i * 2) * 8, -6 - p * 12, 2.6, 0, 6.283);
    g.fill();
  }

  g.restore();
}

/* ============================== 宗 门 山 门 ============================== */

function drawSectGate(g, o, time) {
  const s = o.s || 1;
  g.save();
  g.translate(o.x, o.y);
  g.scale(s, s);

  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath();
  g.ellipse(0, 2, 44, 11, 0, 0, 6.283);
  g.fill();

  // 两根石柱
  for (const sx of [-30, 30]) {
    const pg = g.createLinearGradient(sx - 7, -80, sx + 7, 0);
    pg.addColorStop(0, '#cfcabb');
    pg.addColorStop(0.5, '#a8a294');
    pg.addColorStop(1, '#736e62');
    g.fillStyle = pg;
    rr(g, sx - 7, -78, 14, 78, 2);
    g.fill();
    g.strokeStyle = 'rgba(60,58,50,0.5)';
    g.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      g.beginPath();
      g.moveTo(sx - 7, -78 + i * 10);
      g.lineTo(sx + 7, -78 + i * 10);
      g.stroke();
    }
    // 柱基
    g.fillStyle = '#8a8478';
    rr(g, sx - 10, -4, 20, 8, 2);
    g.fill();
  }

  // 横梁
  const bg2 = g.createLinearGradient(-44, -92, 44, -76);
  bg2.addColorStop(0, '#b9b3a3');
  bg2.addColorStop(0.5, '#8e8879');
  bg2.addColorStop(1, '#6b665a');
  g.fillStyle = bg2;
  rr(g, -44, -92, 88, 13, 3);
  g.fill();
  // 檐角上翘
  g.beginPath();
  g.moveTo(-44, -92);
  g.quadraticCurveTo(-56, -96, -50, -84);
  g.lineTo(-44, -79);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(44, -92);
  g.quadraticCurveTo(56, -96, 50, -84);
  g.lineTo(44, -79);
  g.closePath();
  g.fill();

  // 匾额
  g.fillStyle = '#2f2a22';
  rr(g, -22, -89, 44, 10, 2);
  g.fill();
  g.strokeStyle = '#d9b45a';
  g.lineWidth = 1;
  rr(g, -22, -89, 44, 10, 2);
  g.stroke();
  // 匾上三横（简化“青云宗”）
  g.strokeStyle = '#f0e2c0';
  g.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(-16 + i * 12, -86);
    g.lineTo(-8 + i * 12, -86);
    g.stroke();
  }

  // 悬挂灯笼 / 灵光
  const glow = 0.55 + Math.sin(time * 1.4) * 0.35;
  g.save();
  g.shadowColor = 'rgba(150,230,255,0.9)';
  g.shadowBlur = 18 * glow;
  for (const lx of [-30, 30]) {
    g.fillStyle = 'rgba(190,240,255,0.85)';
    g.beginPath();
    g.arc(lx, -70, 4.2, 0, 6.283);
    g.fill();
  }
  g.restore();

  // 地面灵纹
  g.save();
  g.globalAlpha = 0.32 + 0.18 * Math.sin(time * 2);
  g.strokeStyle = 'rgba(150,220,255,0.9)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(0, 0, 36, 9, 0, 0, 6.283);
  g.stroke();
  g.beginPath();
  g.ellipse(0, 0, 24, 6, 0, 0, 6.283);
  g.stroke();
  g.restore();

  g.restore();
}

/* ============================== 人形对手（宗门弟子） ============================== */

function drawHumanEnemy(g, m, time, def) {
  const atk = m.flash > 0 ? 0.5 : 0;
  const moving = !!(m.moving || Math.hypot(m.knockX || 0, m.knockY || 0) > 8);
  g.save();
  try {
    drawFigure(g, m.x, m.y, {
      t: time, facing: m.facing === undefined ? Math.PI / 2 : m.facing,
      moving: moving, phase: (m.phase || 0) + time * 0.4,
      scale: (def.size || 1) * 1.06,
      robe: def.robe, robeDark: def.robeDark, accent: def.accent,
      sash: '#b8453c', hair: def.hair, glow: def.glow,
      weapon: def.weapon || 'sword',
      eye: def.eye,
      spriteKey: (m.type === 'sect_elder') ? 'npc_master' : null,
      attack: atk
    });
  } catch (e) { }
  g.restore();

  // 被打时的白闪
  if (m.flash > 0) {
    g.save();
    g.globalAlpha = Math.min(0.45, m.flash * 2);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,240,220,0.5)';
    g.beginPath();
    g.ellipse(m.x, m.y - 26, 16, 32, 0, 0, 6.283);
    g.fill();
    g.restore();
  }
}

/* ============================== 可交互建筑标记 ============================== */

function drawSiteMark(g, o, label, rgb, time) {
  const bob = Math.sin(time * 2.2 + (o.x || 0) * 0.01) * 2.4;
  const y = (o.sortY || o.y) - 92 + bob;
  const x = o.x;
  g.save();

  // 光柱
  const lg = g.createLinearGradient(x, y - 6, x, y + 34);
  lg.addColorStop(0, 'rgba(' + rgb + ',0)');
  lg.addColorStop(0.6, 'rgba(' + rgb + ',0.16)');
  lg.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = lg;
  g.beginPath();
  g.ellipse(x, y + 16, 13, 26, 0, 0, 6.283);
  g.fill();

  // 圆牌
  g.shadowColor = 'rgba(' + rgb + ',0.9)';
  g.shadowBlur = 12;
  g.fillStyle = 'rgba(10,16,24,0.9)';
  g.beginPath();
  g.arc(x, y, 8.5, 0, 6.283);
  g.fill();
  g.strokeStyle = 'rgba(' + rgb + ',0.95)';
  g.lineWidth = 1.6;
  g.stroke();
  g.shadowBlur = 0;

  // 内点
  g.fillStyle = 'rgba(' + rgb + ',1)';
  g.beginPath();
  g.arc(x, y, 3, 0, 6.283);
  g.fill();

  // 下方的指示三角
  g.beginPath();
  g.moveTo(x - 3.4, y + 9);
  g.lineTo(x, y + 14);
  g.lineTo(x + 3.4, y + 9);
  g.closePath();
  g.fillStyle = 'rgba(' + rgb + ',0.95)';
  g.fill();

  // 名称
  g.font = '10px "STKaiti","KaiTi",serif';
  g.textAlign = 'center';
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(6,10,16,0.85)';
  g.strokeText(label, x, y - 14);
  g.fillStyle = 'rgb(' + rgb + ')';
  g.fillText(label, x, y - 14);

  g.restore();
}