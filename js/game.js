'use strict';

/* =========================================================================
   青云界 · 主程序
   ========================================================================= */

(function () {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const miniEl = document.getElementById('minimap');
  const miniCtx = miniEl.getContext('2d');

  const ZOOM = 1.15;
  const DAY_LEN = 360;
  const PLAYER_R = 8;

  let DPR = 1;
  let viewW = 0, viewH = 0;

  /* ------------------------------ 状态 ------------------------------ */

  const G = {
    ready: false,
    started: false,
    t: 0,
    keys: new Set(),
    maps: {},
    map: null,
    monsters: [],
    spawnQueue: [],
    effects: [],
    projectiles: [],
    eProjs: [],
    telegraphs: [],
    bursts: [],
    drops: [],
    cooldowns: {},
    questState: {},
    questProgress: {},
    unlockedAnchors: {},
    steles: {},
    seenMaps: {},
    lastNpc: null,
    cam: { x: 0, y: 0 },
    shake: 0,
    fade: 0,
    flash: 0,
    flashColor: '255,255,255',
    zoomPulse: 0,
    hitStop: 0,
    slowMoTimer: 0,
    challenge: null,
    challengeCd: {},
    travelCd: 0,
    interactTarget: null,
    restTimer: 0,
    /* v0.8 */
    bossRef: null,
    secret: { open: false, left: 0, next: 0 },
    tranFx: 0,
    tranLock: false,
    dungeonRun: null
  };

  const player = {
    name: '无涯子',
    look: null,
    x: 0, y: 0, facing: Math.PI / 2,
    phase: 0, moving: false,
    path: 'sword',
    level: 1, exp: 0, stones: 30,
    hp: 60, qi: 50,
    bonusHp: 0, bonusQi: 0,
    bag: [],
    /* 装备为实例：{ id, q, lv, dur, durMax } */
    equip: { weapon: null, body: null, charm: null, cloth: null },
    sectProg: { kill: 0, dungeon: 0, tower: 0 },
    skills: [],
    combo: 0, comboTimer: 0,
    attackTimer: 0, attackCd: 0, attackIndex: 0,
    dodgeTimer: 0, dodgeCd: 0, dodgeDir: 0,
    invuln: 0,
    hurtFlash: 0,
    resting: false,
    dead: false,
    healTimer: 8,
    /* v0.8 新系统 */
    statUp: { atk: 0, hp: 0, def: 0, spd: 0, aspd: 0 },
    contrib: 0,
    buffs: [],
    root: null,
    bottleneck: false,
    realmRewarded: {},
    sectTaskCd: {},
    alchCount: 0,
    mergeCount: 0,
    dungeonClears: {},
    secretCd: 0
  };

  const petals = [];

  /* 供 UI / 对话层调用的接口挂到状态对象上 */
  G.player = player;

  /* ------------------------------ 工具 ------------------------------ */

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);

  function angleLerp(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  function getParam(name, dflt) {
    try {
      const v = new URLSearchParams(window.location.search).get(name);
      return v === null ? dflt : v;
    } catch (e) { return dflt; }
  }

  /* ------------------------------ 轻量存档 ------------------------------ */

  const SAVE_KEY = 'qingyun_v03';
  const SAVE_VERSION = 3;
  let saveData = {};

  function hasLS() {
    try { return typeof localStorage !== 'undefined' && !!localStorage; }
    catch (e) { return false; }
  }

  function loadSave() {
    saveData = {};
    if (!hasLS()) return;
    try {
      saveData = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {};
    } catch (e) { saveData = {}; }
    // 版本不符则丢弃角色进度（保留设置）
    if (saveData.player && saveData.player.v !== SAVE_VERSION) {
      delete saveData.player;
    }
  }

  function persist() {
    if (!hasLS()) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); } catch (e) { }
  }

  function dateStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* ------------------------------ 角色进度存档 ------------------------------ */

  function snapInst(inst) {
    if (!inst) return null;
    if (typeof inst === 'string') return Gear.make(inst);
    return {
      id: inst.id, n: 1,
      q: (typeof inst.q === 'number') ? inst.q : Gear.defQ(inst.id),
      lv: inst.lv || 0,
      dur: (typeof inst.dur === 'number') ? inst.dur : (inst.durMax || 100),
      durMax: inst.durMax || 100
    };
  }

  function snapshotPlayer() {
    const equip = {};
    for (const slot of GEAR_SLOTS) equip[slot] = snapInst(player.equip[slot]);
    return {
      v: SAVE_VERSION,
      name: player.name,
      look: player.look ? Object.assign({}, player.look) : null,
      path: player.path,
      level: player.level,
      exp: Math.floor(player.exp),
      stones: player.stones,
      hp: Math.round(player.hp),
      qi: Math.round(player.qi),
      bonusHp: player.bonusHp,
      bonusQi: player.bonusQi,
      bonusAtk: player.bonusAtk || 0,
      bonusDef: player.bonusDef || 0,
      bonusCrit: player.bonusCrit || 0,
      bonusQiRegen: player.bonusQiRegen || 0,
      statUp: Object.assign({ atk: 0, hp: 0, def: 0, spd: 0, aspd: 0 }, player.statUp || {}),
      root: player.root ? JSON.parse(JSON.stringify(player.root)) : null,
      bottleneck: !!player.bottleneck,
      realmRewarded: Object.assign({}, player.realmRewarded || {}),
      contrib: player.contrib || 0,
      alchCount: player.alchCount || 0,
      mergeCount: player.mergeCount || 0,
      sectProg: Object.assign({ kill: 0, dungeon: 0, tower: 0 }, player.sectProg || {}),
      sectTaskCd: Object.assign({}, player.sectTaskCd || {}),
      dungeonClears: Object.assign({}, player.dungeonClears || {}),
      bag: player.bag.map((it) => {
        const d = ITEMS[it.id];
        if (d && isGearKind(d.kind)) return snapInst(it);
        return { id: it.id, n: it.n };
      }),
      equip: equip,
      questState: Object.assign({}, G.questState),
      questProgress: JSON.parse(JSON.stringify(G.questProgress)),
      challengeCd: Object.assign({}, G.challengeCd),
      seenMaps: Object.assign({}, G.seenMaps),
      introShown: !!G.introShown,
      mapId: G.map ? G.map.id : 'village',
      x: Math.round(player.x),
      y: Math.round(player.y),
      playTime: Math.round(G.playTime || 0),
      savedAt: Date.now()
    };
  }

  function saveGame(silent) {
    if (!G.started) return;
    saveData.player = snapshotPlayer();
    persist();
    try { if (typeof Account !== 'undefined' && Account.syncCurrent) Account.syncCurrent(saveData.player); } catch (e) { }
    try { Rank.upsertSelf(); } catch (e) { }
    if (!silent) UI.toast('修行已记于玉简', 'blue');
  }

  function restorePlayer(s) {
    if (s.name) player.name = String(s.name).slice(0, 12);
    player.look = s.look ? Object.assign({}, s.look) : null;
    player.path = PATHS[s.path] ? s.path : 'sword';
    player.level = Math.max(1, s.level | 0 || 1);
    player.exp = Math.max(0, s.exp || 0);
    player.bonusHp = s.bonusHp || 0;
    player.bonusQi = s.bonusQi || 0;
    player.bonusAtk = s.bonusAtk || 0;
    player.bonusDef = s.bonusDef || 0;
    player.bonusCrit = s.bonusCrit || 0;
    player.bonusQiRegen = s.bonusQiRegen || 0;
    player.statUp = Object.assign({ atk: 0, hp: 0, def: 0, spd: 0, aspd: 0 }, s.statUp || {});
    player.root = s.root ? JSON.parse(JSON.stringify(s.root)) : null;
    player.bottleneck = !!s.bottleneck;
    player.realmRewarded = Object.assign({}, s.realmRewarded || {});
    player.contrib = s.contrib || 0;
    player.alchCount = s.alchCount || 0;
    player.mergeCount = s.mergeCount || 0;
    player.sectProg = Object.assign({ kill: 0, dungeon: 0, tower: 0 }, s.sectProg || {});
    player.sectTaskCd = Object.assign({}, s.sectTaskCd || {});
    player.dungeonClears = Object.assign({}, s.dungeonClears || {});
    player.buffs = [];
    player.stones = s.stones || 0;

    player.bag = [];
    for (const it of (s.bag || [])) {
      if (!it || !ITEMS[it.id] || !(it.n > 0)) continue;
      const d = ITEMS[it.id];
      if (isGearKind(d.kind)) player.bag.push(snapInst(it));
      else player.bag.push({ id: it.id, n: it.n });
    }

    player.equip = { weapon: null, body: null, charm: null, cloth: null };
    for (const slot of GEAR_SLOTS) {
      const v = s.equip && s.equip[slot];
      if (!v) continue;
      const id = (typeof v === 'string') ? v : v.id;
      if (id && ITEMS[id]) player.equip[slot] = snapInst(typeof v === 'string' ? id : v);
    }

    player.skills = PATHS[player.path].skills.slice();
    G.questState = Object.assign({}, s.questState || {});
    G.questProgress = s.questProgress || {};
    G.challengeCd = Object.assign({}, s.challengeCd || {});
    G.seenMaps = Object.assign({}, s.seenMaps || {});
    G.introShown = !!s.introShown;
    G.playTime = s.playTime || 0;
    player.hp = Math.max(1, s.hp || 60);
    player.qi = Math.max(0, s.qi || 0);
    syncMax();
  }

  /** 清空存档（重新择道） */
  G.resetSave = function () {
    delete saveData.player;
    persist();
    try { if (typeof Rank !== 'undefined') Rank.reset(); } catch (e) { }
    location.reload();
  };


  /* ------------------------------ 按键映射 ------------------------------ */

  G.keymap = {};

  function loadKeymap() {
    const saved = saveData.keymap || {};
    G.keymap = {};
    for (const k in KEYMAP_DEFAULT) {
      G.keymap[k] = saved[k] || KEYMAP_DEFAULT[k];
    }
  }

  function actionOf(code) {
    for (const a in G.keymap) {
      if (G.keymap[a] === code) return a;
    }
    if (code === 'ShiftRight') return 'dodge';
    return null;
  }

  G.setKeybinding = function (action, code) {
    for (const k in G.keymap) {
      if (k !== action && G.keymap[k] === code) G.keymap[k] = G.keymap[action];
    }
    G.keymap[action] = code;
    saveData.keymap = Object.assign({}, G.keymap);
    persist();
    UI.buildSkillBar();
  };

  G.resetKeymap = function () {
    G.keymap = Object.assign({}, KEYMAP_DEFAULT);
    saveData.keymap = Object.assign({}, G.keymap);
    persist();
    UI.buildSkillBar();
  };

  G.saveSettings = function () {
    saveData.volumes = Audio2.getVolume();
    persist();
  };

  /* ------------------------------ 触屏按键设置 ------------------------------ */

  function touchCfgNow() {
    const d = (typeof Touch !== 'undefined' && Touch.DEF_CFG) ? Touch.DEF_CFG : {};
    const c = Object.assign({}, d, saveData.touchCfg || {});
    if (!saveData.touchCfg) {
      // 首次进入：触屏设备默认显示，桌面默认不显示
      let auto = false;
      try {
        auto = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      } catch (e) { }
      c.show = auto;
    }
    return c;
  }

  G.getTouchCfg = function () { return touchCfgNow(); };

  G.setTouchCfg = function (patch) {
    const next = Object.assign({}, touchCfgNow(), patch || {});
    let applied = next;
    try {
      if (typeof Touch !== 'undefined' && Touch.applyConfig) {
        applied = Touch.applyConfig(next) || next;
      }
    } catch (e) { }
    // 存的是夹取过的值，避免越界数据写进存档
    saveData.touchCfg = applied;
    persist();
    return applied;
  };

  G.resetTouchCfg = function () {
    delete saveData.touchCfg;
    persist();
    const c = touchCfgNow();
    try { if (typeof Touch !== 'undefined' && Touch.applyConfig) Touch.applyConfig(c); } catch (e) { }
    return c;
  };

  /** 触屏控件只在「已开始游戏且没有打开任何界面」时出现 */
  function updateTouchGate() {
    try {
      if (typeof Touch === 'undefined' || !Touch.setGate) return;
      let open = !!G.started && !player.dead;
      if (open && G.tranLock) open = false;
      if (open) {
        try { if (UI.modalOpen()) open = false; } catch (e) { }
        try { if (UI.cgOpen && UI.cgOpen()) open = false; } catch (e) { }
        try { if (UI.dialogueOpen && UI.dialogueOpen()) open = false; } catch (e) { }
      }
      Touch.setGate(open);
    } catch (e) { }
  }
  G.updateTouchGate = updateTouchGate;

  G.saveData = function () { return saveData; };
  G.persistNow = function () { persist(); };

  /* ------------------------------ 属性 ------------------------------ */

  function totalStats() {
    const P = PATHS[player.path];
    const lv = player.level - 1;
    const su = player.statUp || {};

    /* 基础：开局气血 60，每升一级 +5 */
    let atk = P.atk + lv * 2.3 + (su.atk || 0) * 3.5 + (player.bonusAtk || 0);
    let def = P.def + lv * 1.1 + (su.def || 0) * 2.4 + (player.bonusDef || 0);
    let hpMax = 60 + (P.hp - 100) * 0.6 + lv * 5 + (su.hp || 0) * 22 + player.bonusHp;
    let qiMax = P.qi + lv * 6 + player.bonusQi;
    let speed = P.speed + (su.spd || 0) * 6;
    let crit = 0.05 + (player.bonusCrit || 0);
    let qiRegen = 4 + (player.bonusQiRegen || 0);
    let atkSpd = (su.aspd || 0) * 0.05;

    /* 装备（含品质 / 等级 / 耐久衰减） */
    for (const slot of GEAR_SLOTS) {
      const inst = player.equip[slot];
      if (!inst) continue;
      const s = Gear.stats(inst);
      atk += s.atk; def += s.def; hpMax += s.hp; qiMax += s.qi;
      speed += s.speed; crit += s.crit; qiRegen += s.qiRegen; atkSpd += s.atkSpd;
    }

    /* 称号加成 */
    try {
      const ti = G.currentTitle ? G.currentTitle() : null;
      const b = ti && ti.bonus ? ti.bonus : null;
      if (b) {
        atk += b.atk || 0; def += b.def || 0; hpMax += b.hp || 0;
        qiMax += b.qi || 0; crit += b.crit || 0; qiRegen += b.qiRegen || 0;
      }
    } catch (e) { }

    /* 丹药临时增益 */
    for (const bf of (player.buffs || [])) {
      if (!bf || bf.time <= 0) continue;
      if (bf.atk) atk *= (1 + bf.atk);
      if (bf.def) def *= (1 + bf.def);
      if (bf.move) speed *= (1 + bf.move);
      if (bf.aspd) atkSpd += bf.aspd;
    }

    if (player.path === 'mage') qiRegen += 1.6;

    const out = {
      atk: atk, def: def,
      hpMax: Math.max(1, hpMax), qiMax: Math.max(1, qiMax),
      speed: clamp(speed, 110, 330),
      crit: clamp(crit, 0, 0.92),
      qiRegen: qiRegen,
      atkSpd: atkSpd
    };
    /* 灵根加成（决定开局底子） */
    try {
      if (player.root && typeof Root !== 'undefined') Root.applyToStats(player.root, out);
    } catch (e) { }
    out.crit = clamp(out.crit, 0, 0.92);
    out.speed = clamp(out.speed, 100, 360);
    return out;
  }

  /* 增益计时 */
  function updateBuffs(dt) {
    if (!player.buffs || !player.buffs.length) return;
    for (let i = player.buffs.length - 1; i >= 0; i--) {
      const b = player.buffs[i];
      b.time -= dt;
      if (b.time <= 0) player.buffs.splice(i, 1);
    }
  }

  function addBuff(b) {
    if (!b) return;
    player.buffs = player.buffs || [];
    player.buffs.push(Object.assign({ time: 8 }, b));
  }

  /** 当前普攻间隔（秒）：基础 0.72，攻速越高越快 */
  function attackInterval() {
    const st = totalStats();
    return clamp(0.72 / (1 + (st.atkSpd || 0)), 0.16, 1.4);
  }

  /** 装备磨损；损耗殆尽时提示一次 */
  function wearEquip(slot, amount) {
    const inst = player.equip[slot];
    if (!inst || inst.dur === undefined) return;
    const before = inst.dur;
    Gear.wear(inst, amount);
    if (before > 0 && inst.dur <= 0) {
      const nm = ITEMS[inst.id] ? ITEMS[inst.id].name : '装备';
      UI.toast(nm + ' 已损坏，属性大打折扣（去找铁匠修补）', 'red');
    }
  }

  function syncMax() {
    const st = totalStats();
    player.hpMax = st.hpMax;
    player.qiMax = st.qiMax;
    player.hp = Math.min(player.hp, player.hpMax);
    player.qi = Math.min(player.qi, player.qiMax);
  }

  /* ------------------------------ 背包 ------------------------------ */

  function bagCount(id) {
    let n = 0;
    for (const it of player.bag) if (it.id === id) n += it.n;
    return n;
  }

  /** 行囊格子数：5 行 × 10 列 */
  const BAG_SLOTS = 50;

  function bagFull() { return player.bag.length >= BAG_SLOTS; }

  function addItem(id, n) {
    n = n || 1;
    const def = ITEMS[id];
    if (!def) return;
    try { if (typeof Codex !== 'undefined') Codex.markSeen(id); } catch (e) { }
    /* 装备类：一件一格，各自持有品质 / 等级 / 耐久 */
    if (isGearKind(def.kind)) {
      let left = n;
      while (left > 0) {
        if (bagFull()) {
          UI.toast('行囊已满，遗落了 ' + def.name, 'red');
          return;
        }
        player.bag.push(Gear.make(id));
        left--;
      }
      return;
    }
    const maxStack = def.kind === 'pill' || def.kind === 'mat' ? (def.stack || 99) : 1;
    let left = n;
    if (maxStack > 1) {
      for (const it of player.bag) {
        if (it.id !== id) continue;
        const can = maxStack - it.n;
        if (can <= 0) continue;
        const add = Math.min(can, left);
        it.n += add;
        left -= add;
        if (left <= 0) return;
      }
    }
    while (left > 0 && player.bag.length < BAG_SLOTS) {
      const take = Math.min(maxStack, left);
      player.bag.push({ id: id, n: take });
      left -= take;
    }
    if (left > 0) UI.toast('行囊已满，遗落了 ' + def.name, 'red');
  }

  function removeItem(id, n) {
    n = n || 1;
    for (let i = player.bag.length - 1; i >= 0 && n > 0; i--) {
      const it = player.bag[i];
      if (it.id !== id) continue;
      const take = Math.min(it.n, n);
      it.n -= take;
      n -= take;
      if (it.n <= 0) player.bag.splice(i, 1);
    }
  }

  /** 按格子下标移除一件（装备用） */
  function removeBagAt(index) {
    if (index < 0 || index >= player.bag.length) return null;
    const it = player.bag[index];
    if (!it) return null;
    if (it.n > 1) { it.n--; return it; }
    player.bag.splice(index, 1);
    return it;
  }

  /** 直接提升 n 个小境界（破境丹用） */
  function gainLevels(n) {
    n = Math.max(1, Math.round(n || 1));
    for (let i = 0; i < n; i++) {
      if (player.bottleneck || player.level >= MAX_LEVEL) break;
      gainExp(Math.max(1, expNeed(player.level) - player.exp + 1));
    }
  }

  /* 可直接使用的道具类型：丹药 + 秘法/秘录 */
  const USABLE_KINDS = { pill: 1, manual: 1 };

  function useItem(id) {
    const def = ITEMS[id];
    if (!def || !USABLE_KINDS[def.kind] || !def.use) return;
    const boost = player.path === 'alch' ? 1.25 : 1;
    const u = def.use;
    const st0 = totalStats();
    let did = false;
    const gains = [];

    /* 瓶颈期服破境丹：必须另付灵石，否则不消耗丹药 */
    if (player.bottleneck && u.expLevels) {
      const req = breakRequirement();
      const pd = BREAK_PILLS.filter((p) => p.id === id)[0];
      const need = Math.max(10, Math.ceil(req.base * (pd ? pd.mul : 1)));
      if (player.stones < need) {
        UI.toast('冲关还需 ' + need + ' 灵石（现有 ' + player.stones + '）', 'red');
        return;
      }
      removeItem(id, 1);
      player.stones -= need;
      UI.toast('服下 ' + def.name + '，以灵石 ' + need + ' 冲关', 'gold');
      performBreakthrough();
      if (u.expLevels > 1) gainLevels(u.expLevels - 1);
      UI.updateHUD();
      return;
    }

    if (u.hpFull) {
      player.hp = st0.hpMax;
      did = true;
      addEffect({ type: 'heal', x: player.x, y: player.y, r: 90, life: 0.9, maxLife: 0.9 });
    } else if (u.hp) {
      player.hp = Math.min(st0.hpMax, player.hp + u.hp * boost);
      did = true;
      addEffect({ type: 'heal', x: player.x, y: player.y, r: 60, life: 0.8, maxLife: 0.8 });
      addEffect({
        type: 'dmg', x: player.x, y: player.y - 46, vy: -30,
        text: '+' + Math.round(u.hp * boost), color: '#9fe6b0', life: 0.9, maxLife: 0.9
      });
    }
    if (u.qi) {
      player.qi = Math.min(st0.qiMax, player.qi + u.qi * boost);
      did = true;
    }
    if (u.hpMax) {
      player.bonusHp += u.hpMax * boost; syncMax(); player.hp += u.hpMax * boost; did = true;
      gains.push('气血上限 +' + Math.round(u.hpMax * boost));
    }
    if (u.qiMax) {
      player.bonusQi += u.qiMax * boost; syncMax(); player.qi += u.qiMax * boost; did = true;
      gains.push('灵力上限 +' + Math.round(u.qiMax * boost));
    }
    if (u.qiRegen) {
      player.bonusQiRegen = (player.bonusQiRegen || 0) + u.qiRegen * boost; did = true;
      gains.push('回灵 +' + (u.qiRegen * boost).toFixed(1));
    }
    if (u.atk) {
      player.bonusAtk = (player.bonusAtk || 0) + u.atk * boost; did = true;
      gains.push('攻击 +' + Math.round(u.atk * boost));
    }
    if (u.def) {
      player.bonusDef = (player.bonusDef || 0) + u.def * boost; did = true;
      gains.push('防御 +' + Math.round(u.def * boost));
    }
    if (u.crit) {
      player.bonusCrit = (player.bonusCrit || 0) + u.crit * boost; did = true;
      gains.push('暴击 +' + (u.crit * boost * 100).toFixed(1) + '%');
    }
    if (u.buff) {
      addBuff({
        atk: u.buff.atk || 0, aspd: u.buff.aspd || 0,
        move: u.buff.move || 0, def: u.buff.def || 0,
        guard: u.buff.guard || 0,
        time: u.buff.time || 8
      });
      did = true;
    }

    removeItem(id, 1);

    if (u.expLevels) {
      if (player.bottleneck) {
        // 瓶颈期服破境丹 = 直接冲关
        performBreakthrough();
        if (u.expLevels > 1) gainLevels(u.expLevels - 1);
      } else {
        gainLevels(u.expLevels);
      }
      G.flash = 0.5; G.flashColor = '255,225,150';
      gains.push('境界 +' + u.expLevels + ' 层');
    }

    syncMax();

    /* 反馈：丹药说「服下」，秘法/秘录说「研读」并列出永久增益 */
    if (def.kind === 'manual') {
      addEffect({
        type: 'rune', x: player.x, y: player.y + 4, r: 110,
        life: 1.1, maxLife: 1.1, color: 'rgba(190,220,255,'
      });
      addEffect({
        type: 'elem', x: player.x, y: player.y - 14, r: 70, count: 14,
        kind: 'mage', color: 'rgba(200,225,255,', life: 0.8, maxLife: 0.8,
        seed: Math.random() * 6.283
      });
      Audio2.play('levelup');
      UI.toast('研读《' + def.name + '》' + (gains.length ? '：' + gains.join('　') : ''), 'gold');
    } else if (gains.length && did) {
      UI.toast('服下 ' + def.name + '：' + gains.join('　'), 'blue');
    } else {
      UI.toast('服下 ' + def.name, 'blue');
    }
    UI.updateHUD();
  }

  function equipItem(ref) {
    let idx = -1, inst = null;
    if (typeof ref === 'number') {
      idx = ref;
      inst = player.bag[idx] || null;
    } else {
      for (let i = 0; i < player.bag.length; i++) {
        const e = player.bag[i];
        const d = ITEMS[e.id];
        if (!d || e.id !== ref || !isGearKind(d.kind)) continue;
        idx = i; inst = e; break;
      }
    }
    if (!inst) return;
    const def = ITEMS[inst.id];
    if (!def || !isGearKind(def.kind)) { UI.toast('此物不可佩用', 'red'); return; }
    if (inst.dur === undefined) inst = Gear.make(inst.id);
    const slot = def.kind;
    const old = player.equip[slot];
    player.bag.splice(idx, 1);
    player.equip[slot] = inst;
    if (old) player.bag.push(old);
    syncMax();
    UI.toast('装备 ' + def.name, 'gold');
    saveGame(true);
  }

  function unequip(slot) {
    const inst = player.equip[slot];
    if (!inst) return;
    if (bagFull()) { UI.toast('行囊已满，无法卸下', 'red'); return; }
    player.equip[slot] = null;
    player.bag.push(inst);
    syncMax();
    UI.toast('卸下 ' + (ITEMS[inst.id] ? ITEMS[inst.id].name : ''));
    saveGame(true);
  }

  /* ------------------------------ 经验 ------------------------------ */

  const MAX_LEVEL = REALMS.length * LAYERS_PER_REALM;

  function gainExp(n) {
    let mul = 1;
    try { if (player.root && typeof Root !== 'undefined') mul = Root.expMul(player.root); } catch (e) { }
    player.exp += n * mul;

    let up = false;
    while (player.exp >= expNeed(player.level)) {
      if (player.level >= MAX_LEVEL) {
        player.exp = expNeed(MAX_LEVEL);
        break;
      }
      // 本境巅峰：必须破境
      if (isBottleneckLevel(player.level)) {
        player.exp = expNeed(player.level);
        if (!player.bottleneck) {
          player.bottleneck = true;
          UI.toast('修为已至「' + realmName(player.level) + '」巅峰 · 需破境方可再进', 'gold');
          setTimeout(() => UI.toast('按「破境」按钮，或用破境丹冲关', 'blue'), 900);
          try { Audio2.play('quest'); } catch (e) { }
          G.flash = 0.3; G.flashColor = '255,225,150';
        }
        break;
      }
      player.exp -= expNeed(player.level);
      player.level++;
      up = true;
    }
    if (up) {
      const st = totalStats();
      player.hpMax = st.hpMax;
      player.qiMax = st.qiMax;
      player.hp = player.hpMax;
      player.qi = player.qiMax;
      UI.toast('境界提升：' + realmName(player.level), 'gold');
      addEffect({ type: 'ring', x: player.x, y: player.y, r: 90, life: 0.9, maxLife: 0.9, color: 'rgba(255,225,150,' });
      addEffect({ type: 'elem', x: player.x, y: player.y - 14, r: 70, count: 12, kind: player.path, color: 'rgba(255,230,170,', life: 0.7, maxLife: 0.7, seed: Math.random() * 6.283 });
      G.shake = Math.max(G.shake, 8);
      G.flash = 0.4; G.flashColor = '255,225,150';
      Audio2.play('levelup');
      checkRealmChange();
      saveGame(true);
    }
    syncMax();
    try { checkGameClear(); } catch (e) { }
  }

  /* ------------------------------ 境界与破境 ------------------------------ */

  /** 跨入新大境界：发对应称号 + 属性底子奖励 */
  function checkRealmChange() {
    const ri = realmIndex(player.level);
    player.realmRewarded = player.realmRewarded || {};
    for (let r = 0; r <= ri; r++) {
      if (player.realmRewarded[r]) continue;
      player.realmRewarded[r] = true;
      if (r === 0) continue;    // 炼气是起点，不额外奖励
      grantRealmReward(r);
    }
  }

  function grantRealmReward(r) {
    const stones = Math.floor(180 * Math.pow(r, 2.1));
    const atk = Math.round(5 * r);
    const def = Math.round(3.5 * r);
    const hp = Math.round(55 * r);
    const qi = Math.round(26 * r);
    player.stones += stones;
    player.bonusAtk = (player.bonusAtk || 0) + atk;
    player.bonusDef = (player.bonusDef || 0) + def;
    player.bonusHp = (player.bonusHp || 0) + hp;
    player.bonusQi = (player.bonusQi || 0) + qi;
    syncMax();
    G.flash = 0.7; G.flashColor = '255,240,190';
    G.shake = Math.max(G.shake, 12);
    G.zoomPulse = 1;
    addEffect({ type: 'rune', x: player.x, y: player.y + 4, r: 190, life: 1.6, maxLife: 1.6, color: 'rgba(255,235,170,' });
    addEffect({ type: 'ring', x: player.x, y: player.y, r: 220, life: 1.3, maxLife: 1.3, color: 'rgba(255,235,170,' });
    addEffect({ type: 'streak', x: player.x, y: player.y - 16, r: 220, count: 22, life: 0.8, maxLife: 0.8, color: 'rgba(255,240,190,' });
    try { Audio2.play('levelup'); } catch (e) { }
    UI.toast('★ 踏入 ' + REALMS[r] + ' 境 · ' + REALM_DESC[r], 'gold');
    setTimeout(() => UI.toast('境界之赐：攻击+' + atk + ' 防御+' + def + ' 气血+' + hp + ' 灵力+' + qi + '　灵石+' + stones, 'blue'), 1000);
    checkTitles();
  }

  /** 破境：消化已有的丹/灵石，推进一个小境界 */
  function performBreakthrough() {
    player.bottleneck = false;
    player.level = Math.min(MAX_LEVEL, player.level + 1);
    player.exp = 0;
    syncMax();
    player.hp = player.hpMax;
    player.qi = player.qiMax;
    G.flash = 0.65; G.flashColor = '255,238,185';
    G.shake = Math.max(G.shake, 11);
    G.zoomPulse = 1;
    addEffect({ type: 'ring', x: player.x, y: player.y, r: 170, life: 1.1, maxLife: 1.1, color: 'rgba(255,235,170,' });
    addEffect({ type: 'shock', x: player.x, y: player.y, r: 180, life: 0.9, maxLife: 0.9, color: 'rgba(255,235,170,', seed: Math.random() * 6.283 });
    addEffect({ type: 'elem', x: player.x, y: player.y - 14, r: 90, count: 16, kind: player.path, color: 'rgba(255,240,200,', life: 0.9, maxLife: 0.9, seed: Math.random() * 6.283 });
    try { Audio2.play('levelup'); } catch (e) { }
    UI.toast('破境成功 · 踏入 ' + realmName(player.level), 'gold');
    checkRealmChange();
    checkTitles();
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /** 破境材料需求：必须有破境丹，另需灵石（丹药越好，灵石越省） */
  const BREAK_PILLS = [
    { id: 'pill_break_l', mul: 0.25 },
    { id: 'pill_break', mul: 0.55 },
    { id: 'pill_break_s', mul: 1.00 }
  ];

  function breakRequirement() {
    const base = breakStoneCost(player.level);
    let pill = null;
    for (const p of BREAK_PILLS) {
      if (bagCount(p.id) > 0) { pill = p; break; }
    }
    const mul = pill ? pill.mul : 1;
    const gNeed = (typeof breakGuardNeed === 'function') ? breakGuardNeed(player.level) : 1;
    const cNeed = (typeof breakCondenseNeed === 'function') ? breakCondenseNeed(player.level) : 0;
    const gHave = bagCount('pill_guard');
    const cHave = bagCount('pill_condense');
    return {
      pillId: pill ? pill.id : null,
      pillName: pill ? ITEMS[pill.id].name : null,
      stones: Math.max(10, Math.ceil(base * mul)),
      base: base,
      hasPill: !!pill,
      guardNeed: gNeed,
      guardHave: gHave,
      guardOk: gHave >= gNeed,
      condNeed: cNeed,
      condHave: cHave,
      condOk: cHave >= cNeed,
      ok: !!pill && gHave >= gNeed && cHave >= cNeed && player.stones >= Math.max(10, Math.ceil(base * mul))
    };
  }

  /** 从界面点「破境」：破境丹 + 护脉丹（+凝神丹）+ 灵石，缺一不可 */
  function breakthrough() {
    if (player.dead) return false;
    if (!player.bottleneck) { UI.toast('尚未至瓶颈，继续积累修为罢', 'blue'); return false; }

    const req = breakRequirement();
    if (!req.hasPill) {
      UI.toast('破境须有破境丹（商铺 / 宗门 / 丹炉可得）', 'red');
      return false;
    }
    if (!req.guardOk) {
      UI.toast('还需护脉丹 ×' + (req.guardNeed - req.guardHave) + '（现有 ' + req.guardHave + '）', 'red');
      return false;
    }
    if (!req.condOk) {
      UI.toast('还需凝神丹 ×' + (req.condNeed - req.condHave) + '（现有 ' + req.condHave + '）', 'red');
      return false;
    }
    if (player.stones < req.stones) {
      UI.toast(req.pillName + ' 冲关还需 ' + req.stones + ' 灵石（现有 ' + player.stones + '）', 'red');
      return false;
    }

    removeItem(req.pillId, 1);
    removeItem('pill_guard', req.guardNeed);
    if (req.condNeed > 0) removeItem('pill_condense', req.condNeed);
    player.stones -= req.stones;

    const parts = [req.pillName];
    parts.push('护脉丹×' + req.guardNeed);
    if (req.condNeed > 0) parts.push('凝神丹×' + req.condNeed);
    parts.push('灵石 ' + req.stones);
    UI.toast('以 ' + parts.join('、') + ' 冲关', 'gold');
    return performBreakthrough();
  }

  /* ------------------------------ 特效 ------------------------------ */

  function addEffect(e) {
    e.maxLife = e.maxLife || e.life;
    G.effects.push(e);
    return e;
  }

  function dmgText(x, y, amount, crit) {
    addEffect({
      type: 'dmg', x: x + rand(-8, 8), y: y - 26, vy: -46,
      text: (crit ? '暴击 ' : '') + Math.round(amount),
      color: crit ? '#ff9f6a' : '#ffe9a8',
      big: !!crit, life: 0.85, maxLife: 0.85
    });
  }

  function sparks(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      addEffect({
        type: 'spark', x: x, y: y,
        vx: rand(-90, 90), vy: rand(-110, 40),
        r: rand(1.5, 3.6), color: color || '#fff0c0',
        life: rand(0.25, 0.5), maxLife: 0.5
      });
    }
  }

  /* ------------------------------ 伤害 ------------------------------ */

  function damageEnemy(m, amount, opt) {
    opt = opt || {};
    const crit = Math.random() < (opt.crit || 0);
    let dmg = amount * (1 - m.def * 0.012);
    if (crit) dmg *= 1.6;
    dmg = Math.max(1, dmg);
    m.hp -= dmg;
    m.flash = 0.22;
    dmgText(m.x, m.y, dmg, crit);
    sparks(m.x, m.y - 18, crit ? 8 : 5, crit ? '#ffb070' : '#ffe6b0');
    // 命中爆点（暴击更夸张）
    addEffect({
      type: 'impact', x: m.x, y: m.y - 16,
      r: crit ? 20 : 13, crit: !!crit,
      color: crit ? 'rgba(255,192,110,' : 'rgba(255,236,196,',
      seed: Math.random() * 6.283,
      life: crit ? 0.28 : 0.2, maxLife: crit ? 0.28 : 0.2
    });
    if (crit) G.shake = Math.max(G.shake, 4);

    if (opt.knock) {
      const a = Math.atan2(m.y - opt.fromY, m.x - opt.fromX);
      m.knockX = Math.cos(a) * opt.knock;
      m.knockY = Math.sin(a) * opt.knock;
    }
    if (opt.stun) m.stun = Math.max(m.stun || 0, opt.stun);
    if (opt.burn) { m.burn = 3; m.burnDmg = opt.burnDmg || 3; }
    if (opt.slow) m.slow = opt.slowTime || 2;

    if (m.hp <= 0) killMonster(m);
  }

  function killMonster(m) {
    m.dead = true;
    const def = MONSTERS[m.type];
    Audio2.play('hit');
    sparks(m.x, m.y - 20, 14, '#ffd98a');
    addEffect({ type: 'ring', x: m.x, y: m.y, r: 46, life: 0.5, maxLife: 0.5, color: 'rgba(255,200,120,' });
    if (m.challenge && G.challenge && G.challenge.state === 'running') {
      G.challenge.killed++;
    }

    gainExp(m.exp !== undefined ? m.exp : def.exp);
    const stones = Math.floor(rand(def.stones[0], def.stones[1] + 1));
    player.stones += stones;
    addEffect({
      type: 'dmg', x: m.x, y: m.y - 40, vy: -30,
      text: '修为 +' + (m.exp !== undefined ? m.exp : def.exp) + '　灵石 +' + stones,
      color: '#9fe6b0', life: 1.1, maxLife: 1.1
    });

    // 掉落物落到地上，需玩家自行拾取
    for (const d of (def.drop || [])) {
      if (Math.random() < d.p) spawnDrop(m.x, m.y, d.id, 1);
    }
    G.totalKills = (G.totalKills || 0) + 1;
    player.sectProg = player.sectProg || { kill: 0, dungeon: 0, tower: 0 };
    player.sectProg.kill = (player.sectProg.kill || 0) + 1;
    try { G.dailyAdd && G.dailyAdd('kill', 1); } catch (e) { }
    try { if (m.war && G.onWarKill) G.onWarKill(m); } catch (e) { }

    /* BOSS 掉落与副本结算 */
    if (m.boss) onBossKilled(m);
    // 任务击杀计数
    for (const qid in G.questState) {
      if (G.questState[qid] !== 'active') continue;
      const q = QUESTS[qid];
      for (const o of q.objectives) {
        if (o.type !== 'kill' || o.monster !== m.type) continue;
        const pr = G.questProgress[qid];
        pr.kills = pr.kills || {};
        pr.kills[m.type] = (pr.kills[m.type] || 0) + 1;
        if (pr.kills[m.type] >= o.count) UI.toast('「' + q.name + '」目标已达成，回去复命罢', 'gold');
      }
    }
    // 安排重生（试炼塔的怪不重生）
    if (!m.tower && !m.challenge) {
      G.spawnQueue.push({
        map: G.map.id, type: m.type,
        x: m.home ? m.home.x : m.x, y: m.home ? m.home.y : m.y,
        timer: 26
      });
    }
  }

  /* 首领被击破：高品质装备 + 副本结算 */
  function onBossKilled(m) {
    G.bossRef = null;
    G.shake = Math.max(G.shake, 16);
    G.zoomPulse = 1;
    G.flash = 0.55; G.flashColor = '255,200,120';
    Audio2.play('levelup');
    addEffect({ type: 'ring', x: m.x, y: m.y, r: 180, life: 1.1, maxLife: 1.1, color: 'rgba(255,205,120,' });
    addEffect({ type: 'rune', x: m.x, y: m.y + 4, r: 160, life: 1.4, maxLife: 1.4, color: 'rgba(255,205,120,' });
    UI.toast('击破 ' + (MONSTERS[m.type] ? MONSTERS[m.type].name : '首领'), 'gold');

    // 高品质装备直接入囊
    const lv = m.lv || 1;
    const q = clamp(lv >= 34 ? 4 : lv >= 22 ? 3 : 2, 0, 5);
    const gid = Gear.randomByQuality(q, Math.random);
    if (gid) addItem(gid, 1);

    const mapId = G.map ? G.map.id : null;
    const dg = (typeof DUNGEONS !== 'undefined')
      ? DUNGEONS.filter((d) => d.id === mapId)[0] : null;
    if (dg) {
      player.dungeonClears = player.dungeonClears || {};
      const first = !player.dungeonClears[dg.id];
      player.dungeonClears[dg.id] = (player.dungeonClears[dg.id] || 0) + 1;
      const r = dg.reward || {};
      const stones = r.stones ? Math.floor(rand(r.stones[0], r.stones[1] + 1)) : 0;
      player.stones += stones;
      if (r.exp) gainExp(r.exp);
      for (const it of (r.items || [])) addItem(it.id, it.n);
      player.sectProg = player.sectProg || { kill: 0, dungeon: 0, tower: 0 };
      player.sectProg.dungeon = (player.sectProg.dungeon || 0) + 1;
      UI.toast('副本「' + dg.name + '」已踏破' + (first ? '（首通）' : '') + '　灵石 +' + stones, 'gold');
    }
    saveGame(true);
  }

  function damagePlayer(amount, fromX, fromY) {
    if (player.dead || player.invuln > 0) return;
    const st = totalStats();
    let dmg = Math.max(1, amount - st.def * 0.55);
    if (player.path === 'body' && player.hurtFlash > 0) dmg *= 0.75;
    /* 金刚丹等减伤增益 */
    for (const bf of (player.buffs || [])) {
      if (bf && bf.time > 0 && bf.guard) dmg *= (1 - bf.guard);
    }
    dmg = Math.max(1, dmg);

    // 防具磨损
    wearEquip('body', dmg * 0.05);
    wearEquip('cloth', dmg * 0.03);

    player.hp -= dmg;
    player.hurtFlash = 0.25;
    player.invuln = 0.35;
    G.shake = Math.max(G.shake, 6);
    dmgText(player.x, player.y, dmg, false);
    addEffect({
      type: 'spark', x: player.x, y: player.y - 24, vx: 0, vy: 0,
      r: 16, color: 'rgba(255,90,70,0.5)', life: 0.3, maxLife: 0.3
    });
    if (player.hp <= 0) {
      player.hp = 0;
      player.dead = true;
      try { if (typeof Tower !== 'undefined' && Tower.isActive()) Tower.fail('身殒'); } catch (e) { }
      UI.showDead('你的修为散于天地之间……\n（将于村口古阵重聚神魂）');
    }
  }

  /* ------------------------------ 攻击判定 ------------------------------ */

  function enemiesInArc(x, y, angle, range, arc) {
    const out = [];
    for (const m of G.monsters) {
      if (m.dead) continue;
      const dx = m.x - x, dy = m.y - y;
      const d = Math.hypot(dx, dy);
      if (d > range + (m.size || 1) * 10) continue;
      let da = Math.atan2(dy, dx) - angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) <= arc / 2 + 0.15) out.push(m);
    }
    return out;
  }

  function enemiesInRadius(x, y, r) {
    const out = [];
    for (const m of G.monsters) {
      if (m.dead) continue;
      if (Math.hypot(m.x - x, m.y - y) <= r + (m.size || 1) * 10) out.push(m);
    }
    return out;
  }

  function dealArc(x, y, angle, range, arc, dmg, opt) {
    const st = totalStats();
    for (const m of enemiesInArc(x, y, angle, range, arc)) {
      damageEnemy(m, dmg, Object.assign({ crit: st.crit, fromX: x, fromY: y }, opt || {}));
    }
  }

  /* ------------------------------ 普攻连招 ------------------------------ */

  function tryBasicAttack() {
    if (player.dead || player.resting) return;
    // 攻速限制：基础间隔较长，靠装备 / 属性升级叠攻速来缩短
    if ((player.attackCd || 0) > 0) return;
    // 0.1 秒后可取消后摇，便于快速接续连招
    if (player.attackTimer > 0.1 || player.dodgeTimer > 0) return;
    const st = totalStats();
    const idx = Math.min(player.combo, COMBO_STEPS.length - 1);
    const step = COMBO_STEPS[idx];

    player.combo = (player.combo % COMBO_STEPS.length) + 1;
    player.comboTimer = 0.95;
    player.attackTimer = idx === 2 ? 0.34 : 0.24;
    player.attackCd = attackInterval();
    player.attackIndex = idx;

    // 兵器磨损
    wearEquip('weapon', 0.55);

    const col = player.path === 'body' ? 'rgba(255,200,140,'
      : player.path === 'mage' ? 'rgba(190,170,255,'
        : player.path === 'alch' ? 'rgba(160,255,200,'
          : 'rgba(210,240,255,';

    Audio2.play('slash');
    // ---- 连招三段各不相同的手感与视觉 ----
    const hitX = player.x + Math.cos(player.facing) * 20;
    const hitY = player.y - 22 + Math.sin(player.facing) * 10;

    addEffect({
      type: 'slash', x: player.x, y: player.y - 22,
      angle: player.facing + (idx === 1 ? 0.42 : 0),
      arc: step.arc, r: step.range * (0.74 + idx * 0.06),
      w: idx === 2 ? 5.5 : (3.4 + idx * 0.8), color: col,
      life: 0.18 + idx * 0.04, maxLife: 0.18 + idx * 0.04
    });

    // 剑气：每一段都甩出一束锥形剑光
    addEffect({
      type: 'swordqi', x: player.x, y: player.y - 20,
      angle: player.facing, spread: 0.16,
      count: 3 + idx * 2, r: step.range * (0.8 + idx * 0.12),
      w: 3.4 + idx * 1.4, color: col,
      life: 0.22 + idx * 0.04, maxLife: 0.22 + idx * 0.04
    });

    if (idx >= 1) {
      addEffect({
        type: 'crescent', x: hitX, y: hitY,
        angle: player.facing + (idx === 1 ? -0.26 : -0.46),
        arc: step.arc * (idx === 1 ? 0.92 : 1.18),
        r: step.range * (idx === 1 ? 0.92 : 1.04),
        w: idx === 1 ? 7 : 11, color: col,
        life: 0.26, maxLife: 0.26
      });
    }

    if (idx === 2) {
      // 第三段：交叉双新月 + 地裂 + 元素点缀
      addEffect({
        type: 'crescent', x: hitX, y: hitY,
        angle: player.facing + 0.62, arc: step.arc * 1.0,
        r: step.range * 0.96, w: 9, color: col,
        life: 0.3, maxLife: 0.3
      });
      addEffect({
        type: 'ring', x: player.x, y: player.y, r: step.range * 1.12,
        life: 0.34, maxLife: 0.34, color: col
      });
      addEffect({
        type: 'crack', x: player.x, y: player.y, r: step.range * 0.95,
        color: 'rgba(255,228,175,', life: 0.46, maxLife: 0.46,
        seed: Math.random() * 6.283
      });
      addEffect({
        type: 'elem', x: player.x, y: player.y - 14, r: step.range * 0.72,
        count: 11, kind: player.path, color: col,
        life: 0.5, maxLife: 0.5, seed: Math.random() * 6.283
      });
      G.shake = Math.max(G.shake, 7);
      G.zoomPulse = Math.max(G.zoomPulse, 0.45);
      G.hitStop = Math.max(G.hitStop || 0, 0.05);
    } else {
      G.shake = Math.max(G.shake, 2.2 + idx * 1.1);
    }

    dealArc(player.x, player.y - 10, player.facing, step.range, step.arc,
      st.atk * step.dmg, {
      knock: step.knock || 0,
      stun: idx === 2 ? 0.25 : 0
    });
  }

  /* ------------------------------ 招式 ------------------------------ */

  function castSkill(id) {
    if (player.dead || player.resting) return false;
    const sk = SKILLS[id];
    if (!sk) return false;
    if ((G.cooldowns[id] || 0) > 0) return false;
    if (player.qi < sk.cost) {
      UI.toast('灵力不足', 'red');
      return false;
    }
    if (player.attackTimer > 0 || player.dodgeTimer > 0) return false;

    player.qi -= sk.cost;
    G.cooldowns[id] = sk.cd;
    player.attackTimer = 0.3;
    player.attackIndex = 1;
    Audio2.play(sk.kind === 'burst' || sk.cost >= 40 ? 'ult' : 'cast');

    // 技能释放 CG：绝招 / 高消耗招式来一段漫画式横插
    try {
      if ((sk.kind === 'burst' || sk.kind === 'strike' || sk.cost >= 40) &&
        typeof SkillCG !== 'undefined' && !SkillCG.isPlaying()) {
        const cgCol = player.path === 'mage' ? '200,180,255'
          : player.path === 'body' ? '255,190,120'
            : player.path === 'alch' ? '160,255,200' : '190,235,255';
        SkillCG.play(sk.name, cgCol, {
          sub: player.name + ' · ' + (PATHS[player.path] ? PATHS[player.path].name : ''),
          fig: playerFigureOpts()
        });
      }
    } catch (e) { }
    const st = totalStats();
    const col = player.path === 'mage' ? 'rgba(200,180,255,'
      : player.path === 'body' ? 'rgba(255,190,120,'
        : player.path === 'alch' ? 'rgba(160,255,200,'
          : 'rgba(200,240,255,';

    if (sk.kind === 'arc') {
      addEffect({
        type: 'slash', x: player.x, y: player.y - 22, angle: player.facing,
        arc: sk.arc, r: sk.range, w: 8, color: col, life: 0.24, maxLife: 0.24
      });
      dealArc(player.x, player.y - 10, player.facing, sk.range, sk.arc,
        st.atk * sk.dmg, { knock: sk.knock || 0, stun: sk.stun || 0 });
      G.shake = Math.max(G.shake, 5);

    } else if (sk.kind === 'dash') {
      const dirX = Math.cos(player.facing), dirY = Math.sin(player.facing);
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const nx = player.x + dirX * (sk.dist / steps);
        const ny = player.y + dirY * (sk.dist / steps);
        if (!canStand(nx, ny)) break;
        player.x = nx; player.y = ny;
      }
      player.invuln = Math.max(player.invuln, 0.22);
      addEffect({
        type: 'slash', x: player.x, y: player.y - 22, angle: player.facing,
        arc: sk.arc, r: sk.radius, w: 9, color: col, life: 0.28, maxLife: 0.28
      });
      dealArc(player.x, player.y - 10, player.facing, sk.radius, sk.arc,
        st.atk * sk.dmg, { knock: 160, stun: sk.stun || 0 });
      for (let i = 0; i < 8; i++) {
        addEffect({
          type: 'spark', x: player.x - dirX * rand(0, 60), y: player.y - rand(0, 40),
          vx: rand(-40, 40), vy: rand(-60, 10), r: rand(2, 5),
          color: col + '0.7)', life: rand(0.2, 0.4), maxLife: 0.4
        });
      }
      // 残影
      for (let k = 0; k < 3; k++) {
        G.effects.push({
          type: 'after',
          x: player.x - dirX * (k + 1) * 26,
          y: player.y - dirY * (k + 1) * 26,
          life: 0.26 + k * 0.04, maxLife: 0.34,
          figure: playerFigureOpts()
        });
      }
      G.shake = Math.max(G.shake, 5);

    } else if (sk.kind === 'proj') {
      const count = sk.count || 1;
      for (let i = 0; i < count; i++) {
        const spread = count > 1 ? (i - (count - 1) / 2) * (sk.spread || 0.2) : 0;
        const ang = player.facing + spread;
        G.projectiles.push({
          x: player.x + Math.cos(ang) * 18,
          y: player.y - 20 + Math.sin(ang) * 18,
          vx: Math.cos(ang) * sk.speed, vy: Math.sin(ang) * sk.speed,
          angle: ang,
          w: sk.w, h: sk.h, life: sk.life, maxLife: sk.life,
          dmg: st.atk * sk.dmg, crit: st.crit,
          pierce: sk.pierce || 0, hit: [],
          color: col + '0.95)',
          color2: col + '0.6)',
          explode: sk.explode || 0, explodeDmg: sk.explodeDmg || 0,
          burn: sk.burn || 0, burnDmg: sk.burnDmg || 0,
          fromPath: player.path
        });
      }
      G.shake = Math.max(G.shake, 2);

    } else if (sk.kind === 'strike') {
      const tx = player.x + Math.cos(player.facing) * sk.range * 0.55;
      const ty = player.y + Math.sin(player.facing) * sk.range * 0.55;
      G.bursts.push({
        kind: 'strike', x: tx, y: ty, r: sk.radius,
        delay: sk.delay, life: 0.7, maxLife: 0.7,
        dmg: st.atk * sk.dmg, crit: st.crit, done: false
      });
      addEffect({
        type: 'strike', x: tx, y: ty, r: sk.radius, delay: sk.delay,
        life: 0.7, maxLife: 0.7
      });

    } else if (sk.kind === 'burst') {
      G.bursts.push({
        kind: 'aoe', x: player.x, y: player.y, r: sk.radius,
        hits: sk.hits, interval: sk.interval || 0.28, elapsed: 0,
        dmg: st.atk * sk.dmg, crit: st.crit, color: col
      });
      // 绝招演出：法阵 + 放射光 + 闪白 + 镜头冲击 + 短暂慢镜
      addEffect({
        type: 'rune', x: player.x, y: player.y + 4, r: sk.radius * 1.15,
        life: 1.5, maxLife: 1.5, color: col, seed: 0
      });
      addEffect({
        type: 'streak', x: player.x, y: player.y - 16, r: sk.radius * 1.35,
        count: 18, life: 0.6, maxLife: 0.6, color: col
      });
      addEffect({
        type: 'shock', x: player.x, y: player.y, r: sk.radius * 1.1,
        life: 0.7, maxLife: 0.7, color: col, seed: Math.random() * 6.283
      });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * 6.283;
        G.effects.push({
          type: 'shard', x: player.x + Math.cos(a) * 20, y: player.y - 20 + Math.sin(a) * 12,
          vx: Math.cos(a) * (120 + Math.random() * 160),
          vy: Math.sin(a) * (60 + Math.random() * 90) - 60,
          r: 3 + Math.random() * 5, rot: Math.random() * 6.283,
          color: col + '0.9)', life: 0.5 + Math.random() * 0.4, maxLife: 0.9
        });
      }
      // 万剑归宗：从天而降的满屏飞剑
      addEffect({
        type: 'swordrain', x: player.x, y: player.y + 8,
        w: 300, h: 300, count: 30, seed: Math.random() * 100,
        color: col, life: 1.15, maxLife: 1.15
      });
      addEffect({
        type: 'swordrain', x: player.x, y: player.y + 8,
        w: 420, h: 200, count: 18, seed: Math.random() * 100,
        color: 'rgba(255,255,255,', life: 1.35, maxLife: 1.35
      });
      G.shake = Math.max(G.shake, 12);
      G.zoomPulse = 1;
      G.flash = 0.42;
      G.flashColor = player.path === 'mage' ? '200,180,255'
        : player.path === 'body' ? '255,190,120'
          : player.path === 'alch' ? '160,255,200' : '190,235,255';
      G.slowMoTimer = 0.26;

    } else if (sk.kind === 'heal') {
      const heal = st.hpMax * (sk.heal || 0.2) * (player.path === 'alch' ? 1.25 : 1);
      player.hp = Math.min(player.hpMax, player.hp + heal);
      if (sk.qi) player.qi = Math.min(player.qiMax, player.qi + sk.qi);
      addEffect({ type: 'heal', x: player.x, y: player.y, r: sk.radius || 90, life: 0.9, maxLife: 0.9 });
      addEffect({
        type: 'dmg', x: player.x, y: player.y - 46, vy: -30,
        text: '+' + Math.round(heal), color: '#9fe6b0', life: 0.9, maxLife: 0.9
      });
      if (sk.radius) {
        for (const m of enemiesInRadius(player.x, player.y, sk.radius)) {
          m.slow = sk.slowTime || 2;
        }
      }
      if (sk.shield) player.invuln = Math.max(player.invuln, sk.shield);
    }
    return true;
  }

  /* ------------------------------ NPC 游走 ------------------------------ */

  function updateNpcs(dt) {
    if (!G.map || !G.map.npcs) return;
    for (const n of G.map.npcs) {
      if (n.talking) { n.moving = false; continue; }
      n.waitTimer = (n.waitTimer || 0) - dt;

      if (n.moving) {
        const dx = n.tx - n.x, dy = n.ty - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 3 || n.moveTime <= 0) {
          n.moving = false;
          n.phase = 0;
          n.waitTimer = 1.2 + Math.random() * 3.2;
        } else {
          const sp = (n.speed || 34) * dt;
          const nx = n.x + (dx / d) * sp;
          const ny = n.y + (dy / d) * sp;
          let blocked = false;
          if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(n.y / TILE))) n.x = nx;
          else blocked = true;
          if (!G.map.isSolidTile(Math.floor(n.x / TILE), Math.floor(ny / TILE))) n.y = ny;
          else blocked = true;
          if (blocked) { n.moving = false; n.waitTimer = 0.8; }
          n.facing = Math.atan2(dy, dx);
          n.phase = (n.phase + dt * 1.7) % 1;
          n.moveTime -= dt;
          n.sortY = n.y;
        }
      } else if (n.waitTimer <= 0) {
        const a = Math.random() * 6.283;
        const r = 16 + Math.random() * (n.range || 88);
        n.tx = n.homeX + Math.cos(a) * r;
        n.ty = n.homeY + Math.sin(a) * r;
        n.moving = true;
        n.moveTime = 1.0 + Math.random() * 2.0;
      }
    }
  }

  /* ------------------------------ 怪物 ------------------------------ */

  function spawnMonster(type, x, y, home, lv, cls) {
    const def = MONSTERS[type];
    if (!def) return null;
    const L = Math.max(1, Math.round(lv || 1));
    const clsId = cls || def.cls || null;
    const C = (clsId && typeof ENEMY_CLASS !== 'undefined' && ENEMY_CLASS[clsId]) ? ENEMY_CLASS[clsId] : null;
    /* 怪物强度整体上调（v0.8） */
    const LEVEL_HP = 0.18, LEVEL_ATK = 0.14;
    const hpMul = (1 + (L - 1) * LEVEL_HP) * (C ? C.hpMul : 1) * (def.boss ? 1 : 1.15);
    const atkMul = (1 + (L - 1) * LEVEL_ATK) * (C ? C.atkMul : 1);
    const hp = Math.max(1, Math.round(def.hp * hpMul));
    const m = {
      kind: 'monster', type: type, lv: L, cls: clsId,
      x: x, y: y, home: home || { x: x, y: y },
      hp: hp, hpMax: hp,
      def: def.def + Math.floor((L - 1) * 0.6),
      atk: Math.max(1, Math.round(def.atk * atkMul)),
      /* 修为奖励也随等级指数增长，与境界需求同步 */
      exp: Math.max(1, Math.round(def.exp * Math.pow(1.135, L - 1) * (C ? C.expMul : 1))),
      stonesBase: def.stones,
      speed: Math.round(def.speed * (C ? C.spdMul : 1)),
      size: (def.size || 1) * (C ? C.sizeMul : 1),
      boss: !!def.boss,
      facing: Math.PI, phase: Math.random() * 6.283,
      flash: 0, stun: 0, slow: 0, knockX: 0, knockY: 0,
      attackCd: rand(0.4, 1.4), wanderTimer: 0, wanderDir: rand(0, 6.283),
      dead: false, sortY: y
    };
    if (C && C.ranged) {
      m.ranged = C.ranged;
      m.shootCd = 0.8 + Math.random();
    }
    G.monsters.push(m);
    return m;
  }

  function buildMonsters(map) {
    G.monsters = [];
    G.spawnQueue = [];
    for (const p of map.spawnPoints) {
      spawnMonster(p.type, p.x, p.y, p);
    }
  }

  function updateMonsters(dt) {
    const st = totalStats();
    for (const m of G.monsters) {
      if (m.dead) continue;
      m.flash = Math.max(0, m.flash - dt);
      m.stun = Math.max(0, (m.stun || 0) - dt);
      m.slow = Math.max(0, (m.slow || 0) - dt);
      if (m.burn > 0) {
        m.burn -= dt;
        m.burnTick = (m.burnTick || 0) + dt;
        if (m.burnTick > 0.5) {
          m.burnTick = 0;
          damageEnemy(m, m.burnDmg || 3, {});
        }
        if (m.dead) continue;
      }

      // 击退位移
      if (Math.abs(m.knockX) > 1 || Math.abs(m.knockY) > 1) {
        const nx = m.x + m.knockX * dt;
        const ny = m.y + m.knockY * dt;
        if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(ny / TILE))) {
          m.x = nx; m.y = ny;
        }
        m.knockX *= 0.86;
        m.knockY *= 0.86;
      }

      const dx = player.x - m.x, dy = player.y - m.y;
      const dist = Math.hypot(dx, dy);
      const speedMul = m.slow > 0 ? 0.45 : 1;
      m.attackCd -= dt;

      if (m.stun > 0) {
        m.facing = Math.atan2(dy, dx);
      } else if (!player.dead && dist < 320) {
        m.facing = angleLerp(m.facing, Math.atan2(dy, dx), Math.min(1, dt * 8));

        if (m.ranged) {
          // 远程：拉开距离并放法术
          const want = m.ranged * 0.62;
          const sp = m.speed * speedMul * dt;
          if (dist < want - 30) {
            const nx = m.x - (dx / dist) * sp;
            const ny = m.y - (dy / dist) * sp;
            if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(m.y / TILE))) m.x = nx;
            if (!G.map.isSolidTile(Math.floor(m.x / TILE), Math.floor(ny / TILE))) m.y = ny;
          } else if (dist > want + 40) {
            const nx = m.x + (dx / dist) * sp;
            const ny = m.y + (dy / dist) * sp;
            if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(m.y / TILE))) m.x = nx;
            if (!G.map.isSolidTile(Math.floor(m.x / TILE), Math.floor(ny / TILE))) m.y = ny;
          }
          m.shootCd -= dt;
          if (m.shootCd <= 0 && dist < m.ranged + 80) {
            m.shootCd = 1.7 + Math.random() * 0.9;
            const ang = Math.atan2(dy, dx);
            G.eProjs.push({
              x: m.x, y: m.y - 18,
              vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300,
              dmg: Math.max(1, Math.round(m.atk * 0.75)),
              life: 2.4, r: m.cls === 'mage' ? 9 : 6,
              color: m.cls === 'mage' ? 'rgba(190,150,255,' : 'rgba(255,200,110,'
            });
            Audio2.play('cast');
          }
        } else if (dist > 40) {
          const sp = m.speed * speedMul * dt;
          const nx = m.x + (dx / dist) * sp;
          const ny = m.y + (dy / dist) * sp;
          if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(m.y / TILE))) m.x = nx;
          if (!G.map.isSolidTile(Math.floor(m.x / TILE), Math.floor(ny / TILE))) m.y = ny;
        } else if (m.attackCd <= 0) {
          m.attackCd = 1.5;
          damagePlayer(m.atk, m.x, m.y);
          addEffect({
            type: 'slash', x: m.x, y: m.y - 20, angle: m.facing,
            arc: 1.6, r: 40, w: 4, color: 'rgba(255,120,90,',
            life: 0.2, maxLife: 0.2
          });
        }

        // Boss 技能
        if (m.boss) {
          m.skillCd = (m.skillCd === undefined ? 2.5 : m.skillCd) - dt;
          if (m.skillCd <= 0) {
            m.skillCd = 3.4 + Math.random() * 1.6;
            bossSkill(m);
          }
        }
      } else {
        // 游荡
        m.wanderTimer -= dt;
        if (m.wanderTimer <= 0) {
          m.wanderTimer = rand(1.2, 3);
          m.wanderDir = rand(0, 6.283);
          m.movingWander = Math.random() < 0.6;
        }
        if (m.movingWander) {
          const sp = m.speed * 0.35 * dt;
          const nx = m.x + Math.cos(m.wanderDir) * sp;
          const ny = m.y + Math.sin(m.wanderDir) * sp;
          if (!G.map.isSolidTile(Math.floor(nx / TILE), Math.floor(ny / TILE))) m.x = nx;
          if (!G.map.isSolidTile(Math.floor(m.x / TILE), Math.floor(ny / TILE))) m.y = ny;
          m.facing = angleLerp(m.facing, m.wanderDir, Math.min(1, dt * 4));
        }
      }
      m.sortY = m.y;
    }

    // 重生
    for (let i = G.spawnQueue.length - 1; i >= 0; i--) {
      const q = G.spawnQueue[i];
      q.timer -= dt;
      if (q.timer <= 0) {
        G.spawnQueue.splice(i, 1);
        if (q.map === G.map.id && q.type && MONSTERS[q.type]) {
          spawnMonster(q.type, q.x, q.y, { x: q.x, y: q.y });
        }
      }
    }
  }

  function spawnMonsterByPoint(point) {
    const def = point.type;
    spawnMonster(def, point.x, point.y, { x: point.x, y: point.y });
  }

  /* ------------------------------ 弹道与爆发 ------------------------------ */

  function updateProjectiles(dt) {
    const st = totalStats();
    for (let i = G.projectiles.length - 1; i >= 0; i--) {
      const p = G.projectiles[i];
      p.trail = p.trail || [];
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.pop();
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0) {
        if (p.explode) explodeAt(p, st);
        G.projectiles.splice(i, 1);
        continue;
      }
      // 撞墙
      if (G.map.isSolidTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE))) {
        if (p.explode) explodeAt(p, st);
        sparks(p.x, p.y, 5, p.color2);
        G.projectiles.splice(i, 1);
        continue;
      }
      // 命中
      let hitSomething = false;
      for (const m of G.monsters) {
        if (m.dead || p.hit.indexOf(m) >= 0) continue;
        if (Math.hypot(m.x - p.x, (m.y - 18) - p.y) < 26 + (m.size || 1) * 8) {
          damageEnemy(m, p.dmg, {
            crit: p.crit, fromX: p.x - p.vx, fromY: p.y - p.vy,
            burn: p.burn, burnDmg: p.burnDmg
          });
          p.hit.push(m);
          hitSomething = true;
          if (p.explode) { explodeAt(p, st); break; }
          if (p.pierce > 0) p.pierce--;
          else { G.projectiles.splice(i, 1); break; }
        }
      }
      if (hitSomething && !p.explode && p.pierce < 0) {
        const idx = G.projectiles.indexOf(p);
        if (idx >= 0) G.projectiles.splice(idx, 1);
      }
    }
  }

  function explodeAt(p, st) {
    addEffect({ type: 'ring', x: p.x, y: p.y, r: p.explode, life: 0.4, maxLife: 0.4, color: 'rgba(255,180,110,' });
    sparks(p.x, p.y, 10, '#ffc070');
    for (const m of enemiesInRadius(p.x, p.y, p.explode)) {
      damageEnemy(m, p.dmg * (p.explodeDmg || 0.6), { crit: p.crit, fromX: p.x, fromY: p.y, burn: 2, burnDmg: 2 });
    }
    G.shake = Math.max(G.shake, 3);
  }

  function updateBursts(dt) {
    for (let i = G.bursts.length - 1; i >= 0; i--) {
      const b = G.bursts[i];
      if (b.kind === 'strike') {
        b.delay -= dt;
        if (b.delay <= 0 && !b.done) {
          b.done = true;
          for (const m of enemiesInRadius(b.x, b.y, b.r)) {
            damageEnemy(m, b.dmg, { crit: b.crit, fromX: b.x, fromY: b.y - 40, stun: 0.4 });
          }
          sparks(b.x, b.y - 20, 12, '#d8c0ff');
          G.shake = Math.max(G.shake, 6);
        }
        if (b.done) b.life -= dt;
        if (b.life <= 0) G.bursts.splice(i, 1);
      } else if (b.kind === 'aoe') {
        b.elapsed += dt;
        const step = b.interval;
        const done = b.hitsShot || 0;
        if (done < b.hits && b.elapsed >= done * step) {
          b.hitsShot = done + 1;
          addEffect({
            type: 'ring', x: b.x, y: b.y, r: b.r, life: 0.34, maxLife: 0.34,
            color: b.color
          });
          for (const m of enemiesInRadius(b.x, b.y, b.r)) {
            damageEnemy(m, b.dmg, { crit: b.crit, fromX: b.x, fromY: b.y });
          }
          G.shake = Math.max(G.shake, 6);
        }
        if (b.hitsShot >= b.hits && b.elapsed > b.hits * step + 0.4) {
          G.bursts.splice(i, 1);
        }
      }
    }
  }

  /* ------------------------------ 移动与碰撞 ------------------------------ */

  function canStand(x, y) {
    const x0 = x - PLAYER_R, x1 = x + PLAYER_R;
    const y0 = y - PLAYER_R - 4, y1 = y + 3;
    const tx0 = Math.floor(x0 / TILE), tx1 = Math.floor(x1 / TILE);
    const ty0 = Math.floor(y0 / TILE), ty1 = Math.floor(y1 / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (G.map.isSolidTile(tx, ty)) return false;
      }
    }
    return true;
  }

  function findFreeSpot(x, y) {
    if (canStand(x, y)) return { x, y };
    for (let r = 1; r < 40; r++) {
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        const nx = x + Math.cos(ang) * r * TILE * 0.5;
        const ny = y + Math.sin(ang) * r * TILE * 0.5;
        if (canStand(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x, y };
  }

  /* ------------------------------ 地图 ------------------------------ */

  function loadMap(mapId, spawnPoint, opts) {
    opts = opts || {};
    if (!G.maps[mapId]) {
      G.maps[mapId] = generateMap(mapId);
    }
    G.map = G.maps[mapId];
    G.monsters = [];
    G.effects = [];
    G.projectiles = [];
    G.bursts = [];
    G.drops = [];
    G.spawnQueue = [];

    let sp;
    if (spawnPoint) sp = spawnPoint;
    else if (opts.atAnchor) sp = { x: G.map.anchors[0].x, y: G.map.anchors[0].y + TILE };
    else sp = G.map.spawn;
    const free = findFreeSpot(sp.x, sp.y);
    player.x = free.x;
    player.y = free.y;
    player.facing = Math.PI / 2;
    G.cam.x = player.x - viewW / ZOOM / 2;
    G.cam.y = player.y - viewH / ZOOM / 2;

    if (!G.unlockedAnchors[mapId]) G.unlockedAnchors[mapId] = true;
    // 石碑未刻录时不自动解锁，需玩家亲临刻录

    buildMonsters(G.map);
    G.fade = opts.noFade ? 0 : 1;
    if (G.started) saveGame(true);

    // 换图时中断进行中的挑战与试炼塔
    if (G.challenge && G.challenge.state === 'running') failChallenge(true);
    try { if (typeof Tower !== 'undefined' && Tower.isActive()) Tower.fail('离开此地'); } catch (e) { }

    // 首次进入 → 触发剧情 CG
    if (!G.seenMaps[mapId] && !opts.noCG && getParam('nocg', '0') !== '1') {
      G.seenMaps[mapId] = true;
      const wasFirst = mapId === 'village' && !G.introShown;
      UI.showCG(mapId, () => {
        if (wasFirst) {
          G.introShown = true;
          setTimeout(() => {
            UI.openDialogue(INTRO_PAGES.slice(), null);
            UI.state.dlgIndex = 0;
          }, 300);
        }
      });
    }
    UI.updateHUD();
  }

  /* ------------------------------ 任务 ------------------------------ */

  /* ------------------------------ 称号 / 等级奖励 ------------------------------ */

  function titleState() {
    if (!saveData.titles) saveData.titles = { unlocked: {}, equipped: null };
    if (!saveData.titles.unlocked) saveData.titles.unlocked = {};
    return saveData.titles;
  }

  function checkTitles() {
    const ts = titleState();
    let changed = false;
    for (const t of TITLES) {
      if (ts.unlocked[t.id]) continue;
      const c = t.cond || {};
      let ok = false;
      if (c.type === 'level') ok = player.level >= c.value;
      else if (c.type === 'kill') ok = (G.totalKills || 0) >= c.value;
      else if (c.type === 'stones') ok = player.stones >= c.value;
      else if (c.type === 'tower') ok = (saveData.towerMax || 0) >= c.value;
      else if (c.type === 'abyss') ok = (saveData.abyssMax || 0) >= c.value;
      else if (c.type === 'contrib') ok = (player.contrib || 0) >= c.value;
      else if (c.type === 'alch') ok = (player.alchCount || 0) >= c.value;
      else if (c.type === 'merge') ok = (player.mergeCount || 0) >= c.value;
      else if (c.type === 'realm') ok = realmIndex(player.level) >= c.value;
      if (!ok) continue;
      ts.unlocked[t.id] = true;
      changed = true;
      UI.toast('获得称号「' + t.name + '」', 'gold');
      Audio2.play('quest');
    }
    if (changed) { persist(); if (UI.renderTitles) UI.renderTitles(); }
  }

  G.getTitles = function () {
    const ts = titleState();
    return TITLES.map((t) => ({
      id: t.id, name: t.name, color: t.color || '#d8d8d8', desc: t.desc,
      unlocked: !!ts.unlocked[t.id], equipped: ts.equipped === t.id,
      cond: t.cond, rare: t.rare || 2, bonus: t.bonus || {}
    }));
  };

  G.equipTitle = function (id) {
    const ts = titleState();
    if (id && !ts.unlocked[id]) return false;
    ts.equipped = (ts.equipped === id) ? null : id;
    persist();
    UI.toast(ts.equipped ? '佩戴称号：' + (TITLES.filter((t) => t.id === ts.equipped)[0] || {}).name : '已卸下称号', 'gold');
    return true;
  };

  G.currentTitle = function () {
    const ts = titleState();
    if (!ts.equipped) return null;
    return TITLES.filter((t) => t.id === ts.equipped)[0] || null;
  };

  function levelRewardState() {
    if (!saveData.levelClaimed) saveData.levelClaimed = {};
    return saveData.levelClaimed;
  }

  G.getLevelRewards = function () {
    const claimed = levelRewardState();
    return LEVEL_REWARDS.map((r) => ({
      lv: r.lv, reward: r,
      canClaim: player.level >= r.lv && !claimed[r.lv],
      claimed: !!claimed[r.lv],
      locked: player.level < r.lv
    }));
  };

  G.claimLevelReward = function (lv) {
    const claimed = levelRewardState();
    if (claimed[lv]) return false;
    const r = LEVEL_REWARDS.filter((x) => x.lv === lv)[0];
    if (!r || player.level < r.lv) return false;
    claimed[lv] = true;
    grantReward(r);
    persist();
    UI.toast('领取 ' + r.lv + ' 级奖励', 'gold');
    Audio2.play('coin');
    return true;
  };

  /* ------------------------------ 任务 ------------------------------ */

  /* ------------------------------ 任务指引 ------------------------------ */

  function questTargetPos() {
    let cur = null;
    for (const id in QUESTS) {
      const sq = questStatus(id);
      if (sq === 'ready') { cur = { q: QUESTS[id], st: sq }; break; }
      if (sq === 'active' && !cur) cur = { q: QUESTS[id], st: sq };
    }
    if (!cur) return null;
    const q = cur.q;
    if (cur.st === 'ready') {
      const npc = (G.map.npcs || []).filter((n) => n.id === q.giver)[0];
      if (npc) return { x: npc.x, y: npc.y, name: npc.def.name };
      const d = NPCS[q.giver];
      return d ? { mapId: d.map, name: d.name } : null;
    }
    for (const o of q.objectives) {
      if (o.type === 'visit' && !objectiveDone(q, o)) {
        const pt = G.map.points ? G.map.points[o.at] : null;
        if (pt) return { x: pt.x, y: pt.y, name: pt.name };
      }
    }
    return null;
  }

  function drawQuestArrow(g) {
    const t = questTargetPos();
    if (!t || t.x === undefined) return;
    const dx = t.x - player.x, dy = t.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 90) return;
    const ang = Math.atan2(dy, dx);
    const r = 56;
    const x = player.x + Math.cos(ang) * r;
    const y = player.y + Math.sin(ang) * r - 14;
    const pulse = 0.55 + Math.sin(G.t * 4) * 0.3;
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,215,120,' + pulse.toFixed(3) + ')';
    g.beginPath();
    g.moveTo(15, 0); g.lineTo(-9, -10); g.lineTo(-2, 0); g.lineTo(-9, 10);
    g.closePath();
    g.fill();
    g.restore();
  }

  function questMarkerOf(npc) {
    for (const qid in QUESTS) {
      if (QUESTS[qid].giver !== npc.id) continue;
      const st = questStatus(qid);
      if (st === 'ready') return '?';
      if (st === 'available') return '!';
      if (st === 'active') return '·';
    }
    return null;
  }

  function questStatus(id) {    const q = QUESTS[id];
    const st = G.questState[id];
    if (st === 'done') return 'done';
    if (st === 'active') {
      const pr = G.questProgress[id] || {};
      for (const o of q.objectives) {
        if (!objectiveDone(q, o)) return 'active';
      }
      return 'ready';
    }
    if (q.prereq && G.questState[q.prereq] !== 'done') return 'locked';
    return 'available';
  }

  function objectiveDone(q, o) {
    const pr = G.questProgress[q.id] || {};
    if (o.type === 'visit') return !!pr.visited;
    if (o.type === 'collect') return bagCount(o.item) >= o.count;
    if (o.type === 'kill') return ((pr.kills || {})[o.monster] || 0) >= o.count;
    return false;
  }

  function objectiveText(q, o) {
    // 容错：只传任务 id 或漏传目标时也不会抛异常
    if (typeof q === 'string') q = QUESTS[q];
    if (!q) return '';
    if (!o) {
      try { return (q.objectives || []).map(function (x) { return objectiveText(q, x); }).join('　'); }
      catch (e) { return ''; }
    }
    const pr = G.questProgress[q.id] || {};
    if (o.type === 'visit') return o.text;
    if (o.type === 'collect') {
      return o.text + '　' + Math.min(bagCount(o.item), o.count) + ' / ' + o.count;
    }
    if (o.type === 'kill') {
      return o.text + '　' + Math.min((pr.kills || {})[o.monster] || 0, o.count) + ' / ' + o.count;
    }
    return o.text;
  }

  function acceptQuest(id) {
    G.questState[id] = 'active';
    G.questProgress[id] = { kills: {}, visited: false };
    UI.toast('接取任务：' + QUESTS[id].name, 'gold');
    saveGame(true);
  }

  /** 剧情推进：有新任务可接时提示去找谁 */
  function checkQuestUnlocks() {
    if (!saveData.announced) saveData.announced = {};
    let changed = false;
    for (const id in QUESTS) {
      if (saveData.announced[id]) continue;
      if (questStatus(id) !== 'available') continue;
      saveData.announced[id] = true;
      changed = true;
      const q = QUESTS[id];
      const npc = NPCS[q.giver];
      if (npc) {
        setTimeout(() => {
          UI.toast('新线索：前往 ' + MAPS[npc.map].name + ' 寻「' + npc.name + '」', 'gold');
          Audio2.play('quest');
        }, changed ? 400 : 0);
      }
      break;    // 一次只提示一个，避免刷屏
    }
    if (changed) persist();
  }

  function completeQuest(id) {
    const q = QUESTS[id];
    G.questState[id] = 'done';
    // 扣除收集类物品
    for (const o of q.objectives) {
      if (o.type === 'collect') removeItem(o.item, o.count);
    }
    const r = q.reward || {};
    if (r.exp) gainExp(r.exp);
    if (r.stones) player.stones += r.stones;
    if (r.items) for (const it of r.items) addItem(it.id, it.n);
    UI.toast('任务完成：' + q.name, 'gold');
    const parts = [];
    if (r.exp) parts.push('修为 +' + r.exp);
    if (r.stones) parts.push('灵石 +' + r.stones);
    if (r.items) for (const it of r.items) parts.push(ITEMS[it.id].name + '×' + it.n);
    if (parts.length) UI.toast('获得 ' + parts.join('、'), 'gold');
    UI.updateHUD();
    saveGame(true);
    // 剧情推进：可能解锁新的线索
    setTimeout(() => { try { checkQuestUnlocks(); } catch (e) { } }, 900);
  }

  /* ------------------------------ 奖励与活动 ------------------------------ */

  function grantReward(r) {
    if (!r) return;
    if (r.exp) gainExp(r.exp);
    if (r.stones) { player.stones += r.stones; Audio2.play('coin'); }
    if (r.items) for (const it of r.items) addItem(it.id, it.n);
    UI.updateHUD();
  }

  G.getCheckinState = function () {
    const d = saveData.checkin || { last: '', day: 0 };
    return { canClaim: d.last !== dateStr(), day: (d.day || 0) % 7, streak: d.day || 0 };
  };

  G.claimCheckin = function () {
    const st = G.getCheckinState();
    if (!st.canClaim) return false;
    const r = CHECKIN_REWARDS[st.day];
    grantReward(r);
    saveData.checkin = { last: dateStr(), day: (st.day + 1) % 7 };
    persist();
    UI.toast('签到成功 · 第 ' + (st.day + 1) + ' 日', 'gold');
    Audio2.play('quest');
    return true;
  };

  G.challengeCooldown = function (id) { return G.challengeCd[id] || 0; };

  function spawnChallengeMonster(forceType) {
    const t = forceType || (Math.random() < 0.62 ? 'wolf' : 'ape');
    const a = Math.random() * 6.283;
    const dist = 150 + Math.random() * 130;
    let x = player.x + Math.cos(a) * dist;
    let y = player.y + Math.sin(a) * dist;
    for (let k = 0; k < 16; k++) {
      if (!G.map.isSolidTile(Math.floor(x / TILE), Math.floor(y / TILE))) break;
      const aa = a + k * 0.4;
      x = player.x + Math.cos(aa) * dist;
      y = player.y + Math.sin(aa) * dist;
    }
    spawnMonster(t, x, y, { x: x, y: y });
    const m = G.monsters[G.monsters.length - 1];
    if (m) m.challenge = true;
    return m;
  }

  function spawnWave() {
    const ch = G.challenge;
    const n = 3 + ch.waveIndex;
    for (let i = 0; i < n; i++) spawnChallengeMonster();
    ch.waveLeft = n;
    ch.waveIndex++;
    UI.toast('第 ' + ch.waveIndex + ' 波妖潮来袭！', 'red');
    Audio2.play('thunder');
  }

  G.startChallenge = function (id) {
    if (G.challenge && G.challenge.state === 'running') { UI.toast('已有挑战正在进行', 'red'); return; }
    if ((G.challengeCd[id] || 0) > 0) { UI.toast('此挑战尚在冷却', 'red'); return; }
    const def = CHALLENGES.filter((c) => c.id === id)[0];
    if (!def) return;
    G.challenge = {
      id: id, def: def, state: 'running',
      timeLeft: id === 'timed' ? 90 : id === 'boss' ? 150 : 200,
      need: id === 'timed' ? 12 : id === 'boss' ? 1 : 3,
      killed: 0, waveLeft: 0, waveIndex: 0
    };
    player.resting = false;
    Audio2.play('quest');
    UI.toast('挑战开始 · ' + def.name, 'gold');
    if (id === 'wave') spawnWave();
    else if (id === 'timed') { for (let i = 0; i < 4; i++) spawnChallengeMonster(); }
    else {
      const m = spawnChallengeMonster('golem');
      if (m) {
        m.hp = Math.round(m.hpMax * 1.8);
        m.hpMax = m.hp;
        m.atk = Math.round(m.atk * 1.25);
        m.size = (m.size || 1) * 1.15;
        m.boss = true;
      }
    }
  };

  function winChallenge() {
    const ch = G.challenge;
    if (!ch) return;
    ch.state = 'won';
    grantReward(ch.def.reward);
    G.challengeCd[ch.id] = ch.def.cd;
    G.flash = 0.55;
    G.flashColor = '255,220,140';
    Audio2.play('levelup');
    UI.toast('挑战完成 · ' + ch.def.name, 'gold');
    const r = ch.def.reward, parts = [];
    if (r.exp) parts.push('修为 +' + r.exp);
    if (r.stones) parts.push('灵石 +' + r.stones);
    if (r.items) for (const it of r.items) parts.push(ITEMS[it.id].name + '×' + it.n);
    if (parts.length) UI.toast('获得 ' + parts.join('、'), 'gold');
    setTimeout(() => { if (G.challenge === ch) G.challenge = null; }, 3200);
  }

  function failChallenge(quiet) {
    const ch = G.challenge;
    if (!ch) return;
    ch.state = 'failed';
    G.challengeCd[ch.id] = Math.round(ch.def.cd * 0.5) || 40;
    for (const m of G.monsters) if (m.challenge) m.dead = true;
    if (!quiet) UI.toast('挑战失败', 'red');
    Audio2.play('uiBack');
    setTimeout(() => { if (G.challenge === ch) G.challenge = null; }, 2200);
  }

  /** 记录当前需要显示血条的首领 */
  function updateBossRef() {
    let best = null, bestD = 1e9;
    for (const m of G.monsters) {
      if (m.dead || !m.boss) continue;
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < 900 && d < bestD) { bestD = d; best = m; }
    }
    G.bossRef = best;
  }

  function updateChallenge(dt) {
    for (const id in G.challengeCd) {
      if (G.challengeCd[id] > 0) G.challengeCd[id] = Math.max(0, G.challengeCd[id] - dt);
    }
    const ch = G.challenge;
    if (!ch || ch.state !== 'running') return;

    ch.timeLeft -= dt;
    const alive = G.monsters.filter((m) => !m.dead && m.challenge).length;

    if (ch.id === 'wave') {
      if (alive === 0) {
        if (ch.waveIndex >= 3) { winChallenge(); return; }
        spawnWave();
      }
    } else if (ch.id === 'timed') {
      if (alive < 2 && ch.killed < ch.need) spawnChallengeMonster();
      if (ch.killed >= ch.need) { winChallenge(); return; }
    } else if (ch.id === 'boss') {
      if (ch.killed >= 1) { winChallenge(); return; }
    }

    if (ch.timeLeft <= 0) failChallenge();
  }

  function checkVisitPoints() {
    if (!G.map.points) return;
    for (const key in G.map.points) {
      const pt = G.map.points[key];
      for (const qid in G.questState) {
        if (G.questState[qid] !== 'active') continue;
        const q = QUESTS[qid];
        for (const o of q.objectives) {
          if (o.type !== 'visit' || o.at !== key) continue;
          const pr = G.questProgress[qid];
          if (pr.visited) continue;
          if (Math.hypot(player.x - pt.x, player.y - pt.y) < o.r) {
            pr.visited = true;
            UI.toast('抵达「' + pt.name + '」', 'blue');
            if (objectiveDone(q, o)) UI.toast('「' + q.name + '」目标已达成，回去复命罢', 'gold');
          }
        }
      }
    }
  }

  /* ------------------------------ 掉落物 ------------------------------ */

  function spawnDrop(x, y, id, n) {
    const a = Math.random() * 6.283;
    const d = 20 + Math.random() * 40;
    G.drops.push({
      kind: 'drop', id: id, n: n || 1,
      x: x, y: y,
      vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 40,
      tx: x + Math.cos(a) * d, ty: y + Math.sin(a) * d,
      life: 45, bob: Math.random() * 6.283, picked: false,
      sortY: y
    });
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.life -= dt;
      if (d.life <= 0) { G.drops.splice(i, 1); continue; }
      // 落地弹跳
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.86; d.vy *= 0.86;
      d.sortY = d.y;
      // 靠近自动拾取（玩家需走过去）
      if (!player.dead && Math.hypot(d.x - player.x, d.y - player.y) < 26) {
        addItem(d.id, d.n);
        Audio2.play('pickup');
        addEffect({
          type: 'dmg', x: d.x, y: d.y - 26, vy: -40,
          text: '+' + ITEMS[d.id].name, color: '#bfe9a0', life: 0.9, maxLife: 0.9
        });
        sparks(d.x, d.y - 10, 5, '#bfe9a0');
        G.drops.splice(i, 1);
      }
    }
  }

  /* ------------------------------ 敌方弹道 / Boss 预警 ------------------------------ */

  function bossSkill(m) {
    const ang = Math.atan2(player.y - m.y, player.x - m.x);
    if (Math.random() < 0.55) {
      G.telegraphs.push({
        type: 'line', x: m.x, y: m.y - 12, angle: ang, len: 460, width: 64,
        t: 0, warn: 0.95, dur: 1.25, dmg: Math.round(m.atk * 1.7), fired: false
      });
    } else {
      G.telegraphs.push({
        type: 'nova', x: m.x, y: m.y, r: 190,
        t: 0, warn: 1.1, dur: 1.4, dmg: Math.round(m.atk * 1.45), fired: false
      });
    }
    Audio2.play('thunder');
    G.shake = Math.max(G.shake, 3);
  }

  function updateEProjs(dt) {
    for (let i = G.eProjs.length - 1; i >= 0; i--) {
      const p = G.eProjs[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { G.eProjs.splice(i, 1); continue; }
      if (G.map.isSolidTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE))) {
        G.eProjs.splice(i, 1);
        continue;
      }
      if (!player.dead && Math.hypot(p.x - player.x, p.y - (player.y - 18)) < 20) {
        damagePlayer(p.dmg, p.x, p.y);
        G.eProjs.splice(i, 1);
      }
    }
  }

  function updateTelegraphs(dt) {
    for (let i = G.telegraphs.length - 1; i >= 0; i--) {
      const tg = G.telegraphs[i];
      tg.t += dt;
      if (!tg.fired && tg.t >= tg.warn) {
        tg.fired = true;
        Audio2.play('thunder');
        G.shake = Math.max(G.shake, 6);
        if (tg.type === 'line') {
          // 线段判定
          const dx = Math.cos(tg.angle), dy = Math.sin(tg.angle);
          const rx = player.x - tg.x, ry = (player.y - 12) - tg.y;
          const proj = rx * dx + ry * dy;
          const perp = Math.abs(rx * dy - ry * dx);
          if (proj > 0 && proj < tg.len && perp < tg.width / 2) {
            damagePlayer(tg.dmg, tg.x, tg.y);
          }
        } else {
          if (Math.hypot(player.x - tg.x, (player.y - 12) - tg.y) < tg.r) {
            damagePlayer(tg.dmg, tg.x, tg.y);
          }
        }
        addEffect({
          type: tg.type === 'line' ? 'streak' : 'shock',
          x: tg.x, y: tg.y,
          r: tg.type === 'line' ? tg.len : tg.r,
          count: 12, life: 0.5, maxLife: 0.5,
          color: 'rgba(255,90,70,', seed: tg.angle
        });
      }
      if (tg.t > tg.dur) G.telegraphs.splice(i, 1);
    }
  }

  /* ------------------------------ 试炼场景切换 ------------------------------ */

  G.enterArena = function (mapObj, spawn) {
    // 只在从外部进入时记录归位点，避免连续登层把场景记成 arena
    if (G.map && G.map.id !== 'arena') {
      G.prevSpot = { id: G.map.id, x: player.x, y: player.y };
    }
    G.map = mapObj;
    G.monsters = []; G.effects = []; G.projectiles = []; G.bursts = [];
    G.drops = []; G.spawnQueue = []; G.eProjs = []; G.telegraphs = [];
    const free = findFreeSpot(spawn.x, spawn.y);
    player.x = free.x; player.y = free.y;
    player.facing = -Math.PI / 2;
    G.cam.x = player.x - viewW / ZOOM / 2;
    G.cam.y = player.y - viewH / ZOOM / 2;
    G.fade = 1;
    UI.updateHUD();
  };

  G.leaveArena = function () {
    const back = G.prevSpot;
    G.eProjs = []; G.telegraphs = [];
    G.prevSpot = null;
    if (back) loadMap(back.id, { x: back.x, y: back.y }, { noCG: true });
    else loadMap('village', null, { noCG: true });
  };

  /* ------------------------------ 交互 ------------------------------ */

  function findInteractable() {
    let best = null, bestD = 1e9;
    // NPC
    for (const n of G.map.npcs) {
      const d = Math.hypot(n.x - player.x, n.y - player.y);
      if (d < 88 && d < bestD) { bestD = d; best = { kind: 'npc', obj: n, text: '与 ' + n.def.name + ' 交谈' }; }
    }
    // 草药
    for (const h of G.map.herbs) {
      const d = Math.hypot(h.x - player.x, h.y - player.y);
      if (d < 62 && d < bestD) { bestD = d; best = { kind: 'herb', obj: h, text: '采集 ' + ITEMS[h.id].name }; }
    }
    // 宝箱
    for (const c of (G.map.chests || [])) {
      if (c.opened) continue;
      const d = Math.hypot(c.x - player.x, c.y - player.y);
      if (d < 64 && d < bestD) { bestD = d; best = { kind: 'chest', obj: c, text: '开启宝箱' }; }
    }
    // 传送石碑 / 古阵
    for (const a of G.map.anchors) {
      const d = Math.hypot(a.x - player.x, a.y - player.y);
      if (d < 110 && d < bestD) {
        bestD = d;
        const bound = G.isSteleBound(G.map.id);
        best = {
          kind: 'anchor', obj: a,
          text: bound ? '使用传送图志' : '刻录传送石碑'
        };
      }
    }
    // 地图出入口
    for (const ex of (G.map.exits || [])) {
      const d = Math.hypot(ex.x - player.x, ex.y - player.y);
      if (d < 96 && d < bestD) {
        bestD = d;
        best = { kind: 'exit', obj: ex, text: '前往 ' + MAPS[ex.to].name };
      }
    }
    // 铁匠铺 / 炼丹炉 / 宗门山门
    for (const o of (G.map.objects || [])) {
      if (o.kind !== 'smithy' && o.kind !== 'cauldron' && o.kind !== 'sectgate') continue;
      const d = Math.hypot(o.x - player.x, o.y - player.y);
      if (d < 96 && d < bestD) {
        bestD = d;
        const txt = o.kind === 'smithy' ? '进入 雷记铁铺'
          : o.kind === 'cauldron' ? '开炉炼丹'
            : '青云宗门';
        best = { kind: o.kind, obj: o, text: txt };
      }
    }
    return best;
  }

  function doInteract() {
    const t = G.interactTarget;
    if (!t) return;
    if (t.kind === 'npc') {
      G.lastNpc = t.obj.id;
      t.obj.talking = true;
      t.obj.moving = false;
      t.obj.facing = Math.atan2(player.y - t.obj.y, player.x - t.obj.x);
      let pages = [];
      try { pages = pagesOf(G, t.obj.id); } catch (e) {
        reportError(e, 'dialogue');
        pages = [{ who: (NPCS[t.obj.id] || {}).name || '', text: '「……」', options: [{ label: '告辞', act: { type: 'close' } }] }];
      }
      UI.openDialogue(pages, t.obj.id);
    } else if (t.kind === 'herb') {
      const h = t.obj;
      addItem(h.id, 1);
      UI.toast('采得 ' + ITEMS[h.id].name, 'blue');
      try { G.dailyAdd && G.dailyAdd('herb', 1); } catch (e) { }
      const idx = G.map.herbs.indexOf(h);
      if (idx >= 0) G.map.herbs.splice(idx, 1);
      sparks(h.x, h.y - 16, 6, '#bfffb0');
      G.interactTarget = null;
    } else if (t.kind === 'anchor') {
      if (!G.isSteleBound(G.map.id)) bindStele();
      else {
        Audio2.play('ui');
        BigMap.open(G.map.id);
      }
    } else if (t.kind === 'exit') {
      openExitDialog(t.obj);
    } else if (t.kind === 'chest') {
      openChest(t.obj);
    } else if (t.kind === 'smithy') {
      Audio2.play('ui');
      if (typeof Smith !== 'undefined') Smith.open();
    } else if (t.kind === 'cauldron') {
      Audio2.play('ui');
      if (typeof Alchemy !== 'undefined') Alchemy.open();
    } else if (t.kind === 'sectgate') {
      Audio2.play('ui');
      if (typeof Sect !== 'undefined') Sect.open();
    }
  }

  /* ------------------------------ 宝箱 ------------------------------ */

  function openChest(c) {
    c.opened = true;
    Audio2.play('coin');
    G.shake = Math.max(G.shake, 3);

    const totalW = CHEST_LOOT.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * totalW;
    let pick = CHEST_LOOT[CHEST_LOOT.length - 1];
    for (const x of CHEST_LOOT) {
      roll -= x.w;
      if (roll <= 0) { pick = x; break; }
    }

    const parts = [];
    if (pick.stones) {
      const n = Math.floor(rand(pick.stones[0], pick.stones[1] + 1));
      player.stones += n;
      parts.push('灵石 +' + n);
    }
    if (pick.exp) {
      gainExp(pick.exp);
      parts.push('修为 +' + pick.exp);
    }
    if (pick.items) {
      for (const it of pick.items) {
        addItem(it.id, it.n);
        parts.push(ITEMS[it.id].name + '×' + it.n);
      }
    }

    addEffect({ type: 'rune', x: c.x, y: c.y, r: 72, life: 0.9, maxLife: 0.9, color: 'rgba(255,220,140,' });
    addEffect({ type: 'ring', x: c.x, y: c.y, r: 62, life: 0.7, maxLife: 0.7, color: 'rgba(255,220,140,' });
    sparks(c.x, c.y - 22, 14, pick.rare ? '#ffe28a' : '#ffd98a');
    addEffect({
      type: 'dmg', x: c.x, y: c.y - 50, vy: -36,
      text: pick.rare ? '珍稀之宝' : '宝箱开启',
      color: pick.rare ? '#ffd24a' : '#ffe9a8',
      big: !!pick.rare, life: 1.2, maxLife: 1.2
    });
    UI.toast('开启宝箱：' + parts.join('、'), pick.rare ? 'gold' : 'blue');
    G.lastChest = { pick: pick, parts: parts };
    saveGame(true);
  }

  /* ------------------------------ 石碑与传送 ------------------------------ */

  G.isSteleBound = function (mapId) {
    return !!G.steles[mapId];
  };

  function bindStele() {
    const a = G.map.anchors[0];
    G.steles[G.map.id] = true;
    saveData.steles = Object.assign({}, G.steles);
    persist();
    Audio2.play('bind');
    G.shake = Math.max(G.shake, 6);
    G.flash = 0.55;
    G.flashColor = '150,220,255';
    addEffect({ type: 'rune', x: a.x, y: a.y - 10, r: 150, life: 1.4, maxLife: 1.4, color: 'rgba(150,225,255,', seed: 0 });
    addEffect({ type: 'ring', x: a.x, y: a.y - 10, r: 130, life: 0.9, maxLife: 0.9, color: 'rgba(150,225,255,' });
    addEffect({ type: 'streak', x: a.x, y: a.y - 30, r: 170, count: 12, life: 0.8, maxLife: 0.8, color: 'rgba(170,230,255,' });
    sparks(a.x, a.y - 40, 16, '#a8e4ff');
    UI.toast('传送石碑已刻录 · ' + G.map.name, 'gold');
    UI.toast('按 ' + keyName(G.keymap.map) + ' 打开传送图志', 'blue');
  }

  function openExitDialog(ex) {
    UI.openDialogue([{
      who: '路引',
      text: '此路通往 ' + MAPS[ex.to].name + '。\n' + (ex.to === 'valley'
        ? '谷中妖狼成群，去时多备丹药。' : '前路凶险，量力而行。'),
      options: [
        { label: '启程前往 ' + MAPS[ex.to].name, act: { type: 'travel', to: ex.to } },
        { label: '暂且留步', act: { type: 'close' } }
      ]
    }], null);
  }

  function openTeleport() {
    BigMap.open(G.map ? G.map.id : 'village');
  }

  function computeEntry(mapId, fromId) {
    const def = MAPS[mapId];
    const back = (def.exits || []).filter((e) => e.to === fromId)[0];
    if (back) return { x: (back.tx + 0.5) * TILE, y: (back.ty + 2.0) * TILE };
    return null;
  }

  function doTravel(mapId, isFast) {
    const from = G.map ? G.map.id : null;
    if (!MAPS[mapId]) return;
    const entry = computeEntry(mapId, from);
    Audio2.play('teleport');
    G.flash = 0;
    G.tranLock = true;

    const col = themeColorOf(mapId);
    const finishToast = () => {
      UI.toast(isFast ? '御阵而至 · ' + MAPS[mapId].name : '抵达 ' + MAPS[mapId].name, 'gold');
    };

    if (typeof TranFx !== 'undefined') {
      TranFx.play(MAPS[mapId].name, col, () => {
        try {
          loadMap(mapId, entry, { from: from, noFade: true });
        } catch (e) { reportError(e, 'travel'); }
      }, () => {
        G.tranLock = false;
        finishToast();
      });
    } else {
      G.fade = 1;
      G.flash = 0.4;
      G.flashColor = col;
      setTimeout(() => {
        loadMap(mapId, entry, { from: from });
        G.tranLock = false;
        finishToast();
      }, 280);
    }
  }

  /** 各主题地图的传送光色 */
  function themeColorOf(mapId) {
    const th = MAPS[mapId] && MAPS[mapId].theme;
    if (th === 'fire') return '255,150,80';
    if (th === 'ice') return '150,225,255';
    if (th === 'dark') return '175,125,255';
    if (th === 'thunder') return '185,205,255';
    if (th === 'void') return '140,235,255';
    return '200,230,255';
  }

  function doTeleport(mapId) { doTravel(mapId, true); }

  G.fastTravel = function (mapId) {
    if (G.travelCd > 0) { UI.toast('传送阵尚在冷却', 'red'); return; }
    if (!G.isSteleBound(mapId)) { UI.toast('目标石碑尚未刻录', 'red'); return; }
    G.travelCd = 2.5;
    doTravel(mapId, true);
  };

  /* ------------------------------ 对话回调 ------------------------------ */

  G.questStatus = questStatus;
  G.objectiveDone = objectiveDone;
  G.objectiveText = objectiveText;

  G.onDialogueAction = function (act) {
    if (act.type === 'accept') {
      acceptQuest(act.quest);
      UI.closeDialogue();
    } else if (act.type === 'complete') {
      completeQuest(act.quest);
      UI.closeDialogue();
    } else if (act.type === 'shop') {
      UI.closeDialogue();
      UI.openShop(act.which);
    } else if (act.type === 'teleport') {
      UI.closeDialogue();
      doTravel(act.map);
    } else if (act.type === 'travel') {
      UI.closeDialogue();
      doTravel(act.to);
    } else if (act.type === 'warStart') {
      UI.closeDialogue();
      try { G.beginSectWar(act.war); } catch (e) { reportError(e, 'warStart'); }
    } else if (act.type === 'arenaStart') {
      UI.closeDialogue();
      try { Tower.begin(); } catch (e) { reportError(e, 'arenaStart'); }
    } else if (act.type === 'arenaQuit') {
      UI.closeDialogue();
      try { Tower.quit(); } catch (e) { reportError(e, 'arenaQuit'); }
    } else if (act.type === 'again') {
      const npc = G.lastNpc;
      UI.closeDialogue();
      setTimeout(() => {
        if (npc) UI.openDialogue(pagesOf(G, npc), npc);
      }, 60);
    } else {
      UI.closeDialogue();
    }
  };

  G.onDialogueClosed = function () {
    if (G.map && G.map.npcs) {
      for (const n of G.map.npcs) {
        if (n.talking) { n.talking = false; n.waitTimer = 1.5; }
      }
    }
  };

  /* 注：doTeleport 已在上面定义（走带过场动画的 doTravel），此处不再重复定义 */

  /* ------------------------------ 商店 ------------------------------ */

  function priceOf(id, q) {
    const def = ITEMS[id];
    if (!def) return 0;
    if (isGearKind(def.kind)) {
      const qq = (typeof q === 'number') ? q : Gear.defQ(id);
      return Math.round(def.price * Gear.qualityMul(id, qq));
    }
    return def.price;
  }

  function sellPriceOf(entry) {
    const def = ITEMS[entry.id];
    if (!def) return 0;
    if (isGearKind(def.kind)) {
      const q = (typeof entry.q === 'number') ? entry.q : Gear.defQ(entry.id);
      const lv = entry.lv || 0;
      return Math.max(1, Math.round((def.sell || 1) * Gear.qualityMul(entry.id, q) * (1 + lv * 0.15)));
    }
    return (def.sell || 1) * (entry.n || 1);
  }

  function buyItem(id) {
    const def = ITEMS[id];
    if (!def) return false;
    const price = priceOf(id);
    if (player.stones < price) { UI.toast('灵石不足', 'red'); return false; }
    if (bagFull()) { UI.toast('行囊已满', 'red'); return false; }
    player.stones -= price;
    addItem(id, 1);
    UI.toast('买入 ' + def.name + '　-' + price, 'gold');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /** 卖出（按格子下标，支持装备实例） */
  function sellBagAt(index, n) {
    const it = player.bag[index];
    if (!it) return false;
    const def = ITEMS[it.id];
    if (!def) return false;
    const cnt = isGearKind(def.kind) ? 1 : Math.max(1, Math.min(n || 1, it.n));
    const gain = Math.round(sellPriceOf({ id: it.id, n: cnt, q: it.q, lv: it.lv }));
    if (cnt >= it.n) player.bag.splice(index, 1);
    else it.n -= cnt;
    player.stones += gain;
    UI.toast('卖出 ' + def.name + '　+' + gain, 'blue');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  function sellItem(id) {
    for (let i = 0; i < player.bag.length; i++) {
      if (player.bag[i].id === id) return sellBagAt(i, 1);
    }
    return false;
  }

  /* ------------------------------ 装备合成 ------------------------------ */

  /**
   * 以 baseIndex 那件为主，吞掉另外 4 件同品质装备，合成高一级品质
   */
  function mergeGear(baseIndex) {
    const base = player.bag[baseIndex];
    if (!base) return false;
    const bd = ITEMS[base.id];
    if (!bd || !isGearKind(bd.kind)) { UI.toast('此物不可合成', 'red'); return false; }
    const q = (typeof base.q === 'number') ? base.q : Gear.defQ(base.id);
    if (q >= MERGE_CFG.maxQ) { UI.toast('已是仙品，无法再合', 'red'); return false; }

    const pick = [];
    for (let i = 0; i < player.bag.length && pick.length < MERGE_CFG.need - 1; i++) {
      if (i === baseIndex) continue;
      const e = player.bag[i];
      const d = ITEMS[e.id];
      if (!d || !isGearKind(d.kind)) continue;
      if (((typeof e.q === 'number') ? e.q : Gear.defQ(e.id)) !== q) continue;
      pick.push(i);
    }
    if (pick.length < MERGE_CFG.need - 1) {
      UI.toast('需 ' + MERGE_CFG.need + ' 件' + Gear.qName(q) + '装备（还差 ' + (MERGE_CFG.need - 1 - pick.length) + ' 件）', 'red');
      return false;
    }
    const fee = Gear.mergeFee(q);
    if (player.stones < fee) { UI.toast('灵石不足（需 ' + fee + '）', 'red'); return false; }

    player.stones -= fee;
    // 从大到小删，避免下标错位
    const all = pick.concat([baseIndex]).sort((a, b) => b - a);
    for (const i of all) player.bag.splice(i, 1);

    const inst = Gear.make(base.id, { q: q + 1, lv: base.lv || 0 });
    player.bag.push(inst);
    player.mergeCount = (player.mergeCount || 0) + 1;
    Audio2.play('levelup');
    UI.toast('合成 ' + bd.name + ' → ' + Gear.qName(q + 1), 'gold');
    checkTitles();
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /* ------------------------------ 铁匠铺：修补 / 升级 ------------------------------ */

  function repairGear(slot) {
    const inst = player.equip[slot];
    if (!inst) return false;
    const need = Gear.repairNeed(inst);
    if (!need) { UI.toast('完好如初，无需修补', 'blue'); return false; }
    if (bagCount(need.mat) < need.matN) {
      UI.toast('材料不足：还需 ' + ITEMS[need.mat].name + ' ×' + (need.matN - bagCount(need.mat)), 'red');
      return false;
    }
    if (player.stones < need.stones) { UI.toast('灵石不足（需 ' + need.stones + '）', 'red'); return false; }
    removeItem(need.mat, need.matN);
    player.stones -= need.stones;
    inst.dur = inst.durMax;
    syncMax();
    Audio2.play('hit');
    UI.toast((ITEMS[inst.id] ? ITEMS[inst.id].name : '装备') + ' 已修补如新', 'gold');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  function upgradeGear(slot) {
    const inst = player.equip[slot];
    if (!inst) return false;
    if (!Gear.canUpgrade(inst)) { UI.toast('已至满级', 'red'); return false; }
    const cost = Gear.upgradeCost(inst);
    if (player.stones < cost) { UI.toast('灵石不足（需 ' + cost + '）', 'red'); return false; }
    player.stones -= cost;
    inst.lv = (inst.lv || 0) + 1;
    syncMax();
    Audio2.play('levelup');
    G.flash = 0.3; G.flashColor = '255,220,150';
    UI.toast((ITEMS[inst.id] ? ITEMS[inst.id].name : '装备') + ' 淬炼至 +' + inst.lv, 'gold');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /* ------------------------------ 属性升级 ------------------------------ */

  function upgradeStat(id) {
    const def = STAT_UP.filter((s) => s.id === id)[0];
    if (!def) return false;
    player.statUp = player.statUp || { atk: 0, hp: 0, def: 0, spd: 0, aspd: 0 };
    const lv = player.statUp[id] || 0;
    if (lv >= STAT_UP_MAX) { UI.toast('已至极限', 'red'); return false; }
    const cost = statUpCost(def, lv);
    if (player.stones < cost) { UI.toast('灵石不足（需 ' + cost + '）', 'red'); return false; }
    player.stones -= cost;
    player.statUp[id] = lv + 1;
    syncMax();
    Audio2.play('levelup');
    UI.toast(def.name.replace(/\s/g, '') + ' 提升至 ' + (lv + 1) + ' 级', 'gold');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /* ------------------------------ 炼丹 ------------------------------ */

  function craftAlchemy(rid) {
    const rc = ALCHEMY.filter((a) => a.id === rid)[0];
    if (!rc) return false;
    for (const nd of rc.need) {
      if (bagCount(nd.id) < nd.n) {
        UI.toast('缺 ' + ITEMS[nd.id].name + ' ×' + (nd.n - bagCount(nd.id)), 'red');
        return false;
      }
    }
    if (bagFull()) { UI.toast('行囊已满', 'red'); return false; }
    if (player.stones < rc.fee) { UI.toast('灵石不足（需 ' + rc.fee + '）', 'red'); return false; }
    for (const nd of rc.need) removeItem(nd.id, nd.n);
    player.stones -= rc.fee;
    player.alchCount = (player.alchCount || 0) + 1;
    try { G.dailyAdd && G.dailyAdd('alch', 1); } catch (e) { }
    // 丹修有加成：小概率多得一枚
    let n = rc.out.n || 1;
    if (player.path === 'alch' && Math.random() < 0.3) n++;
    addItem(rc.out.id, n);
    Audio2.play('cast');
    addEffect({ type: 'ring', x: player.x, y: player.y, r: 70, life: 0.8, maxLife: 0.8, color: 'rgba(160,255,200,' });
    UI.toast('炼成 ' + ITEMS[rc.out.id].name + ' ×' + n, 'gold');
    checkTitles();
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /* ------------------------------ 宗门 ------------------------------ */

  function sectRank() {
    return sectRankOf(player.contrib || 0);
  }

  function sectTaskReady(t) {
    const cd = player.sectTaskCd && player.sectTaskCd[t.id];
    if (!cd) return true;
    return (Date.now() - cd) > (t.cd || 240) * 1000;
  }

  function sectAccept(tid) {
    const t = SECT.tasks.filter((x) => x.id === tid)[0];
    if (!t) return false;
    if (!sectTaskReady(t)) { UI.toast('此任务尚未刷新', 'red'); return false; }
    const pr = player.sectProg || { kill: 0, dungeon: 0, tower: 0 };
    if (t.need.item) {
      if (bagCount(t.need.item) < t.need.n) {
        UI.toast('需上缴 ' + ITEMS[t.need.item].name + ' ×' + t.need.n, 'red');
        return false;
      }
      removeItem(t.need.item, t.need.n);
    } else if (t.need.kill) {
      if ((pr.kill || 0) < t.need.kill) { UI.toast('斩杀数不足（' + (pr.kill || 0) + '/' + t.need.kill + '）', 'red'); return false; }
      pr.kill = (pr.kill || 0) - t.need.kill;
    } else if (t.need.dungeon) {
      if ((pr.dungeon || 0) < t.need.dungeon) { UI.toast('副本踏破次数不足', 'red'); return false; }
      pr.dungeon -= t.need.dungeon;
    } else if (t.need.tower) {
      if ((pr.tower || 0) < t.need.tower) { UI.toast('登塔层数不足', 'red'); return false; }
      pr.tower -= t.need.tower;
    }
    player.contrib = (player.contrib || 0) + (t.reward.contrib || 0);
    player.stones += t.reward.stones || 0;
    player.sectTaskCd = player.sectTaskCd || {};
    player.sectTaskCd[t.id] = Date.now();
    Audio2.play('coin');
    UI.toast('宗门贡献 +' + t.reward.contrib + '　灵石 +' + (t.reward.stones || 0), 'gold');
    checkTitles();
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  function sectBuy(idx) {
    const g = SECT.shop[idx];
    if (!g) return false;
    if ((player.contrib || 0) < g.cost) { UI.toast('宗门贡献不足（需 ' + g.cost + '）', 'red'); return false; }
    if (bagFull()) { UI.toast('行囊已满', 'red'); return false; }
    player.contrib -= g.cost;
    addItem(g.id, g.n || 1);
    Audio2.play('coin');
    UI.toast('兑换 ' + ITEMS[g.id].name + ' ×' + (g.n || 1), 'gold');
    UI.updateHUD();
    saveGame(true);
    return true;
  }

  /* ------------------------------ 副本 / 秘境 ------------------------------ */

  function enterDungeon(id) {
    const dg = (typeof DUNGEONS !== 'undefined') ? DUNGEONS.filter((d) => d.id === id)[0] : null;
    if (!dg) return false;
    if (!MAPS[dg.id]) { UI.toast('此副本尚未开启', 'red'); return false; }
    G.dungeonRun = { id: id, at: Date.now() };
    doTravel(dg.id, true);
    UI.toast('进入副本 · ' + dg.name, 'gold');
    return true;
  }

  function leaveDungeon() {
    G.dungeonRun = null;
    doTravel('village', true);
  }

  function secretState() {
    const s = G.secret || { open: false, left: 0, next: 0 };
    return {
      open: !!s.open,
      left: Math.max(0, Math.ceil(s.left || 0)),
      next: Math.max(0, Math.ceil(s.next || 0)),
      name: SECRET_REALM.name
    };
  }

  function enterSecret() {
    if (!(G.secret && G.secret.open)) { UI.toast('太虚幻境尚未开启', 'red'); return false; }
    doTravel(SECRET_REALM.map, true);
    UI.toast('踏入 ' + SECRET_REALM.name, 'gold');
    return true;
  }

  function updateSecret(dt) {
    if (!G.secret) G.secret = { open: false, left: 0, next: SECRET_REALM.period };
    const s = G.secret;
    if (s.open) {
      s.left -= dt;
      if (s.left <= 0) {
        s.open = false;
        s.next = SECRET_REALM.period;
        UI.toast('太虚幻境已闭合', 'blue');
      }
    } else {
      s.next -= dt;
      if (s.next <= 0) {
        s.open = true;
        s.left = SECRET_REALM.duration;
        UI.toast('太虚幻境开启！限时 ' + SECRET_REALM.duration + ' 秒', 'gold');
        Audio2.play('levelup');
      }
    }
  }

  /* ------------------------------ 手动存档 ------------------------------ */

  function manualSave() {
    if (!G.started) { UI.toast('尚未入世', 'red'); return false; }
    saveGame(false);
    return true;
  }


/* =========================================================================
   每日常规任务（进度 + 领取）
   ========================================================================= */
(function dailySystem() {
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function state() {
    if (!saveData.daily || saveData.daily.date !== todayKey()) {
      saveData.daily = { date: todayKey(), prog: {}, claimed: {} };
      persist();
    }
    return saveData.daily;
  }

  G.dailyAdd = function (key, n) {
    const s = state();
    s.prog[key] = (s.prog[key] || 0) + (n || 1);
    persist();
  };

  G.dailyList = function () {
    const s = state();
    const out = [];
    for (const q of DAILY_QUESTS) {
      let cur = 0, needN = 0, k = '';
      for (const kk in q.need) { k = kk; needN = q.need[kk]; }
      cur = s.prog[k] || 0;
      out.push({
        id: q.id, name: q.name, desc: q.desc, icon: q.icon,
        cur: Math.min(cur, needN), need: needN,
        done: cur >= needN,
        claimed: !!s.claimed[q.id],
        reward: q.reward
      });
    }
    return out;
  };

  G.dailyClaim = function (id) {
    const q = DAILY_QUESTS.filter(function (x) { return x.id === id; })[0];
    if (!q) return false;
    const s = state();
    if (s.claimed[id]) { UI.toast('今日已领', 'blue'); return false; }
    let cur = 0, needN = 0;
    for (const kk in q.need) { needN = q.need[kk]; cur = s.prog[kk] || 0; }
    if (cur < needN) { UI.toast('进度不足', 'red'); return false; }
    s.claimed[id] = true;
    persist();
    grantReward(q.reward);
    Audio2.play('coin');
    UI.toast('每日奖励已领：' + q.name, 'gold');
    UI.updateHUD();
    return true;
  };
})();

/* =========================================================================
   宗门战争：宣战 → 击退对方弟子 → 夺其半数资源
   ========================================================================= */
(function sectWar() {
  function rivalState(id) {
    if (!saveData.sects) saveData.sects = {};
    if (!saveData.sects[id]) {
      const def = (typeof SECT_RIVALS !== 'undefined')
        ? SECT_RIVALS.filter(function (r) { return r.id === id; })[0] : null;
      saveData.sects[id] = {
        wealth: def ? def.wealth : 3000,
        contrib: def ? def.contrib : 400,
        wins: 0,
        lost: 0
      };
    }
    return saveData.sects[id];
  }

  G.sectRivals = function () {
    if (typeof SECT_RIVALS === 'undefined') return [];
    return SECT_RIVALS.map(function (r) {
      const st = rivalState(r.id);
      return {
        id: r.id, name: r.name, color: r.color, desc: r.desc,
        reqLv: r.reqLv, power: r.power,
        wealth: st.wealth, contrib: st.contrib,
        wins: st.wins, lost: st.lost,
        canWar: player.level >= r.reqLv && !(G.war && G.war.active),
        locked: player.level < r.reqLv
      };
    });
  };

  /* 擂台车轮战 */
  function spawnDuelist() {
    const w = G.sectWar;
    if (!w) return;
    if (w.idx >= w.rounds.length) { winSectWar(); return; }
    const type = w.rounds[w.idx];
    const def = MONSTERS[type] || MONSTERS.sect_outer;
    const lv = Math.round(player.level + w.def.power * 2);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const dist = 150;
    let x = player.x + Math.cos(ang) * dist;
    let y = player.y + Math.sin(ang) * dist;
    const m = spawnMonster(type, x, y, { x: x, y: y }, lv);
    if (m) {
      m.war = true;
      m.warId = w.id;
      m.duel = true;
      m.hp = Math.round(m.hpMax * (1 + w.def.power * 0.30));
      m.hpMax = m.hp;
      m.atk = Math.round(m.atk * (1 + w.def.power * 0.22));
      m.facing = Math.PI / 2;
      G.bossRef = null;
    }
    UI.toast('第 ' + (w.idx + 1) + ' / ' + w.rounds.length + ' 场 · ' +
      (def ? def.name : '敌手'), 'gold');
  }

  function winSectWar() {
    const w = G.sectWar;
    if (!w) return;
    const id = w.id;
    const def = w.def;
    const st = rivalState(id);
    const takeW = Math.floor(st.wealth * 0.5);
    const takeC = Math.floor(st.contrib * 0.5);
    st.wealth -= takeW;
    st.contrib -= takeC;
    st.wins = (st.wins || 0) + 1;
    player.stones += takeW;
    player.contrib = (player.contrib || 0) + takeC;
    G.sectWar = null;
    persist();
    Audio2.play('levelup');
    G.flash = 0.6; G.flashColor = '255,225,150';
    G.shake = Math.max(G.shake, 12);
    UI.toast('车轮战全胜！夺 ' + (def ? def.name : '敌宗') + ' 灵石 ' + takeW + '　贡献 ' + takeC, 'gold');
    checkTitles();
    saveGame(true);
    setTimeout(function () {
      try { G.leaveArena(); } catch (e) { }
    }, 1200);
  }

  /* 对决前的剧情 */
  function warCgPages(def, rounds) {
    const name = def ? def.name : '敌宗';
    const col = def ? def.color : '#ff8a5a';
    return [
      {
        who: '旁白',
        text: '你踏上青云宗山门前的石阶时，' + name + '的人已经在等了。\n' +
          '对方为首的是一名执事，身后跟着一串弟子，衣袍上还沾着别的战场的尘。'
      },
      {
        who: name + '执事',
        text: '「青云宗的小辈，也敢接这道战书。」\n' +
          '他把刀往地上一顿，石阶裂了一道缝，「今日车轮战 —— 我门下弟子一个个上，你能站到第几个？」'
      },
      {
        who: '旁白',
        text: '擂台四角已经立起，风把幡旗吹得笔直。\n' +
          '（共 ' + (rounds ? rounds.length : 0) + ' 场车轮战，击倒一人立刻换下一人。全胜可夺对方半数资源。）',
        options: [
          { label: '踏 上 擂 台', act: { type: 'warStart', war: def ? def.id : null }, primary: true },
          { label: '暂 且 退 下', act: { type: 'close' } }
        ]
      }
    ];
  }
  G.declareWar = function (id) {
    if (G.sectWar) { UI.toast('一场对决尚未结束', 'red'); return false; }
    if (typeof SECT_RIVALS === 'undefined') return false;
    const def = SECT_RIVALS.filter(function (r) { return r.id === id; })[0];
    if (!def) return false;
    if (player.level < def.reqLv) {
      UI.toast('境界不足，需 ' + def.reqLv + ' 级方可宣战', 'red');
      return false;
    }
    if (G.map && G.map.id === 'arena') { UI.toast('此地不宜开战', 'red'); return false; }

    const rounds = (typeof sectWarRounds === 'function')
      ? sectWarRounds(def.power) : ['sect_outer', 'sect_inner', 'sect_elder'];
    G.pendingWar = { id: id, def: def, rounds: rounds };
    try { UI.openDialogue(warCgPages(def, rounds), null); } catch (e) { }
    return true;
  };

  /* 剧情点「踏上擂台」后真正开打 */
  G.beginSectWar = function (id) {
    const pending = G.pendingWar;
    if (!pending || (id && pending.id !== id)) return false;
    const def = pending.def;
    const rounds = pending.rounds;
    G.pendingWar = null;
    G.sectWar = { id: pending.id, def: def, rounds: rounds, idx: 0, killed: 0 };

    let map;
    try {
      map = buildArena('sect', Math.round(def.power * 10));
    } catch (e) { G.sectWar = null; UI.toast('擂台搭建失败', 'red'); return false; }

    G.prevSpot = { id: G.map.id, x: player.x, y: player.y };
    G.enterArena(map, map.spawn);
    player.hp = player.hpMax;
    player.qi = player.qiMax;
    Audio2.play('teleport');
    UI.toast('踏入擂台 · 与 ' + def.name + ' 车轮对决（共 ' + rounds.length + ' 场）', 'gold');
    setTimeout(spawnDuelist, 420);
    return true;
  };

  G.sectWarState = function () {
    if (!G.sectWar) return null;
    const w = G.sectWar;
    return {
      name: w.def ? w.def.name : '敌宗',
      idx: Math.min(w.idx + 1, w.rounds.length),
      total: w.rounds.length,
      cur: (MONSTERS[w.rounds[w.idx]] || {}).name || '敌手'
    };
  };
  /* 每次击倒对手就换下一位（车轮战） */
  G.onWarKill = function (m) {
    const w = G.sectWar;
    if (!w || !m || m.warId !== w.id) return;
    w.killed++;
    w.idx++;
    if (w.idx >= w.rounds.length) { winSectWar(); return; }
    UI.toast('击倒对手，下一位上场', 'blue');
    setTimeout(spawnDuelist, 700);
  };})();
  /* ------------------------------ 对外接口（供 UI 调用） ------------------------------ */

  G.totalStats = totalStats;
  G.attackInterval = attackInterval;
  G.breakthrough = breakthrough;
  G.isBottleneck = function () { return !!player.bottleneck; };
  G.breakCost = function () { return breakRequirement().stones; };
  G.breakReq = function () { return breakRequirement(); };
  G.realmInfo = function () {
    return {
      index: realmIndex(player.level),
      name: REALMS[realmIndex(player.level)],
      desc: REALM_DESC[realmIndex(player.level)],
      color: REALM_COLOR[realmIndex(player.level)],
      layer: realmLayer(player.level),
      maxLevel: MAX_LEVEL,
      bottleneck: !!player.bottleneck,
      need: expNeed(player.level)
    };
  };
  G.getRoot = function () { return player.root; };
  G.setRoot = function (r) { player.root = r || null; syncMax(); };
  G.useItem = useItem;
  G.equipItem = equipItem;
  G.unequip = unequip;
  G.buyItem = buyItem;
  G.sellItem = sellItem;
  G.sellBagAt = sellBagAt;
  G.sellPriceOf = sellPriceOf;
  G.priceOf = priceOf;
  G.mergeGear = mergeGear;
  G.repairGear = repairGear;
  G.upgradeGear = upgradeGear;
  G.upgradeStat = upgradeStat;
  G.craftAlchemy = craftAlchemy;
  G.sectRank = sectRank;
  G.sectTaskReady = sectTaskReady;
  G.sectAccept = sectAccept;
  G.sectBuy = sectBuy;
  G.enterDungeon = enterDungeon;
  G.leaveDungeon = leaveDungeon;
  G.secretState = secretState;
  G.enterSecret = enterSecret;
  G.manualSave = manualSave;
  G.addBuff = addBuff;
  G.gainLevels = gainLevels;
  G.bagSlots = BAG_SLOTS;
  G.bagCount = bagCount;
  G.addItem = addItem;
  G.removeItem = removeItem;
  G.removeBagAt = removeBagAt;
  G.gainExp = gainExp;
  G.castSkill = castSkill;
  G.tryBasicAttack = tryBasicAttack;
  G.tryDodge = tryDodge;
  G.doInteract = function () { doInteract(); };
  G.toggleRest = toggleRest;
  G.spawnMonsterPublic = spawnMonster;
  G.openChest = openChest;
  G.saveNow = function (silent) { saveGame(silent); };

  /* ------------------------------ 时钟 ------------------------------ */

  const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  function timeOfDay() { return (G.t / DAY_LEN) % 1; }
  G.clockText = function () {
    const tod = timeOfDay();
    const idx = Math.floor(((tod + 1 / 24) % 1) * 12) % 12;
    return SHICHEN[idx] + '时';
  };

  function lightInfo(tod) {
    const d = Math.abs(tod - 0.5) * 2;
    const night = clamp((d - 0.42) / 0.38, 0, 1);
    const dusk = clamp(1 - Math.abs(d - 0.62) / 0.16, 0, 1);
    return { night, dusk };
  }

  /* ------------------------------ 输入 ------------------------------ */

  const PREVENT_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  window.addEventListener('keydown', (e) => {
    Audio2.unlock();
    if (PREVENT_KEYS.indexOf(e.code) >= 0) e.preventDefault();

    // 改键监听优先
    if (Menu.isOpen() && Menu.isListening()) {
      if (Menu.handleKey(e)) { e.preventDefault(); return; }
    }
    if (e.repeat) return;
    G.keys.add(e.code);
    if (G.tranLock) return;

    const action = actionOf(e.code);

    if (!G.ready || !G.started) return;
    if (UI.cgOpen()) {
      if (action === 'interact' || action === 'rest' || e.code === 'Enter') UI.nextCG(true);
      return;
    }
    if (BigMap.isOpen()) {
      if (action === 'map' || action === 'menu') BigMap.close();
      return;
    }
    if (Menu.isOpen()) {
      if (action === 'menu') Menu.close();
      return;
    }
    if (UI.modalOpen()) {
      if (action === 'bag') UI.closeBag();
      if (action === 'quest') UI.closeQuests();
      return;
    }
    if (player.dead) return;

    switch (action) {
      case 'attack': tryBasicAttack(); break;
      case 'skill1': if (player.skills[0]) castSkill(player.skills[0]); break;
      case 'skill2': if (player.skills[1]) castSkill(player.skills[1]); break;
      case 'ult': if (player.skills[2]) castSkill(player.skills[2]); break;
      case 'interact': doInteract(); break;
      case 'bag': UI.openBag(); break;
      case 'quest': UI.openQuests(); break;
      case 'map': BigMap.open(G.map.id); break;
      case 'menu': Menu.open('settings'); break;
      case 'rest': toggleRest(); break;
      case 'dodge': tryDodge(); break;
      default: break;
    }
  });

  window.addEventListener('keyup', (e) => G.keys.delete(e.code));
  window.addEventListener('blur', () => G.keys.clear());

  function toggleRest() {
    player.resting = !player.resting;
    if (player.resting) {
      UI.toast('盘膝调息……（再按一次起身）');
      Audio2.play('heal');
    } else {
      Audio2.play('uiBack');
    }
  }

  function tryDodge() {
    if (player.dodgeCd > 0 || player.dead) return;
    if (player.qi < 10) { UI.toast('灵力不足', 'red'); return; }
    let ix = 0, iy = 0;
    if (G.keys.has(G.keymap.left)) ix -= 1;
    if (G.keys.has(G.keymap.right)) ix += 1;
    if (G.keys.has(G.keymap.up)) iy -= 1;
    if (G.keys.has(G.keymap.down)) iy += 1;
    const ang = (ix || iy) ? Math.atan2(iy, ix) : player.facing;
    player.dodgeDir = ang;
    player.dodgeTimer = 0.22;
    player.dodgeCd = 0.65;
    player.invuln = Math.max(player.invuln, 0.3);
    player.qi -= 10;
    player.facing = ang;
    player.resting = false;
    addEffect({
      type: 'ring', x: player.x, y: player.y, r: 34,
      life: 0.3, maxLife: 0.3, color: 'rgba(200,230,255,'
    });
  }

  /* ------------------------------ 尺寸 ------------------------------ */


  /* ------------------------------ 通关 ------------------------------ */

  function checkGameClear() {
    if (player.level < MAX_LEVEL) return false;
    if (player.exp < expNeed(MAX_LEVEL)) return false;
    if (G.cleared) return false;
    G.cleared = true;
    saveData.clears = (saveData.clears || 0) + 1;
    persist();
    Audio2.play('levelup');
    G.flash = 0.8; G.flashColor = '255,245,200';
    showClearPanel();
    saveGame(true);
    return true;
  }

  G.getClearCount = function () {
    try { return saveData.clears || 0; } catch (e) { return 0; }
  };

  function showClearPanel() {
    const panel = document.getElementById('clearPanel');
    if (!panel) return;
    const num = document.getElementById('clearNum');
    if (num) num.textContent = saveData.clears || 1;
    const st = document.getElementById('clearStats');
    if (st) {
      let tmax = 0, amax = 0;
      try { tmax = Tower.allTimeMax ? Tower.allTimeMax() : 0; } catch (e) { }
      try { amax = Tower.maxFloor('abyss'); } catch (e) { }
      st.innerHTML =
        '<span>流派 <b>' + (PATHS[player.path] ? PATHS[player.path].name : '—') + '</b></span>' +
        '<span>灵根 <b>' + (player.root ? player.root.name : '未测') + '</b></span>' +
        '<span>灵石 <b>' + player.stones + '</b></span>' +
        '<span>试炼塔 <b>' + tmax + ' 层</b></span>' +
        '<span>深渊 <b>' + amax + ' 层</b></span>' +
        '<span>宗门贡献 <b>' + (player.contrib || 0) + '</b></span>';
    }
    panel.classList.remove('hidden');
    try { if (UI.setOverlay) UI.setOverlay(true); } catch (e) { }
  }

  G.reincarnate = function () {
    saveData.player = null;
    if (saveData.auth) saveData.auth.charId = null;
    persist();
    location.reload();
  };
  /* ------------------------------ 手机横屏 ------------------------------ */

  let rotateSkipped = false;

  function isTouchUI() {
    try {
      if (typeof Touch !== 'undefined' && Touch.isEnabled && Touch.isEnabled()) return true;
      if (typeof navigator === 'undefined') return false;
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    } catch (e) { return false; }
  }

  function inPortrait() {
    try {
      if (typeof window === 'undefined') return false;
      if (window.matchMedia) {
        return window.matchMedia('(orientation: portrait)').matches;
      }
      return window.innerHeight > window.innerWidth;
    } catch (e) { return false; }
  }

  /** 竖屏且是触屏设备时，提示玩家把手机横过来 */
  function updateRotateHint() {
    const box = document.getElementById('rotateHint');
    if (!box) return;
    const show = isTouchUI() && inPortrait() && !rotateSkipped;
    if (show) box.classList.remove('hidden');
    else box.classList.add('hidden');
  }

  /** 尝试进入全屏并锁定横屏（必须由用户手势触发） */
  function tryLockLandscape() {
    try {
      const el = document.documentElement;
      if (el && el.requestFullscreen && !document.fullscreenElement) {
        const p = el.requestFullscreen();
        if (p && p.then) {
          p.then(() => {
            try {
              if (screen && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(function () { });
              }
            } catch (e) { }
          }).catch(function () { });
        }
      } else if (screen && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function () { });
      }
    } catch (e) { }
    UI.toast('若仍为竖屏，请手动旋转手机', 'blue');
    setTimeout(updateRotateHint, 600);
  }

  window.addEventListener('resize', updateRotateHint);
  window.addEventListener('orientationchange', function () {
    setTimeout(updateRotateHint, 260);
  });
  const rotLockBtn = document.getElementById('rotLock');
  if (rotLockBtn) {
    rotLockBtn.addEventListener('click', function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      try { Audio2.unlock(); } catch (e) { }
      tryLockLandscape();
    });
  }
  const rotSkipBtn = document.getElementById('rotSkip');
  if (rotSkipBtn) {
    rotSkipBtn.addEventListener('click', function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      rotateSkipped = true;
      updateRotateHint();
    });
  }

  G.updateRotateHint = updateRotateHint;
  G.tryLockLandscape = tryLockLandscape;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * DPR);
    canvas.height = Math.floor(viewH * DPR);
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    UI.resizeCG();
  }
  window.addEventListener('resize', resize);

  /* ------------------------------ 更新 ------------------------------ */

  function update(dt) {
    G.t += dt;
    G.playTime = (G.playTime || 0) + dt;
    if (G.fade > 0) G.fade = Math.max(0, G.fade - dt * 1.6);
    G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.zoomPulse > 0) G.zoomPulse = Math.max(0, G.zoomPulse - dt * 2.6);
    if (G.travelCd > 0) G.travelCd = Math.max(0, G.travelCd - dt);

    if (G.slowMoTimer > 0) {
      G.slowMoTimer -= dt;
      dt *= 0.45;                    // 绝招命中瞬间的短暂慢镜
    }

    if (UI.modalOpen() || BigMap.isOpen() || Menu.isOpen()) {
      updateEffects(dt * 0.35);
      return;
    }

    const keys = G.keys;
    let ix = 0, iy = 0;
    const tv = (typeof Touch !== 'undefined') ? Touch.vector() : null;
    if (tv) {
      ix = tv.x; iy = tv.y;
    } else {
      if (keys.has(G.keymap.left)) ix -= 1;
      if (keys.has(G.keymap.right)) ix += 1;
      if (keys.has(G.keymap.up)) iy -= 1;
      if (keys.has(G.keymap.down)) iy += 1;
    }
    const inputMag = Math.min(1, Math.hypot(ix, iy));
    const wantMove = ix !== 0 || iy !== 0;
    if (wantMove) player.resting = false;

    const st = totalStats();

    // 攻击/闪身计时
    player.attackTimer = Math.max(0, player.attackTimer - dt);
    player.attackCd = Math.max(0, (player.attackCd || 0) - dt);
    player.comboTimer = Math.max(0, player.comboTimer - dt);
    if (player.comboTimer <= 0) player.combo = 0;
    player.invuln = Math.max(0, player.invuln - dt);
    player.hurtFlash = Math.max(0, player.hurtFlash - dt);
    player.dodgeCd = Math.max(0, player.dodgeCd - dt);
    updateBuffs(dt);
    // 饰品缓慢磨损
    if (!player.dead) wearEquip('charm', dt * 0.04);
    // 传送锁自愈：过场已经不在跑就必须解锁，避免卡住操作
    if (G.tranLock && (typeof TranFx === 'undefined' || !TranFx.isPlaying())) G.tranLock = false;

    // 冷却
    for (const k in G.cooldowns) {
      if (G.cooldowns[k] > 0) G.cooldowns[k] = Math.max(0, G.cooldowns[k] - dt);
    }

    // 闪身位移
    if (player.dodgeTimer > 0) {
      player.dodgeTimer -= dt;
      const sp = 420 * dt;
      const nx = player.x + Math.cos(player.dodgeDir) * sp;
      const ny = player.y + Math.sin(player.dodgeDir) * sp;
      if (canStand(nx, player.y)) player.x = nx;
      if (canStand(player.x, ny)) player.y = ny;
      addEffect({
        type: 'spark', x: player.x, y: player.y - 20,
        vx: 0, vy: 0, r: 7, color: 'rgba(180,225,255,0.5)',
        life: 0.22, maxLife: 0.22
      });
      if (Math.random() < 0.55) {
        G.effects.push({
          type: 'after', x: player.x, y: player.y,
          life: 0.24, maxLife: 0.24, figure: playerFigureOpts()
        });
      }
    } else if (wantMove && !player.dead && !player.resting) {
      const len = Math.hypot(ix, iy);
      const dx = ix / len, dy = iy / len;
      player.facing = angleLerp(player.facing, Math.atan2(dy, dx), Math.min(1, dt * 16));
      const speed = st.speed * (player.attackTimer > 0 ? 0.45 : 1) * inputMag;
      const nx = player.x + dx * speed * dt;
      if (canStand(nx, player.y)) player.x = nx;
      const ny = player.y + dy * speed * dt;
      if (canStand(player.x, ny)) player.y = ny;
      player.phase = (player.phase + dt * 2.0) % 1;
      player.moving = true;
    } else {
      player.moving = false;
      player.phase = 0;
    }

    player.x = clamp(player.x, PLAYER_R, G.map.cols * TILE - PLAYER_R);
    player.y = clamp(player.y, PLAYER_R, G.map.rows * TILE - PLAYER_R);
    player.sortY = player.y;

    // 灵力与气血恢复
    let qiRegen = st.qiRegen;
    if (player.resting) qiRegen += 14;
    player.qi = clamp(player.qi + qiRegen * dt, 0, player.qiMax);
    if (player.resting) {
      player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.05 * dt);
    }
    if (player.path === 'alch') {
      player.healTimer -= dt;
      if (player.healTimer <= 0) {
        player.healTimer = 8;
        player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.04);
      }
    }

    // 怪物与战斗
    if (!player.dead) {
      updateMonsters(dt);
      updateProjectiles(dt);
      updateEProjs(dt);
      updateTelegraphs(dt);
      updateBursts(dt);
      updateDrops(dt);
      updateNpcs(dt);
      checkVisitPoints();
      updateChallenge(dt);
      try { Tower.tick(dt); } catch (e) { reportError(e, 'tower'); }
      updateSecret(dt);
      updateBossRef();
    } else {
      updateMonsters(dt * 0.3);
      updateChallenge(dt);
    }

    updateEffects(dt);
    updatePetals(dt);
    updateCamera(dt);

    // 交互目标
    G.interactTarget = player.dead ? null : findInteractable();
    if (G.interactTarget) {
      const t = G.interactTarget;
      const sx = (t.obj.x - G.cam.x) * ZOOM;
      const sy = (t.obj.y - G.cam.y) * ZOOM - 52;
      UI.showInteract(t.text, sx, sy);
    } else {
      UI.hideInteract();
    }
    if (typeof Touch !== 'undefined' && Touch.isEnabled()) {
      Touch.setInteract(!!G.interactTarget);
    }
  }

  function updateEffects(dt) {
    for (let i = G.effects.length - 1; i >= 0; i--) {
      const e = G.effects[i];
      e.life -= dt;
      if (e.vy) e.y += e.vy * dt;
      if (e.vx) e.x += e.vx * dt;
      if (e.type === 'spark' || e.type === 'shard') {
        e.vy += 260 * dt;
        if (e.rot !== undefined) e.rot += dt * 7;
      }
      if (e.life <= 0) G.effects.splice(i, 1);
    }
  }

  function updateCamera(dt) {
    const viewWr = viewW / ZOOM, viewHr = viewH / ZOOM;
    const tx = clamp(player.x - viewWr / 2, 0, Math.max(0, G.map.cols * TILE - viewWr));
    const ty = clamp(player.y - viewHr / 2, 0, Math.max(0, G.map.rows * TILE - viewHr));
    const k = Math.min(1, dt * 6.5);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
  }

  function updatePetals(dt) {
    for (const p of petals) {
      p.x += (p.vx + Math.sin(G.t * 0.9 + p.rot) * 12) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.x > player.x + 900) p.x -= 1800;
      if (p.x < player.x - 900) p.x += 1800;
      if (p.y > player.y + 620) { p.y -= 1240; p.x = player.x + (Math.random() - 0.5) * 1600; }
      if (p.y < player.y - 620) p.y += 1240;
    }
  }

  /* ------------------------------ 渲染 ------------------------------ */

  function render() {
    const g = ctx;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, viewW, viewH);

    const cam = G.cam;
    const viewWr = viewW / ZOOM, viewHr = viewH / ZOOM;

    let shakeX = 0, shakeY = 0;
    if (G.shake > 0.2) {
      shakeX = (Math.random() - 0.5) * G.shake;
      shakeY = (Math.random() - 0.5) * G.shake;
    }

    const zoom = ZOOM * (1 + G.zoomPulse * 0.05);
    g.save();
    g.scale(zoom, zoom);
    g.translate(-cam.x + shakeX, -cam.y + shakeY);

    const x0 = Math.floor(cam.x / TILE) - 1;
    const y0 = Math.floor(cam.y / TILE) - 1;
    const x1 = Math.ceil((cam.x + viewWr) / TILE) + 1;
    const y1 = Math.ceil((cam.y + viewHr) / TILE) + 1;

    drawTerrain(g, G.map, x0, y0, x1, y1, G.t);
    drawDecals(g, G.map, G.t);
    // 地图主题色（冰 / 火 / 暗 / 雷 / 虚空）
    try {
      if (typeof drawMapTheme === 'function') {
        drawMapTheme(g, G.map, cam, viewWr, viewHr, G.t);
      }
    } catch (e) { }

    // 汇总可见对象
    const list = [];
    const cullL = cam.x - 320, cullR = cam.x + viewWr + 320;
    const cullT = cam.y - 460, cullB = cam.y + viewHr + 240;

    for (const o of G.map.objects) {
      if (o.x < cullL || o.x > cullR || o.sortY < cullT || o.sortY > cullB) continue;
      list.push(o);
    }
    for (const n of G.map.npcs) {
      if (n.x < cullL || n.x > cullR || n.sortY < cullT || n.sortY > cullB) continue;
      list.push(n);
    }
    for (const h of G.map.herbs) {
      if (h.x < cullL || h.x > cullR || h.sortY < cullT || h.sortY > cullB) continue;
      list.push(h);
    }
    for (const c of (G.map.chests || [])) {
      if (c.x < cullL || c.x > cullR || c.sortY < cullT || c.sortY > cullB) continue;
      list.push(c);
    }
    for (const m of G.monsters) {
      if (m.dead) continue;
      if (m.x < cullL || m.x > cullR || m.y < cullT || m.y > cullB) continue;
      list.push(m);
    }
    for (const d of G.drops) {
      if (d.x < cullL || d.x > cullR || d.sortY < cullT || d.sortY > cullB) continue;
      list.push(d);
    }

    if (!player.dead) {
      list.push({ __player: true, sortY: player.y });
    }
    list.sort((a, b) => a.sortY - b.sortY);

    for (const o of list) {
      if (o.__player) {
        drawPlayer(g);
      } else if (o.kind === 'monster') {
        drawMonster(g, o, G.t);
        drawMonsterHp(g, o);
      } else {
        if (o.kind === 'stele') o.bound = G.isSteleBound(o.mapId);
        drawObject(g, o, G.t);
        if (o.kind === 'npc') {
          drawNpcTag(g, o, G.t, { marker: questMarkerOf(o) });
        }
      }
    }

    // 交互光标
    if (G.interactTarget && !player.dead) {
      drawCursor3D(g, G.interactTarget.obj.x, G.interactTarget.obj.y - 10, G.t,
        G.interactTarget.kind === 'anchor' && G.isSteleBound(G.map.id)
          ? 'rgba(150,225,255,' : 'rgba(255,225,140,');
    }

    // 称号悬浮于头顶（金属小徽牌）
    try {
      const ti = G.currentTitle();
      if (ti && !player.dead) {
        drawTitlePlaque(g, player.x, player.y - 70, ti, G.t);
      }
    } catch (e) { }

    // 任务指引箭头
    try { drawQuestArrow(g); } catch (e) { }

    drawEffects2(g, G.effects, G.t);
    if (typeof drawTelegraphs === 'function') drawTelegraphs(g, G.telegraphs, G.t);
    if (typeof drawEnemyProjs === 'function') drawEnemyProjs(g, G.eProjs);
    drawPetals(g, petals);

    g.restore();

    // 云雾层（营造仙气）
    try {
      if (typeof drawCloudShadow === 'function') drawCloudShadow(g, cam, viewW, viewH, G.t, 0.07);
      if (typeof drawMist === 'function') drawMist(g, cam, viewW, viewH, G.t, 0.085);
    } catch (e) { }

    // 昼夜
    const tod = timeOfDay();
    const L = lightInfo(tod);
    if (L.night > 0.01) {
      g.fillStyle = 'rgba(14, 24, 58, ' + (0.56 * L.night).toFixed(3) + ')';
      g.fillRect(0, 0, viewW, viewH);
    }
    if (L.dusk > 0.01) {
      g.fillStyle = 'rgba(255, 138, 72, ' + (0.16 * L.dusk).toFixed(3) + ')';
      g.fillRect(0, 0, viewW, viewH);
    }
    if (player.hurtFlash > 0) {
      g.fillStyle = 'rgba(190, 40, 30, ' + (0.22 * player.hurtFlash / 0.25).toFixed(3) + ')';
      g.fillRect(0, 0, viewW, viewH);
    }
    if (G.flash > 0.005) {
      g.fillStyle = 'rgba(' + G.flashColor + ',' + (0.55 * G.flash).toFixed(3) + ')';
      g.fillRect(0, 0, viewW, viewH);
    }

    // 暗角
    const vg = g.createRadialGradient(viewW / 2, viewH / 2, Math.min(viewW, viewH) * 0.34,
      viewW / 2, viewH / 2, Math.max(viewW, viewH) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    g.fillStyle = vg;
    g.fillRect(0, 0, viewW, viewH);

    // 渐变黑幕
    if (G.fade > 0.001) {
      g.fillStyle = 'rgba(0,0,0,' + G.fade.toFixed(3) + ')';
      g.fillRect(0, 0, viewW, viewH);
    }

    drawMinimap();
  }

  function playerFigureOpts() {
    const P = PATHS[player.path];
    const L = player.look || {};
    let robe = L.robe || P.robe;
    let robeDark = L.robeDark || P.robeDark;
    let accent = L.accent || P.accent;

    // 穿了服饰则以外观为准
    const cloth = player.equip.cloth;
    if (cloth && ITEMS[cloth.id]) {
      const cd = ITEMS[cloth.id];
      if (cd.robe) robe = cd.robe;
      if (cd.robeDark) robeDark = cd.robeDark;
      if (cd.accent) accent = cd.accent;
    }

    return {
      t: G.t, facing: player.facing, moving: player.moving, phase: player.phase,
      robe: robe, robeDark: robeDark,
      accent: accent, sash: P.sash,
      hair: L.hair || P.hair, glow: P.glow, weapon: P.weapon,
      eye: L.eye || null,
      spriteKey: 'p_' + player.path,
      flash: player.hurtFlash > 0 ? player.hurtFlash * 1.6 : 0,
      palette: { glow: P.glow }
    };
  }

  function drawPlayer(g) {
    const P = PATHS[player.path];
    const atk = player.attackTimer > 0
      ? 1 - player.attackTimer / (player.attackIndex === 2 ? 0.34 : 0.3)
      : 0;

    g.save();
    if (player.invuln > 0 && player.dodgeTimer > 0) g.globalAlpha = 0.6;

    if (player.resting) {
      g.save();
      g.translate(player.x, player.y);
      const pulse = 0.4 + Math.sin(G.t * 2.4) * 0.18;
      g.strokeStyle = 'rgba(150,220,255,' + pulse.toFixed(3) + ')';
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(0, 0, 24, 10, 0, 0, 6.283); g.stroke();
      for (let k = 0; k < 4; k++) {
        const a = G.t * 1.2 + k * 1.57;
        g.fillStyle = 'rgba(190,240,255,0.85)';
        g.beginPath();
        g.arc(Math.cos(a) * 20, Math.sin(a) * 8, 2, 0, 6.283);
        g.fill();
      }
      g.restore();
      g.translate(player.x, player.y + 3);
      g.scale(0.94, 0.84);
      drawFigure(g, 0, 0, Object.assign(playerFigureOpts(), { moving: false, phase: 0 }));
    } else {
      const opts = Object.assign(playerFigureOpts(), { attack: atk });
      drawFigure2(g, player.x, player.y, opts);
    }
    g.restore();
  }

  function drawMonsterHp(g, m) {
    const w = (m.boss ? 62 : 34) * (m.size || 1);
    const x = m.x - w / 2;
    const y = m.y - (m.boss ? 62 : 52) * (m.size || 1);

    // 等级（头顶）
    if (m.lv) {
      g.save();
      g.font = (m.boss ? 12 : 10) + 'px "STKaiti","KaiTi",serif';
      g.textAlign = 'center';
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(6,10,16,0.8)';
      const lvTxt = 'Lv.' + m.lv;
      g.strokeText(lvTxt, m.x, y - 5);
      g.fillStyle = m.boss ? '#ff8a6a' : (m.lv >= 10 ? '#ffb0a0' : '#cfc3a2');
      g.fillText(lvTxt, m.x, y - 5);
      g.restore();
    }

    // 首领名字
    if (m.boss) {
      const nm = (MONSTERS[m.type] || {}).name || '首领';
      g.save();
      g.font = '13px "STKaiti","KaiTi",serif';
      g.textAlign = 'center';
      g.lineWidth = 3.5;
      g.strokeStyle = 'rgba(6,10,16,0.85)';
      g.strokeText(nm, m.x, y - 20);
      g.fillStyle = '#ffd8a0';
      g.fillText(nm, m.x, y - 20);
      g.restore();
    }

    if (m.hp >= m.hpMax && !m.boss) return;

    const hh = m.boss ? 6 : 3;
    g.fillStyle = 'rgba(0,0,0,0.62)';
    g.fillRect(x - 1, y - 1, w + 2, hh + 2);
    const grd = g.createLinearGradient(x, 0, x + w, 0);
    if (m.boss) {
      grd.addColorStop(0, '#ff8a3a');
      grd.addColorStop(1, '#c2382f');
    } else {
      grd.addColorStop(0, '#e0554a');
      grd.addColorStop(1, '#c2382f');
    }
    g.fillStyle = grd;
    g.fillRect(x, y, w * Math.max(0, m.hp / m.hpMax), hh);
    g.strokeStyle = m.boss ? 'rgba(255,180,120,0.7)' : 'rgba(255,220,160,0.35)';
    g.lineWidth = m.boss ? 1 : 0.6;
    g.strokeRect(x - 1, y - 1, w + 2, hh + 2);
  }

  function drawMinimap() {
    if (!G.map) return;
    const w = miniEl.width, h = miniEl.height;
    const m = miniCtx;
    m.clearRect(0, 0, w, h);
    m.imageSmoothingEnabled = false;
    m.drawImage(G.map.miniCanvas, 0, 0, G.map.cols, G.map.rows, 0, 0, w, h);

    const WW = G.map.cols * TILE, WH = G.map.rows * TILE;
    const sx = w / WW, sy = h / WH;

    const viewWr = viewW / ZOOM, viewHr = viewH / ZOOM;
    m.strokeStyle = 'rgba(255,255,255,0.32)';
    m.lineWidth = 1;
    m.strokeRect(G.cam.x * sx, G.cam.y * sy, viewWr * sx, viewHr * sy);

    // 怪物
    m.fillStyle = 'rgba(255,90,70,0.9)';
    for (const mo of G.monsters) {
      if (mo.dead) continue;
      m.beginPath();
      m.arc(mo.x * sx, mo.y * sy, 2.2, 0, 6.283);
      m.fill();
    }
    // NPC
    m.fillStyle = 'rgba(140,230,255,0.95)';
    for (const n of G.map.npcs) {
      m.beginPath();
      m.arc(n.x * sx, n.y * sy, 2.6, 0, 6.283);
      m.fill();
    }
    // 锚点
    m.fillStyle = 'rgba(255,220,120,0.95)';
    for (const a of G.map.anchors) {
      m.beginPath();
      m.arc(a.x * sx, a.y * sy, 3, 0, 6.283);
      m.fill();
    }
    // 玩家
    m.fillStyle = 'rgba(120,220,255,1)';
    m.beginPath(); m.arc(player.x * sx, player.y * sy, 3.4, 0, 6.283); m.fill();
    m.strokeStyle = 'rgba(10,20,30,0.9)';
    m.lineWidth = 1.2;
    m.stroke();
  }

  /* ------------------------------ 死亡复活 ------------------------------ */

  G.revive = function () {
    player.dead = false;
    const st = totalStats();
    player.hp = st.hpMax * 0.6;
    player.qi = st.qiMax * 0.5;
    player.invuln = 2;
    if (G.map.id !== 'village') {
      loadMap('village', null, { atAnchor: true, noCG: true });
    } else {
      const a = G.map.anchors[0];
      const free = findFreeSpot(a.x, a.y + TILE);
      player.x = free.x; player.y = free.y;
    }
    UI.toast('神魂重聚', 'blue');
  };

  /* ------------------------------ 主循环 ------------------------------ */

  let last = 0;
  let hudTimer = 0;
  let errCount = 0;

  /** 运行时兜底：任何异常都不允许打断主循环 */
  function reportError(e, where) {
    errCount++;
    try { console.error('[青云界] ' + (where || '') + ' 异常', e); } catch (x) { }
    // 清理可能卡住的状态
    try {
      G.keys.clear();
      player.attacking = false;
      player.attackTimer = 0;
      player.dodgeTimer = 0;
    } catch (x) { }
    if (errCount <= 3) {
      try { UI.toast('运行出错（已自动恢复）：' + (e && e.message ? e.message : e), 'red'); } catch (x) { }
    }
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.06) dt = 0.06;

    try {
      if (G.ready) {
        UI.tickCG(dt);
        if (G.started && !UI.cgOpen()) {
          try { update(dt); } catch (e) { reportError(e, 'update'); }
          try { render(); } catch (e) { reportError(e, 'render'); }
        } else if (G.started) {
          try { render(); } catch (e) { reportError(e, 'render'); }
        }
        hudTimer += dt;
        if (hudTimer > 0.1) {
          hudTimer = 0;
          try {
            UI.updateHUD();
            UI.updateSkills();
            UI.updateChallengeBar();
            try { checkTitles(); } catch (e) { }
            updateTouchGate();
            if (typeof Touch !== 'undefined' && Touch.isEnabled()) Touch.updateCooldowns();
          } catch (e) { reportError(e, 'hud'); }
        }
      }
    } catch (e) {
      reportError(e, 'frame');
    }

    // 永远把下一次循环排上，绝不让画面停死
    requestAnimationFrame(frame);
  }

  /* ------------------------------ 启动 ------------------------------ */

  function initPetals() {
    const rnd = makeRng(4321);
    const cols = ['#f6c7d8', '#ffffff', '#f2dfa6', '#e9b7cd'];
    for (let i = 0; i < 70; i++) {
      petals.push({
        x: (rnd() - 0.5) * 1400,
        y: (rnd() - 0.5) * 900,
        vx: 8 + rnd() * 16, vy: 6 + rnd() * 12,
        size: 1.6 + rnd() * 2.4,
        rot: rnd() * 6.283, vr: (rnd() - 0.5) * 2,
        a: 0.25 + rnd() * 0.55,
        color: cols[Math.floor(rnd() * cols.length)]
      });
    }
  }

  function beginGame(pathId, restore, playerName, look, root) {
    player.path = pathId;
    const P = PATHS[pathId];
    player.skills = P.skills.slice();

    /* ---- 读档继续 ---- */
    if (restore) {
      restorePlayer(restore);
      G.t = DAY_LEN * clamp(parseFloat(getParam('tod', '0.3')) || 0.3, 0, 0.999);
      G.started = true;
      const mapId = (restore.mapId && MAPS[restore.mapId]) ? restore.mapId : 'village';
      loadMap(mapId, { x: restore.x || 0, y: restore.y || 0 }, { noFade: true, noCG: true });
      UI.refreshPortrait();
      UI.buildSkillBar();
      UI.updateHUD();
      render();
      UI.toast('继续修行 · ' + realmName(player.level), 'gold');
      setTimeout(() => UI.toast('灵石 ' + player.stones + '　修为 ' + Math.floor(player.exp) + ' / ' + expNeed(player.level), 'blue'), 900);
      setTimeout(() => { try { checkQuestUnlocks(); } catch (e) { } }, 1600);
      return;
    }

    /* ---- 新开局 ---- */
    player.name = (playerName || '').trim().slice(0, 12) || '无涯子';
    player.look = look ? Object.assign({}, look) : null;
    player.level = 1;
    player.exp = 0;
    player.bonusHp = 0;
    player.bonusQi = 0;
    player.bonusAtk = 0;
    player.bonusDef = 0;
    player.bonusCrit = 0;
    player.bonusQiRegen = 0;
    player.statUp = { atk: 0, hp: 0, def: 0, spd: 0, aspd: 0 };
    player.root = root || null;
    player.bottleneck = false;
    player.realmRewarded = { 0: true };
    player.contrib = 0;
    player.alchCount = 0;
    player.mergeCount = 0;
    player.sectProg = { kill: 0, dungeon: 0, tower: 0 };
    player.sectTaskCd = {};
    player.dungeonClears = {};
    player.buffs = [];
    player.stones = 30;
    player.bag = [];
    player.equip = { weapon: null, body: null, charm: null, cloth: null };
    G.questState = {};
    G.questProgress = {};
    G.challengeCd = {};
    G.seenMaps = {};
    syncMax();
    player.hp = player.hpMax;
    player.qi = player.qiMax;
    addItem('pill_heal', 3);
    addItem('pill_qi', 2);
    addItem('mat_iron', 3);

    G.t = DAY_LEN * clamp(parseFloat(getParam('tod', '0.3')) || 0.3, 0, 0.999);
    G.started = true;
    G.introShown = false;
    G.playTime = 0;

    loadMap('village', null, { noFade: true });
    UI.refreshPortrait();
    UI.buildSkillBar();
    UI.updateHUD();
    render();
    saveGame(true);
    UI.toast('择道已成：' + P.name, 'gold');
    setTimeout(() => UI.toast('WASD 行走　J 普攻　E 交互', 'blue'), 1200);
    setTimeout(() => { try { checkQuestUnlocks(); } catch (e) { } }, 2200);
  }

  /* 立绘槽位自检面板（?debug=art） */
  function showArtPanel() {
    let p = document.getElementById('artPanel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'artPanel';
      p.className = 'modal gm-modal hidden';
      uiHudAppend(p);
    }
    const rep = (typeof Art !== 'undefined') ? Art.report() : { portrait: [], sprite: [] };
    const rows = (list, base) => list.map((x) =>
      '<div class="art-row' + (x.ok ? ' ok' : '') + '">' +
      '<span class="art-dot"></span>' +
      '<b>' + x.name + '</b>' +
      '<em>' + (x.ok ? '已使用图片' : ('未找到 · 待放 ' + base + x.key + '.png')) + '</em>' +
      '</div>').join('');

    p.innerHTML =
      '<div class="modal-head"><span>立 绘 插 槽 自 检</span>' +
      '<button class="x-btn gm-x" type="button">✕</button></div>' +
      '<div class="gm-body">' +
      '<div class="gm-tip">把 PNG 放进下面的路径并刷新页面即可替换立绘；不上传时自动使用内置绘制。<br>' +
      '立绘建议 720×960（3:4）透明底；世界里走动的小人建议 256×320。</div>' +
      '<div class="sec-sub">立 绘（对话 / 头像 / 行囊）· ' + Art.P_BASE + '</div>' +
      '<div class="art-list">' + rows(rep.portrait, Art.P_BASE) + '</div>' +
      '<div class="sec-sub">角 色 形 象（世界里走动）· ' + Art.S_BASE + '</div>' +
      '<div class="art-list">' + rows(rep.sprite, Art.S_BASE) + '</div>' +
      '</div>' +
      '<div class="modal-foot"><span>' +
      (rep.anyPortrait ? '已启用图片立绘' : '当前全部使用内置绘制') +
      '</span><span class="dim">改完文件后 Ctrl+Shift+R 强刷</span></div>';
    p.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    const x = p.querySelector('.gm-x');
    if (x) x.addEventListener('click', () => {
      p.classList.add('hidden');
      if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
    });

    // 图片是异步加载的：加载完再刷一次（只挂一次回调）
    if (typeof Art !== 'undefined' && !showArtPanel.__waited) {
      showArtPanel.__waited = true;
      Art.onReady(function () {
        const n = document.getElementById('artPanel');
        if (n && !n.classList.contains('hidden')) {
          showArtPanel.__waited = false;
          showArtPanel();
        }
      });
    }
  }

  function uiHudAppend(node) {
    const hud = document.getElementById('hud') || document.body;
    hud.appendChild(node);
  }

  function init() {
    // 全局错误提示：任何未捕获异常都直接显示在屏幕上，避免"点了没反应"
    try {
      window.addEventListener('error', (ev) => {
        let box = document.getElementById('errBox');
        if (!box) {
          box = document.createElement('div');
          box.id = 'errBox';
          box.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;' +
            'max-width:82vw;padding:8px 16px;border-radius:8px;background:rgba(120,20,20,.95);' +
            'color:#ffdede;font:13px/1.6 "KaiTi",serif;border:1px solid #ff6a6a;' +
            'box-shadow:0 8px 30px rgba(0,0,0,.6)';
          document.body.appendChild(box);
        }
        box.textContent = '运行出错：' + (ev && ev.message ? ev.message : ev);
      });
    } catch (e) { }

    UI.init(G);
    resize();
    buildTileSprites();
    initPetals();

    // 立绘图片：找到就用图片，找不到就用程序化美术
    try {
      if (typeof Art !== 'undefined') {
        Art.preload(function () {
          try { UI.refreshPortrait(); } catch (e) { }
          try { if (UI.bagOpen && UI.bagOpen()) UI.renderBag(); } catch (e) { }
        });
      }
    } catch (e) { }

    loadSave();
    loadKeymap();
    G.steles = Object.assign({}, saveData.steles || {});
    if (saveData.volumes) {
      for (const k in saveData.volumes) Audio2.setVolume(k, saveData.volumes[k]);
    }
    BigMap.init(G);
    Menu.init(G);
    try { Rank.init(G); } catch (e) { console.warn('排行榜初始化失败', e); }
    try { Tower.init(G); } catch (e) { console.warn('试炼塔初始化失败', e); }
    try { Touch.init(G, G.getTouchCfg()); } catch (e) { console.warn('触屏初始化失败', e); }
    try { updateTouchGate(); } catch (e) { }

    // 首次交互解锁音频（浏览器自动播放限制）
    const unlockAudio = () => Audio2.unlock();
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // 自动存档：定时 + 关闭/切后台时
    setInterval(() => { if (G.started && !player.dead) saveGame(true); }, 10000);
    window.addEventListener('beforeunload', () => { if (G.started) saveGame(true); });
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && G.started) saveGame(true);
      });
    }

    G.maps = {};
    G.ready = true;

    // 通关面板按钮
    try {
      const rc = document.getElementById('clearReincarnate');
      if (rc) rc.addEventListener('click', function () { G.reincarnate(); });
      const rs = document.getElementById('clearStay');
      if (rs) rs.addEventListener('click', function () {
        const p2 = document.getElementById('clearPanel');
        if (p2) p2.classList.add('hidden');
        try { if (UI.setOverlay) UI.setOverlay(false); } catch (e) { }
      });
    } catch (e) { }

    // 手机竖屏提示（横屏设备不会出现）
    try { updateRotateHint(); } catch (e) { }

    window.__qingyun = {
      G, player, init, update, render, canStand, loadMap, beginGame,
      acceptQuest, completeQuest, questStatus, objectiveDone, objectiveText,
      castSkill, tryBasicAttack, tryDodge, damageEnemy, damagePlayer,
      gainExp, addItem, removeItem, useItem, equipItem, unequip, totalStats,
      buyItem, sellItem, doTeleport, openTeleport, syncMax, findInteractable,
      saveGame, restorePlayer, snapshotPlayer, updateNpcs, checkQuestUnlocks, checkTitles
    };

    // 开始界面插画
    const artCanvas = document.getElementById('startArt');
    if (artCanvas) { try { drawCGScene(artCanvas, 'village', 0); } catch (e) { } }

    // 调试参数 intro=0 可跳过择道
    const startPanel = document.getElementById('startPanel');
    const startBtn = document.getElementById('startBtn');
    const startHint = document.getElementById('startHint');
    const startReset = document.getElementById('startReset');
    const hasSave = !!(saveData.player && saveData.player.path);

    const goCreate = () => {
      if (startPanel) startPanel.classList.add('hidden');
      UI.openCreate((pathId, name) => {
        const done = (look, nm, root) => beginGame(pathId, null, nm || name, look || null, root || null);
        const toCustomize = (root) => {
          if (typeof UI.openCustomize === 'function') UI.openCustomize(pathId, name, (look, nm) => done(look, nm, root));
          else done(null, name, root);
        };
        // 先测灵根，再捏脸，最后入世
        if (typeof Root !== 'undefined' && Root.open && getParam('noroot', '0') !== '1') {
          try { Root.open(toCustomize); return; } catch (e) { }
        }
        toCustomize(null);
      });
    };

    // 仅当同时带 debug= 时才允许 intro=0 跳过开始界面（防止误入、也便于自动化测试）
    const dbgMode = /[?&]debug=/.test(String((typeof location !== 'undefined' && location.search) || ''));
    if (getParam('intro', '1') === '0' && dbgMode) {
      if (startPanel) startPanel.classList.add('hidden');
      beginGame('sword');
    } else if (getParam('newgame', '0') === '1') {
      goCreate();
    } else {
      // 一律停在开始界面，必须点击才进入
      if (startPanel) startPanel.classList.remove('hidden');
      if (startBtn) {
        const label = hasSave ? '继 续 修 行' : '开 始 修 行';
        if (startBtn.textContent === undefined || startBtn.textContent !== label) startBtn.textContent = label;
        startBtn.addEventListener('click', () => {
          // 音频失败绝不能影响进入游戏
          try { Audio2.unlock(); } catch (e) { }
          try { Audio2.play('ui'); } catch (e) { }
          if (startPanel) startPanel.classList.add('hidden');

          if (hasSave) {
            try {
              beginGame(saveData.player.path, saveData.player);
              if (G.started) return;
            } catch (e) {
              console.error('[青云界] 读档失败，改为新开局', e);
              try { UI.toast('存档读取失败，已改为重新开局', 'red'); } catch (x) { }
              try { saveData.player = null; persist(); } catch (x) { }
            }
          }
          try {
            goCreate();
          } catch (e) {
            console.error('[青云界] 择道界面失败，直接以剑修开局', e);
            try { beginGame('sword'); } catch (x) { }
          }
        });
      }
      if (startHint) {
        const clears = saveData.clears || 0;
        startHint.textContent = (hasSave
          ? '已有存档 · 可继续修行，或重新择道'
          : '点击开始后择道入世 · 进度自动保存于本机') +
          (clears > 0 ? ('　|　已通关 ' + clears + ' 次') : '');
      }
      if (startReset && hasSave) {
        startReset.classList.remove('hidden');
        startReset.addEventListener('click', () => {
          let ok = true;
          if (typeof confirm === 'function') ok = confirm('确定清空当前存档、重新择道吗？');
          if (ok) G.resetSave();
        });
      }
    }

    // 调试：?debug=map|menu|act|talk|portraits
    const dbg = getParam('debug', '');
    if (dbg) {
      try {
        if (dbg === 'map') BigMap.open('village');
        else if (dbg === 'menu') Menu.open('settings');
        else if (dbg === 'act') Menu.open('activity');
        else if (dbg === 'rank') Menu.open('rank');
        else if (dbg === 'bag') {
          ['wp_iron', 'bd_silk', 'ch_jade', 'mat_herb', 'mat_core', 'wp_azure'].forEach((id) => G.addItem(id, 1));
          G.addItem('mat_herb', 2);
          UI.openBag();
        }
        else if (dbg === 'tower') { Tower.start('tower', 10); }
        else if (dbg === 'custom') { UI.openCustomize('sword', '无涯子', function () { }); }
        else if (dbg === 'forge') {
          ['wp_rust', 'wp_iron', 'wp_iron', 'wp_bamboo', 'wp_staff', 'wp_hammer',
            'wp_azure', 'bd_hemp', 'bd_silk', 'ch_wood', 'ch_jade'].forEach((id) => G.addItem(id, 1));
          player.stones += 3000;
          Panels.openForge();
        }
        else if (dbg === 'shop') { window.__shopGoods = true; Panels.openShop('goods'); }
        else if (dbg === 'shopgear') Panels.openShop('gear');
        else if (dbg === 'titles') Menu.open('titles');
        else if (dbg === 'art') { showArtPanel(); }
        else if (dbg === 'manual') {
          G.addItem('man_taixuan', 1);
          G.addItem('pill_heal', 1);
          G.addItem('wp_iron', 1);
          UI.openBag();
          let mi = -1;
          for (let i = 0; i < player.bag.length; i++) {
            if (ITEMS[player.bag[i].id] && ITEMS[player.bag[i].id].kind === 'manual') mi = i;
          }
          UI.state.bagSel = mi >= 0 ? mi : 0;
          UI.renderBag();
        }
        else if (dbg === 'sect') { player.contrib += 900; Panels.openSect(); }
        else if (dbg === 'dungeon') Panels.openDungeon();
        else if (dbg === 'skillup') Panels.openSkillUp();
        else if (dbg === 'alchemy') {
          ['mat_herb', 'mat_bamboo', 'mat_ginseng', 'mat_lingzhi', 'mat_core', 'mat_yin']
            .forEach((id) => G.addItem(id, 9));
          player.stones += 3000;
          Panels.openAlchemy();
        }
        else if (dbg === 'smith') {
          G.addItem('wp_azure', 1);
          G.equipItem('wp_azure');
          G.addItem('mat_iron', 6);
          player.stones += 2000;
          Panels.openSmith();
        }
        else if (dbg === 'account') Panels.openAccount();
        else if (dbg === 'codex') {
          ['wp_iron', 'wp_azure', 'pill_heal', 'pill_break_s', 'mat_herb', 'ch_ice', 'man_taixuan']
            .forEach((id) => G.addItem(id, 2));
          player.stones += 3000;
          try { Codex.open('weapon'); Codex.select('wp_iron'); } catch (e) { }
        }
        else if (dbg === 'break') {
          player.level = 9; player.exp = 0; player.bottleneck = true;
          G.addItem('pill_break_s', 1);
          player.stones += 5000;
          UI.updateHUD();
        }
        else if (dbg === 'breakclick') {
          player.level = 9; player.exp = 0; player.bottleneck = true;
          G.addItem('pill_break_s', 1);
          player.stones += 5000;
          UI.updateHUD();
          setTimeout(() => {
            const b = document.getElementById('breakBtn');
            if (b) b.click();
          }, 900);
          setTimeout(() => {
            document.title = 'BREAK:' + player.level +
              '|bt:' + (player.bottleneck ? 1 : 0) +
              '|pill:' + G.bagCount('pill_break_s') +
              '|stones:' + player.stones +
              '|bar:' + (function () {
                const n = document.getElementById('breakBar');
                return n && !n.classList.contains('hidden') ? 'show' : 'hide';
              })();
          }, 1900);
        }
        else if (dbg === 'boss') {
          const m = spawnMonster('boss_golem', player.x + 150, player.y - 40, null, 12);
          if (m) G.bossRef = m;
        }
        else if (dbg === 'icemap') { doTravel('ice', true); }
        else if (dbg === 'flow3') {
          // 用 localStorage 里真实存档还原（模拟「继续修行」）
          const s = saveData.player;
          if (!s) { document.title = 'NOSAVE'; return; }
          window.addEventListener('error', (e) => { document.title = 'ERR3:' + e.message; });
          setTimeout(() => {
            try {
              beginGame(s.path || 'sword', s);
              document.title = 'FLOW3:ok|map:' + (G.map ? G.map.id : 'null') +
                '|lvl:' + player.level + '|lvType:' + (typeof player.level) +
                '|exp:' + Math.round(player.exp);
            } catch (e) {
              document.title = 'ERR3:' + (e && e.message ? e.message : e);
            }
          }, 400);
        }
        else if (dbg === 'dump') {
          // 导出当前存档内容（截断）便于分析
          try {
            const s = saveData.player || {};
            const brief = {
              name: s.name, look: s.look ? 'obj' : null, path: s.path,
              level: s.level, exp: s.exp, stones: s.stones,
              bag: (s.bag || []).length, equip: s.equip,
              qs: Object.keys(s.questState || {}).length,
              qp: Object.keys(s.questProgress || {}).length,
              cd: Object.keys(s.challengeCd || {}).length,
              seen: Object.keys(s.seenMaps || {}).length,
              mapId: s.mapId, x: s.x, y: s.y, playTime: s.playTime, v: s.v
            };
            document.title = 'DUMP:' + JSON.stringify(brief);
          } catch (e) { document.title = 'DUMPERR:' + e.message; }
        }
        else if (dbg === 'flow2') {
          // 直接还原一份存档，定位「继续修行」卡在哪一步
          window.__errs = [];
          window.addEventListener('error', (e) => { window.__errs.push(String(e.message)); });
          const fake = {
            v: 3, name: '老玩家', look: null, path: 'sword', level: 3, exp: 40, stones: 200,
            hp: 100, qi: 50, bonusHp: 0, bonusQi: 0,
            bag: [{ id: 'pill_heal', n: 2 }], equip: { weapon: null, body: null, charm: null },
            questState: {}, questProgress: {}, challengeCd: {},
            seenMaps: { village: true }, introShown: true,
            mapId: 'village', x: 2300, y: 3600, playTime: 10, savedAt: Date.now()
          };
          setTimeout(() => {
            try {
              document.title = 'STEP1:restoring';
              beginGame('sword', fake);
              document.title = 'FLOW2:ok|map:' + (G.map ? G.map.id : 'null') +
                '|lvl:' + player.level + '|started:' + G.started;
            } catch (e) {
              document.title = 'ERR2:' + (e && e.message ? e.message : e);
            }
          }, 400);
          setTimeout(() => {
            if (String(document.title).indexOf('FLOW2') === 0) {
              document.title = document.title + '|tick:ok';
            }
          }, 2500);
        }
        else if (dbg === 'flow') {
          // 自动走一遍：开始 → 择道 → 测灵根 → 捏脸 → 入世
          window.__errs = [];
          window.addEventListener('error', (e) => {
            window.__errs.push(String(e.message));
          });
          const step = (fn, ms) => setTimeout(fn, ms);
          const vis = (id) => {
            const n = document.getElementById(id);
            return n && !String(n.className).indexOf ? true : (n && n.classList && !n.classList.contains('hidden'));
          };
          step(() => {
            const b = document.getElementById('startBtn');
            if (b) b.click(); else window.__errs.push('no startBtn');
          }, 200);
          step(() => {
            const cp = document.getElementById('createPanel');
            if (cp && !cp.classList.contains('hidden')) {
              const c = document.querySelector('#pathCards .path-card');
              if (c) c.click(); else window.__errs.push('no path card');
            }
          }, 700);
          step(() => {
            const b = document.getElementById('rootSpinBtn');
            if (b) b.click();
          }, 1100);
          step(() => {
            const b = document.getElementById('rootTakeBtn');
            if (b) b.click();
          }, 3000);
          step(() => {
            const cu = document.getElementById('customPanel');
            if (cu && !cu.classList.contains('hidden')) {
              const d = document.getElementById('customDone');
              if (d) d.click(); else window.__errs.push('no customDone');
            }
          }, 3400);
          step(() => {
            if (window.__errs.length) { document.title = 'ERR:' + window.__errs[0]; return; }
            document.title = 'FLOW:' + (G.started ? 'started' : 'not-started') +
              '|map:' + (G.map ? G.map.id : 'null') +
              '|lvl:' + player.level +
              '|look:' + (player.look ? 'Y' : 'N') +
              '|root:' + (player.root ? player.root.short : 'N');
          }, 4200);
        }
        else if (dbg === 'root') {
          Root.open(function () { });
        }
        else if (dbg === 'dd') {
          const t = document.getElementById('menuToggle');
          if (t) t.click();
        }
        else if (dbg === 'arena') {
          Tower.start('tower', 5);
          if (UI.dialogueOpen()) UI.closeDialogue();
          Tower.begin();
          G.fade = 0;
        }
        else if (dbg === 'abyss') {
          Tower.start('abyss', 3);
          if (UI.dialogueOpen()) UI.closeDialogue();
          Tower.begin();
          G.fade = 0;
        }
        else if (dbg === 'icons') {
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:fixed;inset:0;background:#0b1016;display:flex;flex-wrap:wrap;' +
            'gap:10px;padding:16px;z-index:9999;justify-content:center;align-content:center;';
          for (const id in ITEMS) {
            const box = document.createElement('div');
            box.style.cssText = 'width:104px;text-align:center;color:#cfc3a2;font-size:11px;font-family:serif';
            const c = document.createElement('canvas');
            c.width = 72; c.height = 72;
            c.style.cssText = 'display:block;margin:0 auto;background:rgba(255,255,255,.03);border:1px solid #2a3542;border-radius:8px';
            box.appendChild(c);
            const lab = document.createElement('div');
            lab.textContent = ITEMS[id].name;
            lab.style.marginTop = '4px';
            box.appendChild(lab);
            wrap.appendChild(box);
            try { ItemIcons.paint(c, id); } catch (e) { }
          }
          document.body.appendChild(wrap);
        }
        else if (dbg === 'talk') UI.openDialogue(pagesOf(G, 'npc_master'), 'npc_master');
        else if (dbg === 'dirs') {
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:fixed;inset:0;background:#0b1016;display:flex;' +
            'gap:4px;padding:10px;z-index:9999;justify-content:center;align-items:center;';
          const labels = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];
          for (let i = 0; i < 8; i++) {
            const c = document.createElement('canvas');
            c.width = 120; c.height = 150;
            c.style.cssText = 'flex:0 0 auto;background:#16202a;border:1px solid #2a3542;border-radius:6px';
            const gg = c.getContext('2d');
            gg.fillStyle = '#8fa0ad';
            gg.font = '13px "STKaiti",serif';
            gg.textAlign = 'center';
            gg.fillText(labels[i], 60, 18);
            const P = PATHS[player.path];
            drawFigure(gg, 60, 120, {
              t: 1, facing: i * Math.PI / 4, moving: false, phase: 0,
              robe: P.robe, robeDark: P.robeDark, accent: P.accent, sash: P.sash,
              hair: P.hair, glow: P.glow, weapon: P.weapon
            });
            wrap.appendChild(c);
          }
          document.body.appendChild(wrap);
        }
        else if (dbg === 'portraits') {
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:fixed;inset:0;background:#080b10;display:flex;flex-wrap:wrap;' +
            'gap:6px;padding:8px;z-index:9999;justify-content:center;align-items:center;';
          for (const k in PORTRAIT_SPECS) {
            const c = document.createElement('canvas');
            c.width = 280; c.height = 380;
            c.style.cssText = 'flex:0 0 auto;width:172px;height:234px;border:1px solid #2a3542;border-radius:4px';
            wrap.appendChild(c);
            drawPortraitFull(c, k);
          }
          document.body.appendChild(wrap);
        }
      } catch (e) { console.warn('debug 模式失败', e); }
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('DOMContentLoaded', () => {
    init();
  });
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
  }
})();

