'use strict';
/* 无头冒烟测试 v2：载入全部脚本，驱动择道/CG/战斗/任务/商店/传送全流程 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];
const log = (...a) => console.log(...a);

/* ---------------- 假 DOM ---------------- */
function makeCtx2D() {
  const grad = { addColorStop() {} };
  const t = {
    canvas: { width: 1600, height: 900 },
    __calls: 0,
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    measureText: () => ({ width: 10 })
  };
  return new Proxy(t, {
    get(o, k) { if (k in o) return o[k]; return function () { o.__calls++; }; },
    set(o, k, v) { o[k] = v; return true; }
  });
}

function makeEl(tag, hidden) {
  const e = {
    tagName: tag,
    style: {},
    dataset: {},
    textContent: '',
    _classes: new Set(hidden ? ['hidden'] : []),
    _l: {},
    children: [],
    width: 0, height: 0,
    offsetWidth: 1,
    addEventListener(ev, fn) { (e._l[ev] = e._l[ev] || []).push(fn); },
    removeEventListener(ev, fn) {
      const l = e._l[ev];
      if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }
    },
    replaceChild(n, o) {
      const i = e.children.indexOf(o);
      if (i >= 0) { e.children[i] = n; n.parentNode = e; }
      return o;
    },
    cloneNode() { return makeEl(this.tagName, false); },
    appendChild(c) { e.children.push(c); c.parentNode = e; return c; },
    removeChild(c) { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); return c; },
    querySelector() { return makeEl('div'); },
    querySelectorAll() { return []; },
    setAttribute(k, v) { (e._attrs = e._attrs || {})[k] = String(v); },
    getAttribute(k) { return (e._attrs && e._attrs[k]) || null; },
    getContext() { return makeCtx2D(); }
  };
  e.style = e.style || {};
  e.style.setProperty = function (k, v) { e.style[k] = v; };
  e.classList = {
    add(c) { e._classes.add(c); },
    remove(c) { e._classes.delete(c); },
    contains(c) { return e._classes.has(c); },
    toggle(c, v) {
      if (v === undefined) { e._classes.has(c) ? e._classes.delete(c) : e._classes.add(c); }
      else if (v) e._classes.add(c); else e._classes.delete(c);
    }
  };
  Object.defineProperty(e, 'innerHTML', {
    get() { return e._html || ''; },
    set(v) { e._html = v; e.children.length = 0; }
  });
  return e;
}

const HIDDEN_IDS = ['dialogue', 'bagPanel', 'shopPanel', 'questPanel', 'createPanel',
  'cgPanel', 'deadPanel', 'interactTip', 'menuPanel', 'mapPanel', 'challengeBar'];
const els = {};
const ALL_IDS = ['scene', 'minimap', 'portrait', 'pathName', 'realmText', 'stoneNum',
  'hpFill', 'hpNum', 'qiFill', 'qiNum', 'cultFill', 'cultNum', 'mapName', 'clock', 'coord',
  'skillBar', 'toasts', 'interactTip', 'interactText', 'dialogue', 'dlgFace', 'dlgName',
  'dlgText', 'dlgOptions', 'bagPanel', 'bagGrid', 'equipCol', 'itemDetail', 'bagStone',
  'bagStat', 'shopPanel', 'shopTitle', 'shopList', 'sellList', 'shopStone', 'questPanel',
  'questList', 'createPanel', 'pathCards', 'cgPanel', 'cgCanvas', 'cgTitle', 'cgSub',
  'cgLine', 'deadPanel', 'deadBtn', 'deadText',
  'challengeBar', 'chName', 'chTime', 'chProg', 'interactKey',
  'btnMap', 'btnActivity', 'btnMenu',
  'mapPanel', 'mapCanvas', 'mapTabs', 'mapTip', 'mapHint', 'mapTitle',
  'menuPanel', 'menuTabs', 'menuBody', 'menuTitle'];
for (const id of ALL_IDS) {
  els[id] = makeEl(id === 'scene' || id === 'minimap' || id === 'portrait' || id === 'dlgFace' || id === 'cgCanvas' ? 'canvas' : 'div',
    HIDDEN_IDS.indexOf(id) >= 0);
}
els.minimap.width = 336; els.minimap.height = 240;
els.portrait.width = 96; els.portrait.height = 96;
els.dlgFace.width = 120; els.dlgFace.height = 120;

const docListeners = {};
const document = {
  readyState: 'loading',
  getElementById: (id) => els[id] || (els[id] = makeEl('div')),
  createElement: (tag) => makeEl(tag),
  body: makeEl('div'),
  documentElement: makeEl('div'),
  addEventListener(ev, fn) { (docListeners[ev] = docListeners[ev] || []).push(fn); }
};

const winListeners = {};
const rafQueue = [];
const win = {
  innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
  addEventListener(ev, fn) { (winListeners[ev] = winListeners[ev] || []).push(fn); },
  removeEventListener() {}
};

const timers = [];
function fakeSetTimeout(fn, ms) { timers.push({ fn, at: (ms || 0) / 1000 }); return timers.length; }
function runTimers(dt) {
  for (let i = timers.length - 1; i >= 0; i--) {
    timers[i].at -= dt;
    if (timers[i].at <= 0) { const t = timers.splice(i, 1)[0]; try { t.fn(); } catch (e) { errors.push('定时器异常: ' + e.stack); } }
  }
}

const sandbox = {
  window: win, document, console,
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  setTimeout: fakeSetTimeout, clearTimeout() {},
  setInterval: () => 0, clearInterval() {},
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  escape, unescape,
  localStorage: (() => {
    const store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; }
    };
  })(),
  performance: { now: () => Date.now() },
  URLSearchParams,
  Math, Date, JSON, Set, Map, Array, Object, String, Number,
  parseInt, parseFloat, isNaN, isFinite,
  Uint8Array, Uint16Array, Int32Array, Uint8ClampedArray, Float32Array
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const FILES = ['data.js', 'data2.js', 'gear.js', 'root.js', 'artsys.js', 'world.js', 'render.js', 'portrait.js', 'vfx.js',
  'audio.js', 'rank.js', 'tower.js', 'icons.js', 'gearart.js', 'touch.js',
  'dialogue.js', 'account.js', 'ui.js', 'panels.js', 'tranfx.js', 'skillcg.js', 'bigmap.js', 'menu.js', 'game.js'];
for (const f of FILES) {
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: f });
    log('载入 ' + f);
  } catch (e) {
    errors.push('载入失败 ' + f + ': ' + e.stack);
  }
}

const run = (code) => vm.runInContext(code, sandbox);

