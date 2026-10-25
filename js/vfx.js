'use strict';

/* =========================================================================
   青云界 · 特效与角色增强（v0.3）
   战斗特效重做 / 角色外围强化 / NPC 标识
   ========================================================================= */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t;

/* ============================== 特效总派发 ============================== */

function drawEffects2(g, effects, time, screen) {
  for (const e of effects) {
    const k = clamp01(e.life / e.maxLife);
    const a = k;
    switch (e.type) {
      case 'slash': drawSlash(g, e, k); break;
      case 'crescent': drawCrescent(g, e, k); break;
      case 'swordqi': drawSwordQi(g, e, k); break;
      case 'swordrain': drawSwordRain(g, e, k); break;
      case 'impact': drawImpact(g, e, k); break;
      case 'crack': drawGroundCrack(g, e, k); break;
      case 'elem': drawElem(g, e, k); break;
      case 'ring': drawRing(g, e, k); break;
      case 'shock': drawShock(g, e, k); break;
      case 'proj': drawProj(g, e, k); break;
      case 'spark': drawSpark(g, e, k); break;
      case 'dmg': drawDmg(g, e, k); break;
      case 'heal': drawHealFx(g, e, k); break;
      case 'rune': drawRuneFx(g, e, k); break;
      case 'streak': drawStreaks(g, e, k); break;
      case 'bolt': drawBolt(g, e, k); break;
      case 'shard': drawShard(g, e, k); break;
      case 'after': drawAfter(g, e, k); break;
      case 'buff': drawBuff(g, e, k); break;
      default: break;
    }
  }
}

/* ------------------------------ 刀光 ------------------------------ */

function drawSlash(g, e, k) {
  const p = 1 - k;
  const sweep = Math.min(1, p * 1.5);
  const start = e.angle - e.arc / 2;
  const end = start + e.arc * sweep;
  const fade = Math.pow(k, 1.4);
  const w = e.w || 5;

  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';

  // 外层柔光
  g.strokeStyle = e.color + (0.14 * fade).toFixed(3) + ')';
  g.lineWidth = w * 5;
  g.beginPath(); g.arc(0, 0, e.r * 0.96, start, end); g.stroke();

  // 中层刀身
  g.strokeStyle = e.color + (0.55 * fade).toFixed(3) + ')';
  g.lineWidth = w * 1.9;
  g.beginPath(); g.arc(0, 0, e.r, start, end); g.stroke();

  // 内层白光
  g.strokeStyle = 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')';
  g.lineWidth = Math.max(1.2, w * 0.62);
  g.beginPath(); g.arc(0, 0, e.r * 1.01, end - Math.min(e.arc * 0.55, 1.1), end); g.stroke();

  // 刃口拖尾（渐变扇形）
  const trailStart = Math.max(start, end - e.arc * 0.6);
  const grd = g.createLinearGradient(
    Math.cos(end) * e.r * 0.2, Math.sin(end) * e.r * 0.2,
    Math.cos(end) * e.r, Math.sin(end) * e.r
  );
  grd.addColorStop(0, e.color + '0)');
  grd.addColorStop(1, e.color + (0.30 * fade).toFixed(3) + ')');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(0, 0, e.r, trailStart, end);
  g.arc(0, 0, e.r * 0.34, end, trailStart, true);
  g.closePath();
  g.fill();

  // 前缘亮点
  if (p < 0.75) {
    const hx = Math.cos(end) * e.r;
    const hy = Math.sin(end) * e.r;
    const hg = g.createRadialGradient(hx, hy, 0, hx, hy, w * 5);
    hg.addColorStop(0, 'rgba(255,255,255,0.95)');
    hg.addColorStop(0.4, e.color + '0.6)');
    hg.addColorStop(1, e.color + '0)');
    g.fillStyle = hg;
    g.beginPath(); g.arc(hx, hy, w * 5, 0, 6.2832); g.fill();
  }
  g.restore();
}

/* ------------------------------ 环 / 冲击波 ------------------------------ */

/* ---------------- 新月刀气（比普通刀光更厚重，带尾焰） ---------------- */

function drawCrescent(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.25);
  const r = (e.r || 80) * (0.72 + easeOut(p) * 0.42);
  const thick = (e.w || 10) * (0.6 + (1 - k) * 0.9);
  const arc = e.arc || 1.6;
  const start = (e.angle || 0) - arc / 2;

  g.save();
  g.translate(e.x, e.y);
  g.rotate(0);
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';

  // 外焰
  g.strokeStyle = e.color + (0.13 * fade).toFixed(3) + ')';
  g.lineWidth = thick * 3.4;
  g.beginPath(); g.arc(0, 0, r, start, start + arc); g.stroke();

  // 主体
  const grd = g.createLinearGradient(
    Math.cos(start) * r, Math.sin(start) * r,
    Math.cos(start + arc) * r, Math.sin(start + arc) * r);
  grd.addColorStop(0, e.color + '0)');
  grd.addColorStop(0.45, e.color + (0.85 * fade).toFixed(3) + ')');
  grd.addColorStop(1, e.color + (0.2 * fade).toFixed(3) + ')');
  g.strokeStyle = grd;
  g.lineWidth = thick;
  g.beginPath(); g.arc(0, 0, r, start, start + arc); g.stroke();

  // 内侧白芯
  g.strokeStyle = 'rgba(255,255,255,' + (0.8 * fade).toFixed(3) + ')';
  g.lineWidth = Math.max(1, thick * 0.34);
  g.beginPath(); g.arc(0, 0, r * 0.985, start + arc * 0.18, start + arc * 0.92); g.stroke();

  // 前缘高亮
  const hx = Math.cos(start + arc) * r, hy = Math.sin(start + arc) * r;
  const hg = g.createRadialGradient(hx, hy, 0, hx, hy, thick * 3.4);
  hg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')');
  hg.addColorStop(0.45, e.color + (0.5 * fade).toFixed(3) + ')');
  hg.addColorStop(1, e.color + '0)');
  g.fillStyle = hg;
  g.beginPath(); g.arc(hx, hy, thick * 3.4, 0, 6.2832); g.fill();

  g.restore();
}

