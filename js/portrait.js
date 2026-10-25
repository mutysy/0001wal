'use strict';

/* =========================================================================
   青云界 · 立绘系统
   半身立绘（280×380），每个角色按规格程序化绘制，带水墨背景与灵光
   ========================================================================= */

const PORTRAIT_W = 280;
const PORTRAIT_H = 380;

/* ------------------------------ 角色规格 ------------------------------ */

const PORTRAIT_SPECS = {
  /* ===== 玩家·剑修 ===== */
  p_sword: {
    name: '无涯子', title: '剑修',
    skin: '#f6dcc0', skinShade: '#d9b394', hair: '#2a2430', hairHi: '#4a4155',
    eye: '#7fc8ff', brow: 'sharp', age: 0.15, fem: false,
    hairStyle: 'highBun', beard: 'none', headwear: 'hairpin',
    robe: '#f7fbff', robeDark: '#c4d8ec', robeLight: '#ffffff',
    accent: '#5f9ad2', sash: '#b8453c', trim: '#8fc4ee',
    prop: 'sword', qi: 'rgba(150,220,255,', bg: 'cyan', emblem: '剑'
  },
  /* ===== 玩家·法修 ===== */
  p_mage: {
    name: '无涯子', title: '法修',
    skin: '#f7ddc4', skinShade: '#d9b394', hair: '#1d1a26', hairHi: '#3b3550',
    eye: '#b79bff', brow: 'thin', age: 0.1, fem: false,
    hairStyle: 'longLoose', beard: 'none', headwear: 'pin',
    robe: '#31496b', robeDark: '#20304a', robeLight: '#4d6d99',
    accent: '#9fd0ff', sash: '#6b8fc2', trim: '#a9c8ec',
    prop: 'staff', qi: 'rgba(170,190,255,', bg: 'violet', emblem: '符'
  },
  /* ===== 玩家·体修 ===== */
  p_body: {
    name: '无涯子', title: '体修',
    skin: '#e9c39a', skinShade: '#c49a72', hair: '#2b1f16', hairHi: '#4a3524',
    eye: '#ffb066', brow: 'thick', age: 0.2, fem: false,
    hairStyle: 'short', beard: 'stubble', headwear: 'headband',
    robe: '#8a4a33', robeDark: '#5d3020', robeLight: '#a86046',
    accent: '#e0a45c', sash: '#3d2a1e', trim: '#c98a4e',
    prop: 'fist', qi: 'rgba(255,180,110,', bg: 'amber', emblem: '拳'
  },
  /* ===== 玩家·丹修 ===== */
  p_alch: {
    name: '无涯子', title: '丹修',
    skin: '#fae0c8', skinShade: '#dcb69a', hair: '#241f2a', hairHi: '#443a4e',
    eye: '#8fe6b0', brow: 'soft', age: 0.12, fem: false,
    hairStyle: 'topknot', beard: 'none', headwear: 'pin',
    robe: '#eef7ee', robeDark: '#c2dbc6', robeLight: '#ffffff',
    accent: '#7fbb8a', sash: '#a86b3d', trim: '#a8d6b2',
    prop: 'gourd', qi: 'rgba(150,240,190,', bg: 'emerald', emblem: '丹'
  },

  /* ===== NPC·玄清子（执事） ===== */
  npc_master: {
    name: '玄清子', title: '青石村执事',
    skin: '#e8c9a8', skinShade: '#c9a27f', hair: '#cfcad6', hairHi: '#e8e4ee',
    eye: '#8a7fd6', brow: 'thin', age: 0.85, fem: false,
    hairStyle: 'topknot', beard: 'long', headwear: 'crown',
    robe: '#e9e7f2', robeDark: '#b8b3cc', robeLight: '#ffffff',
    accent: '#9b7fd0', sash: '#5f4d8a', trim: '#c9bce8',
    prop: 'whisk', qi: 'rgba(190,170,255,', bg: 'violet', emblem: '道'
  },
  /* ===== NPC·苏青萝（药庐） ===== */
  npc_alchemist: {
    name: '苏青萝', title: '药庐主人',
    skin: '#fbe3cd', skinShade: '#ddb99e', hair: '#2c2430', hairHi: '#4d4055',
    eye: '#7fdcb0', brow: 'soft', age: 0.05, fem: true,
    hairStyle: 'twinBun', beard: 'none', headwear: 'flower',
    robe: '#eaf6ea', robeDark: '#bfd9c2', robeLight: '#ffffff',
    accent: '#7fbb8a', sash: '#a86b3d', trim: '#a8d6b2',
    prop: 'mortar', qi: 'rgba(150,240,190,', bg: 'emerald', emblem: '药'
  },
  /* ===== NPC·雷九斤（铁匠） ===== */
  npc_smith: {
    name: '雷九斤', title: '铁匠 · 杂货',
    skin: '#d9a878', skinShade: '#b3825a', hair: '#20150e', hairHi: '#3d2b1c',
    eye: '#ff9a4a', brow: 'thick', age: 0.45, fem: false,
    hairStyle: 'bald', beard: 'stubble', headwear: 'none',
    robe: '#7a4a33', robeDark: '#4a2a1c', robeLight: '#9a5f42',
    accent: '#e0a45c', sash: '#3d2a1e', trim: '#c98a4e',
    prop: 'hammer', qi: 'rgba(255,160,90,', bg: 'amber', emblem: '铁'
  },
  /* ===== NPC·阿七（杂役） ===== */
  npc_young: {
    name: '阿七', title: '杂役弟子',
    skin: '#f6ddc5', skinShade: '#d8b79c', hair: '#2a2630', hairHi: '#463f52',
    eye: '#9fb8d8', brow: 'soft', age: 0.05, fem: false,
    hairStyle: 'short', beard: 'none', headwear: 'none',
    robe: '#dfe6ef', robeDark: '#b0bccb', robeLight: '#f6fafd',
    accent: '#8aa8c8', sash: '#8a8a99', trim: '#b9cbdd',
    prop: 'broom', qi: 'rgba(170,200,240,', bg: 'cyan', emblem: '役'
  },
  /* ===== NPC·柳翁（钓叟） ===== */
  npc_angler: {
    name: '柳翁', title: '湖畔钓叟',
    skin: '#e0c19c', skinShade: '#bf9d78', hair: '#d8d4c8', hairHi: '#efece2',
    eye: '#9fbfa8', brow: 'thin', age: 0.9, fem: false,
    hairStyle: 'longLoose', beard: 'goatee', headwear: 'hat',
    robe: '#cfd8cf', robeDark: '#9faa9f', robeLight: '#e8efe8',
    accent: '#7f9a7f', sash: '#6b5a45', trim: '#a8c0a8',
    prop: 'rod', qi: 'rgba(190,220,190,', bg: 'jade', emblem: '渔'
  },
  /* ===== NPC·李行舟（守山） ===== */
  npc_guard: {
    name: '李行舟', title: '守山弟子',
    skin: '#eecba6', skinShade: '#cba680', hair: '#232028', hairHi: '#413a4c',
    eye: '#7fc0e8', brow: 'sharp', age: 0.25, fem: false,
    hairStyle: 'highBun', beard: 'none', headwear: 'headband',
    robe: '#e6ecf4', robeDark: '#a9b8ca', robeLight: '#ffffff',
    accent: '#7f9ec4', sash: '#4a5a74', trim: '#a9c4e0',
    prop: 'spear', qi: 'rgba(150,190,255,', bg: 'cyan', emblem: '守'
  },

  /* ---------- 宗门弟子（车轮战对手） ---------- */
  sect_outer: {
    name: '外门弟子', title: '青云外门',
    skin: '#f2d3ae', skinShade: '#cfa982', hair: '#2a2630', hairHi: '#464050',
    eye: '#7fc8ff', brow: 'soft', age: 0.22, fem: false,
    hairStyle: 'topknot', beard: 'none', headwear: 'headband',
    robe: '#dfe6ef', robeDark: '#aebbcb', robeLight: '#ffffff',
    accent: '#7f9ec4', sash: '#4a5a74', trim: '#a9c4e0',
    prop: 'sword', qi: 'rgba(170,200,240,', bg: 'cyan', emblem: '外'
  },
  sect_inner: {
    name: '内门弟子', title: '青云内门',
    skin: '#f6dcc0', skinShade: '#d9b394', hair: '#1c1c26', hairHi: '#3a3a4a',
    eye: '#b79bff', brow: 'sharp', age: 0.3, fem: false,
    hairStyle: 'highBun', beard: 'none', headwear: 'hairpin',
    robe: '#e9edf5', robeDark: '#b8b3cc', robeLight: '#ffffff',
    accent: '#9b7fd0', sash: '#5f4d8a', trim: '#c9bce8',
    prop: 'staff', qi: 'rgba(190,170,255,', bg: 'violet', emblem: '内'
  },
  sect_elder: {
    name: '长老', title: '青云长老',
    skin: '#eed6ba', skinShade: '#c9a682', hair: '#cfcad6', hairHi: '#e8e4ee',
    eye: '#ffd166', brow: 'thick', age: 0.72, fem: false,
    hairStyle: 'topknot', beard: 'long', headwear: 'crown',
    robe: '#e9e7f2', robeDark: '#a9a4c2', robeLight: '#ffffff',
    accent: '#ffd166', sash: '#6a5a9a', trim: '#ffe9a8',
    prop: 'sword', qi: 'rgba(255,225,150,', bg: 'amber', emblem: '长'
  }
};