/* 把游戏内部符号挂到全局，方便断言 */
function aliasGlobals() {
  run(`
    var Q = window.__qingyun;
    var G = Q.G, player = Q.player;
    var totalStats = Q.totalStats, addItem = Q.addItem, removeItem = Q.removeItem,
        useItem = Q.useItem, equipItem = Q.equipItem, unequip = Q.unequip,
        damageEnemy = Q.damageEnemy, damagePlayer = Q.damagePlayer,
        doTeleport = Q.doTeleport, buyItem = Q.buyItem, sellItem = Q.sellItem,
        acceptQuest = Q.acceptQuest, completeQuest = Q.completeQuest,
        questStatus = Q.questStatus, objectiveDone = Q.objectiveDone,
        objectiveText = Q.objectiveText, gainExp = Q.gainExp,
        castSkill = Q.castSkill, loadMap = Q.loadMap,
        saveGame = Q.saveGame, restorePlayer = Q.restorePlayer,
        snapshotPlayer = Q.snapshotPlayer, updateNpcs = Q.updateNpcs,
        checkQuestUnlocks = Q.checkQuestUnlocks, checkTitles = Q.checkTitles;
  `);
}

let ts = 0;
function frames(n) {
  for (let i = 0; i < n; i++) {
    const cbs = rafQueue.splice(0, rafQueue.length);
    ts += 16.7;
    for (const fn of cbs) {
      try { fn(ts); } catch (e) { errors.push('帧异常: ' + e.stack); return; }
    }
    runTimers(0.0167);
  }
}
function key(code, type) {
  const ev = { code, repeat: false, preventDefault() {} };
  (winListeners[type || 'keydown'] || []).forEach((fn) => fn(ev));
}
function clickOption(i) {
  const opt = els.dlgOptions.children[i || 0];
  if (!opt || !opt._l.click) return false;
  opt._l.click[0]({ stopPropagation() {} });
  return true;
}
function clearDialogue(max) {
  let n = 0;
  while (!els.dialogue._classes.has('hidden') && n < (max || 12)) {
    if (!clickOption(0)) break;
    n++;
  }
  return n;
}
function clearCG() {
  let n = 0;
  while (run('UI.cgOpen()') && n < 10) {
    els.cgPanel._l.click[0]();
    frames(1);
    n++;
  }
  return n;
}

/* ---------------- 1. 启动 ---------------- */
try {
  (winListeners['DOMContentLoaded'] || []).forEach((fn) => fn());
  aliasGlobals();
  log('初始化完成');
} catch (e) {
  errors.push('init 异常: ' + e.stack);
  console.log('!! init 失败：\n' + e.stack);
  process.exit(1);
}

frames(3);

/* ---------------- 2. 开始界面 → 择道 ---------------- */
try {
  const sb = els.startBtn;
  if (sb && sb._l && sb._l.click) {
    log('开始界面: 存在，点击「开始修行」');
    sb._l.click[0]();
    frames(1);
  } else {
    log('开始界面: 未找到按钮（可能直接进入择道）');
  }
  const cards = els.pathCards.children;
  if (!cards.length) errors.push('择道卡片未生成');
  else {
    cards[0]._l.click[0]();
    frames(1);
    // 测灵根：直接抽一个并接受
    try {
      run('Root.forceAccept()');
    } catch (e) { errors.push('测灵根异常: ' + e.message); }
    frames(1);
    // 捏脸界面：直接点「入世」
    const done = els.customDone;
    if (done && done._l && done._l.click && done._l.click.length) {
      log('捏脸界面: 点击入世');
      done._l.click[0]();
      frames(1);
    }
    log('择道：' + run('G.player.path') + ' 技能 ' + run('JSON.stringify(G.player.skills)') +
      ' 外观=' + run('G.player.look ? "已捏脸" : "默认"'));
    log('测灵根：' + run('G.player.root ? G.player.root.name : "无"') +
      '　修炼×' + run('G.player.root ? G.player.root.mod.exp.toFixed(2) : "1.00"'));
    if (!run('G.player.root')) errors.push('灵根未写入角色');
  }
} catch (e) { errors.push('择道异常: ' + e.stack); }

frames(3);

/* ---------------- 3. 过场 CG ---------------- */
try {
  if (!els.cgPanel._classes.has('hidden')) {
    log('CG 触发：' + els.cgTitle.textContent + ' / 首句 ' + els.cgLine.textContent.slice(0, 12) + '…');
    for (let i = 0; i < 6; i++) { els.cgPanel._l.click[0](); frames(1); }
    log('CG 关闭：' + els.cgPanel._classes.has('hidden'));
  } else {
    errors.push('进入村庄未触发 CG');
  }
} catch (e) { errors.push('CG 异常: ' + e.stack); }
frames(30);
try {
  const n = clearDialogue();
  log('开场对话翻页 ' + n + ' 次，已关闭: ' + els.dialogue._classes.has('hidden'));
} catch (e) { errors.push('开场对话异常: ' + e.stack); }
frames(3);

/* ---------------- 4. 世界与怪物 ---------------- */
log('地图: ' + run('G.map.name') + ' 物件 ' + run('G.map.objects.length') +
  ' NPC ' + run('G.map.npcs.length') + ' 草药 ' + run('G.map.herbs.length') +
  ' 锚点 ' + run('G.map.anchors.length'));

/* ---------------- 5. 移动 ---------------- */
try {
  const x0 = run('player.x'), y0 = run('player.y');
  key('KeyD'); frames(25); key('KeyD', 'keyup');
  key('KeyW'); frames(25); key('KeyW', 'keyup');
  const x1 = run('player.x'), y1 = run('player.y');
  log('移动: (' + x0.toFixed(0) + ',' + y0.toFixed(0) + ') -> (' + x1.toFixed(0) + ',' + y1.toFixed(0) + ')');
  if (Math.abs(x1 - x0) + Math.abs(y1 - y0) < 5) errors.push('八向移动失效');
} catch (e) { errors.push('移动异常: ' + e.stack); }

/* ---------------- 6. 对话与任务 ---------------- */
try {
  run("UI.openDialogue(pagesOf(G,'npc_master'), 'npc_master')");
  log('对话页数: ' + run('UI.state.dialoguePages.length') + ' 首句: ' +
    String(run('UI.state.dialoguePages[0].text')).slice(0, 16) + '…');
  clickOption(0);
  log('任务状态 q_main1: ' + run("G.questState.q_main1"));
  if (run("G.questState.q_main1") !== 'active') errors.push('接取任务失败');
} catch (e) { errors.push('对话异常: ' + e.stack); }

/* 完成「初入仙门」 */
try {
  run("G.questProgress.q_main1.visited = true");
  const st = run("questStatus('q_main1')");
  log('目标达成后状态: ' + st);
  run("UI.openDialogue(pagesOf(G,'npc_master'), 'npc_master')");
  clickOption(0);
  log('交任务后: 状态 ' + run("G.questState.q_main1") + ' 修为 ' + Math.round(run('player.exp')) +
    ' 灵石 ' + run('player.stones') + ' 背包 ' + run('player.bag.length'));
  if (run("G.questState.q_main1") !== 'done') errors.push('交任务失败');
} catch (e) { errors.push('交任务异常: ' + e.stack); }
frames(2);