/* ---------------- 命中爆点（四芒星 + 环） ---------------- */

function drawImpact(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.6);
  const r = (e.r || 16) * (0.5 + easeOut(p) * 1.5);
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';

  // 四芒星
  g.fillStyle = e.color + (0.9 * fade).toFixed(3) + ')';
  g.beginPath();
  const sp = r * (e.crit ? 1.5 : 1);
  g.moveTo(0, -sp * 1.5);
  g.quadraticCurveTo(sp * 0.16, -sp * 0.18, sp * 1.5, 0);
  g.quadraticCurveTo(sp * 0.16, sp * 0.18, 0, sp * 1.5);
  g.quadraticCurveTo(-sp * 0.16, sp * 0.18, -sp * 1.5, 0);
  g.quadraticCurveTo(-sp * 0.16, -sp * 0.18, 0, -sp * 1.5);
  g.closePath();
  g.fill();

  // 内核
  g.fillStyle = 'rgba(255,255,255,' + (0.95 * fade).toFixed(3) + ')';
  g.beginPath(); g.arc(0, 0, r * 0.34, 0, 6.2832); g.fill();

  // 扩散环
  g.strokeStyle = e.color + (0.55 * fade).toFixed(3) + ')';
  g.lineWidth = 1.6;
  g.beginPath(); g.arc(0, 0, r * 1.5, 0, 6.2832); g.stroke();

  // 细碎火花
  for (let i = 0; i < (e.crit ? 7 : 4); i++) {
    const a = i * 1.6 + (e.seed || 0);
    const d = r * (0.9 + (i % 3) * 0.4);
    g.fillStyle = e.color + (0.6 * fade).toFixed(3) + ')';
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d * 0.7, 1.4, 0, 6.2832);
    g.fill();
  }
  g.restore();
}

/* ---------------- 地裂（重击落地） ---------------- */

function drawGroundCrack(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.8);
  const r = (e.r || 70) * easeOut(p);
  g.save();
  g.translate(e.x, e.y);
  g.scale(1, 0.42);
  g.strokeStyle = e.color + (0.75 * fade).toFixed(3) + ')';
  g.lineCap = 'round';
  const n = 7;
  const seed = e.seed || 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + seed;
    g.lineWidth = 2.4 - (i % 2) * 0.8;
    g.beginPath();
    g.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
    let rr = r * 0.12;
    let aa = a;
    for (let s = 0; s < 3; s++) {
      rr += r * 0.3;
      aa += (Math.sin(i * 7.3 + s * 2.1 + seed) * 0.18);
      g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
    }
    g.stroke();
  }
  // 内圈辉光
  g.strokeStyle = e.color + (0.5 * fade).toFixed(3) + ')';
  g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, r * 0.9, 0, 6.2832); g.stroke();
  g.restore();
}

/* ---------------- 流派元素点缀 ---------------- */

function drawElem(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.4);
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  const kind = e.kind || 'sword';
  const n = e.count || 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + (e.seed || 0) + p * 1.4;
    const d = (e.r || 40) * (0.3 + easeOut(p) * 0.9) * (0.7 + ((i * 37) % 10) / 14);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d * 0.62 - p * 16;
    g.fillStyle = e.color + (0.85 * fade).toFixed(3) + ')';
    if (kind === 'sword') {
      // 花瓣
      g.save();
      g.translate(x, y);
      g.rotate(a * 2 + p * 3);
      g.beginPath();
      g.ellipse(0, 0, 2.6, 1.2, 0, 0, 6.2832);
      g.fill();
      g.restore();
    } else if (kind === 'mage') {
      // 符箓小方块
      g.save();
      g.translate(x, y);
      g.rotate(a + p * 2);
      g.fillRect(-1.6, -2.6, 3.2, 5.2);
      g.restore();
    } else if (kind === 'body') {
      // 尘土碎块
      g.beginPath();
      g.arc(x, y, 1.6 + (i % 3) * 0.7, 0, 6.2832);
      g.fill();
    } else {
      // 灵光点
      g.beginPath();
      g.arc(x, y, 1.2 + (i % 2), 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
}


function drawRing(g, e, k) {
  const p = 1 - k;
  const r = e.r * (0.28 + easeOut(p) * 0.85);
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = e.color + (0.75 * k).toFixed(3) + ')';
  g.lineWidth = 2 + (1 - k) * 7;
  g.beginPath(); g.ellipse(0, 0, r, r * 0.42, 0, 0, 6.2832); g.stroke();
  g.strokeStyle = e.color + (0.28 * k).toFixed(3) + ')';
  g.lineWidth = 1.6;
  g.beginPath(); g.ellipse(0, 0, r * 0.72, r * 0.3, 0, 0, 6.2832); g.stroke();
  g.restore();
}

function drawShock(g, e, k) {
  const p = 1 - k;
  const r = e.r * easeOut(p);
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  // 地面冲击环
  g.strokeStyle = e.color + (0.8 * k).toFixed(3) + ')';
  g.lineWidth = 3 + (1 - k) * 9;
  g.beginPath(); g.ellipse(0, 0, r, r * 0.4, 0, 0, 6.2832); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,' + (0.5 * k).toFixed(3) + ')';
  g.lineWidth = 1.6;
  g.beginPath(); g.ellipse(0, 0, r * 0.94, r * 0.37, 0, 0, 6.2832); g.stroke();

  // 裂纹
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(40,30,20,' + (0.45 * k).toFixed(3) + ')';
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.2832 + (e.seed || 0);
    const len = e.r * (0.4 + ((i * 37) % 60) / 100);
    g.beginPath();
    g.moveTo(Math.cos(a) * e.r * 0.12, Math.sin(a) * e.r * 0.05);
    g.lineTo(Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.24);
    g.lineTo(Math.cos(a + 0.1) * len, Math.sin(a + 0.1) * len * 0.4);
    g.stroke();
  }
  g.restore();
}

/* ------------------------------ 弹道 ------------------------------ */