/* ------------------------------ 背景主题 ------------------------------ */

const PORTRAIT_BG = {
  cyan: { a: '#12212e', b: '#2c4a63', glow: 'rgba(110,190,255,' },
  violet: { a: '#171229', b: '#3a2f5e', glow: 'rgba(170,150,255,' },
  amber: { a: '#2a1911', b: '#5c3a22', glow: 'rgba(255,170,90,' },
  emerald: { a: '#0f2118', b: '#2a4a35', glow: 'rgba(130,235,175,' },
  jade: { a: '#14201a', b: '#2f4436', glow: 'rgba(190,230,190,' },
  crimson: { a: '#2a1216', b: '#5c2429', glow: 'rgba(255,150,130,' }
};

/* ------------------------------ 工具 ------------------------------ */

function pEllipse(g, x, y, rx, ry, rot) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832);
}

function pPath(g, pts, close) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]);
    else g.lineTo(p[0], p[1]);
  }
  if (close) g.closePath();
}

/* ============================== 主绘制 ============================== */

function drawPortrait(g, spec, W, H, seed) {
  W = W || PORTRAIT_W;
  H = H || PORTRAIT_H;
  const sx = W / PORTRAIT_W;
  const sy = H / PORTRAIT_H;
  const bg = PORTRAIT_BG[spec.bg] || PORTRAIT_BG.cyan;

  g.save();
  g.scale(sx, sy);

  /* ---------- 背景 ---------- */
  const bgg = g.createLinearGradient(0, 0, 0, H);
  bgg.addColorStop(0, bg.a);
  bgg.addColorStop(1, bg.b);
  g.fillStyle = bgg;
  g.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);

  // 远山剪影
  g.fillStyle = 'rgba(255,255,255,0.045)';
  pPath(g, [[-10, 250], [40, 190, 90, 236], [140, 176, 196, 232], [250, 196, 300, 244], [300, 300], [-10, 300]], true);
  g.fill();

  // 灵光
  const rg = g.createRadialGradient(140, 140, 8, 140, 150, 175);
  rg.addColorStop(0, bg.glow + '0.42)');
  rg.addColorStop(0.52, bg.glow + '0.13)');
  rg.addColorStop(1, bg.glow + '0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);

  // 光柱
  g.save();
  g.globalAlpha = 0.16;
  const beam = g.createLinearGradient(120, 0, 190, 260);
  beam.addColorStop(0, 'rgba(255,255,255,0.55)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = beam;
  pPath(g, [[126, 0], [178, 0], [214, 300], [96, 300]], true);
  g.fill();
  g.restore();

  // 门派印章纹
  g.save();
  g.globalAlpha = 0.10;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 2;
  g.beginPath(); g.arc(140, 132, 96, 0, 6.2832); g.stroke();
  g.lineWidth = 1;
  g.beginPath(); g.arc(140, 132, 86, 0, 6.2832); g.stroke();
  g.restore();

  /* ---------- 身后灵环 ---------- */
  const rnd = makeRng(seed || 7);
  for (let i = 0; i < 3; i++) {
    g.save();
    g.globalAlpha = 0.10 + i * 0.03;
    g.strokeStyle = bg.glow + '0.9)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(140, 130 + i * 6, 70 + i * 16, 70 + i * 16, 0, 0, 6.2832);
    g.stroke();
    g.restore();
  }

  /* ---------- 人物 ---------- */
  drawFigurePortrait(g, spec);

  /* ---------- 前景颗粒 / 花瓣 ---------- */
  for (let i = 0; i < 26; i++) {
    const px = rnd() * PORTRAIT_W;
    const py = rnd() * PORTRAIT_H;
    const r = 0.7 + rnd() * 1.9;
    g.globalAlpha = 0.10 + rnd() * 0.35;
    g.fillStyle = bg.glow + '1)';
    g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill();
  }
  g.globalAlpha = 1;

  // 暗角
  const vg = g.createRadialGradient(140, 150, 80, 140, 170, 250);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  g.fillStyle = vg;
  g.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H);

  g.restore();
}

/* ------------------------------ 人物本体 ------------------------------ */