/* ---------------- 7. 商店 ---------------- */
try {
  const s0 = run('player.stones');
  run("player.stones = 5000; UI.openShop('goods')");
  // 新的青云商铺是动态构建的，直接调接口验证买卖
  const bought = run("G.buyItem('pill_heal')");
  const s1 = run('player.stones');
  log('商店: 买入=' + bought + ' 灵石 ' + s0 + '→(充值)→' + s1 +
    ' 背包 ' + run('player.bag.length'));
  if (!bought) errors.push('购买失败');
  if (s1 >= 5000) errors.push('购买未扣灵石');

  // 出售（按格子下标）
  const idx = run('(function(){for(var i=0;i<player.bag.length;i++){if(player.bag[i].id==="pill_heal")return i;}return -1;})()');
  const s2 = run('player.stones');
  const sold = run('G.sellBagAt(' + idx + ',1)');
  log('  卖出=' + sold + ' 灵石 ' + s2 + '→' + run('player.stones'));
  if (!sold) errors.push('出售失败');
  if (run('player.stones') <= s2) errors.push('出售未加灵石');

  // 商城只上架白/绿/蓝三档装备
  const badQ = run('(function(){for(var i=0;i<SHOP_GEAR_STOCK.length;i++){var q=Gear.defQ(SHOP_GEAR_STOCK[i]);if(SHOP_GEAR_Q.indexOf(q)<0)return SHOP_GEAR_STOCK[i];}return "";})()');
  if (badQ) errors.push('商城上架了超过蓝色品质的装备: ' + badQ);

  // 服装可买
  const clothOk = run("G.buyItem('cl_white')");
  log('  服饰购买=' + clothOk);
  if (!clothOk) errors.push('服饰无法购买');
  run('UI.closeShop()');
} catch (e) { errors.push('商店异常: ' + e.stack); }

/* ---------------- 8. 装备与使用 ---------------- */
try {
  run("addItem('wp_iron',1); equipItem('wp_iron')");
  log('装备: ' + run('player.equip.weapon') + ' 攻击 ' + run('Math.round(totalStats().atk)'));
  run("addItem('pill_heal',1); player.hp = 1; useItem('pill_heal')");
  log('服药后气血: ' + Math.round(run('player.hp')));
  if (run('player.hp') <= 1) errors.push('丹药无效');
} catch (e) { errors.push('装备异常: ' + e.stack); }

/* ---------------- 9. 战斗 ---------------- */
try {
  run("loadMap('valley', null, {atAnchor:true, noCG:true})");
  frames(20);
  log('落霞谷: 怪物 ' + run('G.monsters.length') + ' 技能 ' + run('JSON.stringify(G.cooldowns)'));
  if (run('G.monsters.length') === 0) errors.push('野外无怪物');

  // 让玩家贴到第一只怪旁边
  run(`(function(){
    const m = G.monsters[0];
    player.x = m.x - 40; player.y = m.y;
    player.facing = 0;
  })()`);
  const hp0 = run('G.monsters[0].hp');
  const exp0 = run('player.exp') + run('player.level') * 10000;
  key('KeyJ'); frames(3);
  key('KeyJ'); frames(3);
  key('KeyK'); frames(6);
  const hp1 = run('G.monsters[0] ? G.monsters[0].hp : -1');
  log('普攻+招式: 怪物气血 ' + hp0.toFixed(0) + ' -> ' + hp1.toFixed(0) +
    ' 连招数 ' + run('player.combo') + ' 特效 ' + run('G.effects.length') +
    ' 弹道 ' + run('G.projectiles.length'));
  if (hp1 >= hp0) errors.push('攻击未造成伤害');

  // 一击必杀验证经验/掉落
  run('(function(){ const m = G.monsters[0]; if (m) damageEnemy(m, 9999, {crit:0}); })()');
  frames(2);
  const expAfter = run('player.exp') + run('player.level') * 10000;
  log('击杀后: 修为 ' + Math.round(run('player.exp')) + ' 等级 ' + run('player.level') +
    ' 灵石 ' + run('player.stones') + ' 死亡怪 ' + run('G.monsters.filter(m=>m.dead).length'));
  if (expAfter <= exp0) errors.push('击杀未给经验');
} catch (e) { errors.push('战斗异常: ' + e.stack); }

/* ---------------- 10. 传送 ---------------- */
try {
  run("G.unlockedAnchors.valley = true; G.unlockedAnchors.village = true;");
  run("doTeleport('village')");
  runTimers(0.4);
  frames(150);
  log('传送后地图: ' + run('G.map.name') + ' 过场锁=' + run('!!G.tranLock'));
  if (run('G.map.id') !== 'village') errors.push('传送失败');
} catch (e) { errors.push('传送异常: ' + e.stack); }

/* ---------------- 11. 四张地图均可生成 ---------------- */
try {
  for (const id of ['village', 'valley', 'forest', 'peak']) {
    const r = run(`(function(){
      const m = generateMap('${id}');
      let solidCount = 0;
      for (let i = 0; i < m.solid.length; i++) solidCount += m.solid[i];
      return { name: m.name, cols: m.cols, rows: m.rows, objs: m.objects.length,
               npcs: m.npcs.length, herbs: m.herbs.length, spawns: m.spawnPoints.length,
               solid: solidCount, anchorSolid: m.isSolidTile(m.anchors[0].tx, m.anchors[0].ty) };
    })()`);
    log('  ' + r.name + ': ' + r.cols + 'x' + r.rows + ' 物件' + r.objs +
      ' NPC' + r.npcs + ' 草药' + r.herbs + ' 刷怪点' + r.spawns +
      ' 实体格' + r.solid + ' 锚点被挡:' + r.anchorSolid);
    if (r.anchorSolid) errors.push(r.name + ' 锚点位置不可站');
    if (r.npcs === 0 && id === 'village') errors.push('村庄没有 NPC');
  }
} catch (e) { errors.push('地图生成异常: ' + e.stack); }

/* ---------------- 12. 长跑 ---------------- */
try {
  for (let i = 0; i < 8; i++) {
    key('KeyJ'); frames(6);
    key('KeyL'); frames(6);
    key('ShiftLeft'); frames(4);
    key('Space'); frames(4);
    key('Space'); frames(2);
  }
  log('长跑 200 帧完成，特效 ' + run('G.effects.length') + ' 弹道 ' + run('G.projectiles.length'));
  run('UI.openQuests()'); frames(2); run('UI.closeQuests()');
  run('UI.openBag()'); frames(2); run('UI.closeBag()');
} catch (e) { errors.push('长跑异常: ' + e.stack); }

/* ---------------- 13. 立绘系统 ---------------- */
try {
  const keys = run('Object.keys(PORTRAIT_SPECS)');
  let bad = 0;
  for (const k of keys) { if (!run("getPortrait('" + k + "') ? 1 : 0")) bad++; }
  run("drawPortraitAvatar(document.getElementById('portrait'), 'p_sword')");
  run("drawPortraitFull(document.getElementById('dlgFace'), 'npc_master')");
  log('立绘: ' + keys.length + ' 个角色（玩家4 + NPC ' + (keys.length - 4) + '），缺失 ' + bad);
  log('  角色: ' + keys.join(' '));
  if (bad) errors.push('立绘缺失 ' + bad + ' 个');
} catch (e) { errors.push('立绘异常: ' + e.stack); }

