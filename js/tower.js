'use strict';

/* =========================================================================
   青云界 · 试炼塔 / 深渊归墟
   独立试炼场景（buildArena），敌人分职业，Boss 带预警技能，
   每层需确认开始，随时可退出，已通关层数保留。
   ========================================================================= */

const Tower = (function () {
  let G = null;
  let st = null;          // 当前试炼状态

  const CFG = {
    tower: null,          // 运行时从 TOWER_CFG 取
    abyss: null
  };

  function cfgOf(kind) {
    return kind === 'abyss' ? ABYSS_CFG : TOWER_CFG;
  }

  function init(game) {
    G = game;
    CFG.tower = TOWER_CFG;
    CFG.abyss = ABYSS_CFG;
    const sd = G.saveData();
    if (typeof sd.towerMax !== 'number') sd.towerMax = 0;
    if (typeof sd.abyssMax !== 'number') sd.abyssMax = 0;
    resetTowerDaily();
  }

  /* ------------------------------ 每日重置 ------------------------------ */

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /** 试炼塔进度每日重置（历史最高另外记在 towerMax，用来发称号） */
  function resetTowerDaily() {
    const sd = G.saveData();
    const today = todayKey();
    if (!sd.towerDaily || sd.towerDaily.date !== today) {
      sd.towerDaily = { date: today, max: 0 };
      G.persistNow();
    }
    return sd.towerDaily;
  }

  function dailyMax() {
    try { return resetTowerDaily().max || 0; } catch (e) { return 0; }
  }

  function maxFloor(kind) {
    try {
      const sd = G.saveData();
      if (kind === 'abyss') return sd.abyssMax || 0;
      return dailyMax();     // 试炼塔：取今日进度
    } catch (e) { return 0; }
  }

  function allTimeMax() {
    try { return G.saveData().towerMax || 0; } catch (e) { return 0; }
  }

  function saveMax(kind, f) {
    const sd = G.saveData();
    if (kind === 'abyss') {
      if (f > (sd.abyssMax || 0)) sd.abyssMax = f;
    } else {
      const d = resetTowerDaily();
      if (f > (d.max || 0)) d.max = f;
      if (f > (sd.towerMax || 0)) sd.towerMax = f;   // 历史最高，供称号判定
    }
    G.persistNow();
  }

  function isBossFloor(kind, f) {
    const cfg = cfgOf(kind);
    return f % cfg.bossEvery === 0;
  }

  /** 每 10 层一次大跳：层数越高，跳得越狠 */
  function tierSpike(f) {
    const tier = Math.floor(f / 10);
    if (tier <= 0) return 1;
    return Math.pow(1.42, tier);
  }

  function isActive() { return !!(st && st.active); }
  function state() { return st; }
  function kindOf() { return st ? st.kind : 'tower'; }

  /* ------------------------------ 入场 ------------------------------ */

  function start(kind, floorArg) {
    kind = (kind === 'abyss') ? 'abyss' : 'tower';
    if (isActive()) { UI.toast('试炼进行中', 'red'); return; }
    if (G.player.dead) return;
    const cfg = cfgOf(kind);
    const f = Math.max(1, Math.min(cfg.maxFloor, floorArg || (maxFloor(kind) + 1)));
    st = {
      active: true, kind: kind, cfg: cfg, floor: f,
      phase: 'confirm', need: 0, alive: 0, timeLeft: 0, boss: false, killed: 0
    };
    buildFloor(true);
    askStart();
  }

  function buildFloor(first) {
    const map = buildArena(st.kind, st.floor);
    G.enterArena(map, map.spawn);
    Audio2.play('teleport');
    UI.toast('踏入' + st.cfg.name + ' · 第 ' + st.floor + ' 层', 'gold');
  }

  function askStart() {
    const f = st.floor;
    const boss = isBossFloor(st.kind, f);
    UI.openDialogue([{
      who: st.cfg.name,
      text: '第 ' + f + ' 层 / 共 ' + st.cfg.maxFloor + ' 层' + (boss ? ' · 守关妖王' : '') + '\n' +
        (boss ? '此地妖气冲霄，守关者已在场中候你。是否开始挑战？'
          : '前方妖物盘踞，是否开始挑战？\n（随时可退出，已破层数会保留）'),
      options: [
        { label: '开始挑战', act: { type: 'arenaStart' } },
        { label: '退出试炼', act: { type: 'arenaQuit' } }
      ]
    }], null);
  }

  /* ------------------------------ 战斗 ------------------------------ */

  function pickClass(f) {
    const pool = ['brute', 'rogue'];
    if (f >= 3) pool.push('archer');
    if (f >= 5) pool.push('mage');
    if (f >= 8) { pool.push('archer', 'mage'); }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function begin() {
    if (!st || !st.active) return;
    st.phase = 'fight';
    const cfg = st.cfg;
    const f = st.floor;
    const boss = isBossFloor(st.kind, f);
    st.boss = boss;
    st.killed = 0;
    st.timeLeft = Math.round(cfg.timeBase + f * cfg.timePerFloor);
    const lv = Math.round(cfg.levelBase + f * cfg.levelPerFloor);

    G.monsters = G.monsters.filter((m) => !m.tower);
    G.eProjs = [];

    if (boss) {
      // 每 10 层轮换守关首领，并按层数大跳
      const bk = (typeof towerBossFor === 'function')
        ? towerBossFor(f) : { type: 'boss_golem', mul: 2.4 };
      const spike = tierSpike(f);
      const m = G.spawnMonsterPublic(bk.type, G.player.x, G.player.y - 220, null, lv + 3);
      if (m) {
        const base = st.kind === 'abyss' ? 3.4 : bk.mul;
        m.hp = Math.round(m.hpMax * base * spike);
        m.hpMax = m.hp;
        m.atk = Math.round(m.atk * 1.35 * Math.pow(spike, 0.55));
        m.size = (m.size || 1) * 1.15;
        m.boss = true; m.tower = true;
        m.skillCd = Math.max(1.2, 2.2 - Math.floor(f / 20) * 0.2);
      }
      st.need = 1;
    } else {
      const spike = tierSpike(f);
      const n = Math.min(12, 2 + Math.floor(f / 6));
      const pool = (typeof towerMobPool === 'function') ? towerMobPool(f) : ['wolf', 'ape'];
      for (let i = 0; i < n; i++) {
        const cls = pickClass(f);
        const a = (i / n) * 6.2832 + Math.random() * 0.6;
        const d = 190 + Math.random() * 90;
        let x = G.player.x + Math.cos(a) * d;
        let y = G.player.y + Math.sin(a) * d * 0.8;
        const type = pool[Math.floor(Math.random() * pool.length)];
        const m = G.spawnMonsterPublic(type, x, y, { x: x, y: y }, lv, cls);
        if (m) {
          m.tower = true;
          if (spike > 1.01) {
            m.hp = Math.round(m.hp * Math.pow(spike, 0.8));
            m.hpMax = m.hp;
            m.atk = Math.round(m.atk * Math.pow(spike, 0.5));
          }
        }
      }
      st.need = n;
    }

    UI.toast(boss ? '守关妖王现身！' : '妖物来袭 · ' + st.need + ' 只', boss ? 'red' : 'gold');
    Audio2.play(boss ? 'thunder' : 'quest');
  }

  function reward() {
    const f = st.floor;
    const boss = st.boss;
    const abyss = st.kind === 'abyss';
    const stones = Math.round((12 + f * 7) * (abyss ? 2.6 : 1) + (boss ? f * 12 : 0));
    const exp = Math.round((20 + f * 16) * (abyss ? 2.2 : 1) + (boss ? f * 34 : 0));
    G.player.stones += stones;
    G.gainExp(exp);
    const parts = ['灵石 +' + stones, '修为 +' + exp];

    if (boss) {
      let pool;
      if (abyss) pool = ['wp_void', 'wp_slayer', 'ch_seal', 'ch_blood', 'man_abyss', 'pill_break'];
      else pool = ['wp_frost', 'wp_crimson', 'ch_orbs', 'ch_bell', 'man_sword', 'man_body', 'pill_marrow'];
      const id = pool[Math.floor(Math.random() * pool.length)];
      G.addItem(id, 1);
      parts.push(ITEMS[id].name + '×1');
      // 深渊有较高概率出红装
      if (abyss && Math.random() < 0.35) {
        const red = ['wp_slayer', 'ch_blood', 'man_abyss'][Math.floor(Math.random() * 3)];
        G.addItem(red, 1);
        parts.push('【仙品】' + ITEMS[red].name);
        G.flash = 0.6; G.flashColor = '255,90,90';
      }
    } else if (f % 5 === 0) {
      G.addItem('pill_heal', 2);
      parts.push('疗伤丹×2');
    }

    saveMax(st.kind, f);
    try { if (st.kind === 'tower' && G.dailyAdd) G.dailyAdd('tower', 1); } catch (e) { }
    UI.toast('第 ' + f + ' 层已破！' + parts.join('、'), 'gold');
    Audio2.play('levelup');
    G.flash = 0.4;
    G.flashColor = abyss ? '255,90,90' : '190,235,255';
  }

  function clearFloor() {
    if (st.phase === 'clear') return;
    reward();
    if (st.floor >= st.cfg.maxFloor) {
      UI.toast(st.cfg.name + ' 全部通关！', 'gold');
      G.flash = 0.7; G.flashColor = '255,220,140';
      exitArena(true);
      return;
    }
    st.phase = 'clear';
    st.timer = 1.6;
  }

  function nextFloor() {
    st.floor++;
    st.phase = 'confirm';
    buildFloor(false);
    askStart();
  }

  /* ------------------------------ 退出 ------------------------------ */

  function exitArena(silent) {
    const kind = st ? st.kind : 'tower';
    for (const m of G.monsters) if (m.tower) m.dead = true;
    G.eProjs = [];
    G.telegraphs = [];
    st.active = false;
    const f = st.floor;
    G.leaveArena();
    if (!silent) UI.toast('退出' + cfgOf(kind).name + '（已破 ' + maxFloor(kind) + ' 层）', 'blue');
    setTimeout(() => { st = null; }, 400);
    Audio2.play('uiBack');
  }

  function quit() {
    if (!isActive()) return;
    if (UI.dialogueOpen()) UI.closeDialogue();
    exitArena(false);
  }

  function fail(reason) {
    if (!isActive()) return;
    const kind = st.kind, f = st.floor;
    for (const m of G.monsters) if (m.tower) m.dead = true;
    G.eProjs = [];
    G.telegraphs = [];
    st.active = false;
    G.leaveArena();
    UI.toast('试炼失败：' + (reason || '时间耗尽') + '（止步第 ' + f + ' 层）', 'red');
    Audio2.play('uiBack');
    setTimeout(() => { st = null; }, 400);
  }

  function finish(win) { if (isActive()) exitArena(true); }

  /* ------------------------------ 每帧 ------------------------------ */

  function tick(dt) {
    if (!st || !st.active) return;
    if (st.phase === 'clear') {
      st.timer -= dt;
      if (st.timer <= 0) nextFloor();
      return;
    }
    if (st.phase !== 'fight') return;

    // 不再因时间耗尽判负：倒计时只作显示，灵气可靠打坐回复
    if (st.timeLeft > 0) st.timeLeft = Math.max(0, st.timeLeft - dt);
    let alive = 0;
    for (const m of G.monsters) if (!m.dead && m.tower) alive++;
    st.alive = alive;

    if (alive <= 0) { clearFloor(); return; }
    // （原「灵力耗竭即失败」规则已移除）
  }

  function progressText() {
    if (!st || !st.active) return '';
    if (st.phase === 'confirm') return '第 ' + st.floor + ' 层 · 待挑战';
    if (st.phase === 'clear') return '第 ' + st.floor + ' 层已破';
    return (st.boss ? '守关妖王' : '余 ' + (st.alive || 0) + ' 只') +
      '　第 ' + st.floor + ' / ' + st.cfg.maxFloor + ' 层';
  }

  function reset(kind) {
    if (!G) return;
    const sd = G.saveData();
    if (kind === 'abyss') sd.abyssMax = 0;
    else { sd.towerMax = 0; sd.towerDaily = { date: todayKey(), max: 0 }; }
    G.persistNow();
  }

  return {
    init, start, begin, quit, tick, finish, fail,
    isActive, state, kindOf, maxFloor, progressText, reset, isBossFloor,
    resetTowerDaily, dailyMax, allTimeMax, tierSpike,
    get MAX_FLOOR() { return TOWER_CFG.maxFloor; }
  };
})();