function drawFigurePortrait(g, s) {
  const cx = 140;

  /* ================= 后层：披发 / 飘带 ================= */
  g.save();
  // 披风/长发底
  g.fillStyle = s.hair;
  if (s.hairStyle === 'longLoose' || s.hairStyle === 'twinBun' || s.hairStyle === 'highBun' || s.hairStyle === 'topknot') {
    pPath(g, [
      [cx - 52, 120],
      [cx - 66, 200, cx - 74, 288],
      [cx - 40, 300],
      [cx - 30, 216, cx - 34, 150],
      [cx - 30, 150], [cx + 30, 150],
      [cx + 34, 216, cx + 30, 300],
      [cx + 46, 300],
      [cx + 70, 200, cx + 54, 120],
      [cx + 30, 96], [cx - 30, 96]
    ], true);
    g.fill();
  }

  // 飘带（朱色）
  g.save();
  g.globalAlpha = 0.9;
  const rib = g.createLinearGradient(cx - 90, 150, cx + 90, 340);
  rib.addColorStop(0, s.sash);
  rib.addColorStop(1, 'rgba(0,0,0,0)');
  g.strokeStyle = s.sash;
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 60, 200);
  g.quadraticCurveTo(cx - 104, 236, cx - 96, 320);
  g.stroke();
  g.beginPath();
  g.moveTo(cx + 62, 204);
  g.quadraticCurveTo(cx + 108, 244, cx + 100, 328);
  g.stroke();
  g.restore();
  g.restore();

  /* ================= 身体 ================= */
  const shoulderY = 214;
  const halfW = 86;

  // 外袍
  const robeG = g.createLinearGradient(cx - halfW, 200, cx + halfW, 380);
  robeG.addColorStop(0, s.robeLight || s.robe);
  robeG.addColorStop(0.4, s.robe);
  robeG.addColorStop(1, s.robeDark);
  g.beginPath();
  g.moveTo(cx - 34, 176);
  g.quadraticCurveTo(cx - halfW - 6, 208, cx - halfW - 14, 380);
  g.lineTo(cx + halfW + 14, 380);
  g.quadraticCurveTo(cx + halfW + 6, 208, cx + 34, 176);
  g.closePath();
  g.fillStyle = robeG;
  g.fill();

  // 袍面纹样（云纹）
  g.save();
  g.beginPath();
  g.moveTo(cx - 34, 176);
  g.quadraticCurveTo(cx - halfW - 6, 208, cx - halfW - 14, 380);
  g.lineTo(cx + halfW + 14, 380);
  g.quadraticCurveTo(cx + halfW + 6, 208, cx + 34, 176);
  g.closePath();
  g.clip();
  g.strokeStyle = s.accent;
  g.globalAlpha = 0.22;
  g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yy = 250 + i * 40;
    g.beginPath();
    g.moveTo(cx - 100, yy);
    g.quadraticCurveTo(cx - 40, yy - 14, cx, yy);
    g.quadraticCurveTo(cx + 40, yy + 14, cx + 100, yy);
    g.stroke();
  }
  // 侧边阴影
  const shd = g.createLinearGradient(cx - halfW, 0, cx - halfW + 60, 0);
  shd.addColorStop(0, 'rgba(0,0,0,0.30)');
  shd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = shd;
  g.fillRect(cx - halfW - 20, 180, 70, 210);
  const shd2 = g.createLinearGradient(cx + halfW, 0, cx + halfW - 60, 0);
  shd2.addColorStop(0, 'rgba(0,0,0,0.26)');
  shd2.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = shd2;
  g.fillRect(cx + halfW - 50, 180, 70, 210);
  g.restore();

  // 交领内衣
  g.beginPath();
  g.moveTo(cx - 26, 178);
  g.lineTo(cx, 250);
  g.lineTo(cx + 26, 178);
  g.quadraticCurveTo(cx, 196, cx - 26, 178);
  g.closePath();
  const inner = g.createLinearGradient(0, 178, 0, 250);
  inner.addColorStop(0, '#ffffff');
  inner.addColorStop(1, s.robeLight || '#eef4fa');
  g.fillStyle = inner;
  g.fill();

  // 领缘
  g.strokeStyle = s.trim;
  g.lineWidth = 4;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(cx - 28, 176);
  g.lineTo(cx, 252);
  g.lineTo(cx + 28, 176);
  g.stroke();

  // 腰带
  g.fillStyle = s.sash;
  pPath(g, [[cx - 74, 330], [cx - 70, 348], [cx + 70, 348], [cx + 74, 330]], true);
  g.fill();
  g.fillStyle = 'rgba(255,235,190,0.9)';
  g.fillRect(cx - 30, 332, 60, 4);
  // 玉佩
  g.fillStyle = '#c8e8d0';
  g.beginPath(); g.arc(cx, 356, 7, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 1.2;
  g.beginPath(); g.arc(cx, 356, 7, 0, 6.2832); g.stroke();

  /* ================= 领口 / 颈 ================= */
  g.fillStyle = s.skinShade;
  pPath(g, [[cx - 15, 158], [cx - 13, 190], [cx + 13, 190], [cx + 15, 158]], true);
  g.fill();
  g.fillStyle = s.skin;
  pPath(g, [[cx - 12, 158], [cx - 10, 186], [cx + 10, 186], [cx + 12, 158]], true);
  g.fill();

  /* ================= 头 ================= */
  const headY = 120;
  drawHead(g, cx, headY, s);

  /* ================= 手持道具 ================= */
  drawProp(g, s, cx);

  /* ================= 前层发丝 ================= */
  drawFrontHair(g, cx, headY, s);
}

/* ------------------------------ 头部 ------------------------------ */