function drawProj(g, e, k) {
  g.save();
  g.globalCompositeOperation = 'lighter';

  // 拖尾
  if (e.trail && e.trail.length > 1) {
    for (let i = 0; i < e.trail.length; i++) {
      const t = e.trail[i];
      const ta = (1 - i / e.trail.length) * 0.45 * k;
      g.fillStyle = e.color2 || 'rgba(150,210,255,0.5)';
      g.globalAlpha = ta;
      g.beginPath();
      g.ellipse(t.x, t.y, e.w * (0.4 + i / e.trail.length * 0.7),
        e.h * (0.4 + i / e.trail.length * 0.7), 0, 0, 6.2832);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  g.translate(e.x, e.y);
  g.rotate(e.angle || 0);

  // 外层光晕
  const og = g.createRadialGradient(0, 0, 1, 0, 0, e.w * 2.6);
  og.addColorStop(0, 'rgba(255,255,255,0.95)');
  og.addColorStop(0.3, e.color || 'rgba(160,215,255,0.85)');
  og.addColorStop(1, 'rgba(80,140,220,0)');
  g.fillStyle = og;
  g.beginPath(); g.ellipse(0, 0, e.w * 2.6, e.h * 2.6, 0, 0, 6.2832); g.fill();

  // 核心
  g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(0, 0, e.w * 0.46, e.h * 0.46, 0, 0, 6.2832); g.fill();

  // 定向尖头
  g.fillStyle = e.color2 || 'rgba(180,225,255,0.9)';
  g.beginPath();
  g.moveTo(e.w * 2.1, 0);
  g.lineTo(0, e.h * 0.7);
  g.lineTo(0, -e.h * 0.7);
  g.closePath();
  g.fill();

  g.restore();
}

/* ------------------------------ 火星 ------------------------------ */

function drawSpark(g, e, k) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = k;
  g.fillStyle = e.color || '#fff0c0';
  g.beginPath();
  g.arc(e.x, e.y, Math.max(0.4, e.r * k), 0, 6.2832);
  g.fill();
  g.restore();
  g.globalAlpha = 1;
}

/* ------------------------------ 伤害数字 ------------------------------ */

function drawDmg(g, e, k) {
  const p = 1 - k;
  const pop = p < 0.18 ? 1 + (0.18 - p) / 0.18 * 0.5 : 1;
  const alpha = k < 0.25 ? k / 0.25 : 1;
  g.save();
  g.globalAlpha = alpha;
  g.translate(e.x, e.y);
  g.scale(pop, pop);
  g.font = 'bold ' + (e.big ? 23 : 16) + 'px "STKaiti","KaiTi",serif';
  g.textAlign = 'center';
  g.lineWidth = 4;
  g.strokeStyle = 'rgba(16,10,6,0.85)';
  g.strokeText(e.text, 0, 0);
  if (e.big) {
    const grd = g.createLinearGradient(0, -14, 0, 6);
    grd.addColorStop(0, '#fff3c4');
    grd.addColorStop(1, '#ff9a4a');
    g.fillStyle = grd;
  } else {
    g.fillStyle = e.color || '#ffe9a8';
  }
  g.fillText(e.text, 0, 0);
  g.restore();
  g.globalAlpha = 1;
}

/* ------------------------------ 治疗 ------------------------------ */

function drawHealFx(g, e, k) {
  const p = 1 - k;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const r = (e.r || 60) * (0.34 + i * 0.22) * (0.6 + easeOut(p) * 0.8);
    g.strokeStyle = 'rgba(150,255,190,' + (0.6 * k).toFixed(3) + ')';
    g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(0, 0, r, r * 0.42, 0, 0, 6.2832); g.stroke();
  }
  // 上升的光点
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.2832;
    const rr = (e.r || 60) * 0.5;
    const yy = -easeOut(p) * 70 * (0.5 + (i % 3) * 0.25);
    g.fillStyle = 'rgba(190,255,215,' + (0.8 * k).toFixed(3) + ')';
    g.beginPath();
    g.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.4 + yy, 2.2, 0, 6.2832);
    g.fill();
  }
  g.restore();
}

/* ------------------------------ 法阵 ------------------------------ */

function drawRuneFx(g, e, k) {
  const p = 1 - k;
  const grow = Math.min(1, p * 4);
  const r = e.r * grow;
  const spin = (e.spin || 0) + p * 2.2;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  g.scale(1, 0.45);

  // 外环
  g.strokeStyle = e.color + (0.75 * k).toFixed(3) + ')';
  g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.stroke();
  g.lineWidth = 1.4;
  g.beginPath(); g.arc(0, 0, r * 0.88, 0, 6.2832); g.stroke();
  g.beginPath(); g.arc(0, 0, r * 0.52, 0, 6.2832); g.stroke();

  // 符文刻度
  for (let i = 0; i < 12; i++) {
    const a = spin + (i / 12) * 6.2832;
    const r0 = r * (i % 3 === 0 ? 0.66 : 0.74);
    const r1 = r * 0.86;
    g.strokeStyle = e.color + ((i % 3 === 0 ? 0.9 : 0.45) * k).toFixed(3) + ')';
    g.lineWidth = i % 3 === 0 ? 2.6 : 1.4;
    g.beginPath();
    g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.stroke();
  }

  // 内接三角（法阵感）
  g.strokeStyle = e.color + (0.5 * k).toFixed(3) + ')';
  g.lineWidth = 1.8;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = spin * 0.6 + (i / 6) * 6.2832;
    const rr = r * 0.52;
    if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.stroke();

  g.restore();
}

/* ------------------------------ 放射光条（大招） ------------------------------ */

function drawStreaks(g, e, k) {
  const p = 1 - k;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  const n = e.count || 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + (e.seed || 0);
    const len = e.r * (0.4 + ((i * 53) % 100) / 160) * easeOut(Math.min(1, p * 1.6));
    const wdt = 1.4 + ((i * 29) % 40) / 22;
    g.strokeStyle = e.color + (0.55 * k).toFixed(3) + ')';
    g.lineWidth = wdt;
    g.beginPath();
    g.moveTo(Math.cos(a) * len * 0.18, Math.sin(a) * len * 0.18);
    g.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    g.stroke();
  }
  // 中心强光
  const cg = g.createRadialGradient(0, 0, 1, 0, 0, e.r * 0.5);
  cg.addColorStop(0, 'rgba(255,255,255,' + (0.75 * k).toFixed(3) + ')');
  cg.addColorStop(0.5, e.color + (0.35 * k).toFixed(3) + ')');
  cg.addColorStop(1, e.color + '0)');
  g.fillStyle = cg;
  g.beginPath(); g.arc(0, 0, e.r * 0.5, 0, 6.2832); g.fill();
  g.restore();
}