/* ---------------- 14. 传送石碑绑定 ---------------- */
try {
  const before = run("G.isSteleBound('village')");
  const a = run('G.map.anchors[0]');
  run('player.x = ' + a.x + '; player.y = ' + (a.y + 24) + ';');
  frames(3);
  const target = run('G.interactTarget && G.interactTarget.kind');
  log('靠近古阵: 交互目标=' + target + ' 文字=' + run('G.interactTarget && G.interactTarget.text'));
  key(run('G.keymap.interact'));
  frames(3);
  const after = run("G.isSteleBound('village')");
  log('石碑绑定: ' + before + ' -> ' + after);
  if (after !== true) errors.push('石碑绑定失败');
} catch (e) { errors.push('石碑异常: ' + e.stack); }

/* ---------------- 15. 大地图 ---------------- */
try {
  run("BigMap.open('village')");
  const open1 = run('BigMap.isOpen()');
  frames(3);
  run('BigMap.close()');
  log('传送图志: 打开=' + open1 + ' 关闭=' + (!run('BigMap.isOpen()')));
  if (!open1) errors.push('大地图无法打开');

  // 直接调用快速传送
  run("G.steles.valley = true");
  run("G.fastTravel('valley')");
  runTimers(0.5); frames(140);
  clearCG();
  log('快速传送后地图: ' + run('G.map.name') + ' 过场锁=' + run('!!G.tranLock'));
  if (run('G.map.id') !== 'valley') errors.push('快速传送失败');
  if (run('!!G.tranLock')) errors.push('传送过场结束后未解锁');
} catch (e) { errors.push('大地图异常: ' + e.stack); }

/* ---------------- 16. 地图出入口 ---------------- */
try {
  const exits = run('G.map.exits ? G.map.exits.length : 0');
  log('当前地图出入口: ' + exits + ' 个');
  if (!exits) errors.push('野外地图缺少出入口');
  const ex = run('G.map.exits[0]');
  run('player.x = ' + ex.x + '; player.y = ' + ex.y + ';');
  frames(3);
  log('  靠近出入口交互: ' + run('G.interactTarget && G.interactTarget.text'));
  key(run('G.keymap.interact'));
  frames(2);
  const opt = els.dlgOptions.children[0];
  if (opt && opt._l.click) opt._l.click[0]({ stopPropagation() {} });
  runTimers(0.5); frames(8);
  clearCG();
  frames(150);   // 等传送过场（1.5s）走完
  log('  走出口后地图: ' + run('G.map.name') + ' 过场锁=' + run('!!G.tranLock'));
} catch (e) { errors.push('出入口异常: ' + e.stack); }

/* ---------------- 17. 菜单与改键 ---------------- */
try {
  run("Menu.open('settings')");
  const openMenu = run('Menu.isOpen()');
  run("G.setKeybinding('attack', 'KeyF')");
  const bound = run('G.keymap.attack');
  run("Menu.close()");
  log('菜单: 打开=' + openMenu + ' 改键普攻=' + bound);
  if (bound !== 'KeyF') errors.push('改键失败');
  // 用新键攻击
  const hp0 = run('G.monsters.filter(m=>!m.dead).length');
  key('KeyF');
  frames(3);
  log('  新键攻击后特效数: ' + run('G.effects.length') + '（怪物数 ' + hp0 + '）');
  run("G.setKeybinding('attack', 'KeyJ')");
  run("Menu.open('activity')");
  log('  活动页渲染: menuBody 子节点 ' + els.menuBody.children.length);
  run('Menu.close()');
} catch (e) { errors.push('菜单异常: ' + e.stack); }

/* ---------------- 18. 签到 ---------------- */
try {
  const b = run('G.getCheckinState()');
  const ok = run('G.claimCheckin()');
  const a2 = run('G.getCheckinState()');
  log('签到: 可签=' + b.canClaim + ' 结果=' + ok + ' → 可签=' + a2.canClaim + ' 第' + (a2.day) + '日');
  if (!ok || a2.canClaim) errors.push('签到异常');
} catch (e) { errors.push('签到异常: ' + e.stack); }

/* ---------------- 19. 挑战 ---------------- */
try {
  run("loadMap('village', null, {noFade:true, noCG:true})");
  frames(4);
  run("G.startChallenge('wave')");
  frames(4);
  log('挑战开始: ' + run("G.challenge ? G.challenge.id + '/' + G.challenge.state : 'none'") +
    ' 挑战怪 ' + run('G.monsters.filter(m=>m.challenge && !m.dead).length'));
  let guard = 0;
  while (guard++ < 40) {
    run("G.monsters.filter(m => !m.dead && m.challenge).forEach(m => damageEnemy(m, 9999, {}))");
    frames(4);
    if (run("!G.challenge || G.challenge.state !== 'running'")) break;
  }
  log('挑战结束: ' + run("G.challenge ? G.challenge.state : '已结算'") +
    ' 等级 ' + run('player.level') + ' 灵石 ' + run('player.stones'));
  if (run("G.challenge && G.challenge.state === 'running'")) errors.push('挑战未能结束');

  // 限时挑战
  run("G.challengeCd = {}");
  run("G.startChallenge('timed')");
  frames(3);
  const tneed = run('G.challenge.need');
  for (let i = 0; i < 14; i++) {
    run("G.monsters.filter(m => !m.dead && m.challenge).forEach(m => { damageEnemy(m, 9999, {}); G.challenge && G.challenge.killed++; })");
    frames(3);
    if (run("!G.challenge || G.challenge.state !== 'running'")) break;
  }
  log('限时挑战: 需击杀 ' + tneed + ' → ' + run("G.challenge ? G.challenge.state : '已结算'"));
} catch (e) { errors.push('挑战异常: ' + e.stack); }

/* ---------------- 20. 存档与读档 ---------------- */
try {
  run('saveGame(true)');
  const saved = run("JSON.parse(localStorage.getItem('qingyun_v03')).player");
  log('存档快照: 职业=' + saved.path + ' 等级=' + saved.level + ' 修为=' + saved.exp +
    ' 灵石=' + saved.stones + ' 背包=' + saved.bag.length + ' 装备=' + (saved.equip.weapon || '无') +
    ' 任务=' + Object.keys(saved.questState || {}).length + ' 地点=' + saved.mapId);

  // 打乱当前状态，再从存档恢复，模拟"重新登录"
  run('player.level = 99; player.exp = 0; player.stones = 0; player.bag = [];' +
    ' player.equip.weapon = null; G.questState = {}; G.steles = {};');
  run('restorePlayer(JSON.parse(localStorage.getItem("qingyun_v03")).player)');
  const lv = run('player.level'), st = run('player.stones'), bag = run('player.bag.length');
  const wp = run('player.equip.weapon ? player.equip.weapon.id : null');
  const qs = run('Object.keys(G.questState).length');
  const savedWp = saved.equip && saved.equip.weapon
    ? (typeof saved.equip.weapon === 'string' ? saved.equip.weapon : saved.equip.weapon.id)
    : null;
  log('读档恢复: 等级=' + lv + ' 灵石=' + st + ' 背包=' + bag + ' 装备=' + wp + ' 任务=' + qs);
  if (lv !== saved.level || st !== saved.stones || bag !== saved.bag.length ||
    wp !== savedWp || qs !== Object.keys(saved.questState || {}).length) {
    errors.push('存档恢复不一致');
  }
} catch (e) { errors.push('存档异常: ' + e.stack); }