function drawHead(g, cx, cy, s) {
  const hw = 41;   // 半宽
  const hh = 50;   // 半高

  // 脸型 / 比例（捏脸可调）
  const fw = (typeof s.faceW === 'number') ? s.faceW : 1;
  const fl = (typeof s.faceLen === 'number') ? s.faceLen : 1;
  g.save();
  g.translate(cx, cy);
  g.scale(fw, fl);
  g.translate(-cx, -cy);

  // 耳
  g.fillStyle = s.skin;
  pEllipse(g, cx - hw + 2, cy + 6, 6, 10, -0.18); g.fill();
  pEllipse(g, cx + hw - 2, cy + 6, 6, 10, 0.18); g.fill();

  // 脸型（微尖下巴）
  g.beginPath();
  g.moveTo(cx - hw, cy - 10);
  g.quadraticCurveTo(cx - hw - 2, cy - 40, cx - 20, cy - 46);
  g.quadraticCurveTo(cx, cy - 52, cx + 20, cy - 46);
  g.quadraticCurveTo(cx + hw + 2, cy - 40, cx + hw, cy - 10);
  g.quadraticCurveTo(cx + hw - 2, cy + 26, cx + 12, cy + 44);
  g.quadraticCurveTo(cx, cy + 52, cx - 12, cy + 44);
  g.quadraticCurveTo(cx - hw + 2, cy + 26, cx - hw, cy - 10);
  g.closePath();
  const faceG = g.createLinearGradient(cx - hw, cy - 40, cx + hw, cy + 40);
  faceG.addColorStop(0, s.skin);
  faceG.addColorStop(0.55, s.skin);
  faceG.addColorStop(1, s.skinShade);
  g.fillStyle = faceG;
  g.fill();

  // 侧面阴影
  g.save();
  g.beginPath();
  g.moveTo(cx - hw, cy - 10);
  g.quadraticCurveTo(cx - hw - 2, cy - 40, cx - 20, cy - 46);
  g.quadraticCurveTo(cx, cy - 52, cx + 20, cy - 46);
  g.quadraticCurveTo(cx + hw + 2, cy - 40, cx + hw, cy - 10);
  g.quadraticCurveTo(cx + hw - 2, cy + 26, cx + 12, cy + 44);
  g.quadraticCurveTo(cx, cy + 52, cx - 12, cy + 44);
  g.quadraticCurveTo(cx - hw + 2, cy + 26, cx - hw, cy - 10);
  g.closePath();
  g.clip();
  const shadow = g.createLinearGradient(cx + 10, 0, cx + hw + 4, 0);
  shadow.addColorStop(0, 'rgba(120,80,60,0)');
  shadow.addColorStop(1, 'rgba(120,80,60,0.34)');
  g.fillStyle = shadow;
  g.fillRect(cx, cy - 60, hw + 10, 130);
  g.restore();

  /* ---------- 眉 ---------- */
  const browY = cy - 16;
  g.strokeStyle = s.hair;
  g.lineCap = 'round';
  const brows = {
    sharp: { w: 4.2, arch: 7, tilt: -3, len: 20 },
    thin: { w: 2.4, arch: 6, tilt: -2, len: 21 },
    thick: { w: 6.2, arch: 5, tilt: -4, len: 19 },
    soft: { w: 3.2, arch: 6, tilt: -1.5, len: 19 }
  };
  const B = brows[s.brow] || brows.soft;
  for (const side of [-1, 1]) {
    g.lineWidth = B.w;
    g.beginPath();
    g.moveTo(cx + side * 8, browY + 2);
    g.quadraticCurveTo(cx + side * (8 + B.len * 0.5), browY - B.arch + B.tilt,
      cx + side * (8 + B.len), browY + 3 + B.tilt * 0.4);
    g.stroke();
    // 眉毛细毛（顺着走向一根根描，更真）
    g.lineWidth = 0.55;
    g.strokeStyle = 'rgba(40,30,26,0.34)';
    for (let k = 0; k < 6; k++) {
      const t0 = 0.14 + k * 0.14;
      const bx = cx + side * (8 + B.len * t0);
      const by = browY + 2 - B.arch * Math.sin(t0 * Math.PI) + B.tilt * t0;
      g.beginPath();
      g.moveTo(bx, by - 1.2);
      g.lineTo(bx + side * 2.6, by + 1.9);
      g.stroke();
    }
    g.strokeStyle = s.hair;
  }

  /* ---------- 眼 ---------- */
  drawEye(g, cx - 18, cy + 2, -1, s);
  drawEye(g, cx + 18, cy + 2, 1, s);

  /* ---------- 鼻 ---------- */
  g.strokeStyle = 'rgba(150,110,88,0.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - 1, cy + 10);
  g.quadraticCurveTo(cx + 4, cy + 22, cx - 1, cy + 25);
  g.stroke();
  g.fillStyle = 'rgba(150,110,88,0.30)';
  pEllipse(g, cx, cy + 26, 5, 2.4, 0); g.fill();
  // 鼻尖高光 + 鼻翼阴影（增强立体感）
  g.fillStyle = 'rgba(255,255,255,0.28)';
  pEllipse(g, cx - 1, cy + 20, 2.4, 1.6, 0); g.fill();
  g.fillStyle = 'rgba(160,110,90,0.16)';
  pEllipse(g, cx + 4.6, cy + 24, 1.8, 1.2, 0); g.fill();
  pEllipse(g, cx - 4.6, cy + 24, 1.8, 1.2, 0); g.fill();

  /* ---------- 嘴 ---------- */
  const mouthW = (s.fem ? 9 : 11) * (s.mouth === 'full' ? 1.12 : 1);
  const mouthY = cy + 36 + (s.mouth === 'smile' ? -1.4 : 0);
  g.strokeStyle = s.fem ? '#c06a6a' : '#b07468';
  g.lineWidth = s.mouth === 'full' ? 2.8 : 2.1;
  g.beginPath();
  g.moveTo(cx - mouthW, mouthY);
  if (s.mouth === 'smile') {
    g.quadraticCurveTo(cx, mouthY + 3.2, cx + mouthW, mouthY - 1.2);
  } else {
    g.quadraticCurveTo(cx, mouthY + 4, cx + mouthW, mouthY);
  }
  g.stroke();
  if (s.fem || s.mouth === 'full') {
    g.fillStyle = 'rgba(230,140,150,' + (s.mouth === 'full' ? '0.62' : '0.45') + ')';
    g.beginPath();
    g.moveTo(cx - mouthW + 1, mouthY + 0.5);
    g.quadraticCurveTo(cx, mouthY + 3.5, cx + mouthW - 1, mouthY + 0.5);
    g.quadraticCurveTo(cx, mouthY + 5, cx - mouthW + 1, mouthY + 0.5);
    g.fill();
  }
  // 下唇高光
  g.fillStyle = 'rgba(255,255,255,0.20)';
  pEllipse(g, cx, mouthY + 4, 5, 1.6, 0); g.fill();

  /* ---------- 腮红 ---------- */
  if (s.age < 0.4) {
    g.fillStyle = s.fem ? 'rgba(230,140,150,0.22)' : 'rgba(220,150,130,0.13)';
    pEllipse(g, cx - 28, cy + 20, 10, 6, -0.2); g.fill();
    pEllipse(g, cx + 28, cy + 20, 10, 6, 0.2); g.fill();
  }

  /* ---------- 写实细节：颧骨高光 / 下颌阴影 ---------- */
  g.fillStyle = 'rgba(255,250,240,0.18)';
  pEllipse(g, cx - 24, cy + 6, 9, 5, -0.35); g.fill();
  pEllipse(g, cx + 24, cy + 6, 9, 5, 0.35); g.fill();
  const jaw = g.createLinearGradient(0, cy + 30, 0, cy + 52);
  jaw.addColorStop(0, 'rgba(120,80,60,0)');
  jaw.addColorStop(1, 'rgba(120,80,60,0.22)');
  g.fillStyle = jaw;
  pEllipse(g, cx, cy + 42, 18, 9, 0); g.fill();
  // 眼窝柔和阴影
  g.fillStyle = 'rgba(140,100,90,0.10)';
  pEllipse(g, cx - 18, cy - 6, 11, 6, 0); g.fill();
  pEllipse(g, cx + 18, cy - 6, 11, 6, 0); g.fill();

  /* ---------- 追加写实细节（v0.9） ---------- */
  // 1) 鼻梁两侧的暗面，让鼻子真正立起来
  g.fillStyle = 'rgba(150,105,82,0.13)';
  g.beginPath();
  g.moveTo(cx + 2.4, cy + 8);
  g.quadraticCurveTo(cx + 7.2, cy + 18, cx + 5.2, cy + 25.5);
  g.quadraticCurveTo(cx + 3.6, cy + 18, cx + 1.4, cy + 9);
  g.closePath();
  g.fill();
  // 鼻头底部投影
  g.fillStyle = 'rgba(140,95,72,0.20)';
  pEllipse(g, cx, cy + 28.6, 4.6, 1.6, 0); g.fill();

  // 2) 下唇下方的阴影（唇部立体感）
  g.fillStyle = 'rgba(150,95,85,0.13)';
  pEllipse(g, cx, mouthY + 7.4, 7.4, 1.9, 0); g.fill();

  // 3) 唇线中间的一点高光
  g.fillStyle = 'rgba(255,255,255,0.22)';
  pEllipse(g, cx - 1.4, mouthY + 1.8, 2.6, 0.9, -0.15); g.fill();

  // 4) 耳廓内圈（不是一块死色）
  for (const side of [-1, 1]) {
    g.strokeStyle = 'rgba(150,105,85,0.35)';
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(cx + side * (hw - 4), cy + 1);
    g.quadraticCurveTo(cx + side * (hw - 1), cy + 6, cx + side * (hw - 5), cy + 11);
    g.stroke();
  }

  // 5) 下颌轮廓的柔和边缘光（让脸不是一块平板）
  g.strokeStyle = 'rgba(255,244,232,0.30)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(cx - hw + 6, cy - 6);
  g.quadraticCurveTo(cx - hw + 3, cy + 20, cx - 14, cy + 40);
  g.stroke();

  // 6) 右侧面部投影（光源在左上）
  g.save();
  g.beginPath();
  g.moveTo(cx - hw, cy - 10);
  g.quadraticCurveTo(cx - hw - 2, cy - 40, cx - 20, cy - 46);
  g.quadraticCurveTo(cx, cy - 52, cx + 20, cy - 46);
  g.quadraticCurveTo(cx + hw + 2, cy - 40, cx + hw, cy - 10);
  g.quadraticCurveTo(cx + hw - 2, cy + 26, cx + 12, cy + 44);
  g.quadraticCurveTo(cx, cy + 52, cx - 12, cy + 44);
  g.quadraticCurveTo(cx - hw + 2, cy + 26, cx - hw, cy - 10);
  g.closePath();
  g.clip();
  const rim = g.createLinearGradient(cx + hw * 0.4, 0, cx + hw + 6, 0);
  rim.addColorStop(0, 'rgba(255,250,240,0)');
  rim.addColorStop(1, 'rgba(255,250,240,0.26)');
  g.fillStyle = rim;
  g.fillRect(cx - hw, cy - 56, hw * 2 + 12, 116);
  g.restore();

  // 7) 女性：上眼睑加睫毛
  if (s.fem) {
    g.strokeStyle = 'rgba(40,28,26,0.72)';
    g.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      const exx = cx + side * 18;
      const eyy = cy + 2;
      for (let k = 0; k < 4; k++) {
        const t0 = 0.2 + k * 0.22;
        const lx = exx - side * 12 + side * 26 * t0;
        const ly = eyy - Math.sin(t0 * Math.PI) * 7.2;
        g.beginPath();
        g.moveTo(lx, ly);
        g.lineTo(lx + side * 2.2, ly - 3.4);
        g.stroke();
      }
    }
  }

  // 8) 年长者：法令纹
  if (s.age > 0.62) {
    g.strokeStyle = 'rgba(145,100,80,0.26)';
    g.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + side * 10, cy + 24);
      g.quadraticCurveTo(cx + side * 17, cy + 32, cx + side * 13, cy + 40);
      g.stroke();
    }
  }

  /* ---------- 年长者的纹路 ---------- */
  if (s.age > 0.6) {
    g.strokeStyle = 'rgba(140,100,80,0.30)';
    g.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + side * 26, cy + 14);
      g.quadraticCurveTo(cx + side * 33, cy + 20, cx + side * 27, cy + 26);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(cx - 14, cy - 30);
    g.quadraticCurveTo(cx, cy - 34, cx + 14, cy - 30);
    g.stroke();
  }

  /* ---------- 额头仙纹 ---------- */
  if (s.eye && s.age < 0.6) {
    g.save();
    g.globalAlpha = 0.65;
    g.strokeStyle = s.accent;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(cx, cy - 40);
    g.lineTo(cx - 5, cy - 34);
    g.lineTo(cx, cy - 28);
    g.lineTo(cx + 5, cy - 34);
    g.closePath();
    g.stroke();
    g.restore();
  }

  g.restore();   // 脸型缩放
}

