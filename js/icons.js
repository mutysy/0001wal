'use strict';

/* =========================================================================
   青云界 · 物品图标（程序化绘制，每件物品独立形象）
   ========================================================================= */

const ItemIcons = (function () {
  const cache = {};

  /* ------------------------------ 小工具 ------------------------------ */
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

  function glow(g, cx, cy, r, color) {
    const grd = g.createRadialGradient(cx, cy, 1, cx, cy, r);
    grd.addColorStop(0, color + '0.55)');
    grd.addColorStop(1, color + '0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, r, 0, 6.2832);
    g.fill();
  }

  /* ============================== 各物品 ============================== */

  const DRAW = {
    /* ---------- 丹药 ---------- */
    pill_qi(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.46, 'rgba(120,210,255,');
      const grd = g.createRadialGradient(s * 0.4, s * 0.36, s * 0.05, s * 0.5, s * 0.5, s * 0.34);
      grd.addColorStop(0, '#e8f8ff');
      grd.addColorStop(0.45, '#66bdec');
      grd.addColorStop(1, '#1e5f96');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * 0.32, 0, 6.2832);
      g.fill();
      // 云纹
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = s * 0.045;
      g.beginPath();
      g.arc(s * 0.5, s * 0.52, s * 0.16, 0.6, 2.6);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.arc(s * 0.4, s * 0.38, s * 0.07, 0, 6.2832);
      g.fill();
    },
    pill_heal(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.46, 'rgba(255,120,110,');
      const grd = g.createRadialGradient(s * 0.4, s * 0.36, s * 0.05, s * 0.5, s * 0.5, s * 0.34);
      grd.addColorStop(0, '#ffd9d2');
      grd.addColorStop(0.5, '#e0554a');
      grd.addColorStop(1, '#8e1f1c');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * 0.32, 0, 6.2832);
      g.fill();
      // 十字药纹
      g.fillStyle = 'rgba(255,240,230,0.85)';
      g.fillRect(s * 0.46, s * 0.32, s * 0.08, s * 0.36);
      g.fillRect(s * 0.32, s * 0.46, s * 0.36, s * 0.08);
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath();
      g.arc(s * 0.4, s * 0.37, s * 0.055, 0, 6.2832);
      g.fill();
    },
    pill_body(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.46, 'rgba(255,190,110,');
      // 六棱丹
      g.save();
      g.translate(s * 0.5, s * 0.5);
      const grd = g.createLinearGradient(0, -s * 0.32, 0, s * 0.32);
      grd.addColorStop(0, '#f0c88a');
      grd.addColorStop(0.5, '#b8763a');
      grd.addColorStop(1, '#6d3f18');
      g.fillStyle = grd;
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 3;
        const x = Math.cos(a) * s * 0.31, y = Math.sin(a) * s * 0.31;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(70,40,15,0.6)';
      g.lineWidth = s * 0.03;
      g.stroke();
      // 内纹
      g.strokeStyle = 'rgba(255,230,180,0.6)';
      g.lineWidth = s * 0.035;
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        g.moveTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2);
        g.lineTo(-Math.cos(a) * s * 0.2, -Math.sin(a) * s * 0.2);
      }
      g.stroke();
      g.restore();
    },
    pill_spirit(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.48, 'rgba(190,150,255,');
      const grd = g.createRadialGradient(s * 0.4, s * 0.36, s * 0.05, s * 0.5, s * 0.5, s * 0.34);
      grd.addColorStop(0, '#f0e6ff');
      grd.addColorStop(0.45, '#a077e8');
      grd.addColorStop(1, '#4b2c86');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * 0.31, 0, 6.2832);
      g.fill();
      // 星芒
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [dx, dy, r] of [[0, -0.12, 0.055], [0.13, 0.06, 0.04], [-0.12, 0.08, 0.04]]) {
        const cx = s * (0.5 + dx), cy = s * (0.5 + dy);
        g.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          g.lineTo(cx + Math.cos(a) * s * r * 2.2, cy + Math.sin(a) * s * r * 2.2);
          g.lineTo(cx + Math.cos(a + Math.PI / 4) * s * r * 0.6, cy + Math.sin(a + Math.PI / 4) * s * r * 0.6);
        }
        g.closePath();
        g.fill();
      }
    },

    /* ---------- 兵器 ---------- */
    _sword(g, s, bladeA, bladeB, gem) {
      g.save();
      g.translate(s * 0.5, s * 0.5);
      g.rotate(-Math.PI / 4);
      // 刃
      const grd = g.createLinearGradient(0, -s * 0.42, 0, s * 0.1);
      grd.addColorStop(0, bladeA);
      grd.addColorStop(1, bladeB);
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(0, -s * 0.44);
      g.lineTo(s * 0.07, -s * 0.3);
      g.lineTo(s * 0.065, s * 0.04);
      g.lineTo(-s * 0.065, s * 0.04);
      g.lineTo(-s * 0.07, -s * 0.3);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.5)';
      g.lineWidth = s * 0.018;
      g.beginPath();
      g.moveTo(0, -s * 0.42);
      g.lineTo(0, s * 0.02);
      g.stroke();
      // 护手
      g.fillStyle = gem || '#c8a24a';
      g.beginPath();
      rr(g, -s * 0.14, s * 0.03, s * 0.28, s * 0.055, s * 0.024);
      g.fill();
      // 柄
      g.fillStyle = '#5a4030';
      g.fillRect(-s * 0.035, s * 0.08, s * 0.07, s * 0.24);
      g.strokeStyle = 'rgba(200,170,110,0.8)';
      g.lineWidth = s * 0.022;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(-s * 0.035, s * 0.12 + i * s * 0.06);
        g.lineTo(s * 0.035, s * 0.14 + i * s * 0.06);
        g.stroke();
      }
      // 圆头
      g.fillStyle = gem || '#c8a24a';
      g.beginPath();
      g.arc(0, s * 0.35, s * 0.045, 0, 6.2832);
      g.fill();
      g.restore();
    },
    wp_wood(g, s) { DRAW._sword(g, s, '#d9b98a', '#8a6338', '#8a6a3a'); },
    wp_iron(g, s) { DRAW._sword(g, s, '#eef3f8', '#8f9aa8', '#b0b8c4'); },
    wp_azure(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.5, 'rgba(120,240,255,');
      DRAW._sword(g, s, '#e0ffff', '#3ba7c4', '#7fe6ff');
    },
    wp_staff(g, s) {
      glow(g, s * 0.5, s * 0.28, s * 0.34, 'rgba(150,220,255,');
      g.save();
      g.translate(s * 0.5, s * 0.5);
      g.rotate(0.18);
      // 杆
      g.strokeStyle = '#7a5a3a';
      g.lineWidth = s * 0.075;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, s * 0.42);
      g.lineTo(0, -s * 0.2);
      g.stroke();
      g.strokeStyle = 'rgba(190,150,100,0.6)';
      g.lineWidth = s * 0.025;
      g.beginPath();
      g.moveTo(-s * 0.015, s * 0.4);
      g.lineTo(-s * 0.015, -s * 0.18);
      g.stroke();
      // 珠
      const orb = g.createRadialGradient(0, -s * 0.28, s * 0.02, 0, -s * 0.28, s * 0.16);
      orb.addColorStop(0, '#ffffff');
      orb.addColorStop(0.4, '#8fd8ff');
      orb.addColorStop(1, 'rgba(80,160,230,0.15)');
      g.fillStyle = orb;
      g.beginPath();
      g.arc(0, -s * 0.28, s * 0.16, 0, 6.2832);
      g.fill();
      // 环
      g.strokeStyle = '#c8a24a';
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.arc(0, -s * 0.2, s * 0.075, 0.2, Math.PI - 0.2);
      g.stroke();
      g.restore();
    },
    wp_hammer(g, s) {
      g.save();
      g.translate(s * 0.5, s * 0.5);
      g.rotate(0.35);
      g.strokeStyle = '#6b4f36';
      g.lineWidth = s * 0.085;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, s * 0.42);
      g.lineTo(0, -s * 0.12);
      g.stroke();
      const grd = g.createLinearGradient(-s * 0.26, -s * 0.42, s * 0.26, -s * 0.14);
      grd.addColorStop(0, '#b8bcc6');
      grd.addColorStop(0.5, '#767a86');
      grd.addColorStop(1, '#3e424c');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-s * 0.27, -s * 0.4);
      g.lineTo(s * 0.27, -s * 0.4);
      g.lineTo(s * 0.32, -s * 0.16);
      g.lineTo(-s * 0.32, -s * 0.16);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(20,22,28,0.6)';
      g.lineWidth = s * 0.025;
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.fillRect(-s * 0.25, -s * 0.38, s * 0.5, s * 0.05);
      g.restore();
    },

    /* ---------- 护体 / 饰品 ---------- */
    bd_silk(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.46, 'rgba(180,220,255,');
      g.save();
      g.translate(s * 0.5, s * 0.5);
      // 袍身
      const grd = g.createLinearGradient(0, -s * 0.3, 0, s * 0.36);
      grd.addColorStop(0, '#f4f8fd');
      grd.addColorStop(1, '#a9c4dd');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-s * 0.11, -s * 0.3);
      g.lineTo(s * 0.11, -s * 0.3);
      g.quadraticCurveTo(s * 0.26, -s * 0.16, s * 0.3, s * 0.34);
      g.lineTo(-s * 0.3, s * 0.34);
      g.quadraticCurveTo(-s * 0.26, -s * 0.16, -s * 0.11, -s * 0.3);
      g.closePath();
      g.fill();
      // 交领
      g.strokeStyle = '#6d9ac4';
      g.lineWidth = s * 0.035;
      g.beginPath();
      g.moveTo(-s * 0.12, -s * 0.28);
      g.lineTo(0, s * 0.02);
      g.lineTo(s * 0.12, -s * 0.28);
      g.stroke();
      // 腰带
      g.fillStyle = '#b8453c';
      g.fillRect(-s * 0.2, s * 0.06, s * 0.4, s * 0.05);
      // 云纹
      g.strokeStyle = 'rgba(110,160,210,0.55)';
      g.lineWidth = s * 0.025;
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.arc(0, s * (0.18 + i * 0.08), s * 0.1, 0.5, 2.6);
        g.stroke();
      }
      g.restore();
    },
    bd_scale(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.44, 'rgba(150,200,255,');
      g.save();
      g.translate(s * 0.5, s * 0.5);
      // 甲片
      const grd = g.createLinearGradient(0, -s * 0.32, 0, s * 0.32);
      grd.addColorStop(0, '#9fb0c8');
      grd.addColorStop(0.5, '#5c708c');
      grd.addColorStop(1, '#2e3c50');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-s * 0.28, -s * 0.22);
      g.lineTo(0, -s * 0.34);
      g.lineTo(s * 0.28, -s * 0.22);
      g.lineTo(s * 0.24, s * 0.22);
      g.lineTo(0, s * 0.34);
      g.lineTo(-s * 0.24, s * 0.22);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(20,28,40,0.65)';
      g.lineWidth = s * 0.028;
      g.stroke();
      // 鳞纹
      g.strokeStyle = 'rgba(190,215,240,0.45)';
      g.lineWidth = s * 0.02;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          g.beginPath();
          g.arc((-s * 0.14) + c * s * 0.14, (-s * 0.14) + r * s * 0.14, s * 0.07, Math.PI, 0);
          g.stroke();
        }
      }
      // 中央宝石
      g.fillStyle = '#8fe3ff';
      g.beginPath();
      g.arc(0, 0, s * 0.055, 0, 6.2832);
      g.fill();
      g.restore();
    },
    ch_jade(g, s) {
      glow(g, s * 0.5, s * 0.54, s * 0.42, 'rgba(150,255,200,');
      g.save();
      g.translate(s * 0.5, s * 0.52);
      // 绳
      g.strokeStyle = '#b8453c';
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.moveTo(0, -s * 0.4);
      g.lineTo(0, -s * 0.22);
      g.stroke();
      // 玉璧
      const grd = g.createRadialGradient(-s * 0.06, -s * 0.06, s * 0.02, 0, 0, s * 0.26);
      grd.addColorStop(0, '#e6fff2');
      grd.addColorStop(0.5, '#7fd8a8');
      grd.addColorStop(1, '#2f8a5c');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, s * 0.24, 0, 6.2832);
      g.fill();
      g.fillStyle = 'rgba(10,40,25,0.75)';
      g.beginPath();
      g.arc(0, 0, s * 0.085, 0, 6.2832);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = s * 0.02;
      g.beginPath();
      g.arc(0, 0, s * 0.24, 0, 6.2832);
      g.stroke();
      g.restore();
    },
    ch_talisman(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.44, 'rgba(255,220,120,');
      g.save();
      g.translate(s * 0.5, s * 0.5);
      // 符纸
      g.fillStyle = '#f2e2b8';
      g.beginPath();
      rr(g, -s * 0.19, -s * 0.32, s * 0.38, s * 0.64, s * 0.03);
      g.fill();
      g.strokeStyle = 'rgba(150,120,60,0.7)';
      g.lineWidth = s * 0.022;
      g.stroke();
      // 朱砂符文
      g.strokeStyle = '#c0392b';
      g.lineWidth = s * 0.028;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, -s * 0.24); g.lineTo(0, s * 0.24);
      g.moveTo(-s * 0.1, -s * 0.14); g.lineTo(s * 0.1, -s * 0.14);
      g.moveTo(-s * 0.08, s * 0.02); g.lineTo(s * 0.08, s * 0.02);
      g.moveTo(-s * 0.1, s * 0.16); g.lineTo(s * 0.1, s * 0.16);
      g.stroke();
      g.beginPath();
      g.arc(0, -s * 0.2, s * 0.05, 0, 6.2832);
      g.stroke();
      g.restore();
    },

    /* ---------- 材料 ---------- */
    mat_herb(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.42, 'rgba(160,255,170,');
      g.save();
      g.translate(s * 0.5, s * 0.52);
      g.strokeStyle = '#4f8a4a';
      g.lineWidth = s * 0.045;
      g.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        g.beginPath();
        g.moveTo(i * s * 0.04, s * 0.3);
        g.quadraticCurveTo(i * s * 0.16, 0, i * s * 0.13, -s * 0.26);
        g.stroke();
      }
      // 叶
      g.fillStyle = '#8ed07a';
      for (const [dx, dy, rot] of [[-0.15, -0.1, -0.6], [0.15, -0.06, 0.6], [0, -0.22, 0]]) {
        g.save();
        g.translate(s * dx, s * dy);
        g.rotate(rot);
        g.beginPath();
        g.ellipse(0, 0, s * 0.13, s * 0.06, 0, 0, 6.2832);
        g.fill();
        g.restore();
      }
      // 花
      g.fillStyle = '#f6f2d8';
      g.beginPath();
      g.arc(0, -s * 0.32, s * 0.055, 0, 6.2832);
      g.fill();
      g.fillStyle = '#ffd98a';
      g.beginPath();
      g.arc(0, -s * 0.32, s * 0.025, 0, 6.2832);
      g.fill();
      g.restore();
    },
    mat_bamboo(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.4, 'rgba(170,240,150,');
      g.save();
      g.translate(s * 0.5, s * 0.5);
      g.rotate(0.2);
      const grd = g.createLinearGradient(-s * 0.1, 0, s * 0.1, 0);
      grd.addColorStop(0, '#a8d888');
      grd.addColorStop(0.5, '#7fb85f');
      grd.addColorStop(1, '#4d7a3a');
      g.fillStyle = grd;
      g.beginPath();
      rr(g, -s * 0.085, -s * 0.38, s * 0.17, s * 0.76, s * 0.06);
      g.fill();
      g.strokeStyle = 'rgba(50,90,40,0.7)';
      g.lineWidth = s * 0.028;
      for (let i = 0; i < 3; i++) {
        const y = -s * 0.26 + i * s * 0.26;
        g.beginPath();
        g.moveTo(-s * 0.085, y);
        g.lineTo(s * 0.085, y);
        g.stroke();
      }
      g.strokeStyle = '#5f9c52';
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.moveTo(s * 0.08, -s * 0.1);
      g.quadraticCurveTo(s * 0.3, -s * 0.22, s * 0.34, -s * 0.34);
      g.stroke();
      g.fillStyle = '#7fb85f';
      g.beginPath();
      g.ellipse(s * 0.3, -s * 0.32, s * 0.09, s * 0.045, 0.7, 0, 6.2832);
      g.fill();
      g.restore();
    },
    mat_core(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.5, 'rgba(255,170,120,');
      g.save();
      g.translate(s * 0.5, s * 0.52);
      const grd = g.createRadialGradient(-s * 0.05, -s * 0.06, s * 0.02, 0, 0, s * 0.3);
      grd.addColorStop(0, '#fff2d8');
      grd.addColorStop(0.35, '#f0a860');
      grd.addColorStop(0.8, '#c2451e');
      grd.addColorStop(1, '#6d1a0c');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(0, 0, s * 0.28, 0, 6.2832);
      g.fill();
      // 内核
      g.fillStyle = 'rgba(255,240,200,0.9)';
      g.beginPath();
      g.arc(-s * 0.06, -s * 0.07, s * 0.08, 0, 6.2832);
      g.fill();
      // 灵气弧
      g.strokeStyle = 'rgba(255,220,160,0.85)';
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.arc(0, 0, s * 0.34, 0.6, 2.2);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, s * 0.34, 3.8, 5.4);
      g.stroke();
      g.restore();
    },
    mat_snow(g, s) {
      glow(g, s * 0.5, s * 0.5, s * 0.48, 'rgba(160,230,255,');
      g.save();
      g.translate(s * 0.5, s * 0.52);
      g.fillStyle = 'rgba(200,240,255,0.95)';
      g.beginPath();
      g.moveTo(0, -s * 0.34);
      g.lineTo(s * 0.2, -s * 0.08);
      g.lineTo(s * 0.13, s * 0.28);
      g.lineTo(-s * 0.13, s * 0.28);
      g.lineTo(-s * 0.2, -s * 0.08);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(80,150,200,0.75)';
      g.lineWidth = s * 0.028;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = s * 0.022;
      g.beginPath();
      g.moveTo(0, -s * 0.3);
      g.lineTo(0, s * 0.26);
      g.moveTo(-s * 0.16, -s * 0.02);
      g.lineTo(s * 0.16, -s * 0.02);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.moveTo(0, -s * 0.34);
      g.lineTo(s * 0.08, -s * 0.16);
      g.lineTo(-s * 0.08, -s * 0.16);
      g.closePath();
      g.fill();
      g.restore();
    }
  };

  /* ------------------------------ 通用形状 ------------------------------ */

  function pendant(g, s, c1, c2, glowCol, cordCol) {
    glow(g, s * 0.5, s * 0.54, s * 0.46, glowCol);
    g.save();
    g.translate(s * 0.5, s * 0.52);
    g.strokeStyle = cordCol || '#b8453c';
    g.lineWidth = s * 0.03;
    g.beginPath(); g.moveTo(0, -s * 0.4); g.lineTo(0, -s * 0.22); g.stroke();
    const grd = g.createRadialGradient(-s * 0.06, -s * 0.06, s * 0.02, 0, 0, s * 0.26);
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2);
    g.fillStyle = grd;
    g.beginPath(); g.arc(0, 0, s * 0.24, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(10,20,30,0.72)';
    g.beginPath(); g.arc(0, 0, s * 0.085, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = s * 0.02;
    g.beginPath(); g.arc(0, 0, s * 0.24, 0, 6.2832); g.stroke();
    g.restore();
  }

  function book(g, s, cover, edge, mark, glowCol) {
    glow(g, s * 0.5, s * 0.5, s * 0.48, glowCol);
    g.save();
    g.translate(s * 0.5, s * 0.5);
    g.fillStyle = cover;
    rr(g, -s * 0.24, -s * 0.3, s * 0.48, s * 0.6, s * 0.04);
    g.fill();
    g.strokeStyle = edge;
    g.lineWidth = s * 0.03;
    g.stroke();
    g.fillStyle = edge;
    g.fillRect(-s * 0.24, -s * 0.3, s * 0.07, s * 0.6);
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = s * 0.02;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(-s * 0.1, -s * 0.1 + i * s * 0.13);
      g.lineTo(s * 0.15, -s * 0.1 + i * s * 0.13);
      g.stroke();
    }
    g.fillStyle = mark;
    g.beginPath(); g.arc(0, -s * 0.2, s * 0.045, 0, 6.2832); g.fill();
    g.restore();
  }

  function orbIcon(g, s, ca, cb, glowCol) {
    glow(g, s * 0.5, s * 0.5, s * 0.5, glowCol);
    g.save();
    g.translate(s * 0.5, s * 0.5);
    const grd = g.createRadialGradient(-s * 0.06, -s * 0.07, s * 0.02, 0, 0, s * 0.28);
    grd.addColorStop(0, ca);
    grd.addColorStop(1, cb);
    g.fillStyle = grd;
    g.beginPath(); g.arc(0, 0, s * 0.26, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.arc(-s * 0.08, -s * 0.09, s * 0.06, 0, 6.2832); g.fill();
    g.strokeStyle = glowCol + '0.8)';
    g.lineWidth = s * 0.025;
    g.beginPath(); g.ellipse(0, 0, s * 0.36, s * 0.15, -0.5, 0, 6.2832); g.stroke();
    g.restore();
  }

  function bellIcon(g, s, ca, cb, glowCol) {
    glow(g, s * 0.5, s * 0.5, s * 0.44, glowCol);
    g.save();
    g.translate(s * 0.5, s * 0.54);
    const grd = g.createLinearGradient(0, -s * 0.32, 0, s * 0.24);
    grd.addColorStop(0, ca);
    grd.addColorStop(1, cb);
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, -s * 0.34);
    g.quadraticCurveTo(s * 0.22, -s * 0.24, s * 0.26, s * 0.16);
    g.lineTo(-s * 0.26, s * 0.16);
    g.quadraticCurveTo(-s * 0.22, -s * 0.24, 0, -s * 0.34);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(60,40,20,0.6)';
    g.lineWidth = s * 0.025;
    g.stroke();
    g.fillStyle = cb;
    g.beginPath(); g.arc(0, s * 0.2, s * 0.06, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = s * 0.02;
    g.beginPath(); g.moveTo(0, -s * 0.34); g.lineTo(0, -s * 0.42); g.stroke();
    g.restore();
  }

  function sealIcon(g, s, ca, cb, glowCol) {
    glow(g, s * 0.5, s * 0.5, s * 0.46, glowCol);
    g.save();
    g.translate(s * 0.5, s * 0.5);
    g.fillStyle = ca;
    rr(g, -s * 0.24, -s * 0.24, s * 0.48, s * 0.48, s * 0.05);
    g.fill();
    g.strokeStyle = cb;
    g.lineWidth = s * 0.035;
    g.stroke();
    g.strokeStyle = cb;
    g.lineWidth = s * 0.032;
    g.beginPath();
    g.moveTo(-s * 0.1, -s * 0.12); g.lineTo(s * 0.1, -s * 0.12);
    g.moveTo(0, -s * 0.12); g.lineTo(0, s * 0.14);
    g.moveTo(-s * 0.1, s * 0.02); g.lineTo(s * 0.1, s * 0.02);
    g.moveTo(-s * 0.08, s * 0.14); g.lineTo(s * 0.08, s * 0.14);
    g.stroke();
    g.restore();
  }

  /* ---------- 新物品（复用形状 + 独立配色） ---------- */
  DRAW.wp_frost = (g, s) => { glow(g, s * 0.5, s * 0.5, s * 0.5, 'rgba(150,235,255,'); DRAW._sword(g, s, '#f0feff', '#4fa8c8', '#8fe8ff'); };
  DRAW.wp_crimson = (g, s) => { glow(g, s * 0.5, s * 0.5, s * 0.5, 'rgba(255,110,90,'); DRAW._sword(g, s, '#ffd8b0', '#b83a1e', '#ffb060'); };
  DRAW.wp_void = (g, s) => { glow(g, s * 0.5, s * 0.5, s * 0.52, 'rgba(190,160,255,'); DRAW._sword(g, s, '#f2eaff', '#6a4aa8', '#c9b0ff'); };
  DRAW.wp_slayer = (g, s) => { glow(g, s * 0.5, s * 0.5, s * 0.56, 'rgba(255,70,70,'); DRAW._sword(g, s, '#ffe4e0', '#8e1414', '#ff4a4a'); };

  DRAW.ch_ice = (g, s) => pendant(g, s, '#eaf9ff', '#2f7fa8', 'rgba(150,230,255,', '#5a8fb0');
  DRAW.ch_orbs = (g, s) => orbIcon(g, s, '#eaf6ff', '#3f86c8', 'rgba(140,210,255,');
  DRAW.ch_bell = (g, s) => bellIcon(g, s, '#e8dcb8', '#8a6a30', 'rgba(255,220,140,');
  DRAW.ch_seal = (g, s) => sealIcon(g, s, '#3a2b4a', '#c8a24a', 'rgba(200,160,255,');
  DRAW.ch_blood = (g, s) => pendant(g, s, '#ffe0e0', '#8e1414', 'rgba(255,70,70,', '#6b1a1a');

  DRAW.pill_marrow = (g, s) => {
    glow(g, s * 0.5, s * 0.5, s * 0.48, 'rgba(255,240,200,');
    g.save(); g.translate(s * 0.5, s * 0.5);
    const grd = g.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#e8d4a8'); grd.addColorStop(1, '#a88850');
    g.fillStyle = grd;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3;
      const px = Math.cos(a) * s * 0.3, py = Math.sin(a) * s * 0.3;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = s * 0.03; g.stroke();
    g.restore();
  };
  DRAW.pill_revive = (g, s) => {
    glow(g, s * 0.5, s * 0.5, s * 0.5, 'rgba(255,220,140,');
    const grd = g.createRadialGradient(s * 0.4, s * 0.36, s * 0.05, s * 0.5, s * 0.5, s * 0.34);
    grd.addColorStop(0, '#fff6d8'); grd.addColorStop(0.5, '#e8b64a'); grd.addColorStop(1, '#8a5a12');
    g.fillStyle = grd;
    g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.32, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = s * 0.04;
    g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.18, 0.6, 3.6); g.stroke();
  };
  DRAW.pill_break = (g, s) => {
    glow(g, s * 0.5, s * 0.5, s * 0.52, 'rgba(255,140,110,');
    const grd = g.createRadialGradient(s * 0.4, s * 0.36, s * 0.05, s * 0.5, s * 0.5, s * 0.34);
    grd.addColorStop(0, '#fff0e0'); grd.addColorStop(0.45, '#e0663a'); grd.addColorStop(1, '#6d1a08');
    g.fillStyle = grd;
    g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.32, 0, 6.2832); g.fill();
    g.strokeStyle = 'rgba(255,220,150,0.95)'; g.lineWidth = s * 0.035;
    g.beginPath();
    g.moveTo(s * 0.3, s * 0.24); g.lineTo(s * 0.52, s * 0.44); g.lineTo(s * 0.4, s * 0.56); g.lineTo(s * 0.66, s * 0.78);
    g.stroke();
  };

  DRAW.man_taixuan = (g, s) => book(g, s, '#2f4a6b', '#c8a24a', '#8fd0ff', 'rgba(140,200,255,');
  DRAW.man_sword = (g, s) => book(g, s, '#5a2a2a', '#e0b060', '#ffd98a', 'rgba(255,180,120,');
  DRAW.man_body = (g, s) => book(g, s, '#3a2a1a', '#a8783a', '#e0a45c', 'rgba(255,180,110,');
  DRAW.man_abyss = (g, s) => book(g, s, '#1a0d12', '#c02828', '#ff5a5a', 'rgba(255,70,70,');

  /* ------------------------------ 对外 ------------------------------ */

  const RARITY = {
    weapon: 'rgba(255,170,90,',
    body: 'rgba(255,215,130,',
    charm: 'rgba(200,150,255,',
    pill: 'rgba(150,255,180,',
    mat: 'rgba(150,200,240,'
  };

  /** 取得（或生成）某物品的图标 canvas */
  function get(itemId, size) {
    size = size || 48;
    const key = itemId + '@' + size;
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    const def = ITEMS[itemId];
    if (def) {
      // 底框 + 品质光晕（白→绿→蓝→紫→金→红）
      const q = (typeof qualityOf === 'function') ? qualityOf(itemId) : 0;
      const Q = (typeof QUALITY !== 'undefined' && QUALITY[q]) ? QUALITY[q]
        : { glow: RARITY[def.kind] || 'rgba(200,200,200,' };
      const col = Q.glow;
      g.fillStyle = col + (0.10 + q * 0.045).toFixed(3) + ')';
      g.fillRect(0, 0, size, size);
      const bg = g.createRadialGradient(size * 0.5, size * 0.46, 1, size * 0.5, size * 0.5, size * 0.62);
      bg.addColorStop(0, col + (0.18 + q * 0.07).toFixed(3) + ')');
      bg.addColorStop(0.65, col + (0.05 + q * 0.03).toFixed(3) + ')');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bg;
      g.fillRect(0, 0, size, size);
      // 高品质外圈光
      if (q >= 4) {
        g.strokeStyle = col + '0.85)';
        g.lineWidth = Math.max(1, size * 0.028);
        g.beginPath();
        g.arc(size / 2, size / 2, size * 0.46, 0, 6.2832);
        g.stroke();
      }
      const fn = DRAW[itemId];
      if (fn) {
        g.save();
        try { fn(g, size); } catch (e) { console.warn('图标绘制失败 ' + itemId, e); }
        g.restore();
      } else if (typeof GearArt !== 'undefined' && GearArt.has && GearArt.has(itemId)) {
        // 兵器 / 护体 / 饰品 / 服饰：用专属立绘
        g.save();
        try { GearArt.paint(c, itemId, { q: q, t: 0 }); } catch (e) { }
        g.restore();
      } else {
        try { fallbackDraw(g, size, itemId, def, q); } catch (e) { }
      }
    }
    cache[key] = c;
    return c;
  }

  /* -------------------- 没有专属画法的道具：程序化生成 -------------------- */

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const PILL_HUES = [
    ['#ffd8a0', '#c87a2a'], ['#a8e8ff', '#2a7ab0'], ['#b8ffcc', '#2a8a52'],
    ['#e0c0ff', '#6a3ab0'], ['#ffc0c0', '#a02a2a'], ['#fff0a0', '#b08a1a']
  ];
  const MAT_HUES = [
    ['#b8e88a', '#4a7a2a'], ['#8ad8e8', '#2a6a8a'], ['#e8c88a', '#8a5a2a'],
    ['#d8a8e8', '#6a2a8a'], ['#ffb88a', '#a04a2a'], ['#c8d8e8', '#4a5a7a']
  ];

  function fallbackDraw(g, size, id, def, q) {
    const h = hashStr(id);
    const kind = def.kind || 'mat';
    const S = size;
    const cx = S / 2, cy = S / 2;
    const name = def.name || '';

    if (kind === 'pill') {
      const pal = PILL_HUES[h % PILL_HUES.length];
      // 丹丸
      g.save();
      g.shadowColor = pal[0];
      g.shadowBlur = S * 0.22;
      const rg = g.createRadialGradient(cx - S * 0.1, cy - S * 0.12, S * 0.03, cx, cy, S * 0.34);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.32, pal[0]);
      rg.addColorStop(1, pal[1]);
      g.fillStyle = rg;
      g.beginPath();
      g.arc(cx, cy, S * 0.30, 0, 6.2832);
      g.fill();
      g.restore();

      // 丹纹
      g.strokeStyle = 'rgba(255,255,255,0.6)';
      g.lineWidth = Math.max(0.8, S * 0.022);
      const arcs = 1 + (h % 3);
      for (let i = 0; i < arcs; i++) {
        g.beginPath();
        g.arc(cx, cy, S * (0.12 + i * 0.055), 0.4 + i, 0.4 + i + 2.0);
        g.stroke();
      }
      // 灵气
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 3; i++) {
        const a = (h % 10) * 0.3 + i * 2.1;
        g.beginPath();
        g.arc(cx + Math.cos(a) * S * 0.38, cy + Math.sin(a) * S * 0.38, S * 0.026, 0, 6.2832);
        g.fill();
      }
      // 破境类加一圈裂光
      if (name.indexOf('破境') >= 0) {
        g.strokeStyle = 'rgba(255,120,90,0.9)';
        g.lineWidth = Math.max(1, S * 0.03);
        g.beginPath();
        g.arc(cx, cy, S * 0.36, 0, 6.2832);
        g.stroke();
      }
      return;
    }

    if (kind === 'mat') {
      const pal = MAT_HUES[h % MAT_HUES.length];
      const isHerb = /草|参|芝|蕊|花|灵|髓/.test(name);
      const isMetal = /锭|丝|筋|铁|丹/.test(name);
      if (isHerb) {
        // 草药：茎 + 叶 + 花/果
        const tilt = ((h % 7) - 3) * 0.06;
        g.save();
        g.translate(cx, cy + S * 0.08);
        g.rotate(tilt);
        g.strokeStyle = pal[1];
        g.lineWidth = Math.max(1, S * 0.045);
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(0, S * 0.26);
        g.quadraticCurveTo(S * 0.03, 0, 0, -S * 0.16);
        g.stroke();
        // 叶
        g.fillStyle = pal[0];
        const leaves = 2 + (h % 3);
        for (let i = 0; i < leaves; i++) {
          const y = S * 0.18 - i * S * 0.11;
          const dir = i % 2 === 0 ? 1 : -1;
          g.save();
          g.translate(0, y);
          g.rotate(dir * 0.65);
          g.beginPath();
          g.ellipse(dir * S * 0.09, 0, S * 0.10, S * 0.045, 0, 0, 6.2832);
          g.fill();
          g.restore();
        }
        // 顶花 / 顶果
        g.fillStyle = pal[0];
        g.shadowColor = pal[0];
        g.shadowBlur = S * 0.16;
        g.beginPath();
        g.arc(0, -S * 0.19, S * 0.075, 0, 6.2832);
        g.fill();
        g.restore();
        return;
      }
      if (isMetal) {
        // 锭 / 丝 / 筋：块状 + 纹理
        g.save();
        g.translate(cx, cy);
        g.rotate(0.18 + ((h % 5) - 2) * 0.1);
        const w = S * 0.5, ht = S * 0.3;
        const lg = g.createLinearGradient(-w / 2, -ht / 2, w / 2, ht / 2);
        lg.addColorStop(0, pal[0]);
        lg.addColorStop(0.55, pal[1]);
        lg.addColorStop(1, pal[0]);
        g.fillStyle = lg;
        roundRectI(g, -w / 2, -ht / 2, w, ht, S * 0.05);
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.42)';
        g.lineWidth = Math.max(0.8, S * 0.02);
        g.stroke();
        g.strokeStyle = 'rgba(0,0,0,0.24)';
        for (let i = 1; i < 3; i++) {
          g.beginPath();
          g.moveTo(-w / 2 + i * w / 3, -ht / 2);
          g.lineTo(-w / 2 + i * w / 3, ht / 2);
          g.stroke();
        }
        g.restore();
        return;
      }
      // 通用：矿晶
      g.save();
      g.translate(cx, cy + S * 0.05);
      g.shadowColor = pal[0];
      g.shadowBlur = S * 0.18;
      g.fillStyle = pal[0];
      g.beginPath();
      g.moveTo(0, -S * 0.3);
      g.lineTo(S * 0.22, -S * 0.04);
      g.lineTo(0, S * 0.28);
      g.lineTo(-S * 0.22, -S * 0.04);
      g.closePath();
      g.fill();
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = Math.max(0.7, S * 0.018);
      g.beginPath();
      g.moveTo(0, -S * 0.28);
      g.lineTo(0, S * 0.26);
      g.stroke();
      return;
    }

    // 其它：品质色圆珠
    const qq = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, q || 0))];
    g.fillStyle = qq.color;
    g.beginPath();
    g.arc(cx, cy, S * 0.26, 0, 6.2832);
    g.fill();
  }

  function roundRectI(g, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr);
    g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr);
    g.closePath();
  }

  /** 把图标画进指定 canvas 元素 */
  function paint(canvas, itemId) {
    if (!canvas || !canvas.getContext) return;
    const src = get(itemId, canvas.width || 48);
    const g = canvas.getContext('2d');
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(src, 0, 0, canvas.width, canvas.height);
  }

  return {
    get, paint,
    has: (id) => !!DRAW[id] ||
      (typeof GearArt !== 'undefined' && GearArt.has && GearArt.has(id))
  };
})();