/* ------------------------------ 雷电 ------------------------------ */

function drawBolt(g, e, k) {
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  const a = k;
  const top = -(e.h || 260);

  function bolt(x0, y0, x1, y1, depth, seed) {
    const rnd = makeRng(seed);
    const seg = 6 + depth * 2;
    const pts = [[x0, y0]];
    for (let i = 1; i < seg; i++) {
      const t = i / seg;
      pts.push([
        x0 + (x1 - x0) * t + (rnd() - 0.5) * 22 * (1 - Math.abs(t - 0.5) * 1.4),
        y0 + (y1 - y0) * t
      ]);
    }
    pts.push([x1, y1]);
    const draw = (w, alpha) => {
      g.strokeStyle = 'rgba(225,215,255,' + (alpha * a).toFixed(3) + ')';
      g.lineWidth = w;
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    };
    draw(depth === 0 ? 7 : 2.5, 0.30);
    draw(depth === 0 ? 2.6 : 1.2, 0.95);

    // 分叉
    if (depth < 2) {
      for (let b = 0; b < 2; b++) {
        const idx = 2 + Math.floor(rnd() * (pts.length - 4));
        const bp = pts[idx] || [0, 0];
        bolt(bp[0], bp[1], bp[0] + (rnd() - 0.5) * 90, bp[1] + 50 + rnd() * 60,
          depth + 1, seed + 977 * (b + 1));
      }
    }
  }
  bolt(0, top, 0, 0, 0, e.seed || 13);

  // 落点光环
  g.strokeStyle = 'rgba(200,180,255,' + (0.8 * a).toFixed(3) + ')';
  g.lineWidth = 3;
  g.beginPath(); g.ellipse(0, 0, e.r * (0.6 + (1 - k) * 0.5), e.r * 0.4 * (0.6 + (1 - k) * 0.5), 0, 0, 6.2832); g.stroke();

  const cg = g.createRadialGradient(0, 0, 1, 0, 0, e.r);
  cg.addColorStop(0, 'rgba(230,220,255,' + (0.6 * a).toFixed(3) + ')');
  cg.addColorStop(1, 'rgba(160,140,255,0)');
  g.fillStyle = cg;
  g.beginPath(); g.ellipse(0, 0, e.r, e.r * 0.45, 0, 0, 6.2832); g.fill();

  g.restore();
}

/* ------------------------------ 碎片 ------------------------------ */

function drawShard(g, e, k) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = k;
  g.fillStyle = e.color || 'rgba(200,230,255,0.8)';
  g.translate(e.x, e.y);
  g.rotate(e.rot || 0);
  g.beginPath();
  g.moveTo(-e.r, 0);
  g.lineTo(0, -e.r * 0.5);
  g.lineTo(e.r, 0);
  g.lineTo(0, e.r * 0.5);
  g.closePath();
  g.fill();
  g.restore();
  g.globalAlpha = 1;
}

/* ------------------------------ 残影 ------------------------------ */

function drawAfter(g, e, k) {
  const o = e.figure;
  if (!o) return;
  g.save();
  g.globalAlpha = 0.42 * k;
  g.globalCompositeOperation = 'lighter';
  drawFigure(g, e.x, e.y, o);
  g.restore();
  g.globalAlpha = 1;
}

/* ------------------------------ 增益光环 ------------------------------ */

function drawBuff(g, e, k) {
  const p = 1 - k;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = e.color + (0.5 * k).toFixed(3) + ')';
  g.lineWidth = 2;
  const r = (e.r || 30) * (1 + Math.sin(p * 6) * 0.06);
  g.beginPath(); g.ellipse(0, 0, r, r * 0.4, 0, 0, 6.2832); g.stroke();
  g.restore();
}

/* ============================== 云雾层 ============================== */

/** 屏幕空间的流动云雾（两层视差），用于营造仙气 */
function drawMist(g, cam, viewW, viewH, time, alpha) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 2; layer++) {
    const par = layer === 0 ? 0.30 : 0.62;
    const speed = layer === 0 ? 6 : 13;
    const yBase = viewH * (0.30 + layer * 0.30);
    const n = layer === 0 ? 6 : 5;
    for (let i = 0; i < n; i++) {
      const seed = i * 137 + layer * 53 + 19;
      const w = 280 + (seed % 5) * 110;
      const h = 70 + (seed % 3) * 26;
      const span = viewW + w * 2;
      let x = (seed * 97 + time * speed - cam.x * par * 0.6) % span;
      if (x < 0) x += span;
      x -= w;
      const y = yBase + Math.sin(time * 0.28 + seed * 0.7) * 26;
      const grd = g.createRadialGradient(x, y, 1, x, y, w * 0.5);
      grd.addColorStop(0, 'rgba(205,230,255,' + (alpha * 0.55).toFixed(3) + ')');
      grd.addColorStop(0.5, 'rgba(190,220,250,' + (alpha * 0.26).toFixed(3) + ')');
      grd.addColorStop(1, 'rgba(180,215,250,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, 6.2832);
      g.fill();
    }
  }
  g.restore();
}