function drawEye(g, ex, ey, side, s) {
  const SHAPES = {
    almond: { w: 13.0, hf: 1.00, tilt: 0 },
    phoenix: { w: 14.2, hf: 0.78, tilt: -2.8 },
    round: { w: 12.0, hf: 1.30, tilt: 1.0 },
    narrow: { w: 13.6, hf: 0.62, tilt: 0.4 },
    gentle: { w: 13.2, hf: 1.12, tilt: -1.0 }
  };
  const SH = SHAPES[s.eyeShape] || SHAPES.almond;
  const w = SH.w;
  const h = (s.fem ? 8.4 : 7.4) * SH.hf;
  const tilt = SH.tilt;

  // 眼白
  g.save();
  g.beginPath();
  g.moveTo(ex - side * w, ey);
  g.quadraticCurveTo(ex, ey - h, ex + side * w, ey + 1 + tilt);
  g.quadraticCurveTo(ex, ey + h * 0.82, ex - side * w, ey);
  g.closePath();
  g.fillStyle = '#fdf7f2';
  g.fill();
  g.clip();

  // 虹膜
  const irisG = g.createRadialGradient(ex + side * 1.5, ey, 1, ex + side * 1.5, ey, 7);
  irisG.addColorStop(0, s.eye);
  irisG.addColorStop(0.7, s.eye);
  irisG.addColorStop(1, 'rgba(20,20,30,0.9)');
  g.fillStyle = irisG;
  g.beginPath(); g.arc(ex + side * 1.5, ey, 6.2 * Math.min(1, SH.hf + 0.12), 0, 6.2832); g.fill();
  // 瞳孔
  g.fillStyle = 'rgba(16,14,22,0.92)';
  g.beginPath(); g.arc(ex + side * 1.5, ey, 2.7, 0, 6.2832); g.fill();
  // 高光
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath(); g.arc(ex + side * 1.5 - 2.2, ey - 2.4, 2, 0, 6.2832); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath(); g.arc(ex + side * 1.5 + 2.4, ey + 2.2, 1, 0, 6.2832); g.fill();
  g.restore();

  // 眼下卧蚕 + 上眼睑褶（更写实）
  g.strokeStyle = 'rgba(150,110,105,0.28)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(ex - side * (w - 3), ey + h * 0.52);
  g.quadraticCurveTo(ex, ey + h * 0.8, ex + side * (w - 3), ey + h * 0.6 + tilt * 0.4);
  g.stroke();
  g.strokeStyle = 'rgba(120,80,80,0.18)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(ex - side * (w - 1), ey - 1.6);
  g.quadraticCurveTo(ex, ey - h - 3.4, ex + side * (w - 1), ey - 0.4 + tilt * 0.5);
  g.stroke();

  // 上眼睑
  g.strokeStyle = '#2b2230';
  g.lineWidth = s.fem ? 2.6 : 2.2;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(ex - side * w, ey);
  g.quadraticCurveTo(ex, ey - h - 1, ex + side * w, ey + 1 + tilt);
  g.stroke();
  // 眼尾
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(ex + side * w, ey + 1 + tilt);
  g.lineTo(ex + side * (w + 3.5), ey - 1.4 + tilt * 1.4);
  g.stroke();
  // 下睑
  g.strokeStyle = 'rgba(90,70,70,0.42)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(ex - side * (w - 2), ey + 1.4);
  g.quadraticCurveTo(ex, ey + h * 0.9, ex + side * (w - 1), ey + 1.8 + tilt * 0.5);
  g.stroke();
}

/* ------------------------------ 发型 ------------------------------ */

