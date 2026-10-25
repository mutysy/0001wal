'use strict';

/* =========================================================================
   青云界 · 触屏操作（虚拟摇杆 + 技能按键）
   触屏设备自动启用；也可用 ?touch=1 强制开启，?touch=0 关闭
   ========================================================================= */

const Touch = (function () {
  let G = null;
  let root = null;
  let knob = null;
  let base = null;
  let vec = { x: 0, y: 0 };
  let pointerId = null;
  let enabled = false;
  let buttons = {};
  let gateOpen = false;
  let overlayHidden = false;

  const DEAD = 0.16;        // 摇杆死区
  const MAX_R = 46;         // 摇杆最大半径

  function isTouchDevice() {
    try {
      if (typeof navigator === 'undefined') return false;
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    } catch (e) { return false; }
  }

  function wantTouch() {
    try {
      const q = new URLSearchParams(window.location.search).get('touch');
      if (q === '1') return true;
      if (q === '0') return false;
    } catch (e) { }
    return isTouchDevice();
  }

  function el(tag, cls, html) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html) d.innerHTML = html;
    return d;
  }

  function init(game, config) {
    G = game;
    cfg = normalize(config || {});
    // 没有传 show 时按设备自动判断
    if (!config || typeof config.show !== 'boolean') cfg.show = wantTouch();
    // 调试参数优先：?touch=1 强制显示 / ?touch=0 强制隐藏
    try {
      const q = new URLSearchParams(window.location.search).get('touch');
      if (q === '1') cfg.show = true;
      else if (q === '0') cfg.show = false;
    } catch (e) { }
    gateOpen = false;
    if (!cfg.show) return;
    build();
    applyStyle();
    refreshVisible();
  }

  /** 真正把摇杆与按键创建出来 */
  function build() {
    if (root) { applyStyle(); return; }
    enabled = true;

    root = el('div', 'touch-ui');
    root.id = 'touchUI';

    /* ---------- 摇杆 ---------- */
    base = el('div', 'joy-base');
    knob = el('div', 'joy-knob');
    base.appendChild(knob);
    root.appendChild(base);

    base.addEventListener('pointerdown', onDown);
    base.addEventListener('pointermove', onMove);
    base.addEventListener('pointerup', onUp);
    base.addEventListener('pointercancel', onUp);
    base.addEventListener('pointerleave', onUp);

    /* ---------- 按键 ---------- */
    const pad = el('div', 'touch-pad');
    root.appendChild(pad);

    const defs = [
      { id: 'ult', label: '绝', cls: 'b-ult', act: () => G.player.skills[2] && G.castSkill(G.player.skills[2]) },
      { id: 'skill2', label: '招二', cls: 'b-s2', act: () => G.player.skills[1] && G.castSkill(G.player.skills[1]) },
      { id: 'skill1', label: '招一', cls: 'b-s1', act: () => G.player.skills[0] && G.castSkill(G.player.skills[0]) },
      { id: 'attack', label: '攻', cls: 'b-atk', act: () => G.tryBasicAttack() },
      { id: 'dodge', label: '闪', cls: 'b-dodge', act: () => G.tryDodge() },
      { id: 'interact', label: '交互', cls: 'b-act', act: () => G.doInteract() }
    ];
    for (const d of defs) {
      const b = el('button', 'touch-btn ' + d.cls, d.label);
      b.type = 'button';
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        b.classList.add('pressed');
        Audio2.unlock();
        try { d.act(); } catch (err) { console.error(err); }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
        b.addEventListener(ev, () => b.classList.remove('pressed')));
      pad.appendChild(b);
      buttons[d.id] = b;
    }

    /* ---------- 顶部菜单按钮交给 HUD 的三横线菜单，这里不再重复 ---------- */
    document.body.appendChild(root);

    applyStyle();

    // 阻止页面滚动/缩放
    document.addEventListener('touchmove', (e) => {
      if (e.target && e.target.closest && e.target.closest('.touch-ui')) e.preventDefault();
    }, { passive: false });
  }

  /** 移除控件（关闭显示时） */
  function destroy() {
    if (!root) return;
    try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) { }
    root = null; base = null; knob = null;
    buttons = {};
    enabled = false;
    pointerId = null;
    vec.x = 0; vec.y = 0;
  }

  function onDown(e) {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    try { base.setPointerCapture(e.pointerId); } catch (x) { }
    Audio2.unlock();
    e.preventDefault();
    moveTo(e);
  }

  function onMove(e) {
    if (pointerId === null || e.pointerId !== pointerId) return;
    e.preventDefault();
    moveTo(e);
  }

  function onUp(e) {
    if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;
    pointerId = null;
    vec.x = 0; vec.y = 0;
    if (knob) { knob.style.transform = 'translate(-50%, -50%)'; }
    if (base) base.classList.remove('active');
  }

  function moveTo(e) {
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    const maxR = Math.min(MAX_R, r.width / 2 - 6);
    if (len > maxR) { dx = dx / len * maxR; dy = dy / len * maxR; }
    if (knob) knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    base.classList.add('active');

    const nx = dx / maxR;
    const ny = dy / maxR;
    const mag = Math.hypot(nx, ny);
    if (mag < DEAD) { vec.x = 0; vec.y = 0; }
    else { vec.x = nx; vec.y = ny; }
  }

  /** 返回摇杆方向（已归一化到 [-1,1]，含死区） */
  function vector() {
    if (!enabled) return null;
    if (vec.x === 0 && vec.y === 0) return null;
    return { x: vec.x, y: vec.y };
  }

  /** 交互按钮高亮 */
  function setInteract(show) {
    if (!enabled || !buttons.interact) return;
    buttons.interact.classList.toggle('on', !!show);
  }

  /** 技能冷却显示 */
  function updateCooldowns() {
    if (!enabled) return;
    const p = G.player;
    const map = { skill1: 0, skill2: 1, ult: 2 };
    for (const k in map) {
      const b = buttons[k];
      if (!b) continue;
      const id = p.skills[map[k]];
      if (!id) continue;
      const cd = G.cooldowns[id] || 0;
      const max = SKILLS[id].cd || 1;
      if (cd > 0.05) {
        b.classList.add('cooling');
        b.style.setProperty('--cd', Math.min(1, cd / max).toFixed(3));
      } else {
        b.classList.remove('cooling');
        b.style.setProperty('--cd', '0');
      }
      b.classList.toggle('noqi', p.qi < SKILLS[id].cost);
    }
  }

  function isEnabled() { return enabled; }

  function refreshVisible() {
    if (!root) return;
    const hide = overlayHidden || !gateOpen || !cfg.show;
    root.classList.toggle('hidden', hide);
    if (hide) {
      vec.x = 0; vec.y = 0;
      pointerId = null;
      if (knob) knob.style.transform = 'translate(-50%, -50%)';
      if (base) base.classList.remove('active');
    }
  }

  /** 打开界面时隐藏摇杆与按键（恢复时再显示） */
  function setHidden(hide) {
    overlayHidden = !!hide;
    refreshVisible();
  }

  /** 游戏开始 / 结束的总开关 */
  function setGate(open) {
    gateOpen = !!open;
    refreshVisible();
  }

  /* ==================================================================
     可自定义：大小 / 位置 / 透明度
     ================================================================== */

  const DEF_CFG = {
    joySize: 132,     // 摇杆直径
    joyX: 22,         // 摇杆距边
    joyY: 26,         // 摇杆距下
    joySide: 'left',  // 摇杆在左还是右
    btnScale: 1.0,    // 按键整体缩放
    padX: 18,         // 按键组距右
    padY: 20,         // 按键组距下
    opacity: 1.0,     // 整体不透明度
    show: false       // 是否显示触屏控件
  };

  let cfg = Object.assign({}, DEF_CFG);

  function clampN(v, a, b) {
    v = Number(v);
    if (!isFinite(v)) return a;
    return v < a ? a : (v > b ? b : v);
  }

  function normalize(input) {
    const c = Object.assign({}, DEF_CFG, cfg, input || {});
    c.joySize = clampN(c.joySize, 80, 210);
    c.joyX = clampN(c.joyX, 4, 240);
    c.joyY = clampN(c.joyY, 4, 240);
    c.btnScale = clampN(c.btnScale, 0.6, 1.8);
    c.padX = clampN(c.padX, 2, 240);
    c.padY = clampN(c.padY, 2, 240);
    c.opacity = clampN(c.opacity, 0.25, 1);
    c.joySide = (c.joySide === 'right') ? 'right' : 'left';
    c.show = !!c.show;
    return c;
  }

  function applyStyle() {
    if (!root) return;
    root.setAttribute('data-joy', cfg.joySide);
    root.style.setProperty('--joy-size', cfg.joySize + 'px');
    root.style.setProperty('--joy-x', cfg.joyX + 'px');
    root.style.setProperty('--joy-y', cfg.joyY + 'px');
    root.style.setProperty('--btn-scale', String(cfg.btnScale));
    root.style.setProperty('--pad-x', cfg.padX + 'px');
    root.style.setProperty('--pad-y', cfg.padY + 'px');
    root.style.opacity = String(cfg.opacity);
  }

  /** 应用一份配置；show 为 true 时会即时创建控件（桌面也可预览） */
  function applyConfig(input) {
    cfg = normalize(input);
    if (cfg.show) {
      if (!root) build();
      else applyStyle();
    }
    refreshVisible();
    return cfg;
  }

  function getConfig() { return normalize(cfg); }

  return {
    init, vector, setInteract, updateCooldowns, isEnabled, isTouchDevice, setHidden,
    applyConfig, getConfig, destroy, setGate, DEF_CFG
  };
})();