/** 流动云影（压在地面上，形成明暗对比） */
function drawCloudShadow(g, cam, viewW, viewH, time, alpha) {
  g.save();
  g.fillStyle = 'rgba(20,26,40,1)';
  g.globalAlpha = alpha;
  for (let i = 0; i < 4; i++) {
    const seed = i * 211 + 31;
    const w = 380 + (seed % 4) * 160;
    const h = 200 + (seed % 3) * 90;
    const span = viewW + w * 2;
    let x = (seed * 131 + time * 9 - cam.x * 0.45) % span;
    if (x < 0) x += span;
    x -= w;
    const y = viewH * 0.42 + Math.sin(time * 0.16 + seed) * 90;
    const grd = g.createRadialGradient(x, y, 1, x, y, w * 0.5);
    grd.addColorStop(0, 'rgba(20,26,40,0.9)');
    grd.addColorStop(0.6, 'rgba(20,26,40,0.45)');
    grd.addColorStop(1, 'rgba(20,26,40,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, 6.2832);
    g.fill();
  }
  g.restore();
}

/* ============================== 敌方弹道 / 预警 ============================== */

function drawEnemyProjs(g, list) {
  if (!list) return;
  for (const p of list) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r * 3.2);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.35, p.color + '0.85)');
    grd.addColorStop(1, p.color + '0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(p.x, p.y, p.r * 3.2, 0, 6.2832); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(p.x, p.y, p.r * 0.42, 0, 6.2832); g.fill();
    g.restore();
  }
}

function drawTelegraphs(g, list, time) {
  if (!list) return;
  for (const t of list) {
    const p = Math.min(1, t.t / t.warn);
    const after = t.fired ? Math.min(1, (t.t - t.warn) / 0.4) : 0;
    const alpha = t.fired ? (1 - after) : 1;

    g.save();
    g.globalCompositeOperation = 'lighter';

    if (t.type === 'line') {
      g.translate(t.x, t.y);
      g.rotate(t.angle);
      const w = t.width;
      // 底色
      g.fillStyle = 'rgba(255,60,40,' + (0.10 * alpha).toFixed(3) + ')';
      g.fillRect(0, -w / 2, t.len, w);
      // 充能填充
      g.fillStyle = 'rgba(255,70,50,' + (0.28 * alpha).toFixed(3) + ')';
      g.fillRect(0, -w / 2, t.len * p, w);
      // 边框
      g.strokeStyle = 'rgba(255,90,70,' + (0.85 * alpha).toFixed(3) + ')';
      g.lineWidth = 3;
      g.strokeRect(0, -w / 2, t.len, w);
      // 中线
      g.strokeStyle = 'rgba(255,140,120,' + (0.6 * alpha).toFixed(3) + ')';
      g.lineWidth = 1.6;
      g.setLineDash([14, 10]);
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(t.len, 0);
      g.stroke();
      g.setLineDash([]);
    } else {
      // 环形预警
      g.translate(t.x, t.y);
      g.scale(1, 0.5);
      g.fillStyle = 'rgba(255,60,40,' + (0.12 * alpha).toFixed(3) + ')';
      g.beginPath(); g.arc(0, 0, t.r, 0, 6.2832); g.fill();
      g.fillStyle = 'rgba(255,70,50,' + (0.22 * alpha).toFixed(3) + ')';
      g.beginPath(); g.arc(0, 0, t.r * p, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(255,90,70,' + (0.9 * alpha).toFixed(3) + ')';
      g.lineWidth = 4;
      g.beginPath(); g.arc(0, 0, t.r, 0, 6.2832); g.stroke();
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, t.r * p, 0, 6.2832); g.stroke();
    }
    g.restore();
  }
}

/* ============================== 角色外围 ============================== */

/** 在世界中绘制人形，附加：飘带、武器辉光、影子拖尾 */
function drawFigure2(g, x, y, o) {
  const P = o.palette || {};

  // 灵气拖尾
  const t = o.t || 0;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const auraR = o.auraR || 17;
  const pulse = 0.16 + Math.sin(t * 2.2) * 0.06;
  const ag = g.createRadialGradient(x, y - 16, 2, x, y - 16, auraR * 1.9);
  ag.addColorStop(0, (P.glow || 'rgba(150,220,255,') + (pulse * 1.6).toFixed(3) + ')');
  ag.addColorStop(1, (P.glow || 'rgba(150,220,255,') + '0)');
  g.fillStyle = ag;
  g.beginPath(); g.arc(x, y - 16, auraR * 1.9, 0, 6.2832); g.fill();
  g.restore();

  drawFigure(g, x, y, o);

  // 飘带（行走/受击时摆动）
  if (o.showRibbon !== false) {
    const sway = Math.sin(t * 2.6) * 3 + (o.moving ? Math.sin((o.phase || 0) * 6.2832) * 4 : 0);
    g.save();
    g.strokeStyle = o.sash || '#b8453c';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(x - 6, y - 22);
    g.quadraticCurveTo(x - 20 + sway, y - 14, x - 24 + sway * 1.4, y - 2);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 6, y - 22);
    g.quadraticCurveTo(x + 20 - sway, y - 14, x + 24 - sway * 1.4, y - 2);
    g.stroke();
    g.restore();
    g.globalAlpha = 1;
  }
}

/** NPC 头顶名牌 + 任务标记 */
function drawNpcTag(g, npc, time, opts) {
  const name = npc.def.name;
  const y = npc.y - 62;

  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  // 名牌底
  g.font = '12px "STKaiti","KaiTi",serif';
  const w = g.measureText(name).width + 16;
  g.fillStyle = 'rgba(8,14,20,0.62)';
  if (g.roundRect) {
    g.beginPath();
    g.roundRect(npc.x - w / 2, y - 9, w, 18, 9);
    g.fill();
  } else {
    g.fillRect(npc.x - w / 2, y - 9, w, 18);
  }
  g.strokeStyle = 'rgba(190,158,92,0.55)';
  g.lineWidth = 1;
  if (g.roundRect) {
    g.beginPath();
    g.roundRect(npc.x - w / 2, y - 9, w, 18, 9);
    g.stroke();
  }

  g.fillStyle = '#f0e4c6';
  g.fillText(name, npc.x, y + 0.5);

  // 任务标记
  if (opts && opts.marker) {
    const bob = Math.sin(time * 3) * 3;
    const my = y - 22 + bob;
    g.font = 'bold 18px "STKaiti","KaiTi",serif';
    const mark = opts.marker;       // '!' 可接 / '?' 可交 / '·' 普通
    if (mark === '!' || mark === '?') {
      const glow = g.createRadialGradient(npc.x, my, 1, npc.x, my, 16);
      const col = mark === '!' ? 'rgba(255,210,90,' : 'rgba(140,230,255,';
      glow.addColorStop(0, col + '0.55)');
      glow.addColorStop(1, col + '0)');
      g.fillStyle = glow;
      g.beginPath(); g.arc(npc.x, my, 16, 0, 6.2832); g.fill();
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(10,10,10,0.8)';
      g.strokeText(mark, npc.x, my);
      g.fillStyle = mark === '!' ? '#ffdf8a' : '#a8e8ff';
      g.fillText(mark, npc.x, my);
    }
  }
  g.restore();
}