function drawFrontHair(g, cx, cy, s) {
  g.save();
  const hairG = g.createLinearGradient(cx - 42, cy - 50, cx + 42, cy + 10);
  hairG.addColorStop(0, s.hairHi);
  hairG.addColorStop(0.45, s.hair);
  hairG.addColorStop(1, s.hair);

  if (s.hairStyle === 'bald') {
    // 光头 + 两侧短发
    g.fillStyle = s.hair;
    g.beginPath();
    g.moveTo(cx - 40, cy - 6);
    g.quadraticCurveTo(cx - 44, cy - 30, cx - 32, cy - 36);
    g.quadraticCurveTo(cx - 30, cy - 12, cx - 26, cy - 2);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(cx + 40, cy - 6);
    g.quadraticCurveTo(cx + 44, cy - 30, cx + 32, cy - 36);
    g.quadraticCurveTo(cx + 30, cy - 12, cx + 26, cy - 2);
    g.closePath();
    g.fill();
    // 头顶高光
    g.fillStyle = 'rgba(255,255,255,0.14)';
    pEllipse(g, cx - 12, cy - 34, 16, 8, -0.3); g.fill();
  } else if (s.hairStyle === 'short') {
    g.fillStyle = hairG;
    g.beginPath();
    g.moveTo(cx - 43, cy + 4);
    g.quadraticCurveTo(cx - 50, cy - 44, cx - 6, cy - 52);
    g.quadraticCurveTo(cx + 44, cy - 56, cx + 44, cy + 2);
    g.quadraticCurveTo(cx + 38, cy - 22, cx + 22, cy - 30);
    g.quadraticCurveTo(cx + 6, cy - 22, cx - 12, cy - 30);
    g.quadraticCurveTo(cx - 30, cy - 22, cx - 43, cy + 4);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)';
    pEllipse(g, cx - 14, cy - 36, 20, 8, -0.25); g.fill();
  } else {
    // 长发/发髻：顶部大块 + 两侧鬓发
    g.fillStyle = hairG;
    g.beginPath();
    g.moveTo(cx - 44, cy + 8);
    g.quadraticCurveTo(cx - 52, cy - 44, cx - 4, cy - 54);
    g.quadraticCurveTo(cx + 46, cy - 58, cx + 44, cy + 6);
    g.quadraticCurveTo(cx + 30, cy - 26, cx + 4, cy - 32);
    g.quadraticCurveTo(cx - 24, cy - 26, cx - 44, cy + 8);
    g.closePath();
    g.fill();

    // 中分/侧分刘海
    g.fillStyle = s.hair;
    g.beginPath();
    g.moveTo(cx - 40, cy - 4);
    g.quadraticCurveTo(cx - 26, cy - 34, cx - 2, cy - 36);
    g.quadraticCurveTo(cx + 22, cy - 34, cx + 40, cy - 4);
    g.quadraticCurveTo(cx + 26, cy - 18, cx + 6, cy - 22);
    g.quadraticCurveTo(cx - 16, cy - 18, cx - 40, cy - 4);
    g.closePath();
    g.fill();

    // 侧发
    g.beginPath();
    g.moveTo(cx - 44, cy - 2);
    g.quadraticCurveTo(cx - 50, cy + 30, cx - 40, cy + 52);
    g.quadraticCurveTo(cx - 34, cy + 24, cx - 32, cy + 2);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(cx + 44, cy - 2);
    g.quadraticCurveTo(cx + 50, cy + 30, cx + 40, cy + 52);
    g.quadraticCurveTo(cx + 34, cy + 24, cx + 32, cy + 2);
    g.closePath();
    g.fill();

    // 发丝高光
    g.strokeStyle = 'rgba(255,255,255,0.16)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(cx - 30 + i * 20, cy - 40);
      g.quadraticCurveTo(cx - 24 + i * 20, cy - 26, cx - 34 + i * 20, cy - 10);
      g.stroke();
    }
  }

  /* ---------- 发髻 ---------- */
  if (s.hairStyle === 'highBun') {
    g.fillStyle = s.hair;
    pEllipse(g, cx, cy - 62, 18, 15, 0); g.fill();
    g.fillStyle = s.hairHi;
    pEllipse(g, cx - 5, cy - 66, 8, 6, -0.3); g.fill();
  } else if (s.hairStyle === 'twinBun') {
    g.fillStyle = s.hair;
    pEllipse(g, cx - 44, cy - 44, 14, 13, -0.3); g.fill();
    pEllipse(g, cx + 44, cy - 44, 14, 13, 0.3); g.fill();
    g.fillStyle = s.hairHi;
    pEllipse(g, cx - 47, cy - 48, 6, 5, -0.3); g.fill();
    pEllipse(g, cx + 41, cy - 48, 6, 5, 0.3); g.fill();
  } else if (s.hairStyle === 'topknot') {
    g.fillStyle = s.hair;
    pEllipse(g, cx, cy - 66, 13, 17, 0); g.fill();
    g.strokeStyle = s.accent;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(cx, cy - 54, 13, 5, 0, 0, 6.2832);
    g.stroke();
  }

  /* ---------- 头饰 ---------- */
  drawHeadwear(g, cx, cy, s);

  g.restore();
}

function drawHeadwear(g, cx, cy, s) {
  if (s.headwear === 'crown') {
    // 道冠
    g.fillStyle = '#2d2a3a';
    pPath(g, [[cx - 20, cy - 56], [cx - 16, cy - 82], [cx, cy - 74], [cx + 16, cy - 82], [cx + 20, cy - 56]], true);
    g.fill();
    g.strokeStyle = '#c8a24a';
    g.lineWidth = 2.4;
    g.stroke();
    g.fillStyle = '#c8a24a';
    pEllipse(g, cx, cy - 70, 4, 4, 0); g.fill();
    // 飘带
    g.strokeStyle = 'rgba(200,170,110,0.85)';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(cx - 18, cy - 60);
    g.quadraticCurveTo(cx - 44, cy - 40, cx - 52, cy + 6);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + 18, cy - 60);
    g.quadraticCurveTo(cx + 44, cy - 40, cx + 52, cy + 6);
    g.stroke();
  } else if (s.headwear === 'hairpin') {
    g.strokeStyle = '#c8a24a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx - 30, cy - 58);
    g.lineTo(cx + 26, cy - 72);
    g.stroke();
    g.fillStyle = '#e8d08a';
    g.beginPath(); g.arc(cx + 28, cy - 73, 4.2, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(255,240,190,0.8)';
    g.beginPath(); g.arc(cx + 29.4, cy - 74.4, 1.6, 0, 6.2832); g.fill();
  } else if (s.headwear === 'pin') {
    g.strokeStyle = '#b8a06a';
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(cx - 18, cy - 60);
    g.lineTo(cx + 16, cy - 66);
    g.stroke();
  } else if (s.headwear === 'headband') {
    g.strokeStyle = s.sash;
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(cx - 42, cy - 30);
    g.quadraticCurveTo(cx, cy - 44, cx + 42, cy - 30);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.30)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx - 42, cy - 32);
    g.quadraticCurveTo(cx, cy - 46, cx + 42, cy - 32);
    g.stroke();
    // 飘带
    g.strokeStyle = s.sash;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(cx + 40, cy - 30);
    g.quadraticCurveTo(cx + 66, cy - 12, cx + 60, cy + 26);
    g.stroke();
  } else if (s.headwear === 'hat') {
    // 斗笠
    const hatG = g.createLinearGradient(cx - 90, cy - 40, cx + 90, cy + 10);
    hatG.addColorStop(0, '#d9c89a');
    hatG.addColorStop(1, '#9c8a60');
    g.fillStyle = hatG;
    g.beginPath();
    g.moveTo(cx - 92, cy - 16);
    g.quadraticCurveTo(cx, cy - 96, cx + 92, cy - 16);
    g.quadraticCurveTo(cx, cy - 4, cx - 92, cy - 16);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(90,74,44,0.55)';
    g.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(cx + i * 26, cy - 20);
      g.quadraticCurveTo(cx + i * 14, cy - 50, cx, cy - 62);
      g.stroke();
    }
    g.strokeStyle = 'rgba(60,48,28,0.6)';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(cx - 92, cy - 16);
    g.quadraticCurveTo(cx, cy - 4, cx + 92, cy - 16);
    g.stroke();
  } else if (s.headwear === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.2832 - 0.4;
      g.fillStyle = '#f7c6d8';
      g.beginPath();
      g.ellipse(cx + 40 + Math.cos(a) * 6, cy - 40 + Math.sin(a) * 6, 4.2, 3.2, a, 0, 6.2832);
      g.fill();
    }
    g.fillStyle = '#ffe9a8';
    g.beginPath(); g.arc(cx + 40, cy - 40, 3.4, 0, 6.2832); g.fill();
  }
}

/* ------------------------------ 胡须 ------------------------------ */