/* ---------------- 21. 八向朝向 ---------------- */
try {
  const angles = [-2.356, -1.571, -0.785, 0, 0.785, 1.571, 2.356, 3.1416];
  const seen = {};
  for (const a of angles) {
    const d = run('dirParams(' + a + ')');
    seen[d.faceShow + '|' + d.bodyW + '|' + d.flip] = true;
    // 实际绘制一遍，确保不抛异常
    run("(function(){const c=document.createElement('canvas');c.width=120;c.height=140;" +
      "const g2=c.getContext('2d');drawFigure(g2,60,120,{t:1,facing:" + a + ",moving:true,phase:0.3});})()");
  }
  log('八向朝参组合数: ' + Object.keys(seen).length + ' （应为 8）');
  if (Object.keys(seen).length < 8) errors.push('八向朝向未覆盖全部 8 个方向');
} catch (e) { errors.push('八向朝向异常: ' + e.stack); }

/* ---------------- 22. NPC 游走 ---------------- */
try {
  run("loadMap('village', null, {noFade:true, noCG:true})");
  frames(3);
  const p0 = run('G.map.npcs.map(n => Math.round(n.x) + "," + Math.round(n.y)).join(" ")');
  for (let i = 0; i < 120; i++) { run('updateNpcs(0.05)'); }
  const p1 = run('G.map.npcs.map(n => Math.round(n.x) + "," + Math.round(n.y)).join(" ")');
  const moved = p0 !== p1;
  log('NPC 游走: ' + (moved ? '有移动' : '未移动'));
  log('  初始 ' + p0.slice(0, 60));
  log('  之后 ' + p1.slice(0, 60));
  if (!moved) errors.push('NPC 未游走');
} catch (e) { errors.push('NPC 游走异常: ' + e.stack); }

/* ---------------- 23. 修为榜（真实记录） ---------------- */
try {
  run('saveGame(true)');
  let rows = run('Rank.list()');
  const me = run('Rank.myRank()');
  log('修为榜: ' + rows.length + ' 条，玩家「' + (me ? me.name : '?') + '」第 ' + (me ? me.rank : '?') + ' 名');
  if (!me) errors.push('玩家未进入榜单');

  // 导出铭牌 → 伪造两个朋友的记录 → 导入
  const myCode = run('Rank.code()');
  log('  我的铭牌: ' + myCode);
  run("(function(){var p=player; p.name='剑无尘'; p.level=8; p.exp=200; p.path='mage'; })()");
  const friendCode = run('Rank.code()');
  run("Rank.importCode('" + myCode + "')");
  run("Rank.importCode('" + friendCode + "')");
  rows = run('Rank.list()');
  log('  导入后榜上: ' + rows.map((r) => r.rank + '.' + r.name + '(' + r.level + '级,' + Math.round(r.total) + ')').join('  '));
  if (rows.length < 2) errors.push('铭牌导入失败');

  // 解码校验
  const dec = run('Rank.decode("' + friendCode + '")');
  log('  铭牌解码: ' + JSON.stringify(dec));
  if (!dec || dec.name !== '剑无尘' || dec.level !== 8) errors.push('铭牌解码错误');

  const sorted = rows.every((r, i) => i === 0 || rows[i - 1].total >= r.total);
  if (!sorted) errors.push('排行榜排序错误');

  run('Menu.open("rank")');
  log('  排行页渲染: menuBody 子节点 ' + els.menuBody.children.length);
  run('Menu.close()');
} catch (e) { errors.push('排行榜异常: ' + e.stack); }

/* ---------------- 24. 奖励宝箱 ---------------- */
try {
  run("loadMap('village', null, {noFade:true, noCG:true})");
  frames(3);
  const n = run('G.map.chests ? G.map.chests.length : 0');
  log('宝箱: 本图 ' + n + ' 个');
  if (!n) errors.push('地图未生成宝箱');
  run("(function(){var c=G.map.chests[0]; player.x=c.x; player.y=c.y+22;})()");
  frames(3);
  log('  靠近宝箱交互: ' + run('G.interactTarget && G.interactTarget.text'));
  const st0 = run('player.stones'), bag0 = run('player.bag.length'), exp0 = run('player.exp');
  key(run('G.keymap.interact'));
  frames(3);
  log('  开启后 opened=' + run('G.map.chests[0].opened') +
    ' 灵石 ' + st0 + '->' + run('player.stones') +
    ' 背包 ' + bag0 + '->' + run('player.bag.length') +
    ' 修为 ' + Math.round(exp0) + '->' + Math.round(run('player.exp')));
  if (!run('G.map.chests[0].opened')) errors.push('宝箱无法开启');
  const loot = run('G.lastChest ? G.lastChest.parts.join("、") : ""');
  log('  宝箱产出: ' + loot);
  if (!loot) errors.push('宝箱没有产出奖励');
} catch (e) { errors.push('宝箱异常: ' + e.stack); }

/* ---------------- 25. 试炼塔（独立场景） ---------------- */
try {
  run("loadMap('village', null, {noFade:true, noCG:true})");
  frames(3);
  run('Tower.start("tower", 1)');
  frames(2);
  log('试炼场景: 地图=' + run('G.map.id') + ' ' + run('G.map.cols + "x" + G.map.rows') +
    ' 确认弹窗=' + run('UI.dialogueOpen()') + ' 阶段=' + run('Tower.state().phase'));
  if (run('G.map.id') !== 'arena') errors.push('未进入独立试炼场景');
  if (!run('UI.dialogueOpen()')) errors.push('开战前未询问玩家');

  clickOption(0);   // 开始挑战
  frames(3);
  const cls = run('G.monsters.filter(m=>m.tower).map(m=>m.cls).join(",")');
  log('  开战: 阶段=' + run('Tower.state().phase') +
    ' 怪=' + run('G.monsters.filter(m=>m.tower && !m.dead).length') + ' 职业=[' + cls + ']');

  for (let i = 0; i < 20; i++) {
    run("G.monsters.filter(m => m.tower && !m.dead).forEach(m => damageEnemy(m, 999999, {}))");
    frames(6);
    if (run('Tower.state() && Tower.state().phase === "confirm"')) break;
  }
  log('  清层后: 阶段=' + run('Tower.state() ? Tower.state().phase : "null"') +
    ' 最高层=' + run('Tower.maxFloor("tower")'));

  run('Tower.quit()');
  frames(3);
  log('  退出后: 激活=' + run('Tower.isActive()') + ' 地图=' + run('G.map.id') +
    ' 怪物=' + run('G.monsters.length'));
  if (run('Tower.isActive()')) errors.push('无法退出试炼');
  if (run('G.map.id') === 'arena') errors.push('退出后未回到原地图');
  if (run('Tower.maxFloor("tower")') < 1) errors.push('通关层数未保留');
} catch (e) { errors.push('试炼塔异常: ' + e.stack); }