/** 悬停光标（世界中） */
function drawCursor3D(g, x, y, time, color) {
  const bob = Math.sin(time * 4) * 3;
  g.save();
  g.translate(x, y + bob);
  g.globalCompositeOperation = 'lighter';
  const col = color || 'rgba(255,225,140,';
  g.fillStyle = col + '0.9)';
  g.beginPath();
  g.moveTo(0, -18);
  g.lineTo(-7, -4);
  g.lineTo(7, -4);
  g.closePath();
  g.fill();
  g.strokeStyle = col + '0.45)';
  g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, 2, 14, 5, 0, 0, 6.2832); g.stroke();
  g.restore();
}

/** 地面掉落物 */
function drawDrop(g, o, time) {
  const bob = Math.sin(time * 3 + o.bob) * 2.5;
  const q = (typeof qualityOf === 'function') ? qualityOf(o.id) : 0;
  const Q = (typeof QUALITY !== 'undefined' ? QUALITY[q] : null) || { color: '#d8d8d8', glow: 'rgba(216,216,216,' };
  g.save();
  g.translate(o.x, o.y);

  // 光柱 + 落地光
  g.globalCompositeOperation = 'lighter';
  const pulse = 0.35 + Math.sin(time * 3.4 + o.bob) * 0.15;
  const ph = 46 + q * 8;
  const beam = g.createLinearGradient(0, -ph, 0, 2);
  beam.addColorStop(0, Q.glow + '0)');
  beam.addColorStop(0.5, Q.glow + (pulse * 0.5).toFixed(3) + ')');
  beam.addColorStop(1, Q.glow + (pulse * 0.85).toFixed(3) + ')');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(-5 - q, -ph); g.lineTo(5 + q, -ph);
  g.lineTo(9 + q, 2); g.lineTo(-9 - q, 2);
  g.closePath();
  g.fill();
  g.beginPath();
  g.ellipse(0, 0, 13 + q * 2, 5, 0, 0, 6.2832);
  g.fillStyle = Q.glow + (pulse * 0.6).toFixed(3) + ')';
  g.fill();
  g.globalCompositeOperation = 'source-over';

  // 图标
  try {
    const icon = ItemIcons.get(o.id, 34);
    g.drawImage(icon, -17, -34 + bob, 34, 34);
  } catch (e) {
    g.fillStyle = Q.color;
    g.beginPath(); g.arc(0, -18 + bob, 7, 0, 6.2832); g.fill();
  }
  g.restore();
}

/** 奖励宝箱 */
function drawChest(g, o, time) {
  const t = time + (o.seed % 100) * 0.1;
  g.save();
  g.translate(o.x, o.y);

  g.fillStyle = 'rgba(24,34,20,0.28)';
  g.beginPath(); g.ellipse(0, 0, 17, 6, 0, 0, 6.2832); g.fill();

  if (!o.opened) {
    // 未开启：微微起伏 + 灵光
    const bob = Math.sin(t * 2) * 1.2;
    g.translate(0, -bob);
    const gl = g.createRadialGradient(0, -16, 2, 0, -16, 40);
    gl.addColorStop(0, 'rgba(255,220,120,' + (0.28 + Math.sin(t * 2.4) * 0.1).toFixed(3) + ')');
    gl.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = gl;
    g.beginPath(); g.arc(0, -16, 40, 0, 6.2832); g.fill();
  }

  // 箱体
  const bodyG = g.createLinearGradient(-18, -20, 18, 2);
  if (o.opened) {
    bodyG.addColorStop(0, '#7a6a52');
    bodyG.addColorStop(1, '#3f3628');
  } else {
    bodyG.addColorStop(0, '#b98a4a');
    bodyG.addColorStop(0.5, '#8a6230');
    bodyG.addColorStop(1, '#5a3f1c');
  }
  g.fillStyle = bodyG;
  pPath(g, [[-18, -2], [18, -2], [17, -20], [-17, -20]], true);
  g.fill();
  g.strokeStyle = 'rgba(40,26,12,0.75)';
  g.lineWidth = 1.4;
  g.stroke();

  // 铁箍
  g.fillStyle = o.opened ? '#4a4a52' : '#c8a24a';
  g.fillRect(-19, -12, 38, 3.2);
  g.fillRect(-3, -20, 6, 18);

  if (o.opened) {
    // 开着：盖子翘起 + 内部暗影
    g.fillStyle = '#2a2418';
    g.beginPath(); g.ellipse(0, -19, 16, 4.4, 0, 0, 6.2832); g.fill();
    g.save();
    g.translate(0, -20);
    g.rotate(-0.55);
    g.fillStyle = '#6b5334';
    pPath(g, [[-17, 0], [17, 0], [15, -10], [-15, -10]], true);
    g.fill();
    g.strokeStyle = 'rgba(40,26,12,0.7)';
    g.lineWidth = 1.2;
    g.stroke();
    g.restore();
  } else {
    // 弧形盖
    g.fillStyle = '#a87c40';
    g.beginPath();
    g.moveTo(-18, -20);
    g.quadraticCurveTo(0, -32, 18, -20);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(40,26,12,0.75)';
    g.lineWidth = 1.4;
    g.stroke();
    // 锁扣
    g.fillStyle = '#e0c070';
    g.beginPath(); rr(g, -3.4, -17, 6.8, 7, 1.6); g.fill();
    g.fillStyle = '#5a4020';
    g.beginPath(); g.arc(0, -14, 1.6, 0, 6.2832); g.fill();
  }
  g.restore();
}

