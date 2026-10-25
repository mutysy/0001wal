'use strict';

/* =========================================================================
   青云界 · 技能释放 CG
   漫画式横插：屏幕中间一条粗黑框，里面是角色放招的特写动作 + 速度线 + 招式名
   ========================================================================= */

const SkillCG = (function () {
  let cv = null, g = null;
  let playing = false;
  let t = 0;
  let dur = 1.05;
  let title = '';
  let sub = '';
  let color = '200,230,255';
  let figOpts = null;
  let raf = 0;
  let last = 0;

  function ensure() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.id = 'skillCg';
    cv.className = 'skill-cg hidden';
    (document.getElementById('hud') || document.body).appendChild(cv);
    g = cv.getContext('2d');
  }

  function resize() {
    if (!cv) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    cv.width = Math.floor(window.innerWidth * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    cv.style.width = window.innerWidth + 'px';
    cv.style.height = window.innerHeight + 'px';
    if (g && g.setTransform) g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function hexA(hex, a) {
    const s = String(hex || '#ffffff').replace('#', '');
    const n = parseInt(s.length === 3 ? s.split('').map(function (c) { return c + c; }).join('') : s, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function draw(W, H, p) {
    if (!g) return;
    g.clearRect(0, 0, W, H);

    // 0~0.18 展开，0.18~0.72 停留，0.72~1 收起
    let bandK;
    if (p < 0.18) bandK = p / 0.18;
    else if (p > 0.74) bandK = Math.max(0, 1 - (p - 0.74) / 0.26);
    else bandK = 1;
    if (bandK <= 0.001) return;

    const bandH = H * 0.34 * bandK;
    const cy = H * 0.5;
    const y0 = cy - bandH / 2;
    const y1 = cy + bandH / 2;

    // 速度线（整屏斜线）
    g.save();
    g.globalAlpha = 0.30 * bandK;
    g.strokeStyle = 'rgba(255,255,255,' + (0.5 * bandK).toFixed(3) + ')';
    g.lineWidth = 1.6;
    for (let i = 0; i < 26; i++) {
      const yy = (i / 26) * H;
      const off = ((t * 900 + i * 137) % (W + 400)) - 200;
      g.beginPath();
      g.moveTo(off - 160, yy);
      g.lineTo(off + 40, yy - 26);
      g.stroke();
    }
    g.restore();

    // 黑框
    g.save();
    g.fillStyle = '#05070a';
    g.fillRect(0, y0, W, bandH);
    // 上下白边
    g.fillStyle = 'rgba(255,255,255,' + (0.85 * bandK).toFixed(3) + ')';
    g.fillRect(0, y0 - 3, W, 3);
    g.fillRect(0, y1, W, 3);
    // 边缘斜切
    g.fillStyle = '#05070a';
    for (let i = 0; i < 2; i++) {
      const dir = i === 0 ? 1 : -1;
      g.beginPath();
      g.moveTo(0, i === 0 ? y0 : y1);
      g.lineTo(W * 0.16, i === 0 ? y0 - H * 0.06 : y1 + H * 0.06);
      g.lineTo(W * 0.16, i === 0 ? y0 : y1);
      g.closePath();
      g.fill();
    }
    g.restore();

    // 角色特写
    if (figOpts && typeof drawFigure === 'function') {
      const fx = W * 0.24;
      const fy = y1 - bandH * 0.06;
      const scaleF = Math.min(3.2, (bandH * 1.5) / 60);
      g.save();
      g.beginPath();
      g.rect(0, y0, W, bandH);
      g.clip();
      // 光晕
      const halo = g.createRadialGradient(fx, cy, 4, fx, cy, bandH * 1.1);
      halo.addColorStop(0, 'rgba(' + color + ',0.5)');
      halo.addColorStop(1, 'rgba(' + color + ',0)');
      g.fillStyle = halo;
      g.fillRect(0, y0, W, bandH);

      try {
        drawFigure(g, fx, fy, Object.assign({}, figOpts, {
          scale: (figOpts.scale || 1) * scaleF,
          attack: 0.85,
          moving: false,
          facing: 0
        }));
      } catch (e) { }
      g.restore();
    }

    // 招式名
    if (title) {
      const tx = W * 0.46;
      const fs = Math.round(Math.min(H * 0.13, bandH * 0.52));
      g.save();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.font = '700 ' + fs + 'px "STKaiti","KaiTi",serif';
      // 斜切底衬
      g.beginPath();
      g.moveTo(tx - fs * 0.4, cy + fs * 0.9);
      g.lineTo(tx + (title.length * fs * 0.95) + fs * 0.4, cy + fs * 0.55);
      g.lineTo(tx + (title.length * fs * 0.95) + fs * 0.1, cy - fs * 0.62);
      g.lineTo(tx - fs * 0.7, cy - fs * 0.95);
      g.closePath();
      g.fillStyle = hexA('#000000', 0.55);
      g.fill();

      g.lineWidth = Math.max(4, fs * 0.09);
      g.strokeStyle = '#0a0d12';
      g.strokeText(title, tx, cy);
      g.fillStyle = '#ffffff';
      g.fillText(title, tx, cy);

      if (sub) {
        g.font = '600 ' + Math.round(fs * 0.34) + 'px "STKaiti","KaiTi",serif';
        g.fillStyle = 'rgba(' + color + ',0.95)';
        g.fillText(sub, tx + fs * 0.1, cy + fs * 0.72);
      }

      // 速度线跟着名字
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const yy = cy - fs * 0.9 + i * fs * 0.32;
        const w2 = fs * (1.2 + (i % 3) * 0.7);
        g.beginPath();
        g.moveTo(tx + fs * 0.2, yy);
        g.lineTo(tx + fs * 0.2 + w2, yy - 4);
        g.stroke();
      }
      g.restore();
    }
  }

  function loop(now) {
    if (!playing) return;
    try {
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const p = Math.min(1, t / dur);
      if (cv.width !== Math.floor(window.innerWidth * (Math.min(2, window.devicePixelRatio || 1))) ||
        cv.height !== Math.floor(window.innerHeight * (Math.min(2, window.devicePixelRatio || 1)))) {
        resize();
      }
      draw(window.innerWidth, window.innerHeight, p);
      if (p >= 1) {
        playing = false;
        if (cv) cv.classList.add('hidden');
        return;
      }
    } catch (e) {
      playing = false;
      if (cv) cv.classList.add('hidden');
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  /**
   * @param {string} name  招式名
   * @param {string} col   'r,g,b'
   * @param {object} opts  { sub, fig }
   */
  function play(name, col, opts) {
    ensure();
    resize();
    title = name || '';
    color = col || '200,230,255';
    sub = (opts && opts.sub) || '';
    figOpts = (opts && opts.fig) || null;
    t = 0;
    last = 0;
    playing = true;
    if (cv) cv.classList.remove('hidden');
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    // 硬兜底
    setTimeout(function () {
      if (playing) {
        playing = false;
        if (cv) cv.classList.add('hidden');
      }
    }, Math.ceil(dur * 1000) + 400);
  }

  function isPlaying() { return playing; }

  return { play, isPlaying, resize };
})();