/* ---------------- 25b. 深渊 + Boss 预警 ---------------- */
try {
  run('Tower.start("abyss", 3)');   // 第 3 层是妖王层
  frames(2);
  clickOption(0);
  frames(3);
  const boss = run('G.monsters.filter(m=>m.tower && m.boss).length');
  log('深渊: 妖王=' + boss + ' 阶段=' + run('Tower.state().phase'));
  // 逼出 Boss 技能预警
  run("(function(){ var b = G.monsters.filter(m=>m.boss)[0]; if (b) { b.skillCd = 0; } })()");
  frames(20);
  log('  Boss 预警数: ' + run('G.telegraphs.length') +
    ' 类型=' + run('G.telegraphs.map(t=>t.type).join(",")'));
  if (!run('G.telegraphs.length')) errors.push('Boss 未释放预警技能');
  // 敌方弹道（若有远程职业）
  const rangedN = run('G.monsters.filter(m=>m.tower && m.ranged).length');
  if (rangedN) {
    run("G.monsters.filter(m=>m.tower && m.ranged).forEach(m=>{ m.shootCd = 0; })");
    frames(10);
  }
  log('  远程敌人 ' + rangedN + ' 个，敌方弹道 ' + run('G.eProjs.length'));
  run('Tower.quit()');
  frames(3);
} catch (e) { errors.push('深渊异常: ' + e.stack); }

/* ---------------- 26. 物品图标 ---------------- */
try {
  const ids = run('Object.keys(ITEMS)');
  let missing = 0;
  const lack = [];
  let gearOk = 0, gearTotal = 0;
  for (const id of ids) {
    const isGear = run("(function(){var k=ITEMS['" + id + "'].kind;return k==='weapon'||k==='body'||k==='charm'||k==='cloth';})()");
    if (isGear) {
      gearTotal++;
      if (run("GearArt.has('" + id + "')")) gearOk++;
      else { missing++; lack.push(id); }
    } else if (!run("ItemIcons.has('" + id + "')")) {
      // 丹药 / 材料用程序化图标兜底，不算缺失
      if (run("typeof GearArt !== 'undefined'")) { /* ok */ }
    }
    run("ItemIcons.get('" + id + "', 48)");
  }
  log('装备立绘: ' + gearOk + ' / ' + gearTotal + ' 件有专属立绘' +
    (lack.length ? '，缺 ' + lack.join(',') : '') +
    '；全部 ' + ids.length + ' 件物品均可绘制图标');
  if (missing) errors.push('有装备缺少专属立绘');
} catch (e) { errors.push('物品图标异常: ' + e.stack); }

/* ---------------- 27. 任务剧情线索 ---------------- */
try {
  const before = run("JSON.stringify(G.saveData().announced || {})");
  run('checkQuestUnlocks()');
  runTimers(0.5);
  const after = run("JSON.stringify(G.saveData().announced || {})");
  log('任务线索: ' + before + ' -> ' + after);
  log('  当前任务追踪: ' + run("(document.getElementById('questTracker').innerHTML || '').replace(/<[^>]+>/g,' ').trim().slice(0,60)"));
  run('UI.updateQuestTracker()');
} catch (e) { errors.push('任务线索异常: ' + e.stack); }

/* ---------------- 28. 称号 / 等级奖励 / 道行面板 ---------------- */
try {
  run('checkTitles()');
  const ts = run('G.getTitles()');
  const un = ts.filter((t) => t.unlocked);
  log('称号: ' + ts.length + ' 个，已解锁 ' + un.length + '（' + un.map((t) => t.name).join('、') + '）');
  if (!un.length) errors.push('称号未解锁');
  run("G.equipTitle('t_rookie')");
  log('  佩戴称号: ' + run('G.currentTitle() ? G.currentTitle().name : "无"'));
  if (!run('G.currentTitle()')) errors.push('称号佩戴失败');

  const lvR = run('G.getLevelRewards()');
  const can = lvR.filter((r) => r.canClaim);
  log('等级奖励: 可领 ' + can.length + ' 项（等级 ' + run('player.level') + '）');
  if (can.length) {
    const st0 = run('player.stones');
    run('G.claimLevelReward(' + can[0].lv + ')');
    log('  领取 Lv.' + can[0].lv + ': 灵石 ' + st0 + '->' + run('player.stones'));
    if (run('player.stones') === st0 && !can[0].reward.items && !can[0].reward.exp) {
      errors.push('等级奖励领取失败');
    }
  }

  run('UI.openStats()');
  const hasStats = run("!!document.getElementById('statsPanel')");
  run('UI.closeStats()');
  log('道行面板: 打开=' + hasStats);
  if (!hasStats) errors.push('道行面板未生成');
} catch (e) { errors.push('称号/奖励异常: ' + e.stack); }