/** 出入口路牌 */
function drawSignpost(g, o, time) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.26)';
  g.beginPath(); g.ellipse(0, 0, 10, 3.6, 0, 0, 6.2832); g.fill();

  // 木柱
  g.fillStyle = '#6b4f36';
  g.fillRect(-3, -46, 6, 46);
  g.fillStyle = 'rgba(255,220,170,0.16)';
  g.fillRect(-3, -46, 2, 46);

  // 牌面
  g.fillStyle = '#8a6a48';
  pPath(g, [[-30, -48], [30, -48], [34, -40], [30, -32], [-30, -32], [-34, -40]], true);
  g.fill();
  g.strokeStyle = '#4e3a26';
  g.lineWidth = 1.6;
  g.stroke();

  // 指示箭头
  g.fillStyle = 'rgba(255,235,190,0.85)';
  g.beginPath();
  g.moveTo(14, -40);
  g.lineTo(24, -40);
  g.lineTo(24, -44);
  g.lineTo(31, -40);
  g.lineTo(24, -36);
  g.lineTo(24, -40);
  g.closePath();
  g.fill();

  // 灵光
  const pulse = 0.25 + Math.sin(time * 2) * 0.1;
  const gl = g.createRadialGradient(0, -40, 1, 0, -40, 34);
  gl.addColorStop(0, 'rgba(255,220,140,' + pulse.toFixed(3) + ')');
  gl.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = gl;
  g.beginPath(); g.arc(0, -40, 34, 0, 6.2832); g.fill();

  g.restore();
}

/** 传送石碑（未绑定 / 已绑定） */
function drawStele(g, o, time, bound) {
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(24,34,20,0.30)';
  g.beginPath(); g.ellipse(0, 0, 22, 7, 0, 0, 6.2832); g.fill();

  // 底座
  g.fillStyle = '#8d8a80';
  pPath(g, [[-20, 0], [20, 0], [15, -10], [-15, -10]], true);
  g.fill();

  // 碑体
  const grd = g.createLinearGradient(-16, -70, 16, 0);
  grd.addColorStop(0, bound ? '#a8b4c4' : '#8f8f98');
  grd.addColorStop(0.5, bound ? '#7c8b9e' : '#6e6e78');
  grd.addColorStop(1, '#4a4a54');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(-16, -8);
  g.lineTo(-15, -52);
  g.quadraticCurveTo(0, -70, 15, -52);
  g.lineTo(16, -8);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(30,30,36,0.55)';
  g.lineWidth = 1.4;
  g.stroke();

  // 碑面符文
  if (bound) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + Math.sin(time * 2.2) * 0.25;
    g.strokeStyle = 'rgba(150,225,255,' + pulse.toFixed(3) + ')';
    g.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const y = -46 + i * 12;
      g.beginPath();
      g.moveTo(-7, y);
      g.lineTo(0, y - 5);
      g.lineTo(7, y);
      g.stroke();
    }
    const gl = g.createRadialGradient(0, -40, 2, 0, -40, 46);
    gl.addColorStop(0, 'rgba(140,220,255,0.35)');
    gl.addColorStop(1, 'rgba(90,170,255,0)');
    g.fillStyle = gl;
    g.beginPath(); g.arc(0, -40, 46, 0, 6.2832); g.fill();
    g.restore();
  } else {
    g.fillStyle = 'rgba(20,20,26,0.35)';
    for (let i = 0; i < 3; i++) {
      g.fillRect(-7, -46 + i * 12, 14, 3);
    }
    // 未激活提示
    g.fillStyle = 'rgba(190,190,200,0.5)';
    g.font = '11px "STKaiti","KaiTi",serif';
    g.textAlign = 'center';
    g.fillText('未 刻 录', 0, -58);
  }
  g.restore();
}

/* =========================================================================
   地图主题色调（冰 / 火 / 暗 / 雷 / 虚空）
   在已变换到世界坐标的上下文里作画
   ========================================================================= */

const MAP_THEME = {
  fire: { tint: '255,120,40', a: 0.20, blend: 'overlay', pcol: 'rgba(255,150,60,', motes: 'ember' },
  ice: { tint: '140,210,255', a: 0.22, blend: 'overlay', pcol: 'rgba(200,240,255,', motes: 'snow' },
  dark: { tint: '90,60,150', a: 0.26, blend: 'multiply', pcol: 'rgba(170,130,255,', motes: 'wisp' },
  thunder: { tint: '150,170,255', a: 0.18, blend: 'overlay', pcol: 'rgba(200,220,255,', motes: 'spark' },
  void: { tint: '80,110,200', a: 0.24, blend: 'multiply', pcol: 'rgba(140,230,255,', motes: 'star' }
};

