'use strict';

/* =========================================================================
   青云界 · 大地图（点击放大 / 光标快速传送）
   ========================================================================= */

const BigMap = (function () {
  let G = null;
  const el = {};
  let curMap = null;
  let hover = null;
  let mouse = { x: -1, y: -1 };
  let scaleInfo = null;
  let anim = 0;
  let rafId = 0;

  function $(id) { return document.getElementById(id); }

  function init(game) {
    G = game;
    ['mapPanel', 'mapCanvas', 'mapTabs', 'mapTip', 'mapHint', 'mapTitle', 'mapClose'].forEach((id) => {
      el[id] = $(id);
    });
    if (!el.mapPanel) return;

    el.mapCanvas.addEventListener('mousemove', onMove);
    el.mapCanvas.addEventListener('mouseleave', () => { mouse.x = -1; mouse.y = -1; hover = null; hideTip(); });
    el.mapCanvas.addEventListener('click', onClick);
    el.mapCanvas.addEventListener('touchend', onClick);
    el.mapPanel.addEventListener('click', (e) => {
      if (e.target === el.mapPanel) close();
    });
    // 手机端必须有关闭按钮
    if (el.mapClose) {
      el.mapClose.addEventListener('click', (e) => {
        e.stopPropagation();
        Audio2.play('uiBack');
        close();
      });
    }
  }

  function isOpen() { return el.mapPanel && !el.mapPanel.classList.contains('hidden'); }

  function open(mapId) {
    if (!el.mapPanel) return;
    curMap = mapId || (G.map ? G.map.id : 'village');
    el.mapPanel.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    buildTabs();
    resize();
    anim = 0;
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  function close() {
    if (!el.mapPanel) return;
    el.mapPanel.classList.add('hidden');
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
    hideTip();
  }

  function buildTabs() {
    el.mapTabs.innerHTML = '';
    const order = ['village', 'valley', 'forest', 'peak'];
    for (const id of order) {
      const def = MAPS[id];
      const known = !!G.maps[id];
      const tab = document.createElement('div');
      tab.className = 'map-tab' + (id === curMap ? ' on' : '') + (known ? '' : ' locked');
      tab.textContent = known ? def.name : '？？？';
      if (known) {
        tab.addEventListener('click', () => {
          curMap = id;
          buildTabs();
        });
      }
      el.mapTabs.appendChild(tab);
    }
  }

  function resize() {
    const c = el.mapCanvas;
    if (!c) return;
    // 缩小地图窗口：不超过半屏
    const w = Math.max(320, Math.min(window.innerWidth * 0.52, 720));
    const h = Math.max(240, Math.min(window.innerHeight * 0.50, 460));
    c.width = Math.floor(w);
    c.height = Math.floor(h);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
  }

  function hideTip() { if (el.mapTip) el.mapTip.classList.add('hidden'); }

  /* ------------------------------ 坐标换算 ------------------------------ */

  function computeScale() {
    const map = G.maps[curMap];
    const c = el.mapCanvas;
    if (!map) return null;
    const mw = map.cols * TILE, mh = map.rows * TILE;
    const pad = 16;
    const s = Math.min((c.width - pad * 2) / mw, (c.height - pad * 2) / mh);
    const ox = (c.width - mw * s) / 2;
    const oy = (c.height - mh * s) / 2;
    return { s, ox, oy, mw, mh };
  }

  function toScreen(wx, wy) {
    return { x: scaleInfo.ox + wx * scaleInfo.s, y: scaleInfo.oy + wy * scaleInfo.s };
  }

  /* ------------------------------ 绘制 ------------------------------ */

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (!isOpen()) return;
    anim += 0.016;
    draw();
  }

  function draw() {
    const c = el.mapCanvas;
    const g = c.getContext('2d');
    const map = G.maps[curMap];

    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#070b10';
    g.fillRect(0, 0, c.width, c.height);

    if (!map) {
      g.fillStyle = '#66727c';
      g.font = '18px "STKaiti","KaiTi",serif';
      g.textAlign = 'center';
      g.fillText('尚未踏足此地', c.width / 2, c.height / 2);
      return;
    }

    scaleInfo = computeScale();
    const { s, ox, oy, mw, mh } = scaleInfo;

    // 地形
    g.imageSmoothingEnabled = false;
    g.drawImage(map.miniCanvas, 0, 0, map.cols, map.rows,
      ox, oy, mw * s, mh * s);
    g.imageSmoothingEnabled = true;

    // 边框
    g.strokeStyle = 'rgba(190,158,92,0.5)';
    g.lineWidth = 1.5;
    g.strokeRect(ox, oy, mw * s, mh * s);

    // 网格
    g.strokeStyle = 'rgba(255,255,255,0.045)';
    g.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const x = ox + (mw * s) * (i / 8);
      const y = oy + (mh * s) * (i / 8);
      g.beginPath(); g.moveTo(x, oy); g.lineTo(x, oy + mh * s); g.stroke();
      g.beginPath(); g.moveTo(ox, y); g.lineTo(ox + mw * s, y); g.stroke();
    }

    // 出口
    for (const ex of (map.exits || [])) {
      const p = toScreen(ex.x, ex.y);
      g.fillStyle = 'rgba(255,200,120,0.85)';
      g.beginPath();
      const r = 6;
      g.moveTo(p.x, p.y - r);
      g.lineTo(p.x + r, p.y);
      g.lineTo(p.x, p.y + r);
      g.lineTo(p.x - r, p.y);
      g.closePath();
      g.fill();
    }

    // NPC
    for (const n of map.npcs) {
      const p = toScreen(n.x, n.y);
      g.fillStyle = 'rgba(140,230,255,0.95)';
      g.beginPath(); g.arc(p.x, p.y, 3.4, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(10,20,30,0.8)';
      g.lineWidth = 1.2;
      g.stroke();
    }

    // 草药
    for (const h of map.herbs) {
      const p = toScreen(h.x, h.y);
      g.fillStyle = 'rgba(150,240,160,0.75)';
      g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 6.2832); g.fill();
    }

    // 传送石碑
    const bound = G.isSteleBound(curMap);
    const st = map.anchors[0];
    const sp = toScreen(st.x, st.y);
    const isHover = hover && hover.type === 'stele';
    const pulse = 0.5 + Math.sin(anim * 3) * 0.3;

    if (bound) {
      const gl = g.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, 26);
      gl.addColorStop(0, 'rgba(150,225,255,' + (0.5 * pulse).toFixed(3) + ')');
      gl.addColorStop(1, 'rgba(90,170,255,0)');
      g.fillStyle = gl;
      g.beginPath(); g.arc(sp.x, sp.y, 26, 0, 6.2832); g.fill();
    }

    // 石碑图标
    g.save();
    g.translate(sp.x, sp.y);
    g.fillStyle = bound ? '#a8e4ff' : 'rgba(150,150,160,0.7)';
    g.beginPath();
    g.moveTo(-6, 8);
    g.lineTo(-6, -6);
    g.quadraticCurveTo(0, -14, 6, -6);
    g.lineTo(6, 8);
    g.closePath();
    g.fill();
    g.strokeStyle = bound ? 'rgba(255,255,255,0.9)' : 'rgba(80,80,90,0.9)';
    g.lineWidth = 1.4;
    g.stroke();
    if (!bound) {
      // 锁
      g.fillStyle = 'rgba(240,240,250,0.85)';
      g.fillRect(-3, 0, 6, 5);
      g.strokeStyle = 'rgba(240,240,250,0.85)';
      g.lineWidth = 1.2;
      g.beginPath(); g.arc(0, 0, 2.6, Math.PI, 0); g.stroke();
    }
    g.restore();

    // 悬停高亮环
    if (isHover && bound) {
      g.strokeStyle = 'rgba(255,225,140,' + (0.6 + pulse * 0.4).toFixed(3) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(sp.x, sp.y, 16 + pulse * 4, 0, 6.2832); g.stroke();
    }

    // 玩家
    if (G.map && G.map.id === curMap) {
      const pp = toScreen(G.player.x, G.player.y);
      const pp2 = 0.5 + Math.sin(anim * 4) * 0.5;
      g.strokeStyle = 'rgba(120,220,255,' + (0.35 + pp2 * 0.4).toFixed(3) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(pp.x, pp.y, 8 + pp2 * 5, 0, 6.2832); g.stroke();
      g.fillStyle = '#7ce0ff';
      g.beginPath(); g.arc(pp.x, pp.y, 4.2, 0, 6.2832); g.fill();
      g.strokeStyle = 'rgba(10,20,30,0.9)';
      g.lineWidth = 1.4;
      g.stroke();
    }

    // 光标
    if (mouse.x >= 0) {
      g.strokeStyle = 'rgba(255,255,255,0.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(mouse.x - 9, mouse.y); g.lineTo(mouse.x - 3, mouse.y);
      g.moveTo(mouse.x + 3, mouse.y); g.lineTo(mouse.x + 9, mouse.y);
      g.moveTo(mouse.x, mouse.y - 9); g.lineTo(mouse.x, mouse.y - 3);
      g.moveTo(mouse.x, mouse.y + 3); g.lineTo(mouse.x, mouse.y + 9);
      g.stroke();
    }

    // 标题
    g.fillStyle = 'rgba(240,228,198,0.75)';
    g.font = '13px "STKaiti","KaiTi",serif';
    g.textAlign = 'left';
    g.fillText(MAPS[curMap].name + '　' + (bound ? '古阵已刻录' : '古阵未刻录'), ox + 6, oy - 6);
  }

  /* ------------------------------ 交互 ------------------------------ */

  function onMove(e) {
    const r = el.mapCanvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (el.mapCanvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (el.mapCanvas.height / r.height);
    hover = null;
    const map = G.maps[curMap];
    if (!map || !scaleInfo) { hideTip(); return; }
    const st = map.anchors[0];
    const p = toScreen(st.x, st.y);
    if (Math.hypot(mouse.x - p.x, mouse.y - p.y) < 20) {
      hover = { type: 'stele' };
      const bound = G.isSteleBound(curMap);
      showTip(p.x, p.y - 30, bound
        ? (G.map && G.map.id === curMap ? '此处即当前所在古阵' : '点击传送至 ' + map.name)
        : '未刻录 · 需亲临石碑处按 E 刻录');
    } else {
      hideTip();
    }
    el.mapCanvas.style.cursor = (hover && G.isSteleBound(curMap) && !(G.map && G.map.id === curMap)) ? 'pointer' : 'crosshair';
  }

  function showTip(x, y, text) {
    const t = el.mapTip;
    if (!t) return;
    t.textContent = text;
    t.classList.remove('hidden');
    const r = el.mapCanvas.getBoundingClientRect();
    t.style.left = (r.left + x * (r.width / el.mapCanvas.width)) + 'px';
    t.style.top = (r.top + y * (r.height / el.mapCanvas.height)) + 'px';
  }

  function onClick() {
    if (!hover || hover.type !== 'stele') return;
    if (!G.isSteleBound(curMap)) {
      if (UI && UI.toast) UI.toast('此碑尚未刻录，需亲临其地刻录', 'red');
      Audio2.play('uiBack');
      return;
    }
    if (G.map && G.map.id === curMap) {
      if (UI && UI.toast) UI.toast('你已在此地', 'blue');
      return;
    }
    close();
    if (G.fastTravel) G.fastTravel(curMap);
  }

  return { init, open, close, isOpen, resize };
})();