/* ---------------- 30. 指数经验曲线 / 瓶颈 / 破境 / 境界称号 ---------------- */
try {
  const n9 = run('expNeed(9)');
  const n18 = run('expNeed(18)');
  const n36 = run('expNeed(36)');
  const n72 = run('expNeed(72)');
  log('经验曲线: Lv9=' + n9 + ' Lv18=' + n18 + ' Lv36=' + n36 + ' Lv72=' + n72);
  if (!(n18 > n9 * 2 && n36 > n18 * 2 && n72 > n36 * 2)) {
    errors.push('经验曲线不是指数增长');
  }

  // 卡瓶颈
  run('player.level = 9; player.exp = 0; player.bottleneck = false;');
  run("gainExp(expNeed(9) * 3)");
  const bn = run('!!player.bottleneck');
  log('  炼气九层堆满修为 → 瓶颈=' + bn + ' 等级=' + run('player.level') +
    ' 修为=' + run('Math.floor(player.exp)'));
  if (!bn) errors.push('满级未触发瓶颈');

  // ① 只有灵石、没有破境丹 → 不能破境
  run('player.stones = 999999; player.bag = player.bag.filter(function(e){return e.id.indexOf("pill_break")<0;});');
  run("G.addItem('pill_guard', 9); G.addItem('pill_condense', 9);");
  const noPill = run('G.breakthrough()');
  log('  只有灵石无破境丹 → 破境=' + noPill);
  if (noPill) errors.push('缺破境丹时应无法破境');

  // ①b 破境丹 + 灵石都有，但缺护脉丹 → 仍不能破境
  run('player.bag = player.bag.filter(function(e){return e.id !== "pill_guard" && e.id !== "pill_condense";});');
  run("G.addItem('pill_break_s', 1); player.stones = 999999;");
  const noGuard = run('G.breakthrough()');
  log('  缺护脉丹 → 破境=' + noGuard);
  if (noGuard) errors.push('缺护脉丹时应无法破境');
  run('player.bag = player.bag.filter(function(e){return e.id !== "pill_break_s";});');

  // ② 有破境丹但灵石不足 → 不能破境，且丹药不能白吃
  run("addItem('pill_break_s',1); player.stones = 0; G.addItem('pill_guard', 9); G.addItem('pill_condense', 9);");
  const pillBefore = run("G.bagCount('pill_break_s')");
  const noStone = run('G.breakthrough()');
  const pillAfter = run("G.bagCount('pill_break_s')");
  log('  有丹无灵石 → 破境=' + noStone + ' 丹 ' + pillBefore + '→' + pillAfter);
  if (noStone) errors.push('灵石不足时应无法破境');
  if (pillAfter !== pillBefore) errors.push('灵石不足时不应消耗丹药');

  // ③ 破境丹 + 护脉丹 + 灵石齐备 → 成功
  run('player.stones = 999999;');
  const ok = run('G.breakthrough()');
  log('  丹+灵石破境: ' + ok + ' → 等级=' + run('player.level') +
    ' 境界=' + run('realmName(player.level)') + ' 瓶颈=' + run('!!player.bottleneck'));
  if (!ok) errors.push('灵石破境失败');
  if (run('player.level') !== 10) errors.push('破境后等级不对');
  if (run('!!player.bottleneck')) errors.push('破境后瓶颈未清除');

  // 境界称号应已解锁
  run('checkTitles()');
  const realmTitleOk = run("(function(){var t=G.getTitles();for(var i=0;i<t.length;i++){if(t[i].id==='t_realm1')return t[i].unlocked;}return false;})()");
  log('  筑基称号「筑基立鼎」已解锁=' + realmTitleOk);
  if (!realmTitleOk) errors.push('境界称号未解锁');

  // 用破境丹 + 灵石破境：先把等级压回 18（筑基九层）
  run('player.level = 18; player.exp = 0; player.bottleneck = true; player.stones = 999999;');
  run("G.addItem('pill_break_s', 1)");
  const ok2 = run('G.breakthrough()');
  log('  丹药+灵石破境: ' + ok2 + ' → 等级=' + run('player.level') +
    ' 境界=' + run('realmName(player.level)'));
  if (!ok2) errors.push('丹药破境失败');
  if (run('player.level') !== 19) errors.push('丹药破境后等级不对');

  // 大破境丹的灵石代价更省
  run('player.level = 27; player.exp = 0; player.bottleneck = true;');
  run("player.bag = player.bag.filter(function(e){return e.id.indexOf('pill_break')<0;});");
  run("G.addItem('pill_break_l', 1); G.addItem('pill_break_s', 1); G.addItem('pill_guard', 9); G.addItem('pill_condense', 9); player.stones = 999999;");
  const sBefore = run('player.stones');
  const req = run('G.breakReq()');
  log('  破境需求: 丹=' + req.pillName + ' 灵石=' + req.stones + '（基础 ' + req.base + '）');
  const pillL = run("G.bagCount('pill_break_l')");
  run('G.breakthrough()');
  const spent = sBefore - run('player.stones');
  log('    消耗大破境丹 ' + pillL + '→' + run("G.bagCount('pill_break_l')") +
    '　灵石净变化 -' + spent + '（已含境界之赐返还）');
  if (req.stones !== Math.max(10, Math.ceil(req.base * 0.25))) errors.push('大破境丹折扣计算错误');
  if (run("G.bagCount('pill_break_l')") !== 0) errors.push('破境未消耗大破境丹');
} catch (e) { errors.push('境界异常: ' + e.stack); }

/* ---------------- 31. 灵根加成生效 ---------------- */
try {
  const before = run('G.totalStats().hpMax');
  const r = run('Root.roll()');
  run('G.setRoot(' + JSON.stringify(r) + ')');
  const after = run('G.totalStats().hpMax');
  log('灵根: ' + run('G.getRoot().name') + '　气血 ' + before.toFixed(0) + ' → ' + after.toFixed(0) +
    '　修炼×' + run('G.getRoot().mod.exp.toFixed(2)'));
  const mul = run('Root.expMul(G.getRoot())');
  if (mul <= 0) errors.push('灵根修炼倍率异常');
  if (Math.abs(after - before) < 0.01 && Math.abs(r.mod.hpMul - 1) > 0.05) {
    errors.push('灵根未影响属性');
  }
  // 八种品阶都能生成
  const seen = {};
  for (let i = 0; i < 400; i++) {
    const x = run('Root.roll()');
    seen[x.short] = true;
    run('G.setRoot(' + JSON.stringify(x) + ')');
    run('G.totalStats()');
  }
  const kinds = Object.keys(seen).length;
  log('  灵根品阶覆盖: ' + kinds + ' 种（' + Object.keys(seen).join('、') + '）');
  if (kinds < 6) errors.push('灵根品阶覆盖不足');
} catch (e) { errors.push('灵根异常: ' + e.stack); }

/* ---------------- 32. 头顶称号徽牌 / 商店属性行 / 行囊境界卡 ---------------- */
try {
  run("(function(){var c=document.createElement('canvas');c.width=220;c.height=200;" +
    "var g2=c.getContext('2d');" +
    "drawTitlePlaque(g2,110,150,{name:'筑基立鼎',rare:3,color:'#ffc24a'},1.0);" +
    "drawTitlePlaque(g2,110,150,{name:'仙品称号测试长名字',rare:5,color:'#ff5a5a'},2.4);})()");
  log('头顶称号徽牌: 绘制无异常（含长名与仙品）');

  const gearLine = String(run("Panels.effectLine('wp_iron', ITEMS['wp_iron'])")).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  log('商店·装备第二行: ' + gearLine);
  if (!/攻击/.test(gearLine)) errors.push('商店未显示装备属性');
  if (!/耐久/.test(gearLine)) errors.push('商店未显示耐久');

  const pillLine = String(run("Panels.effectLine('pill_heal_l', ITEMS['pill_heal_l'])")).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  log('商店·丹药第二行: ' + pillLine);
  if (!/气血/.test(pillLine)) errors.push('商店未显示丹药效果');

  const clothLine = String(run("Panels.effectLine('cl_fire', ITEMS['cl_fire'])")).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  log('商店·服饰第二行: ' + clothLine);
  if (!/攻击/.test(clothLine)) errors.push('商店未显示服饰属性');

  // 行囊境界卡（破境入口已移入行囊）
  run("player.level = 9; player.exp = expNeed(9); player.bottleneck = true;" +
    "player.stones = 5000; G.addItem('pill_break_s', 1);");
  run('UI.openBag()');
  const realmBox = String(run("(function(){var n=document.getElementById('bagRealm');return n?String(n.innerHTML):'';})()"));
  const childN = run("(function(){var n=document.getElementById('bagRealm');return n&&n.children?n.children.length:0;})()");
  log('行囊境界卡: 长度=' + realmBox.length + ' 子节点=' + childN);
  if (realmBox.indexOf('炼气') < 0) errors.push('行囊境界卡未渲染境界名');
  if (childN < 2) errors.push('行囊境界卡缺少破境按钮');
  run('UI.closeBag()');
} catch (e) { errors.push('徽牌/商店/境界卡异常: ' + e.stack); }