function drawMapTheme(g, map, cam, vw, vh, t) {
  if (!map || !map.def) return;
  const th = MAP_THEME[map.def.theme];
  if (!th) return;

  const x = cam.x - 40, y = cam.y - 40;
  const w = vw + 80, h = vh + 80;

  // 色调叠加
  g.save();
  g.globalCompositeOperation = th.blend;
  g.globalAlpha = th.a;
  g.fillStyle = 'rgb(' + th.tint + ')';
  g.fillRect(x, y, w, h);
  g.restore();

  // 边缘压暗
  g.save();
  const vg = g.createRadialGradient(
    cam.x + vw / 2, cam.y + vh / 2, Math.min(vw, vh) * 0.28,
    cam.x + vw / 2, cam.y + vh / 2, Math.max(vw, vh) * 0.66);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, map.def.theme === 'dark' || map.def.theme === 'void'
    ? 'rgba(8,4,18,0.55)' : 'rgba(10,14,22,0.34)');
  g.fillStyle = vg;
  g.fillRect(x, y, w, h);
  g.restore();

  // 飘浮粒子
  const N = 26;
  g.save();
  for (let i = 0; i < N; i++) {
    const seed = i * 137.51;
    let px, py, alpha, r;
    if (th.motes === 'snow') {
      px = x + ((seed * 7.3 + t * (14 + (i % 5) * 5)) % w);
      py = y + ((seed * 11.7 + t * (22 + (i % 4) * 9)) % h);
      alpha = 0.24 + 0.2 * Math.sin(t * 1.4 + i);
      r = 1 + (i % 3) * 0.6;
    } else if (th.motes === 'ember') {
      px = x + ((seed * 5.1 + Math.sin(t * 0.6 + i) * 24) % w);
      py = y + h - ((seed * 9.9 + t * (30 + (i % 6) * 12)) % h);
      alpha = 0.35 + 0.35 * Math.sin(t * 3 + i);
      r = 0.9 + (i % 3) * 0.7;
    } else if (th.motes === 'wisp') {
      px = x + ((seed * 6.7 + Math.sin(t * 0.4 + i * 1.7) * 60) % w);
      py = y + ((seed * 8.3 + Math.cos(t * 0.33 + i) * 40) % h);
      alpha = 0.1 + 0.16 * Math.abs(Math.sin(t * 0.8 + i));
      r = 4 + (i % 4) * 2.4;
    } else if (th.motes === 'star') {
      px = x + ((seed * 13.1) % w);
      py = y + ((seed * 17.9) % h);
      alpha = 0.18 + 0.4 * Math.abs(Math.sin(t * 1.1 + i * 2.1));
      r = 0.6 + (i % 3) * 0.4;
    } else {
      px = x + ((seed * 3.7 + t * 90 + Math.sin(t * 2 + i) * 30) % w);
      py = y + ((seed * 7.9 + t * 40) % h);
      alpha = 0.3 * Math.abs(Math.sin(t * 6 + i * 3));
      r = 0.8 + (i % 2);
    }
    g.globalAlpha = Math.max(0, Math.min(1, alpha));
    g.fillStyle = th.pcol + '1)';
    g.beginPath();
    g.arc(px, py, r, 0, 6.283);
    g.fill();
  }
  g.restore();

  // 雷泽：偶发闪电
  if (map.def.theme === 'thunder') {
    const ph = (t * 0.35) % 1;
    if (ph < 0.06) {
      const a = (1 - ph / 0.06) * 0.5;
      g.save();
      g.globalAlpha = a;
      g.strokeStyle = 'rgba(220,235,255,1)';
      g.lineWidth = 2.4;
      const sx = x + w * (0.2 + ((Math.floor(t * 0.35) * 61) % 60) / 100);
      g.beginPath();
      g.moveTo(sx, y);
      let cy = y;
      let cx = sx;
      while (cy < y + h * 0.6) {
        cx += ((((cy * 7) | 0) % 5) - 2) * 12;
        cy += 30;
        g.lineTo(cx, cy);
      }
      g.stroke();
      g.restore();
    }
  }
}

/* ============================== 剑气 / 剑雨 ============================== */

/* 细长剑气：一束束从出招点射出的锥形剑光 */
function drawSwordQi(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.6);
  const n = e.count || 5;
  const r = (e.r || 90) * (0.5 + p * 0.9);
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = (e.angle || 0) + (i - (n - 1) / 2) * (e.spread || 0.14) + p * 0.12;
    const len = r * (0.7 + ((i * 37) % 10) / 14);
    const w = (e.w || 5) * (0.6 + (i % 3) * 0.22);
    const tx = Math.cos(a) * len;
    const ty = Math.sin(a) * len;
    const nx = -Math.sin(a) * w;
    const ny = Math.cos(a) * w;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(tx + nx, ty + ny);
    g.lineTo(tx + Math.cos(a) * 14, ty + Math.sin(a) * 14);
    g.lineTo(tx - nx, ty - ny);
    g.closePath();
    const grd = g.createLinearGradient(0, 0, tx, ty);
    grd.addColorStop(0, e.color + (0.05 * fade).toFixed(3) + ')');
    grd.addColorStop(0.6, e.color + (0.6 * fade).toFixed(3) + ')');
    grd.addColorStop(1, 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')');
    g.fillStyle = grd;
    g.fill();
  }
  g.restore();
}

/* 万剑归宗：从屏幕上方落下满屏飞剑 */
function drawSwordRain(g, e, k) {
  const p = 1 - k;
  const fade = Math.pow(k, 1.1);
  const n = e.count || 26;
  const W = e.w || 240;          // 横向散布宽度
  const H = e.h || 260;          // 下落高度
  const seed = e.seed || 0;
  g.save();
  g.translate(e.x, e.y);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const r1 = ((seed + i * 137.5) % 100) / 100;
    const r2 = ((seed + i * 71.3) % 100) / 100;
    const delay = r1 * 0.42;
    const lp = Math.max(0, Math.min(1, (p - delay) / (1 - delay)));
    if (lp <= 0) continue;
    const sx = (-0.5 + r2) * W;
    const startY = -H * (0.7 + r1 * 0.5);
    const y = startY + (H * 1.05 + startY) * lp * lp;
    const len = 34 + r1 * 26;
    const w = 2.2 + r2 * 2.4;
    const col = e.color || 'rgba(200,240,255,';

    // 拖尾
    const trail = g.createLinearGradient(sx, y - len * 2.4, sx, y);
    trail.addColorStop(0, col + '0)');
    trail.addColorStop(0.65, col + (0.35 * fade).toFixed(3) + ')');
    trail.addColorStop(1, 'rgba(255,255,255,' + (0.8 * fade).toFixed(3) + ')');
    g.fillStyle = trail;
    g.beginPath();
    g.moveTo(sx - w, y - len * 0.2);
    g.lineTo(sx, y - len * 2.4);
    g.lineTo(sx + w, y - len * 0.2);
    g.closePath();
    g.fill();

    // 剑身
    g.strokeStyle = 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(sx, y - len);
    g.lineTo(sx, y);
    g.stroke();

    // 落点冲击（快落地时）
    if (lp > 0.86) {
      const ik = (lp - 0.86) / 0.14;
      g.strokeStyle = col + ((1 - ik) * 0.75 * fade).toFixed(3) + ')';
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(sx, 0, 8 + ik * 26, 3 + ik * 9, 0, 0, 6.283);
      g.stroke();
    }
  }
  g.restore();
}