function drawBeard(g, cx, cy, s) {
  if (s.beard === 'none') return;
  g.save();
  const hairG = g.createLinearGradient(cx, cy + 30, cx, cy + 150);
  hairG.addColorStop(0, s.hair);
  hairG.addColorStop(1, 'rgba(255,255,255,0.25)');
  g.fillStyle = s.hair;

  if (s.beard === 'long') {
    // 长须
    g.beginPath();
    g.moveTo(cx - 16, cy + 34);
    g.quadraticCurveTo(cx - 24, cy + 90, cx - 6, cy + 150);
    g.quadraticCurveTo(cx, cy + 158, cx + 6, cy + 150);
    g.quadraticCurveTo(cx + 24, cy + 90, cx + 16, cy + 34);
    g.quadraticCurveTo(cx, cy + 46, cx - 16, cy + 34);
    g.closePath();
    g.fillStyle = hairG;
    g.fill();
    // 八撇胡
    g.strokeStyle = s.hair;
    g.lineWidth = 4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - 12, cy + 30);
    g.quadraticCurveTo(cx - 26, cy + 26, cx - 30, cy + 44);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + 12, cy + 30);
    g.quadraticCurveTo(cx + 26, cy + 26, cx + 30, cy + 44);
    g.stroke();
  } else if (s.beard === 'goatee') {
    g.beginPath();
    g.moveTo(cx - 8, cy + 40);
    g.quadraticCurveTo(cx, cy + 96, cx + 8, cy + 40);
    g.quadraticCurveTo(cx, cy + 46, cx - 8, cy + 40);
    g.closePath();
    g.fillStyle = hairG;
    g.fill();
    g.strokeStyle = s.hair;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(cx - 10, cy + 31);
    g.quadraticCurveTo(cx - 22, cy + 28, cx - 24, cy + 40);
    g.stroke();
    g.beginPath();
    g.moveTo(cx + 10, cy + 31);
    g.quadraticCurveTo(cx + 22, cy + 28, cx + 24, cy + 40);
    g.stroke();
  } else if (s.beard === 'stubble') {
    g.globalAlpha = 0.30;
    g.fillStyle = s.hair;
    g.beginPath();
    g.moveTo(cx - 26, cy + 24);
    g.quadraticCurveTo(cx, cy + 54, cx + 26, cy + 24);
    g.quadraticCurveTo(cx, cy + 40, cx - 26, cy + 24);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();
}

/* ------------------------------ 道具 ------------------------------ */

function drawProp(g, s, cx) {
  const p = s.prop;
  g.save();

  if (p === 'sword') {
    // 背后长剑（斜挎）
    g.save();
    g.translate(cx + 52, 250);
    g.rotate(-0.62);
    // 剑鞘
    const sheathG = g.createLinearGradient(-6, 0, 6, 0);
    sheathG.addColorStop(0, '#3a2f28');
    sheathG.addColorStop(0.5, '#5c4a38');
    sheathG.addColorStop(1, '#2e251f');
    g.fillStyle = sheathG;
    pPath(g, [[-7, 0], [7, 0], [6, -170], [-6, -170]], true);
    g.fill();
    g.strokeStyle = '#c8a24a';
    g.lineWidth = 2.4;
    g.stroke();
    // 剑格
    g.fillStyle = '#c8a24a';
    g.fillRect(-14, -4, 28, 6);
    // 剑柄
    g.fillStyle = '#4a3a2e';
    pPath(g, [[-5, 2], [5, 2], [4, 34], [-4, 34]], true);
    g.fill();
    g.strokeStyle = 'rgba(200,170,110,0.8)';
    g.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(-5, 8 + i * 6);
      g.lineTo(5, 12 + i * 6);
      g.stroke();
    }
    // 剑穗
    g.strokeStyle = s.sash;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 36);
    g.quadraticCurveTo(12, 56, 6, 76);
    g.stroke();
    g.restore();
  } else if (p === 'staff') {
    g.save();
    g.translate(cx + 74, 360);
    g.rotate(0.12);
    g.strokeStyle = '#7a5a3a';
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, -230); g.stroke();
    g.strokeStyle = 'rgba(180,140,90,0.6)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(-2, -6); g.lineTo(-8, -226); g.stroke();
    // 杖首灵珠
    const orb = g.createRadialGradient(-8, -248, 2, -8, -248, 20);
    orb.addColorStop(0, '#ffffff');
    orb.addColorStop(0.4, s.accent);
    orb.addColorStop(1, 'rgba(120,180,255,0)');
    g.fillStyle = orb;
    g.beginPath(); g.arc(-8, -248, 20, 0, 6.2832); g.fill();
    g.fillStyle = '#eaf6ff';
    g.beginPath(); g.arc(-8, -248, 6, 0, 6.2832); g.fill();
    g.restore();
  } else if (p === 'whisk') {
    // 拂尘
    g.save();
    g.translate(cx + 66, 300);
    g.rotate(0.3);
    g.strokeStyle = '#6b4f36';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 40); g.lineTo(0, -30); g.stroke();
    g.strokeStyle = '#e8e4d8';
    g.lineWidth = 2;
    for (let i = -9; i <= 9; i++) {
      g.beginPath();
      g.moveTo(0, -30);
      g.quadraticCurveTo(i * 3, -70, i * 4.4, -108);
      g.stroke();
    }
    g.fillStyle = '#c8a24a';
    g.beginPath(); g.arc(0, -30, 5, 0, 6.2832); g.fill();
    g.restore();
  } else if (p === 'hammer') {
    // 大锤扛肩
    g.save();
    g.translate(cx - 78, 250);
    g.rotate(-0.35);
    g.strokeStyle = '#6b4f36';
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 90); g.lineTo(0, -80); g.stroke();
    const headG = g.createLinearGradient(-34, -110, 34, -60);
    headG.addColorStop(0, '#9a9aa4');
    headG.addColorStop(0.5, '#6e6e78');
    headG.addColorStop(1, '#43434c');
    g.fillStyle = headG;
    pPath(g, [[-34, -108], [34, -108], [40, -62], [-40, -62]], true);
    g.fill();
    g.strokeStyle = '#2c2c34';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(-30, -104, 60, 5);
    g.restore();
  } else if (p === 'rod') {
    // 钓竿
    g.save();
    g.translate(cx + 84, 340);
    g.rotate(-0.5);
    g.strokeStyle = '#8a6a48';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -190); g.stroke();
    g.strokeStyle = 'rgba(230,240,255,0.55)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, -188); g.quadraticCurveTo(30, -150, 26, -100); g.stroke();
    g.fillStyle = '#d8d4c8';
    g.beginPath(); g.arc(26, -96, 4, 0, 6.2832); g.fill();
    g.restore();
  } else if (p === 'mortar') {
    // 药臼与药杵
    g.save();
    g.translate(cx + 74, 350);
    g.fillStyle = '#8b8578';
    g.beginPath();
    g.moveTo(-26, 0);
    g.quadraticCurveTo(-30, -34, 0, -36);
    g.quadraticCurveTo(30, -34, 26, 0);
    g.closePath();
    g.fill();
    g.fillStyle = '#6d685e';
    g.beginPath(); g.ellipse(0, -34, 26, 7, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#3e3a34';
    g.beginPath(); g.ellipse(0, -33, 20, 4.6, 0, 0, 6.2832); g.fill();
    g.strokeStyle = '#9a8a6a';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(6, -36); g.lineTo(30, -100); g.stroke();
    // 灵草
    g.strokeStyle = '#7fbb8a';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(-22, -30); g.quadraticCurveTo(-34, -62, -24, -84); g.stroke();
    g.fillStyle = '#bfe8a0';
    pEllipse(g, -26, -86, 7, 4, -0.5); g.fill();
    g.restore();
  } else if (p === 'broom') {
    g.save();
    g.translate(cx + 70, 340);
    g.rotate(0.22);
    g.strokeStyle = '#a08464';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -170); g.stroke();
    g.strokeStyle = '#c9a976';
    g.lineWidth = 2.4;
    for (let i = -6; i <= 6; i++) {
      g.beginPath();
      g.moveTo(0, -168);
      g.quadraticCurveTo(i * 4, -196, i * 6.4, -226);
      g.stroke();
    }
    g.strokeStyle = '#8a6a48';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(-9, -166); g.lineTo(9, -166); g.stroke();
    g.restore();
  } else if (p === 'spear') {
    g.save();
    g.translate(cx + 86, 372);
    g.rotate(0.1);
    g.strokeStyle = '#6b4f36';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, -250); g.stroke();
    // 枪头
    const tipG = g.createLinearGradient(-14, -290, 14, -240);
    tipG.addColorStop(0, '#e8eef6');
    tipG.addColorStop(1, '#8f9aa8');
    g.fillStyle = tipG;
    pPath(g, [[-4, -248], [-13, -272, -4, -296], [4, -272, 4, -272], [12, -268, 4, -248]], true);
    g.fill();
    g.strokeStyle = '#4a5a74';
    g.lineWidth = 2;
    g.stroke();
    // 红缨
    g.fillStyle = s.sash;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(-4, -246);
      g.quadraticCurveTo(i * 7, -228, i * 9, -206);
      g.quadraticCurveTo(i * 4, -226, 4, -246);
      g.closePath();
      g.fill();
    }
    g.restore();
  } else if (p === 'fist') {
    // 拳：缠布的前臂
    g.save();
    g.translate(cx + 74, 300);
    g.rotate(-0.25);
    g.fillStyle = s.skin;
    pPath(g, [[-14, 0], [14, 0], [16, -54], [-16, -54]], true);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.16)';
    g.fillRect(-16, -40, 32, 6);
    g.fillStyle = s.skinShade;
    g.beginPath(); g.arc(0, -60, 18, 0, 6.2832); g.fill();
    // 缠手布
    g.strokeStyle = '#d8cdb8';
    g.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(-17, -52 - i * 5);
      g.lineTo(17, -56 - i * 5);
      g.stroke();
    }
    g.strokeStyle = '#d8cdb8';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-4, -70);
    g.quadraticCurveTo(16, -80, 10, -104);
    g.stroke();
    g.restore();
  } else if (p === 'gourd') {
    // 药葫芦 + 灵草
    g.save();
    g.translate(cx + 76, 300);
    const gourdG = g.createLinearGradient(-20, 0, 20, 0);
    gourdG.addColorStop(0, '#d8a860');
    gourdG.addColorStop(0.5, '#b8873f');
    gourdG.addColorStop(1, '#8a6428');
    g.fillStyle = gourdG;
    g.beginPath(); g.arc(0, 10, 26, 0, 6.2832); g.fill();
    g.beginPath(); g.arc(0, -34, 17, 0, 6.2832); g.fill();
    g.fillStyle = '#a07830';
    g.beginPath(); g.arc(0, -52, 8, 0, 6.2832); g.fill();
    g.strokeStyle = '#6b4a28';
    g.lineWidth = 3;
    g.beginPath(); g.arc(0, -52, 8, 0, 6.2832); g.stroke();
    g.strokeStyle = '#7a5a2a';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-24, 12); g.quadraticCurveTo(0, 0, 24, 12); g.stroke();
    g.restore();
  }

  // 胡须要在道具之后、前景之前
  drawBeard(g, cx, 120, s);

  g.restore();
}