/* ---------------- 33. 秘法 / 秘录 可以研读（之前只能卖） ---------------- */
try {
  run('player.bonusAtk = 0; player.bonusQi = 0; player.bonusHp = 0;' +
    ' player.bonusDef = 0; player.bonusCrit = 0; player.bonusQiRegen = 0;');
  const snap = () => run('JSON.stringify({atk:player.bonusAtk||0,qi:player.bonusQi||0,' +
    'hp:player.bonusHp||0,def:player.bonusDef||0,crit:player.bonusCrit||0,' +
    'qr:player.bonusQiRegen||0})');

  const manuals = run('Object.keys(ITEMS).filter(function(id){return ITEMS[id].kind==="manual";})');
  log('秘法/秘录共 ' + manuals.length + ' 种: ' + manuals.join('、'));
  if (!manuals.length) errors.push('没有找到秘法道具');

  for (const id of manuals) {
    const b0 = snap();
    run("G.addItem('" + id + "', 1)");
    const n0 = run("G.bagCount('" + id + "')");
    run("G.useItem('" + id + "')");
    const n1 = run("G.bagCount('" + id + "')");
    const b1 = snap();
    const gained = b0 !== b1;
    log('  ' + id + '：消耗 ' + n0 + '→' + n1 + '　属性变化=' + (gained ? '有' : '无'));
    if (n1 >= n0) errors.push(id + ' 研读后未被消耗');
    if (!gained) errors.push(id + ' 研读后属性没有提升');
  }

  // 丹药仍然可以服用
  run("G.addItem('pill_heal', 1); player.hp = 1;");
  run("G.useItem('pill_heal')");
  if (run('player.hp') <= 1) errors.push('丹药服用后未回血');
  log('  丹药服用仍正常，气血=' + Math.round(run('player.hp')));

  // 装备类不能被 useItem 误用
  const eqBefore = run('player.bag.length');
  run("G.addItem('wp_iron', 1); G.useItem('wp_iron');");
  log('  装备不会被当道具用掉，背包 ' + eqBefore + '→' + run('player.bag.length'));
  if (run('player.bag.length') <= eqBefore) errors.push('装备被 useItem 误消耗');

  // 行囊详情里秘法应该有「研读」按钮，而不是只有出售
  run("G.addItem('man_taixuan', 1); UI.openBag();");
  const mi = run('(function(){for(var i=0;i<player.bag.length;i++){if(ITEMS[player.bag[i].id].kind==="manual")return i;}return -1;})()');
  run('UI.state.bagSel = ' + mi + '; UI.renderBag();');
  const detail = String(run("(function(){var n=document.getElementById('itemDetail');return n?String(n.innerHTML):'';})()"));
  const plain = detail.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  log('  行囊秘法详情: ' + plain.slice(0, 90));
  if (detail.indexOf('研　读') < 0 && detail.indexOf('研读') < 0) {
    errors.push('行囊详情里秘法没有研读按钮');
  }
  if (detail.indexOf('永久获得') < 0 && detail.indexOf('研读后') < 0) {
    errors.push('行囊详情里秘法没有显示效果说明');
  }
  run('UI.closeBag()');
} catch (e) { errors.push('秘法研读异常: ' + e.stack); }

/* ---------------- 34. 触屏按键自定义 + 开始前不显示 ---------------- */
try {
  const def = run('G.getTouchCfg()');
  log('触屏默认配置: 摇杆=' + def.joySize + ' 按键×' + def.btnScale +
    ' 透明=' + def.opacity + ' 摇杆侧=' + def.joySide + ' 显示=' + def.show);

  const after = run("JSON.stringify(G.setTouchCfg({joySize:180, btnScale:1.4, opacity:0.6, joySide:'right', padX:40}))");
  const c = JSON.parse(after);
  log('  调整后: 摇杆=' + c.joySize + ' 按键×' + c.btnScale + ' 透明=' + c.opacity +
    ' 摇杆侧=' + c.joySide + ' 按键水平=' + c.padX);
  if (c.joySize !== 180) errors.push('摇杆大小未生效');
  if (Math.abs(c.btnScale - 1.4) > 0.001) errors.push('按键大小未生效');
  if (Math.abs(c.opacity - 0.6) > 0.001) errors.push('透明度未生效');
  if (c.joySide !== 'right') errors.push('摇杆左右未生效');
  if (c.padX !== 40) errors.push('按键位置未生效');

  const savedCfg = String(run('JSON.stringify(G.saveData().touchCfg || {})'));
  if (savedCfg.indexOf('180') < 0) errors.push('触屏配置未写入存档');
  log('  已写入存档: ' + (savedCfg.indexOf('180') >= 0 ? '是' : '否'));

  // 越界值必须被夹住
  const clampCfg = JSON.parse(run("JSON.stringify(G.setTouchCfg({joySize:9999, opacity:-5, btnScale:99}))"));
  log('  越界夹取: 摇杆=' + clampCfg.joySize + ' 透明=' + clampCfg.opacity + ' 按键×' + clampCfg.btnScale);
  if (clampCfg.joySize > 210) errors.push('摇杆大小未夹取上限');
  if (clampCfg.opacity < 0.25) errors.push('透明度未夹取下限');

  // 从 document.body.children 里找真实控件，用 classList 判断显隐
  const touchState = () => run("(function(){var b=document.body;if(!b||!b.children)return 'NOBODY';" +
    "for(var i=0;i<b.children.length;i++){var c=b.children[i];" +
    "if(c&&c.id==='touchUI'&&c.classList)return c.classList.contains('hidden')?'hidden':'shown';}" +
    "return 'NOTFOUND';})()");
  const touchJoySide = () => run("(function(){var b=document.body;if(!b||!b.children)return 'nobody';" +
    "for(var i=0;i<b.children.length;i++){var c=b.children[i];" +
    "if(c&&c.id==='touchUI'&&c.getAttribute)return String(c.getAttribute('data-joy'));}return 'none';})()");

  run("G.setTouchCfg({show:true, joySide:'right'})");
  const st0 = touchState();
  const joyAttr = touchJoySide();
  log('  控件已建立=' + (st0 !== 'NOTFOUND' && st0 !== 'NOBODY') + '  摇杆侧属性=' + joyAttr);
  if (st0 === 'NOTFOUND' || st0 === 'NOBODY') errors.push('打开显示后未建立触屏控件');
  if (joyAttr !== 'right') errors.push('摇杆左右属性未写到控件上');

  // 开始游戏前：gate 关闭时必须隐藏
  run('Touch.setGate(false)');
  const hid1 = touchState();
  run('Touch.setGate(true)');
  const hid2 = touchState();
  log('  未开始游戏时=' + hid1 + '　开始后=' + hid2);
  if (hid1 !== 'hidden') errors.push('未开始游戏时触屏按键仍然显示');
  if (hid2 !== 'shown') errors.push('开始游戏后触屏按键未显示');

  // 重置
  run('G.resetTouchCfg()');
  const r = run('G.getTouchCfg()');
  log('  重置后摇杆大小: ' + r.joySize);
  if (r.joySize !== 132) errors.push('触屏配置重置失败');
} catch (e) { errors.push('触屏配置异常: ' + e.stack); }

log('\n=========== 结果 ===========');
if (errors.length) {
  for (const e of errors) log('✗ ' + e);
  process.exit(1);
} else {
  log('✓ 全部通过');
}
