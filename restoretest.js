'use strict';
/* 复现「有存档时继续修行」卡死：逐步打点，看停在哪一步 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const log = (m) => console.log('[' + new Date().toISOString().slice(11, 23) + '] ' + m);

function makeCtx2D() {
  const grad = { addColorStop() {} };
  const t = {
    canvas: { width: 800, height: 600 }, __calls: 0,
    createLinearGradient: () => grad, createRadialGradient: () => grad,
    createPattern: () => null,
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    measureText: () => ({ width: 10 })
  };
  return new Proxy(t, {
    get(o, k) { if (k in o) return o[k]; return function () { }; },
    set(o, k, v) { o[k] = v; return true; }
  });
}

function makeEl(tag, hidden) {
  const e = {
    tagName: tag, style: {}, dataset: {}, textContent: '',
    _classes: new Set(hidden ? ['hidden'] : []), _l: {}, children: [],
    width: 0, height: 0, offsetWidth: 1,
    addEventListener(ev, fn) { (e._l[ev] = e._l[ev] || []).push(fn); },
    removeEventListener() {},
    appendChild(c) { e.children.push(c); c.parentNode = e; return c; },
    removeChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); return c; },
    querySelector() { return makeEl('div'); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx2D(); }
  };
  e.classList = {
    add(c) { e._classes.add(c); }, remove(c) { e._classes.delete(c); },
    contains(c) { return e._classes.has(c); },
    toggle(c, v) { if (v === undefined) { e._classes.has(c) ? e._classes.delete(c) : e._classes.add(c); } else if (v) e._classes.add(c); else e._classes.delete(c); }
  };
  Object.defineProperty(e, 'innerHTML', {
    get() { return e._html || ''; }, set(v) { e._html = v; e.children.length = 0; }
  });
  return e;
}

const IDS = ['scene', 'minimap', 'portrait', 'pathName', 'realmText', 'stoneNum', 'hpFill', 'hpNum',
  'qiFill', 'qiNum', 'cultFill', 'cultNum', 'mapName', 'clock', 'coord', 'skillBar', 'toasts',
  'interactTip', 'interactText', 'interactKey', 'dialogue', 'dlgFace', 'dlgName', 'dlgText',
  'dlgOptions', 'bagPanel', 'bagGrid', 'equipCol', 'itemDetail', 'bagStone', 'bagStat', 'shopPanel',
  'shopTitle', 'shopList', 'sellList', 'shopStone', 'questPanel', 'questList', 'createPanel',
  'pathCards', 'cgPanel', 'cgCanvas', 'cgTitle', 'cgSub', 'cgLine', 'deadPanel', 'deadBtn', 'deadText',
  'challengeBar', 'chName', 'chTime', 'chProg', 'questTracker', 'interactKey',
  'btnMap', 'btnActivity', 'btnMenu', 'nameInput', 'charName',
  'mapPanel', 'mapCanvas', 'mapTabs', 'mapTip', 'mapHint', 'mapTitle', 'mapClose',
  'menuPanel', 'menuTabs', 'menuBody', 'menuTitle', 'menuClose',
  'customPanel', 'customFace', 'customOpts', 'customDone',
  'startPanel', 'startBtn', 'startHint', 'startReset', 'startArt',
  'menuToggle', 'menuDropdown', 'bagFace', 'bagHeroInfo', 'statsPanel'];
const HIDDEN = ['dialogue', 'bagPanel', 'shopPanel', 'questPanel', 'createPanel', 'cgPanel',
  'deadPanel', 'interactTip', 'menuPanel', 'mapPanel', 'challengeBar', 'questTracker',
  'customPanel', 'startPanel', 'menuDropdown', 'startReset'];
const els = {};
for (const id of IDS) els[id] = makeEl('div', HIDDEN.indexOf(id) >= 0);

const document = {
  readyState: 'loading',
  getElementById: (id) => els[id] || (els[id] = makeEl('div')),
  createElement: (t) => makeEl(t),
  addEventListener() {}
};
const winL = {};
const rafQ = [];
const win = {
  innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
  addEventListener(ev, fn) { (winL[ev] = winL[ev] || []).push(fn); },
  removeEventListener() {}
};
const store = {};
const sandbox = {
  window: win, document, console,
  requestAnimationFrame: (fn) => { rafQ.push(fn); return rafQ.length; },
  cancelAnimationFrame() {}, setInterval: () => 0, clearInterval() {},
  setTimeout: (fn) => { timers.push(fn); return 0; }, clearTimeout() {},
  performance: { now: () => Date.now() },
  URLSearchParams,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }, clear() { }
  },
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  escape, unescape,
  Math, Date, JSON, Set, Map, Array, Object, String, Number,
  parseInt, parseFloat, isNaN, isFinite,
  Uint8Array, Uint16Array, Int32Array, Uint8ClampedArray, Float32Array
};
const timers = [];
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

log('载入脚本...');
for (const f of ['data.js', 'world.js', 'render.js', 'portrait.js', 'vfx.js', 'audio.js',
  'rank.js', 'tower.js', 'icons.js', 'touch.js', 'dialogue.js', 'ui.js', 'bigmap.js', 'menu.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: f });
}
log('载入完成');

const run = (c) => vm.runInContext(c, sandbox);
let ts = 0;
function frames(n) {
  for (let i = 0; i < n; i++) {
    const cbs = rafQ.splice(0, rafQ.length);
    ts += 16.7;
    for (const fn of cbs) fn(ts);
  }
}

log('初始化（无存档路径）');
(winL['DOMContentLoaded'] || []).forEach((f) => f());
log('初始化完成');

log('直接 beginGame 开一局');
run("window.__qingyun.beginGame('sword', null, '测试者', null)");
frames(3);
log('snapshot 存档快照');
const snap = run('JSON.parse(JSON.stringify(window.__qingyun.snapshotPlayer()))');
log('快照: ' + JSON.stringify(snap).slice(0, 160));

log('>>> 开始还原（这一步若卡死，说明死循环在 beginGame 的 restore 分支）');
run('(function(){ window.__step = "enter"; })()');
run('window.__qingyun.beginGame("sword", ' + JSON.stringify(snap) + ')');
log('<<< 还原返回，未卡死');
frames(2);
log('还原后: map=' + run('G.map && G.map.id') + ' started=' + run('G.started') +
  ' lvl=' + run('player.level'));
log('✅ 未复现卡死');

