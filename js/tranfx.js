'use strict';

/* =========================================================================
   青云界 · 传送过场动画（约 1.5 秒，丝滑衔接）
   TranFx.play(mapName, themeColor, onSwitch, onDone)
   ========================================================================= */

const TranFx = (function () {
  let cv = null, g = null;
  let playing = false;
  let t = 0;
  let dur = 1.5;
  let switchAt = 0.62;      // 在这一刻切换地图，画面正被白光吞没
  let switched = false;
  let onSwitch = null, onDone = null;
  let title = '';
  let color = '150,220,255';
  let raf = 0;
  let guard = 0;
  let last = 0;

  function ensure() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.id = 'tranCanvas';
    cv.className = 'tran-canvas hidden';
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

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x) => x * x * x;

  function draw(W, H, p) {
    if (!g) return;
    g.clearRect(0, 0, W, H);

    // p: 0 → 1
    const gather = Math.min(1, p / switchAt);              // 汇聚
    const reveal = Math.max(0, (p - switchAt) / (1 - switchAt)); // 展开

    // 背景暗下
    let bgA = gather * 0.9;
    if (p > switchAt) bgA = (1 - easeOut(reveal)) * 0.9;
    g.fillStyle = 'rgba(4,7,12,' + bgA.toFixed(3) + ')';
    g.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H);

    /* ---------- 汇聚阶段：法阵 + 符文向内收 ---------- */
    if (p <= switchAt + 0.06) {
      const a = 1 - reveal;
      g.save();
      g.translate(cx, cy);

      // 旋转法阵
      const ringR = R * (0.42 - 0.26 * easeIn(gather));
      g.strokeStyle = 'rgba(' + color + ',' + (0.55 * (1 - reveal)).toFixed(3) + ')';
      g.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        g.save();
        g.rotate(t * (i ? -1.4 : 2.1) + i * 1.2);
        g.beginPath();
        g.arc(0, 0, ringR * (1 + i * 0.18), 0, 6.2832);
        g.stroke();
        // 刻度
        for (let k = 0; k < 12; k++) {
          const ang = k * 0.5236;
          g.beginPath();
          g.moveTo(Math.cos(ang) * ringR * (1 + i * 0.18), Math.sin(ang) * ringR * (1 + i * 0.18));
          g.lineTo(Math.cos(ang) * ringR * (1.09 + i * 0.18), Math.sin(ang) * ringR * (1.09 + i * 0.18));
          g.stroke();
        }
        g.restore();
      }

      // 符文粒向内飞
      const N = 46;
      for (let i = 0; i < N; i++) {
        const seed = i * 12.9898;
        const ang = seed % 6.2832 + t * 0.6;
        const rad = R * (0.62 - 0.55 * easeIn(gather)) * (0.6 + ((seed * 7) % 10) / 16);
        const x = Math.cos(ang) * rad;
        const y = Math.sin(ang) * rad * 0.66;
        const al = (1 - reveal) * (0.35 + 0.5 * Math.abs(Math.sin(t * 6 + i)));
        g.fillStyle = 'rgba(' + color + ',' + al.toFixed(3) + ')';
        g.beginPath();
        g.arc(x, y, 1.2 + ((i % 3) * 0.7), 0, 6.2832);
        g.fill();
      }
      g.restore();
    }

    /* ---------- 白光峰值 ---------- */
    const flash = Math.max(0, 1 - Math.abs(p - switchAt) / 0.16);
    if (flash > 0.001) {
      g.fillStyle = 'rgba(220,245,255,' + (flash * 0.92).toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }

    /* ---------- 展开阶段：光带 + 地图名 ---------- */
    if (p > switchAt) {
      const k = easeOut(reveal);
      g.save();
      g.translate(cx, cy);

      // 扩散光环
      for (let i = 0; i < 3; i++) {
        const rr = R * (0.06 + k * 0.5) + i * R * 0.06;
        g.strokeStyle = 'rgba(' + color + ',' + ((1 - k) * 0.5).toFixed(3) + ')';
        g.lineWidth = 2.4 - i * 0.6;
        g.beginPath();
        g.arc(0, 0, rr, 0, 6.2832);
        g.stroke();
      }

      // 射线
      g.globalAlpha = (1 - k) * 0.5;
      for (let i = 0; i < 16; i++) {
        const ang = i * 0.3927 + t * 0.4;
        g.strokeStyle = 'rgba(' + color + ',0.7)';
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(Math.cos(ang) * R * 0.08, Math.sin(ang) * R * 0.08);
        g.lineTo(Math.cos(ang) * R * (0.2 + k * 0.55), Math.sin(ang) * R * (0.2 + k * 0.55));
        g.stroke();
      }
      g.globalAlpha = 1;
      g.restore();

      // 地图名
      if (title) {
        const ta = Math.min(1, reveal * 3.2);
        g.save();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const fs = Math.round(Math.min(W, H) * 0.085);
        g.font = '600 ' + fs + 'px "STKaiti","KaiTi",serif';
        g.globalAlpha = ta;
        g.shadowColor = 'rgba(' + color + ',0.95)';
        g.shadowBlur = 28;
        g.fillStyle = '#f2fbff';
        g.fillText(title, cx, cy);
        // 装饰线
        const lw = Math.min(W * 0.28, 260) * ta;
        g.shadowBlur = 0;
        g.strokeStyle = 'rgba(' + color + ',' + (0.85 * ta).toFixed(3) + ')';
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(cx - lw, cy + fs * 0.82);
        g.lineTo(cx + lw, cy + fs * 0.82);
        g.stroke();
        g.restore();
      }
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

      if (!switched && p >= switchAt) {
        switched = true;
        try { if (onSwitch) onSwitch(); } catch (e) { console.error(e); }
      }

      try { resizeIfNeeded(); draw(window.innerWidth, window.innerHeight, p); } catch (e) { }

      if (p >= 1) { finish(); return; }
    } catch (e) {
      // 任何异常都不能让玩家卡在过场里
      try { console.error('[青云界] 过场异常', e); } catch (x) { }
      if (!switched) {
        switched = true;
        try { if (onSwitch) onSwitch(); } catch (x) { }
      }
      finish();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function finish() {
    playing = false;
    if (guard) { try { clearTimeout(guard); } catch (e) { } guard = 0; }
    if (cv) cv.classList.add('hidden');
    const cb = onDone;
    onSwitch = onDone = null;
    if (cb) { try { cb(); } catch (e) { } }
  }

  let lastW = 0, lastH = 0;
  function resizeIfNeeded() {
    if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
      lastW = window.innerWidth;
      lastH = window.innerHeight;
      resize();
    }
  }

  /**
   * @param {string} mapName  显示的地图名
   * @param {string} themeColor 'r,g,b'
   * @param {Function} onSwitch 切换地图（白光最亮时）
   * @param {Function} onDone   动画结束
   */
  function play(mapName, themeColor, cbSwitch, cbDone) {
    ensure();
    resizeIfNeeded();
    if (cv) cv.classList.remove('hidden');
    title = mapName || '';
    color = themeColor || '150,220,255';
    onSwitch = cbSwitch || null;
    onDone = cbDone || null;
    t = 0;
    last = 0;
    switched = false;
    dur = 1.5;
    switchAt = 0.62;
    playing = true;
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    // 硬兜底：即便动画回调因环境异常停了，也一定解锁
    if (guard) { try { clearTimeout(guard); } catch (e) { } }
    guard = setTimeout(() => {
      if (playing) { finish(); }
    }, Math.ceil(dur * 1000) + 500);
  }

  function isPlaying() { return playing; }

  return { play, isPlaying, resize };
})();
