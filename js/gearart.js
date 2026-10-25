'use strict';

/* =========================================================================
   青云界 · 装备立绘
   每件装备都是单独手绘的程序化插画，各有独特造型与光效
   ========================================================================= */

const GearArt = (function () {

  /* ------------------------------------------------------------------
     规格表：shape 决定画法，其余为造型参数
  ------------------------------------------------------------------ */

  const W = { /* 兵器：剑 */
    wp_rust:   { shape: 'sword', len: 74, w: 7.5, curve: 0.0,  edge: '#b9b2a4', blade: '#8c8578', hilt: '#4a3a2a', guard: '#6b5b45', glow: '#d8cbb0', rune: 0, notch: 3, rough: 1, gs: 'none', pm: 'none', wrap: 1 },
    wp_wood:   { shape: 'sword', len: 70, w: 6.5, curve: 0.0,  edge: '#d8c99a', blade: '#a8895a', hilt: '#6b4f2e', guard: '#8a6a3a', glow: '#ffe9a8', rune: 0, leaf: 1, gs: 'flat', pm: 'ball' },
    wp_iron:   { shape: 'sword', len: 78, w: 8.5, curve: 0.0,  edge: '#f0f4f8', blade: '#b8c2cc', hilt: '#3a3a44', guard: '#7a7a86', glow: '#cfe6ff', rune: 0, gs: 'cross', pm: 'ball' },
    wp_azure:  { shape: 'sword', len: 82, w: 8,   curve: 0.1,  edge: '#d8f6ff', blade: '#5f9ec8', hilt: '#20344a', guard: '#8fd0ff', glow: '#7fe0ff', rune: 2, gs: 'round', pm: 'ring', gem: '#8fe8ff' },
    wp_bamboo: { shape: 'sword', len: 72, w: 6,   curve: 0.0,  edge: '#e8f8d8', blade: '#8fbb6a', hilt: '#4a6b38', guard: '#a8d88a', glow: '#c8ffa8', rune: 0, joint: 1, gs: 'bamboo', pm: 'none' },
    wp_frost:  { shape: 'sword', len: 84, w: 8,   curve: 0.06, edge: '#eafcff', blade: '#9fd6ee', hilt: '#1e3a4a', guard: '#bfeaff', glow: '#8fe0ff', rune: 1, frost: 1, gs: 'ice', pm: 'spike', gem: '#bfeaff' },
    wp_crimson:{ shape: 'saber', len: 80, w: 10,  curve: 0.34, edge: '#ffd0a8', blade: '#c2401c', hilt: '#4a1c10', guard: '#e08a3a', glow: '#ff8a4a', rune: 3, gs: 'ring', pm: 'ring', gem: '#ffb066' },
    wp_void:   { shape: 'sword', len: 88, w: 7,   curve: 0.02, edge: '#d8e8ff', blade: 'void',      hilt: '#181426', guard: '#7f5fff', glow: '#a08fff', rune: 4, star: 1, gs: 'void', pm: 'ring', gem: '#c0a8ff' },
    wp_slayer: { shape: 'sword', len: 92, w: 11,  curve: 0.04, edge: '#ffe0e0', blade: '#7a1f22', hilt: '#2a0e10', guard: '#ff5a5a', glow: '#ff5a5a', rune: 5, ragged: 1, gs: 'jagged', pm: 'spike', gem: '#ff8a6a' },

    /* 兵器：法杖 */
    wp_staff:  { shape: 'staff', len: 84, w: 5.5, shaft: '#7a5a34', head: '#9fd06a', glow: '#c8ff9a', rune: 1, paper: 1 },
    wp_bone:   { shape: 'bone', len: 80, w: 6, shaft: '#d8d2b8', glow: '#cfe8d0', gem: '#7fe0b0', rune: 1 },
    wp_hammer: { shape: 'hammer', len: 78, w: 7,  shaft: '#5a4028', headCol: '#8a8a96', band: '#e0a45c', glow: '#ffd8a0', rune: 2 },

    /* 护体 */
    bd_hemp:   { shape: 'armor', base: '#a89070', trim: '#8a7355', glow: '#d8c8a8', pattern: 'weave', collar: 'round' },
    bd_silk:   { shape: 'armor', base: '#dfeaf6', trim: '#7fa8d8', glow: '#9fd0ff', pattern: 'cloud', collar: 'cross' },
    bd_light:  { shape: 'armor', base: '#c4d8c0', trim: '#6b9e78', glow: '#9fe8b8', pattern: 'scale', collar: 'v' },
    bd_scale:  { shape: 'armor', base: '#5f666f', trim: '#9aa4b0', glow: '#b8d8ff', pattern: 'scale', collar: 'high' },
    bd_ice:    { shape: 'armor', base: '#bfe4f5', trim: '#5fa8d0', glow: '#8fe0ff', pattern: 'frost', collar: 'high' },
    bd_dragon: { shape: 'armor', base: '#2f6b4a', trim: '#d8b45a', glow: '#ffe9a0', pattern: 'dragon', collar: 'high' },
    bd_slayer: { shape: 'armor', base: '#5a1718', trim: '#ff5a5a', glow: '#ff7a6a', pattern: 'crack', collar: 'high' },

    /* 饰品 */
    ch_wood:   { shape: 'talisman', base: '#c8a878', ink: '#a83a2a', glow: '#ffd8a0', rune: 1 },
    ch_jade:   { shape: 'pendant', base: '#8fe0b0', rim: '#d8f0e0', glow: '#c8ffe0', cord: '#a83a2a' },
    ch_talisman:{ shape: 'talisman', base: '#f0e2b8', ink: '#c84a2a', glow: '#ffd166', rune: 3 },
    ch_ice:    { shape: 'ring', base: '#9fd6ee', rim: '#e8f8ff', glow: '#8fe0ff', gem: '#5fa8d0' },
    ch_orbs:   { shape: 'orb', base: '#7fd8b0', glow: '#c8ffe8', core: '#ffffff', sat: 1 },
    ch_bell:   { shape: 'bell', base: '#d8b45a', rim: '#8a6a2a', glow: '#ffe9a0' },
    ch_seal:   { shape: 'seal', base: '#c8c8d8', rim: '#7a7a92', glow: '#cfd8ff', rune: 2 },
    ch_blood:  { shape: 'pendant', base: '#c02434', rim: '#ff8a8a', glow: '#ff5a5a', cord: '#3a0e12', blood: 1 },

    /* 圣品 / 神品 */
    wp_saint:  { shape: 'sword', len: 94, w: 10, curve: 0.03, edge: '#ffffff', blade: '#dfe9ff', hilt: '#1c2436', guard: '#eafcff', glow: '#eafcff', rune: 7, star: 1, gs: 'void', pm: 'ring', gem: '#eafcff' },
    wp_divine: { shape: 'sword', len: 98, w: 12, curve: 0.02, edge: '#ffffff', blade: 'void', hilt: '#0e0b18', guard: '#ff8ae0', glow: '#ff8ae0', rune: 8, star: 1, ragged: 1, gs: 'jagged', pm: 'spike', gem: '#ff8ae0' },
    bd_saint:  { shape: 'armor', base: '#cfe6ff', trim: '#ffffff', glow: '#eafcff', pattern: 'frost', collar: 'high' },
    bd_divine: { shape: 'armor', base: '#1a1626', trim: '#ff8ae0', glow: '#ff8ae0', pattern: 'crack', collar: 'high' },
    ch_saint:  { shape: 'seal', base: '#eafcff', rim: '#8fd8ff', glow: '#eafcff', rune: 3 },
    ch_divine: { shape: 'pendant', base: '#2a1c3a', rim: '#ff8ae0', glow: '#ff8ae0', cord: '#0e0b18', blood: 1 },

    /* 服饰 */
    cl_white:  { shape: 'robe', base: '#f7fbff', dark: '#c4d8ec', accent: '#5f9ad2', glow: '#bfe6ff', pattern: 'cloud', trim: 'plain' },
    cl_ink:    { shape: 'robe', base: '#31496b', dark: '#20304a', accent: '#9fd0ff', glow: '#7fb0ff', pattern: 'wave', trim: 'plain' },
    cl_cloud:  { shape: 'robe', base: '#dfeaf6', dark: '#a9bfd8', accent: '#e8d9a8', glow: '#ffeec0', pattern: 'crane', trim: 'wide' },
    cl_jade:   { shape: 'robe', base: '#eef7ee', dark: '#c2dbc6', accent: '#7fbb8a', glow: '#b8ffcc', pattern: 'bamboo', trim: 'plain' },
    cl_fire:   { shape: 'robe', base: '#8a2f22', dark: '#5d1c14', accent: '#f0a24c', glow: '#ff9a4a', pattern: 'flame', trim: 'armor' },
    cl_ice:    { shape: 'robe', base: '#e8f4fb', dark: '#b6d2e4', accent: '#8fd8ff', glow: '#c8f0ff', pattern: 'frost', trim: 'gauze' },
    cl_ghost:  { shape: 'robe', base: '#2b2a3e', dark: '#171622', accent: '#b98fff', glow: '#a08fff', pattern: 'ghost', trim: 'narrow' },
    cl_moon:   { shape: 'robe', base: '#eae4ff', dark: '#c0b6e0', accent: '#d0c4ff', glow: '#e0d8ff', pattern: 'moon', trim: 'wide' },
    cl_gold:   { shape: 'robe', base: '#d9b45a', dark: '#a8823a', accent: '#fff0b8', glow: '#ffe9a0', pattern: 'script', trim: 'armor' },
    cl_void:   { shape: 'robe', base: '#1f2436', dark: '#12151f', accent: '#7fe8ff', glow: '#8fe8ff', pattern: 'star', trim: 'wide' }
  };

  function specOf(id) { return W[id] || null; }

  /* ------------------------------------------------------------------
     公共小工具
  ------------------------------------------------------------------ */

  function hex2rgb(h) {
    const s = String(h).replace('#', '');
    const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(h, a) {
    const c = hex2rgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function mix(h1, h2, t) {
    const a = hex2rgb(h1), b = hex2rgb(h2);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function roundRect(g, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr);
    g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr);
    g.closePath();
  }

  /* ------------------------------------------------------------------
     背景：按品质上色的光雾
  ------------------------------------------------------------------ */

  function paintBackdrop(g, qc, t) {
    const grd = g.createRadialGradient(50, 56, 4, 50, 50, 68);
    grd.addColorStop(0, rgba(qc, 0.42));
    grd.addColorStop(0.42, rgba(qc, 0.14));
    grd.addColorStop(1, 'rgba(6,10,16,0.92)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 100, 100);

    // 斜向光线
    g.save();
    g.globalAlpha = 0.16;
    for (let i = 0; i < 7; i++) {
      const a = -0.6 + i * 0.19;
      g.save();
      g.translate(50, 50);
      g.rotate(a);
      const lg = g.createLinearGradient(0, -60, 0, 60);
      lg.addColorStop(0, rgba(qc, 0));
      lg.addColorStop(0.5, rgba(qc, 0.5));
      lg.addColorStop(1, rgba(qc, 0));
      g.fillStyle = lg;
      g.fillRect(-1.6, -60, 3.2, 120);
      g.restore();
    }
    g.restore();

    // 星尘
    g.save();
    for (let i = 0; i < 22; i++) {
      const x = (i * 37.7) % 100;
      const y = (i * 61.3 + 11) % 100;
      const r = 0.5 + ((i * 13) % 7) * 0.12;
      g.globalAlpha = 0.15 + 0.35 * Math.abs(Math.sin(t * 0.6 + i));
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x, y, r, 0, 6.283);
      g.fill();
    }
    g.restore();

    // 底部光环
    const bg2 = g.createRadialGradient(50, 92, 2, 50, 92, 40);
    bg2.addColorStop(0, rgba(qc, 0.4));
    bg2.addColorStop(1, rgba(qc, 0));
    g.fillStyle = bg2;
    g.fillRect(0, 52, 100, 48);
  }

  /* ------------------------------------------------------------------
     剑 / 刀
  ------------------------------------------------------------------ */

  function paintSword(g, s, qc, t) {
    const len = s.len, bw = s.w, curve = s.curve || 0;
    g.save();
    g.translate(50, 50);
    g.rotate(-0.72);

    // 剑身轮廓（上为尖）
    const body = () => {
      g.beginPath();
      g.moveTo(0, -len / 2);
      g.quadraticCurveTo(bw / 2 + curve * 14, -len / 4, bw / 2 + curve * 20, len * 0.16);
      g.lineTo(bw / 2 + curve * 20, len * 0.20);
      g.lineTo(-bw / 2, len * 0.20);
      g.lineTo(-bw / 2, -len / 4);
      g.closePath();
    };

    // 外发光
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 16;
    body();
    g.fillStyle = rgba(s.glow, 0.5);
    g.fill();
    g.restore();

    // 剑身底色
    body();
    if (s.blade === 'void') {
      const vg = g.createLinearGradient(-bw / 2, -len / 2, bw / 2, len / 2);
      vg.addColorStop(0, '#3a3060');
      vg.addColorStop(0.4, '#14121f');
      vg.addColorStop(0.55, '#4a3a88');
      vg.addColorStop(1, '#0c0a14');
      g.fillStyle = vg;
    } else {
      const vg = g.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      vg.addColorStop(0, mix(s.blade, '#000000', 0.35));
      vg.addColorStop(0.42, s.blade);
      vg.addColorStop(0.62, mix(s.blade, '#ffffff', 0.35));
      vg.addColorStop(1, mix(s.blade, '#000000', 0.42));
      g.fillStyle = vg;
    }
    g.fill();

    // 刃口高光
    g.save();
    body();
    g.clip();
    g.strokeStyle = rgba(s.edge, 0.85);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-bw * 0.34, -len / 2 + 4);
    g.quadraticCurveTo(-bw * 0.34, 0, -bw * 0.34, len * 0.2);
    g.stroke();

    // 中脊
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(0, -len / 2 + 3);
    g.lineTo(curve * 16, len * 0.2);
    g.stroke();

    // 符文
    const runeN = s.rune || 0;
    if (runeN) {
      g.strokeStyle = rgba(s.glow, 0.85);
      g.lineWidth = 0.9;
      for (let i = 0; i < runeN; i++) {
        const yy = -len / 2 + 12 + i * (len * 0.5 / Math.max(1, runeN));
        g.beginPath();
        g.moveTo(-bw * 0.22, yy);
        g.lineTo(bw * 0.22, yy + 2.4);
        g.moveTo(0, yy - 2.6);
        g.lineTo(0, yy + 4);
        g.stroke();
      }
    }

    // 缺口（锈刀）
    if (s.rough) {
      g.fillStyle = rgba('#2a2018', 0.55);
      for (let i = 0; i < 5; i++) {
        const yy = -len / 2 + 14 + i * 9;
        g.beginPath();
        g.arc(bw * 0.44, yy, 1.5 + (i % 3) * 0.5, 0, 6.283);
        g.fill();
      }
    }
    // 竹节
    if (s.joint) {
      g.strokeStyle = 'rgba(60,90,40,0.55)';
      g.lineWidth = 1.1;
      for (let i = 1; i < 5; i++) {
        const yy = -len / 2 + i * (len * 0.62 / 5);
        g.beginPath();
        g.moveTo(-bw / 2 - 0.6, yy);
        g.lineTo(bw / 2 + 0.6, yy);
        g.stroke();
      }
    }
    // 霜花
    if (s.frost) {
      g.strokeStyle = 'rgba(220,250,255,0.55)';
      g.lineWidth = 0.7;
      for (let i = 0; i < 6; i++) {
        const yy = -len / 2 + 12 + i * 10;
        g.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = k * 1.05;
          g.moveTo(0, yy);
          g.lineTo(Math.cos(a) * 2.6, yy + Math.sin(a) * 2.6);
        }
        g.stroke();
      }
    }
    // 桃叶
    if (s.leaf) {
      g.fillStyle = 'rgba(140,200,110,0.8)';
      for (let i = 0; i < 2; i++) {
        g.save();
        g.translate(bw * 0.5 + 1.6, -len / 2 + 16 + i * 8);
        g.rotate(0.9 + i * 0.4);
        g.beginPath();
        g.ellipse(0, 0, 3.2, 1.3, 0, 0, 6.283);
        g.fill();
        g.restore();
      }
    }
    g.restore(); // clip

    /* ---- 剑格：每把兵器各有各的形状 ---- */
    const gs = s.gs || 'plain';
    const gy = len * 0.19;
    g.save();
    g.shadowColor = rgba(s.guard, 0.6);
    g.shadowBlur = gs === 'void' ? 14 : 0;
    g.fillStyle = s.guard;
    g.strokeStyle = rgba(s.glow, 0.75);
    g.lineWidth = 0.8;

    if (gs === 'none') {
      // 锈刀：没有剑格，只缠了几圈麻布
      g.fillStyle = '#8a7355';
      roundRect(g, -bw * 0.85, gy - 1, bw * 1.7, 5.4, 1.4);
      g.fill();
      g.strokeStyle = 'rgba(60,45,30,0.55)';
      g.lineWidth = 0.7;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-bw * 0.85, gy + i * 1.8);
        g.lineTo(bw * 0.85, gy + i * 1.8 + 0.9);
        g.stroke();
      }
    } else if (gs === 'cross') {
      // 十字剑格
      roundRect(g, -bw * 1.55, gy - 0.6, bw * 3.1, 3.4, 1);
      g.fill(); g.stroke();
      roundRect(g, -bw * 0.6, gy - 3.2, bw * 1.2, 7.6, 1.4);
      g.fill(); g.stroke();
    } else if (gs === 'round') {
      // 圆环剑格
      g.beginPath();
      g.ellipse(0, gy + 2, bw * 1.5, 4.2, 0, 0, 6.283);
      g.fill(); g.stroke();
      g.fillStyle = rgba(s.glow, 0.55);
      g.beginPath();
      g.arc(0, gy + 2, bw * 0.55, 0, 6.283);
      g.fill();
    } else if (gs === 'bamboo') {
      // 竹节剑格
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.ellipse(i * bw * 0.9, gy + 2 + Math.abs(i) * 1.2, bw * 0.5, 2.6, 0, 0, 6.283);
        g.fill();
      }
      roundRect(g, -bw * 1.3, gy, bw * 2.6, 3, 1.2);
      g.fill();
    } else if (gs === 'ice') {
      // 冰晶剑格：三片尖刃
      g.beginPath();
      g.moveTo(-bw * 1.7, gy + 3.4);
      g.lineTo(0, gy - 2.6);
      g.lineTo(bw * 1.7, gy + 3.4);
      g.lineTo(0, gy + 6.6);
      g.closePath();
      g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.beginPath();
      g.moveTo(0, gy - 2.2);
      g.lineTo(0, gy + 6.2);
      g.stroke();
    } else if (gs === 'ring') {
      // 弯刀护手铜环
      g.beginPath();
      g.arc(0, gy + 3, bw * 1.25, Math.PI * 0.05, Math.PI * 0.95);
      g.lineWidth = 3.2;
      g.strokeStyle = s.guard;
      g.stroke();
      g.lineWidth = 1;
      g.strokeStyle = rgba(s.glow, 0.85);
      g.beginPath();
      g.arc(0, gy + 3, bw * 1.25, Math.PI * 0.05, Math.PI * 0.95);
      g.stroke();
    } else if (gs === 'void') {
      // 虚空剑格：悬浮的双环
      g.strokeStyle = rgba(s.guard, 0.9);
      g.lineWidth = 1.6;
      g.beginPath();
      g.ellipse(0, gy + 2, bw * 1.7, 4.6, 0, 0, 6.283);
      g.stroke();
      g.globalAlpha = 0.5;
      g.beginPath();
      g.ellipse(0, gy + 2, bw * 2.3, 6.2, 0, 0, 6.283);
      g.stroke();
      g.globalAlpha = 1;
    } else if (gs === 'jagged') {
      // 锯齿剑格
      g.beginPath();
      g.moveTo(-bw * 1.7, gy + 1);
      g.lineTo(-bw * 0.9, gy - 2.4);
      g.lineTo(-bw * 0.3, gy + 1);
      g.lineTo(bw * 0.3, gy - 2.4);
      g.lineTo(bw * 0.9, gy + 1);
      g.lineTo(bw * 1.7, gy - 1.4);
      g.lineTo(bw * 1.7, gy + 4.4);
      g.lineTo(-bw * 1.7, gy + 4.4);
      g.closePath();
      g.fill(); g.stroke();
    } else {
      roundRect(g, -bw * 1.35, gy, bw * 2.7, 3.6, 1.4);
      g.fill(); g.stroke();
    }
    g.restore();

    // 剑格上的宝石（高品质才有）
    if (s.gem && q >= 3) {
      g.save();
      g.shadowColor = s.gem;
      g.shadowBlur = 12;
      const gg = g.createRadialGradient(-1, gy, 0.4, 0, gy + 2, bw * 0.7);
      gg.addColorStop(0, '#ffffff');
      gg.addColorStop(0.45, s.gem);
      gg.addColorStop(1, rgba(s.gem, 0.15));
      g.fillStyle = gg;
      g.beginPath();
      g.arc(0, gy + 2, bw * 0.62, 0, 6.283);
      g.fill();
      g.restore();
    }

    // 剑柄
    const hg = g.createLinearGradient(-bw * 0.5, 0, bw * 0.5, 0);
    hg.addColorStop(0, mix(s.hilt, '#000000', 0.4));
    hg.addColorStop(0.5, s.hilt);
    hg.addColorStop(1, mix(s.hilt, '#000000', 0.4));
    g.fillStyle = hg;
    roundRect(g, -bw * 0.55, len * 0.23, bw * 1.1, len * 0.20, 1.4);
    g.fill();

    // 缠绳（麻布柄则是粗布纹）
    g.strokeStyle = s.wrap ? 'rgba(200,180,140,0.55)' : 'rgba(230,220,190,0.35)';
    g.lineWidth = s.wrap ? 1.3 : 0.8;
    for (let i = 0; i < 5; i++) {
      const yy = len * 0.24 + i * (len * 0.036);
      g.beginPath();
      g.moveTo(-bw * 0.55, yy);
      g.lineTo(bw * 0.55, yy + 2);
      g.stroke();
    }

    /* ---- 剑首 ---- */
    const pm = s.pm || 'ball';
    g.save();
    g.shadowColor = rgba(s.glow, 0.7);
    g.shadowBlur = pm === 'ring' ? 10 : 0;
    g.fillStyle = s.guard;
    g.strokeStyle = rgba(s.glow, 0.85);
    g.lineWidth = 0.9;
    if (pm === 'ball') {
      g.beginPath();
      g.arc(0, len * 0.44, bw * 0.72, 0, 6.283);
      g.fill(); g.stroke();
    } else if (pm === 'ring') {
      g.lineWidth = 2;
      g.strokeStyle = s.guard;
      g.beginPath();
      g.arc(0, len * 0.455, bw * 0.8, 0, 6.283);
      g.stroke();
      g.lineWidth = 0.8;
      g.strokeStyle = rgba(s.glow, 0.85);
      g.beginPath();
      g.arc(0, len * 0.455, bw * 0.8, 0, 6.283);
      g.stroke();
    } else if (pm === 'spike') {
      g.beginPath();
      g.moveTo(0, len * 0.40);
      g.lineTo(bw * 0.55, len * 0.44);
      g.lineTo(0, len * 0.52);
      g.lineTo(-bw * 0.55, len * 0.44);
      g.closePath();
      g.fill(); g.stroke();
    }
    g.restore();

    g.restore();
  }

  /* ------------------------------------------------------------------
     骨杖（一根兽骨，两端带关节，顶端嵌妖丹）
  ------------------------------------------------------------------ */

  function paintBone(g, s, t) {
    g.save();
    g.translate(50, 50);
    g.rotate(-0.42);

    const len = s.len;
    const bw = s.w;

    // 骨干
    const lg = g.createLinearGradient(-bw, 0, bw, 0);
    lg.addColorStop(0, mix(s.shaft, '#000000', 0.32));
    lg.addColorStop(0.4, s.shaft);
    lg.addColorStop(0.62, mix(s.shaft, '#ffffff', 0.3));
    lg.addColorStop(1, mix(s.shaft, '#000000', 0.34));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(-bw * 0.6, -len * 0.36);
    g.quadraticCurveTo(-bw, 0, -bw * 0.75, len * 0.36);
    g.lineTo(bw * 0.75, len * 0.36);
    g.quadraticCurveTo(bw, 0, bw * 0.6, -len * 0.36);
    g.closePath();
    g.fill();

    // 骨节
    g.strokeStyle = 'rgba(90,80,60,0.5)';
    g.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const yy = -len * 0.3 + i * (len * 0.6 / 5);
      g.beginPath();
      g.moveTo(-bw * 0.7, yy);
      g.quadraticCurveTo(0, yy + 2.4, bw * 0.7, yy);
      g.stroke();
    }

    // 骨节球
    for (const yy of [-len * 0.36, len * 0.36]) {
      g.fillStyle = mix(s.shaft, '#ffffff', 0.18);
      g.beginPath();
      g.ellipse(0, yy, bw * 1.25, bw * 0.95, 0, 0, 6.283);
      g.fill();
      g.strokeStyle = 'rgba(110,100,80,0.45)';
      g.lineWidth = 0.8;
      g.stroke();
    }

    // 顶端妖丹
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 18;
    const cg = g.createRadialGradient(-1, -len * 0.36 - 1, 0.5, 0, -len * 0.36, 10);
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.35, s.gem);
    cg.addColorStop(1, rgba(s.gem, 0.1));
    g.fillStyle = cg;
    g.beginPath();
    g.arc(0, -len * 0.36, 9, 0, 6.283);
    g.fill();
    g.restore();

    // 缠绕的旧绳
    g.strokeStyle = 'rgba(150,110,70,0.75)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const yy = len * 0.16 + i * 4;
      g.beginPath();
      g.moveTo(-bw * 0.8, yy);
      g.lineTo(bw * 0.8, yy + 2);
      g.stroke();
    }

    // 引气低鸣的光点
    g.save();
    g.globalAlpha = 0.35 + 0.3 * Math.sin(t * 2.2);
    g.fillStyle = rgba(s.glow, 0.9);
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(Math.sin(t + i * 1.7) * 4, -len * 0.36 + 16 + i * 9, 1.2, 0, 6.283);
      g.fill();
    }
    g.restore();

    g.restore();
  }

  /* ------------------------------------------------------------------
     法杖
  ------------------------------------------------------------------ */

  function paintStaff(g, s) {
    g.save();
    g.translate(50, 50);
    g.rotate(-0.36);

    // 杖身
    const lg = g.createLinearGradient(-3, 0, 3, 0);
    lg.addColorStop(0, mix(s.shaft, '#000000', 0.45));
    lg.addColorStop(0.5, mix(s.shaft, '#ffffff', 0.18));
    lg.addColorStop(1, mix(s.shaft, '#000000', 0.5));
    g.fillStyle = lg;
    roundRect(g, -2.4, -s.len * 0.26, 4.8, s.len * 0.82, 2.2);
    g.fill();

    // 木纹
    g.strokeStyle = 'rgba(0,0,0,0.22)';
    g.lineWidth = 0.5;
    for (let i = 0; i < 7; i++) {
      const yy = -s.len * 0.24 + i * 11;
      g.beginPath();
      g.moveTo(-2, yy);
      g.quadraticCurveTo(0, yy + 2, 2, yy);
      g.stroke();
    }

    // 缠布
    g.fillStyle = '#b8453c';
    roundRect(g, -3, s.len * 0.34, 6, s.len * 0.14, 1.5);
    g.fill();

    // 杖头
    const cy = -s.len * 0.34;
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 18;
    const hg = g.createRadialGradient(0, cy, 1, 0, cy, 11);
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(0.35, s.head);
    hg.addColorStop(1, rgba(s.head, 0.15));
    g.fillStyle = hg;
    g.beginPath();
    g.arc(0, cy, 10, 0, 6.283);
    g.fill();
    g.restore();

    // 环形藤架
    g.strokeStyle = mix(s.shaft, '#000000', 0.2);
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(0, cy, 9, Math.PI * 0.15, Math.PI * 0.85, true);
    g.stroke();

    // 挂符纸
    if (s.paper) {
      g.fillStyle = 'rgba(245,235,200,0.92)';
      g.save();
      g.translate(7, cy + 4);
      g.rotate(0.22);
      roundRect(g, 0, 0, 5, 11, 0.8);
      g.fill();
      g.strokeStyle = 'rgba(200,60,40,0.85)';
      g.lineWidth = 0.7;
      g.beginPath();
      g.moveTo(2.5, 2);
      g.lineTo(2.5, 9);
      g.moveTo(1.2, 4);
      g.lineTo(3.8, 4);
      g.stroke();
      g.restore();
    }

    g.restore();
  }

  /* ------------------------------------------------------------------
     锤
  ------------------------------------------------------------------ */

  function paintHammer(g, s) {
    g.save();
    g.translate(50, 50);
    g.rotate(-0.5);

    // 柄
    const lg = g.createLinearGradient(-3, 0, 3, 0);
    lg.addColorStop(0, mix(s.shaft, '#000000', 0.45));
    lg.addColorStop(0.5, mix(s.shaft, '#ffffff', 0.15));
    lg.addColorStop(1, mix(s.shaft, '#000000', 0.5));
    g.fillStyle = lg;
    roundRect(g, -2.6, -s.len * 0.16, 5.2, s.len * 0.78, 2.4);
    g.fill();

    // 锤头
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 14;
    const hg = g.createLinearGradient(-18, -12, 18, 12);
    hg.addColorStop(0, mix(s.headCol, '#000000', 0.4));
    hg.addColorStop(0.4, mix(s.headCol, '#ffffff', 0.28));
    hg.addColorStop(1, mix(s.headCol, '#000000', 0.5));
    g.fillStyle = hg;
    roundRect(g, -17, -s.len * 0.24, 34, 15, 3);
    g.fill();
    g.restore();

    // 镔铁纹
    g.strokeStyle = 'rgba(0,0,0,0.28)';
    g.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const xx = -14 + i * 5.4;
      g.beginPath();
      g.moveTo(xx, -s.len * 0.23);
      g.lineTo(xx + 1.5, -s.len * 0.24 + 14);
      g.stroke();
    }

    // 铜箍
    g.fillStyle = s.band;
    roundRect(g, -18, -s.len * 0.245, 5, 16, 1.2);
    g.fill();
    roundRect(g, 13, -s.len * 0.245, 5, 16, 1.2);
    g.fill();

    // 符文
    g.strokeStyle = rgba(s.glow, 0.8);
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-6, -s.len * 0.185);
    g.lineTo(0, -s.len * 0.2);
    g.lineTo(6, -s.len * 0.185);
    g.moveTo(0, -s.len * 0.21);
    g.lineTo(0, -s.len * 0.17);
    g.stroke();

    g.restore();
  }

  /* ------------------------------------------------------------------
     护体（胸甲）
  ------------------------------------------------------------------ */

  function paintArmor(g, s, t) {
    g.save();
    g.translate(50, 52);

    const bodyPath = () => {
      g.beginPath();
      g.moveTo(-17, -22);
      g.quadraticCurveTo(-26, -18, -22, -4);
      g.quadraticCurveTo(-20, 12, -13, 22);
      g.lineTo(0, 26);
      g.lineTo(13, 22);
      g.quadraticCurveTo(20, 12, 22, -4);
      g.quadraticCurveTo(26, -18, 17, -22);
      g.quadraticCurveTo(0, -28, -17, -22);
      g.closePath();
    };

    // 辉光
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 16;
    bodyPath();
    g.fillStyle = rgba(s.glow, 0.35);
    g.fill();
    g.restore();

    // 主体
    bodyPath();
    const bg = g.createLinearGradient(-22, -26, 22, 26);
    bg.addColorStop(0, mix(s.base, '#ffffff', 0.22));
    bg.addColorStop(0.45, s.base);
    bg.addColorStop(1, mix(s.base, '#000000', 0.42));
    g.fillStyle = bg;
    g.fill();

    // 裁剪内画花纹
    g.save();
    bodyPath();
    g.clip();

    // 甲片
    if (s.pattern === 'scale' || s.pattern === 'dragon') {
      g.strokeStyle = rgba(s.trim, 0.55);
      g.lineWidth = 0.7;
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 6; col++) {
          const x = -20 + col * 7 + (row % 2) * 3.5;
          const y = -22 + row * 7;
          g.beginPath();
          g.arc(x, y, 4, Math.PI * 0.1, Math.PI * 0.9);
          g.stroke();
        }
      }
    }
    // 布纹
    if (s.pattern === 'weave') {
      g.strokeStyle = 'rgba(0,0,0,0.16)';
      g.lineWidth = 0.5;
      for (let i = -24; i < 24; i += 3.2) {
        g.beginPath();
        g.moveTo(i, -28);
        g.lineTo(i, 28);
        g.stroke();
        g.beginPath();
        g.moveTo(-24, i);
        g.lineTo(24, i);
        g.stroke();
      }
    }
    // 云纹
    if (s.pattern === 'cloud') {
      g.strokeStyle = rgba(s.trim, 0.6);
      g.lineWidth = 0.9;
      for (let i = 0; i < 4; i++) {
        const yy = -18 + i * 11;
        g.beginPath();
        g.moveTo(-20, yy);
        g.bezierCurveTo(-10, yy - 5, -2, yy + 5, 8, yy);
        g.bezierCurveTo(14, yy - 3, 18, yy + 2, 21, yy);
        g.stroke();
      }
    }
    // 冰裂
    if (s.pattern === 'frost') {
      g.strokeStyle = 'rgba(235,250,255,0.75)';
      g.lineWidth = 0.7;
      for (let i = 0; i < 8; i++) {
        const x = -18 + (i * 5.4) % 36;
        const y = -20 + i * 5;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 5, y + 4);
        g.lineTo(x + 2, y + 8);
        g.stroke();
      }
    }
    // 裂纹（弑神）
    if (s.pattern === 'crack') {
      g.strokeStyle = 'rgba(255,140,120,0.8)';
      g.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(-18 + i * 8, -24);
        g.lineTo(-14 + i * 8, -8);
        g.lineTo(-18 + i * 8, 6);
        g.lineTo(-12 + i * 8, 22);
        g.stroke();
      }
    }
    g.restore();

    // 边缘描线
    bodyPath();
    g.strokeStyle = s.trim;
    g.lineWidth = 1.6;
    g.stroke();

    // 护心镜
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 10;
    const mg = g.createRadialGradient(-2, -8, 1, 0, -6, 9);
    mg.addColorStop(0, mix(s.trim, '#ffffff', 0.6));
    mg.addColorStop(1, s.trim);
    g.fillStyle = mg;
    g.beginPath();
    g.arc(0, -6, 7.5, 0, 6.283);
    g.fill();
    g.restore();
    g.strokeStyle = rgba('#ffffff', 0.55);
    g.lineWidth = 0.9;
    g.beginPath();
    g.arc(0, -6, 7.5, 0, 6.283);
    g.stroke();
    g.beginPath();
    g.arc(0, -6, 3.4, 0, 6.283);
    g.stroke();

    // 腰带
    g.fillStyle = mix(s.trim, '#000000', 0.15);
    roundRect(g, -17, 12, 34, 5, 1.4);
    g.fill();

    // 领口
    if (s.collar === 'high') {
      g.fillStyle = mix(s.base, '#000000', 0.25);
      g.beginPath();
      g.moveTo(-13, -24);
      g.lineTo(-9, -14);
      g.lineTo(0, -10);
      g.lineTo(9, -14);
      g.lineTo(13, -24);
      g.closePath();
      g.fill();
      g.strokeStyle = s.trim;
      g.lineWidth = 1;
      g.stroke();
    } else if (s.collar === 'cross') {
      g.strokeStyle = s.trim;
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(-13, -23);
      g.lineTo(0, -8);
      g.lineTo(13, -23);
      g.stroke();
    } else if (s.collar === 'v') {
      g.strokeStyle = s.trim;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-12, -22);
      g.lineTo(0, -12);
      g.lineTo(12, -22);
      g.stroke();
    }

    // 飘光
    g.save();
    g.globalAlpha = 0.28 + 0.16 * Math.sin(t * 2);
    g.strokeStyle = s.glow;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, 0, 30, 0.6, 2.4);
    g.stroke();
    g.restore();

    g.restore();
  }

  /* ------------------------------------------------------------------
     饰品
  ------------------------------------------------------------------ */

  function paintCharm(g, s, t) {
    g.save();
    g.translate(50, 50);

    if (s.shape === 'pendant') {
      // 挂绳
      g.strokeStyle = s.cord;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-16, -26);
      g.quadraticCurveTo(0, -14, 16, -26);
      g.stroke();

      // 玉体
      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 16;
      const pg = g.createRadialGradient(-2, -2, 2, 0, 4, 18);
      pg.addColorStop(0, mix(s.base, '#ffffff', 0.55));
      pg.addColorStop(0.55, s.base);
      pg.addColorStop(1, mix(s.base, '#000000', 0.45));
      g.fillStyle = pg;
      g.beginPath();
      g.moveTo(0, -8);
      g.bezierCurveTo(16, -4, 18, 14, 0, 26);
      g.bezierCurveTo(-18, 14, -16, -4, 0, -8);
      g.closePath();
      g.fill();
      g.restore();

      g.strokeStyle = s.rim;
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(0, -8);
      g.bezierCurveTo(16, -4, 18, 14, 0, 26);
      g.bezierCurveTo(-18, 14, -16, -4, 0, -8);
      g.stroke();

      // 内纹
      g.strokeStyle = rgba(s.rim, 0.75);
      g.lineWidth = 0.8;
      g.beginPath();
      g.arc(0, 6, 6, 0.3, 5.4);
      g.stroke();
      g.beginPath();
      g.arc(0, 6, 2.6, 0, 6.283);
      g.stroke();

      // 血玉的“心跳”
      if (s.blood) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
        g.globalAlpha = 0.35 + pulse * 0.4;
        const bgr = g.createRadialGradient(0, 8, 1, 0, 8, 14);
        bgr.addColorStop(0, '#ff8a8a');
        bgr.addColorStop(1, 'rgba(255,90,90,0)');
        g.fillStyle = bgr;
        g.beginPath();
        g.arc(0, 8, 14, 0, 6.283);
        g.fill();
        g.globalAlpha = 1;
        g.strokeStyle = 'rgba(255,120,120,0.8)';
        g.lineWidth = 0.8;
        g.beginPath();
        g.moveTo(-4, 8);
        g.lineTo(-1, 8);
        g.lineTo(0, 4);
        g.lineTo(2, 12);
        g.lineTo(3, 8);
        g.lineTo(6, 8);
        g.stroke();
      }

      // 顶珠
      g.fillStyle = s.rim;
      g.beginPath();
      g.arc(0, -9, 2.6, 0, 6.283);
      g.fill();
    }

    if (s.shape === 'talisman') {
      g.save();
      g.rotate(0.08);
      g.shadowColor = s.glow;
      g.shadowBlur = 12;
      const tg = g.createLinearGradient(-14, -26, 14, 26);
      tg.addColorStop(0, mix(s.base, '#ffffff', 0.3));
      tg.addColorStop(0.5, s.base);
      tg.addColorStop(1, mix(s.base, '#000000', 0.3));
      g.fillStyle = tg;
      roundRect(g, -13, -26, 26, 52, 2);
      g.fill();
      g.restore();

      g.strokeStyle = rgba(s.ink, 0.85);
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(0, -20);
      g.lineTo(0, 20);
      g.stroke();
      for (let i = 0; i < (s.rune || 2); i++) {
        const yy = -14 + i * 9;
        g.beginPath();
        g.moveTo(-7, yy);
        g.lineTo(7, yy + 1.6);
        g.stroke();
      }
      g.strokeStyle = rgba(s.ink, 0.55);
      g.lineWidth = 1;
      roundRect(g, -9, -22, 18, 45, 1.5);
      g.stroke();
    }

    if (s.shape === 'ring') {
      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 14;
      g.strokeStyle = s.base;
      g.lineWidth = 5;
      g.beginPath();
      g.arc(0, 4, 15, 0, 6.283);
      g.stroke();
      g.strokeStyle = s.rim;
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(0, 4, 17.5, 0, 6.283);
      g.stroke();
      g.beginPath();
      g.arc(0, 4, 12.5, 0, 6.283);
      g.stroke();
      g.restore();
      // 宝石
      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 16;
      const gg = g.createRadialGradient(-1, -13, 0.5, 0, -11, 8);
      gg.addColorStop(0, '#ffffff');
      gg.addColorStop(0.4, s.gem || s.base);
      gg.addColorStop(1, mix(s.gem || s.base, '#000000', 0.4));
      g.fillStyle = gg;
      g.beginPath();
      g.moveTo(0, -20);
      g.lineTo(7, -11);
      g.lineTo(0, -2);
      g.lineTo(-7, -11);
      g.closePath();
      g.fill();
      g.restore();
    }

    if (s.shape === 'orb') {
      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 22;
      const og = g.createRadialGradient(-5, -6, 1, 0, 0, 20);
      og.addColorStop(0, '#ffffff');
      og.addColorStop(0.3, s.base);
      og.addColorStop(1, mix(s.base, '#000000', 0.55));
      g.fillStyle = og;
      g.beginPath();
      g.arc(0, 0, 18, 0, 6.283);
      g.fill();
      g.restore();

      // 珠内小天地
      g.save();
      g.beginPath();
      g.arc(0, 0, 17, 0, 6.283);
      g.clip();
      g.globalAlpha = 0.5;
      for (let i = 0; i < 5; i++) {
        const a = t * 0.6 + i * 1.25;
        g.strokeStyle = rgba('#ffffff', 0.35);
        g.lineWidth = 0.7;
        g.beginPath();
        g.ellipse(Math.cos(a) * 7, Math.sin(a) * 7, 3.2, 1.6, a, 0, 6.283);
        g.stroke();
      }
      g.restore();

      // 高光
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.beginPath();
      g.ellipse(-6, -7, 3.4, 2.2, -0.6, 0, 6.283);
      g.fill();
    }

    if (s.shape === 'bell') {
      g.strokeStyle = s.rim;
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(0, -26);
      g.lineTo(0, -18);
      g.stroke();

      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 14;
      const bg2 = g.createLinearGradient(-14, -18, 14, 22);
      bg2.addColorStop(0, mix(s.base, '#ffffff', 0.35));
      bg2.addColorStop(0.5, s.base);
      bg2.addColorStop(1, mix(s.base, '#000000', 0.42));
      g.fillStyle = bg2;
      g.beginPath();
      g.moveTo(0, -19);
      g.bezierCurveTo(11, -17, 14, -2, 15, 14);
      g.lineTo(-15, 14);
      g.bezierCurveTo(-14, -2, -11, -17, 0, -19);
      g.closePath();
      g.fill();
      g.restore();

      g.strokeStyle = s.rim;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-15, 14);
      g.lineTo(15, 14);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -19);
      g.bezierCurveTo(11, -17, 14, -2, 15, 14);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -19);
      g.bezierCurveTo(-11, -17, -14, -2, -15, 14);
      g.stroke();

      // 声波
      g.save();
      g.globalAlpha = 0.3 + 0.25 * Math.sin(t * 3);
      g.strokeStyle = s.glow;
      g.lineWidth = 0.9;
      for (let i = 1; i <= 2; i++) {
        g.beginPath();
        g.arc(0, 16, 10 + i * 5, 0.3, Math.PI - 0.3);
        g.stroke();
      }
      g.restore();

      g.fillStyle = s.rim;
      g.beginPath();
      g.arc(0, 18, 3, 0, 6.283);
      g.fill();
    }

    if (s.shape === 'seal') {
      g.save();
      g.shadowColor = s.glow;
      g.shadowBlur = 14;
      const sg = g.createLinearGradient(-18, -18, 18, 18);
      sg.addColorStop(0, mix(s.base, '#ffffff', 0.35));
      sg.addColorStop(0.5, s.base);
      sg.addColorStop(1, mix(s.base, '#000000', 0.4));
      g.fillStyle = sg;
      roundRect(g, -17, -17, 34, 34, 3);
      g.fill();
      g.restore();

      g.strokeStyle = s.rim;
      g.lineWidth = 1.8;
      roundRect(g, -17, -17, 34, 34, 3);
      g.stroke();
      g.lineWidth = 1;
      roundRect(g, -12, -12, 24, 24, 2);
      g.stroke();

      // 印文
      g.strokeStyle = rgba(s.rim, 0.9);
      g.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-7, -7 + i * 7);
        g.lineTo(7, -7 + i * 7);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(0, -9);
      g.lineTo(0, 9);
      g.stroke();
    }

    g.restore();
  }

  /* ------------------------------------------------------------------
     服饰（长袍）
  ------------------------------------------------------------------ */

  function paintRobe(g, s, t) {
    g.save();
    g.translate(50, 50);

    const robe = () => {
      g.beginPath();
      g.moveTo(-9, -26);
      g.quadraticCurveTo(-16, -24, -21, -14);
      g.quadraticCurveTo(-28, 2, -24, 24);
      g.quadraticCurveTo(-12, 30, 0, 30);
      g.quadraticCurveTo(12, 30, 24, 24);
      g.quadraticCurveTo(28, 2, 21, -14);
      g.quadraticCurveTo(16, -24, 9, -26);
      g.quadraticCurveTo(0, -30, -9, -26);
      g.closePath();
    };

    // 辉光
    g.save();
    g.shadowColor = s.glow;
    g.shadowBlur = 16;
    robe();
    g.fillStyle = rgba(s.glow, 0.3);
    g.fill();
    g.restore();

    robe();
    const rg = g.createLinearGradient(-24, -28, 24, 30);
    rg.addColorStop(0, mix(s.base, '#ffffff', 0.25));
    rg.addColorStop(0.45, s.base);
    rg.addColorStop(1, mix(s.dark, '#000000', 0.3));
    g.fillStyle = rg;
    g.fill();

    g.save();
    robe();
    g.clip();

    // 花纹
    const pc = rgba(s.accent, 0.7);
    g.strokeStyle = pc;
    g.lineWidth = 0.8;
    if (s.pattern === 'cloud') {
      for (let i = 0; i < 4; i++) {
        const yy = -18 + i * 12;
        g.beginPath();
        g.moveTo(-24, yy);
        g.bezierCurveTo(-12, yy - 6, -2, yy + 6, 10, yy);
        g.bezierCurveTo(16, yy - 4, 20, yy + 2, 24, yy);
        g.stroke();
      }
    } else if (s.pattern === 'wave') {
      for (let i = 0; i < 5; i++) {
        const yy = -16 + i * 10;
        g.beginPath();
        for (let x = -24; x <= 24; x += 4) {
          const y2 = yy + Math.sin((x + i * 5) * 0.4) * 2.2;
          if (x === -24) g.moveTo(x, y2); else g.lineTo(x, y2);
        }
        g.stroke();
      }
    } else if (s.pattern === 'bamboo') {
      for (let i = 0; i < 3; i++) {
        const xx = -14 + i * 14;
        g.beginPath();
        g.moveTo(xx, 26);
        g.lineTo(xx + 2, -24);
        g.stroke();
        for (let k = 0; k < 4; k++) {
          const yy = 22 - k * 12;
          g.beginPath();
          g.ellipse(xx + 6, yy, 4, 1.6, -0.5, 0, 6.283);
          g.stroke();
        }
      }
    } else if (s.pattern === 'flame') {
      for (let i = 0; i < 5; i++) {
        const xx = -20 + i * 10;
        g.beginPath();
        g.moveTo(xx, 28);
        g.quadraticCurveTo(xx + 5, 10, xx + 2, -4);
        g.quadraticCurveTo(xx - 5, 10, xx - 1, 28);
        g.stroke();
      }
    } else if (s.pattern === 'frost') {
      for (let i = 0; i < 9; i++) {
        const x = -20 + (i * 11) % 40;
        const y = -20 + i * 5.5;
        g.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = k * 1.05 + i;
          g.moveTo(x, y);
          g.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
        }
        g.stroke();
      }
    } else if (s.pattern === 'star' || s.pattern === 'moon') {
      for (let i = 0; i < 12; i++) {
        const x = (-22 + (i * 37) % 44);
        const y = (-24 + (i * 53) % 52);
        const rr = 0.7 + (i % 3) * 0.5;
        g.fillStyle = rgba(s.accent, 0.5 + 0.4 * Math.abs(Math.sin(t * 1.4 + i)));
        g.beginPath();
        g.arc(x, y, rr, 0, 6.283);
        g.fill();
      }
      if (s.pattern === 'moon') {
        g.fillStyle = rgba(s.accent, 0.45);
        g.beginPath();
        g.arc(8, -14, 9, 0, 6.283);
        g.fill();
        g.fillStyle = s.base;
        g.beginPath();
        g.arc(12, -17, 8, 0, 6.283);
        g.fill();
      }
    } else if (s.pattern === 'crane') {
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-12, 6);
      g.quadraticCurveTo(-2, -6, 10, 2);
      g.quadraticCurveTo(2, 4, -6, 12);
      g.stroke();
      g.beginPath();
      g.moveTo(10, 2);
      g.lineTo(15, -3);
      g.stroke();
    } else if (s.pattern === 'ghost') {
      g.globalAlpha = 0.5;
      for (let i = 0; i < 4; i++) {
        const yy = -14 + i * 12;
        g.beginPath();
        g.moveTo(-18, yy);
        g.bezierCurveTo(-6, yy - 8, 6, yy + 8, 18, yy);
        g.stroke();
      }
      g.globalAlpha = 1;
    } else if (s.pattern === 'script') {
      g.lineWidth = 0.7;
      for (let i = 0; i < 14; i++) {
        const x = -18 + (i * 17) % 36;
        const y = -22 + i * 3.6;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 4, y);
        g.moveTo(x + 2, y - 2);
        g.lineTo(x + 2, y + 2);
        g.stroke();
      }
    }

    // 衣褶
    g.strokeStyle = rgba('#000000', 0.18);
    g.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(-16 + i * 11, 28);
      g.quadraticCurveTo(-12 + i * 11, 2, -9 + i * 9, -18);
      g.stroke();
    }
    g.restore();

    // 领口交叠
    g.strokeStyle = s.accent;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-10, -24);
    g.lineTo(1, -12);
    g.lineTo(11, -24);
    g.stroke();
    g.lineWidth = 1;
    g.strokeStyle = rgba(s.accent, 0.6);
    g.beginPath();
    g.moveTo(-13, -22);
    g.lineTo(1, -8);
    g.lineTo(14, -22);
    g.stroke();

    // 腰带
    g.fillStyle = s.accent;
    roundRect(g, -15, 6, 30, 5, 1.6);
    g.fill();
    g.fillStyle = mix(s.accent, '#ffffff', 0.4);
    g.beginPath();
    g.arc(0, 8.5, 2.6, 0, 6.283);
    g.fill();

    // 袖
    g.fillStyle = mix(s.dark, '#000000', 0.1);
    g.beginPath();
    g.moveTo(-21, -14);
    g.quadraticCurveTo(-32, -4, -29, 14);
    g.quadraticCurveTo(-24, 16, -22, 8);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(21, -14);
    g.quadraticCurveTo(32, -4, 29, 14);
    g.quadraticCurveTo(24, 16, 22, 8);
    g.closePath();
    g.fill();
    g.strokeStyle = rgba(s.accent, 0.55);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-29, 14);
    g.quadraticCurveTo(-24, 16, -22, 8);
    g.moveTo(29, 14);
    g.quadraticCurveTo(24, 16, 22, 8);
    g.stroke();

    // 下摆描边
    g.strokeStyle = s.accent;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-24, 24);
    g.quadraticCurveTo(-12, 30, 0, 30);
    g.quadraticCurveTo(12, 30, 24, 24);
    g.stroke();

    g.restore();
  }

  /* ------------------------------------------------------------------
     对外接口
  ------------------------------------------------------------------ */

  function paint(cv, id, opt) {
    if (!cv || !cv.getContext) return false;
    const g = cv.getContext('2d');
    const w = cv.width || 64, h = cv.height || 64;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);

    const s = specOf(id);
    const q = (opt && typeof opt.q === 'number') ? opt.q : (Gear.defQ(id));
    const Q = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, q))];
    const t = (opt && opt.t) || 0;

    // 统一到 100×100 空间
    const S = Math.min(w, h) / 100;
    g.save();
    g.translate((w - 100 * S) / 2, (h - 100 * S) / 2);
    g.scale(S, S);

    if (!s) {
      g.fillStyle = Q.color;
      g.beginPath();
      g.arc(50, 50, 20, 0, 6.283);
      g.fill();
      g.restore();
      return false;
    }

    paintBackdrop(g, Q.color, t);

    if (s.shape === 'sword' || s.shape === 'saber') paintSword(g, s, Q.color, t);
    else if (s.shape === 'staff') paintStaff(g, s);
    else if (s.shape === 'bone') paintBone(g, s, t);
    else if (s.shape === 'hammer') paintHammer(g, s);
    else if (s.shape === 'armor') paintArmor(g, s, t);
    else if (s.shape === 'robe') paintRobe(g, s, t);
    else paintCharm(g, s, t);

    g.restore();

    // 品质外框
    g.save();
    const S2 = Math.min(w, h) / 100;
    g.translate((w - 100 * S2) / 2, (h - 100 * S2) / 2);
    g.scale(S2, S2);
    g.strokeStyle = rgba(Q.color, 0.55);
    g.lineWidth = 1.4;
    roundRect(g, 1.5, 1.5, 97, 97, 4);
    g.stroke();
    g.restore();

    return true;
  }

  function has(id) { return !!specOf(id); }

  function trait(id) { return GEAR_TRAIT[id] || ''; }

  return { paint, has, trait, specOf };
})();