/* ------------------------------------------------------------------
   金币 / 修为 / 品质星 小图标（任务奖励、价格处使用）
------------------------------------------------------------------ */
const CoinArt = (function () {
  const cache = {};

  function goldCoin(g, S) {
    const cx = S / 2, cy = S / 2, R = S * 0.40;
    // 外圈
    const rim = g.createLinearGradient(0, cy - R, 0, cy + R);
    rim.addColorStop(0, '#fff3c0');
    rim.addColorStop(0.45, '#e8b53a');
    rim.addColorStop(1, '#8a5c10');
    g.fillStyle = rim;
    g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fill();
    // 内盘
    const inner = g.createRadialGradient(cx - R * 0.32, cy - R * 0.36, R * 0.1, cx, cy, R * 0.9);
    inner.addColorStop(0, '#fff8d8');
    inner.addColorStop(0.46, '#f2c85a');
    inner.addColorStop(1, '#b8862a');
    g.fillStyle = inner;
    g.beginPath(); g.arc(cx, cy, R * 0.78, 0, 6.2832); g.fill();
    // 方孔（铜钱感）
    g.fillStyle = 'rgba(60,40,10,0.55)';
    const h = R * 0.3;
    g.fillRect(cx - h / 2, cy - h / 2, h, h);
    g.strokeStyle = 'rgba(255,250,220,0.55)';
    g.lineWidth = Math.max(0.6, S * 0.02);
    g.strokeRect(cx - h / 2, cy - h / 2, h, h);
    // 高光
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath();
    g.ellipse(cx - R * 0.34, cy - R * 0.42, R * 0.26, R * 0.16, -0.6, 0, 6.2832);
    g.fill();
    // 底部阴影
    const sh = g.createLinearGradient(0, cy + R * 0.1, 0, cy + R);
    sh.addColorStop(0, 'rgba(90,55,10,0)');
    sh.addColorStop(1, 'rgba(90,55,10,0.45)');
    g.fillStyle = sh;
    g.beginPath(); g.arc(cx, cy, R, 0.2, Math.PI - 0.2); g.fill();
  }

  function expStar(g, S) {
    const cx = S / 2, cy = S / 2, R = S * 0.42;
    g.save();
    g.translate(cx, cy);
    const grd = g.createLinearGradient(0, -R, 0, R);
    grd.addColorStop(0, '#e8f4ff');
    grd.addColorStop(0.5, '#7fc8ff');
    grd.addColorStop(1, '#2a6a9e');
    g.fillStyle = grd;
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832 - Math.PI / 2;
      const r = i % 2 === 0 ? R : R * 0.42;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(230,248,255,0.85)';
    g.lineWidth = Math.max(0.6, S * 0.02);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.arc(-R * 0.2, -R * 0.28, R * 0.14, 0, 6.2832); g.fill();
    g.restore();
  }

  function paint(cv, kind, size) {
    if (!cv || !cv.getContext) return;
    const S = size || cv.width || 32;
    const key = kind + '@' + S;
    let src = cache[key];
    if (!src) {
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const g = c.getContext('2d');
      if (kind === 'coin') goldCoin(g, S);
      else expStar(g, S);
      src = c;
      cache[key] = src;
    }
    const g2 = cv.getContext('2d');
    g2.clearRect(0, 0, cv.width, cv.height);
    g2.drawImage(src, 0, 0, cv.width, cv.height);
  }

  return { paint };
})();