/* ============================== 缓存 ============================== */

const PORTRAIT_CACHE = {};

function specSignature(spec) {
  if (!spec) return '';
  return ['hairStyle', 'hair', 'hairHi', 'skin', 'skinShade', 'eye', 'robe', 'robeDark', 'accent', 'bg',
    'faceW', 'faceLen', 'eyeShape', 'brow', 'mouth', 'fem', 'age']
    .map((k) => spec[k] || '').join('|');
}

/** 按流派默认值 + 玩家捏脸数据合成规格 */
function playerSpec(path, look) {
  const base = PORTRAIT_SPECS['p_' + (path || 'sword')] || PORTRAIT_SPECS.p_sword;
  if (!look) return base;
  const s = Object.assign({}, base);
  if (look.hairStyle) s.hairStyle = look.hairStyle;
  if (look.hair) s.hair = look.hair;
  if (look.hairHi) s.hairHi = look.hairHi;
  if (look.skin) s.skin = look.skin;
  if (look.skinShade) s.skinShade = look.skinShade;
  if (look.eye) s.eye = look.eye;
  if (look.robe) s.robe = look.robe;
  if (look.robeDark) s.robeDark = look.robeDark;
  if (look.accent) s.accent = look.accent;
  if (look.bg) s.bg = look.bg;
  /* 高级捏脸新增项 */
  if (typeof look.faceW === 'number') s.faceW = look.faceW;
  if (typeof look.faceLen === 'number') s.faceLen = look.faceLen;
  if (look.eyeShape) s.eyeShape = look.eyeShape;
  if (look.brow) s.brow = look.brow;
  if (look.mouth) s.mouth = look.mouth;
  if (typeof look.fem === 'boolean') s.fem = look.fem;
  if (typeof look.age === 'number') s.age = look.age;
  return s;
}

function getPortrait(key, spec) {
  const sig = specSignature(spec);
  const cacheKey = sig ? key + '#' + sig : key;
  if (PORTRAIT_CACHE[cacheKey]) return PORTRAIT_CACHE[cacheKey];
  const useSpec = spec || PORTRAIT_SPECS[key];
  if (!useSpec) return null;
  const c = document.createElement('canvas');
  c.width = PORTRAIT_W;
  c.height = PORTRAIT_H;
  const g = c.getContext('2d');
  let seed = 17;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) & 0x7fffffff;
  drawPortrait(g, useSpec, PORTRAIT_W, PORTRAIT_H, seed);
  PORTRAIT_CACHE[cacheKey] = c;
  return c;
}

/** 把立绘的头部区域裁进一个小圆框 */
function drawPortraitAvatar(canvas, key, spec) {
  // 1) 优先用玩家提供的图片
  if (typeof Art !== 'undefined') {
    const img = Art.portrait(key);
    if (img && Art.drawAvatar(canvas, img)) return;
  }
  const src = getPortrait(key, spec);
  if (!src) return;
  const g = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  g.clearRect(0, 0, w, h);
  g.save();
  g.beginPath();
  g.arc(w / 2, h / 2, w / 2, 0, 6.2832);
  g.clip();
  // 取头部区域（脸在 x 99-181, y 70-170 附近）
  const sx = 72, sy = 44, sw = 136, sh = 136;
  g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  g.restore();
}

/** 把立绘整幅画进对话肖像框 */
function drawPortraitFull(canvas, key, spec) {
  if (typeof Art !== 'undefined') {
    const img = Art.portrait(key);
    if (img && Art.drawInto(canvas, img)) return;
  }
  const src = getPortrait(key, spec);
  if (!src) return;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.drawImage(src, 0, 0, canvas.width, canvas.height);
}
