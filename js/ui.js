'use strict';

/* =========================================================================
   青云界 · 界面层（DOM）
   ========================================================================= */

const UI = (function () {
  let G = null;
  const el = {};
  const state = {
    bagSel: null,
    shopKind: null,
    dialoguePages: null,
    dlgIndex: 0,
    cgIdx: 0,
    cgLines: null,
    cgOnDone: null,
    cgTimer: 0,
    cgMap: null,
    bagMulti: false,
    bagPick: null
  };

  function $(id) { return document.getElementById(id); }

  const KIND_NAME = {
    pill: '丹药', weapon: '兵器', body: '护体', charm: '饰品', mat: '材料'
  };

  function kindIcon(it) {
    if (it.kind === 'weapon') return '刃';
    if (it.kind === 'body') return '衣';
    if (it.kind === 'charm') return '佩';
    if (it.kind === 'mat') return '材';
    return '丹';
  }

  function itemStatText(it) {
    const parts = [];
    if (it.atk) parts.push('攻击 +' + it.atk);
    if (it.def) parts.push('防御 +' + it.def);
    if (it.hp) parts.push('气血 +' + it.hp);
    if (it.qi) parts.push('灵力 +' + it.qi);
    if (it.crit) parts.push('暴击 +' + Math.round(it.crit * 100) + '%');
    if (it.speed) parts.push('身法 ' + (it.speed > 0 ? '+' : '') + it.speed);
    if (it.qiRegen) parts.push('回灵 +' + it.qiRegen + '/秒');
    return parts.join('　');
  }

  /** 丹药 / 秘法的使用效果（写在 use 里，不是道具本身的属性） */
  function useEffectText(def) {
    const u = def && def.use;
    if (!u) return '';
    const p = [];
    if (u.hp) p.push('回复气血 ' + u.hp);
    if (u.qi) p.push('回复灵力 ' + u.qi);
    if (u.hpFull) p.push('回满气血');
    if (u.hpMax) p.push('气血上限 +' + u.hpMax);
    if (u.qiMax) p.push('灵力上限 +' + u.qiMax);
    if (u.atk) p.push('攻击 +' + u.atk);
    if (u.def) p.push('防御 +' + u.def);
    if (u.crit) p.push('暴击 +' + (u.crit * 100).toFixed(1) + '%');
    if (u.qiRegen) p.push('回灵 +' + u.qiRegen);
    if (u.expLevels) p.push('境界 +' + u.expLevels + ' 层');
    if (u.buff) {
      if (u.buff.aspd) p.push('攻速 +' + Math.round(u.buff.aspd * 100) + '% / ' + u.buff.time + '秒');
      if (u.buff.move) p.push('移速 +' + Math.round(u.buff.move * 100) + '% / ' + u.buff.time + '秒');
      if (u.buff.guard) p.push('减伤 ' + Math.round(u.buff.guard * 100) + '% / ' + u.buff.time + '秒');
    }
    return p.join('　');
  }

  /* ------------------------------ 初始化 ------------------------------ */

  function init(game) {
    G = game;
    const ids = ['portrait', 'pathName', 'realmText', 'stoneNum', 'hpFill', 'hpNum',
      'qiFill', 'qiNum', 'cultFill', 'cultNum', 'minimap', 'mapName', 'clock', 'coord',
      'skillBar', 'toasts', 'interactTip', 'interactText', 'interactKey', 'dialogue', 'dlgFace',
      'dlgName', 'dlgText', 'dlgOptions', 'bagPanel', 'bagGrid', 'equipCol',
      'itemDetail', 'bagStone', 'bagStat', 'shopPanel', 'shopTitle', 'shopList',
      'sellList', 'shopStone', 'questPanel', 'questList', 'createPanel', 'pathCards',
      'cgPanel', 'cgCanvas', 'cgTitle', 'cgSub', 'cgLine', 'deadPanel', 'deadBtn', 'deadText',
      'challengeBar', 'chName', 'chTime', 'chProg', 'questTracker',
      'btnMap', 'btnActivity', 'btnMenu', 'nameInput', 'charName',
      'bossBar', 'bbName', 'bbLv', 'bbFill', 'bbNum',
      'bagRealm'];
    for (const id of ids) el[id] = $(id);

    try { if (typeof Panels !== 'undefined') Panels.init(G); } catch (e) { }
    try { if (typeof Codex !== 'undefined') Codex.init(G); } catch (e) { }

    // HUD 灵石金币图标
    try {
      const sc = document.getElementById('stoneCoin');
      if (sc && typeof CoinArt !== 'undefined') CoinArt.paint(sc, 'coin', 72);
    } catch (e) { }

    // 右上角：三横线菜单
    const toggle = document.getElementById('menuToggle');
    const dd = document.getElementById('menuDropdown');
    if (toggle && dd) {
      const closeDd = () => {
        if (dd.classList) dd.classList.add('hidden');
        if (toggle.classList) toggle.classList.remove('open');
      };
      const updateMenuHead = () => {
        const sub = document.getElementById('mdSub');
        if (!sub) return;
        const p = G && G.player;
        if (!p) { sub.textContent = '未入世'; return; }
        const r = (G.getRoot && G.getRoot()) || null;
        const parts = [PATHS[p.path] ? PATHS[p.path].name : '散修', realmName(p.level)];
        if (r) parts.push(r.name);
        sub.textContent = (p.name || '无涯子') + ' · ' + parts.join(' · ');
        if (r) sub.style.color = r.color;
      };
      toggle.addEventListener('click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        Audio2.play('ui');
        const willOpen = dd.classList.contains('hidden');
        if (willOpen) updateMenuHead();
        if (dd.classList) dd.classList.toggle('hidden');
        if (toggle.classList) toggle.classList.toggle('open', willOpen);
      });
      const items = (dd.querySelectorAll && typeof dd.querySelectorAll === 'function')
        ? dd.querySelectorAll('.md-item') : [];
      Array.prototype.forEach.call(items || [], (it) => {
        it.addEventListener('click', (ev) => {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          const act = it.getAttribute('data-act');
          closeDd();
          Audio2.play('ui');
          if (act === 'map') BigMap.open(G.map ? G.map.id : 'village');
          else if (act === 'bag') openBag();
          else if (act === 'quest') openQuests();
          else if (act === 'skillup') Panels.openSkillUp();
          else if (act === 'codex') { if (typeof Codex !== 'undefined') Codex.open(); }
          else if (act === 'forge') Panels.openForge();
          else if (act === 'shop') Panels.openShop('goods');
          else if (act === 'sect') Panels.openSect();
          else if (act === 'dungeon') Panels.openDungeon();
          else if (act === 'account') Panels.openAccount();
          else if (act === 'activity') Menu.open('activity');
          else if (act === 'rank') Menu.open('rank');
          else if (act === 'titles') Menu.open('titles');
          else if (act === 'settings') Menu.open('settings');
        });
      });
      document.addEventListener('click', closeDd);
      el.menuToggle = toggle;
      el.menuDropdown = dd;
    }

    // 点击小地图放大
    if (el.minimap) el.minimap.addEventListener('click', () => {
      Audio2.play('ui');
      BigMap.open(G.map ? G.map.id : 'village');
    });
    // 点击头像查看道行
    if (el.portrait && el.portrait.parentNode && el.portrait.parentNode.addEventListener) {
      el.portrait.parentNode.style.pointerEvents = 'auto';
      el.portrait.parentNode.style.cursor = 'pointer';
      el.portrait.parentNode.addEventListener('click', () => openStats());
    }

    el.deadBtn.addEventListener('click', () => {
      el.deadPanel.classList.add('hidden');
      if (G && G.revive) G.revive();
    });

    // CG 点击继续
    el.cgPanel.addEventListener('click', () => nextCG(true));

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (dialogueOpen()) { closeDialogue(); e.preventDefault(); }
        else if (typeof Panels !== 'undefined' && Panels.closeAll()) { e.preventDefault(); }
        else if (!el.shopPanel.classList.contains('hidden')) { closeShop(); e.preventDefault(); }
        else if (!el.bagPanel.classList.contains('hidden')) { closeBag(); e.preventDefault(); }
        else if (!el.questPanel.classList.contains('hidden')) { closeQuests(); e.preventDefault(); }
      }
    });

    // 手机也要能关：给每个弹窗标题栏补一个 ✕
    try {
      Array.prototype.forEach.call(document.querySelectorAll('.modal-head'), (head) => {
        if (head.querySelector && head.querySelector('.x-btn')) return;
        const panel = head.parentNode;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'x-btn head-x';
        b.textContent = '✕';
        b.addEventListener('click', (ev) => {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          Audio2.play('ui');
          if (panel && panel.id === 'bagPanel') closeBag();
          else if (panel && panel.id === 'shopPanel') closeShop();
          else if (panel && panel.id === 'questPanel') closeQuests();
          else if (panel && panel.classList) panel.classList.add('hidden');
        });
        const em = head.querySelector('em');
        if (em && em.parentNode === head) head.insertBefore(b, em);
        else head.appendChild(b);
      });
    } catch (e) { }
  }

  /* ------------------------------ 提示 ------------------------------ */

  function toast(text, cls) {
    const d = document.createElement('div');
    d.className = 'toast' + (cls ? ' ' + cls : '');
    d.textContent = text;
    el.toasts.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2800);
  }

  function showInteract(text, sx, sy) {
    el.interactTip.classList.remove('hidden');
    el.interactText.textContent = text;
    if (el.interactKey) el.interactKey.textContent = keyName(G.keymap.interact);
    if (sx !== undefined) {
      el.interactTip.style.left = sx + 'px';
      el.interactTip.style.top = sy + 'px';
      el.interactTip.style.transform = 'translate(-50%, 0)';
    }
  }

  function hideInteract() {
    el.interactTip.classList.add('hidden');
  }

  /* ------------------------------ HUD ------------------------------ */

  function updateHUD() {
    const p = G.player;
    const need = expNeed(p.level);
    if (el.charName) el.charName.textContent = (p.name || '无涯子').split('').join(' ');
    el.pathName.textContent = PATHS[p.path].name;
    el.realmText.textContent = realmName(p.level);
    el.stoneNum.textContent = p.stones;
    el.hpFill.style.width = Math.max(0, p.hp / p.hpMax * 100).toFixed(1) + '%';
    el.hpNum.textContent = Math.max(0, Math.ceil(p.hp)) + ' / ' + Math.round(p.hpMax);
    el.qiFill.style.width = Math.max(0, p.qi / p.qiMax * 100).toFixed(1) + '%';
    el.qiNum.textContent = Math.round(p.qi) + ' / ' + Math.round(p.qiMax);
    el.cultFill.style.width = Math.min(100, p.exp / need * 100).toFixed(1) + '%';
    let bn = false;
    try { bn = !!(G.isBottleneck && G.isBottleneck()); } catch (e) { }
    el.cultNum.innerHTML = Math.floor(p.exp) + ' / ' + need +
      (bn ? '<span class="bn-tag">瓶颈</span>' : '');
    const cultBar = el.cultFill.parentNode;
    if (cultBar && cultBar.classList) cultBar.classList.toggle('bottleneck', bn);
    el.clock.textContent = G.clockText();
    el.coord.textContent = 'x:' + Math.round(p.x / TILE) + ' y:' + Math.round(p.y / TILE);
    if (G.map) el.mapName.textContent = G.map.name;
    updateQuestTracker();
    updateBossBar();
  }

  /* ------------------------------ 行囊里的境界卡（破境入口） ------------------------------ */

  function renderRealmBox() {
    const box = el.bagRealm || document.getElementById('bagRealm');
    if (!box) return;
    const p = G.player;
    let info = null;
    try { info = G.realmInfo ? G.realmInfo() : null; } catch (e) { }
    if (!info) { box.innerHTML = ''; return; }

    const need = info.need || expNeed(p.level);
    const k = Math.max(0, Math.min(1, p.exp / Math.max(1, need)));
    const bt = !!(G.isBottleneck && G.isBottleneck());
    const req = (G.breakReq ? G.breakReq() : null) ||
      { hasPill: false, pillName: null, stones: 0, guardNeed: 0, guardHave: 0, guardOk: false, condNeed: 0, condHave: 0, condOk: true, ok: false };
    const can = bt && !!req.ok;

    box.innerHTML =
      '<div class="br-top">' +
      '<span class="br-realm" style="color:' + info.color + '">' + info.name + '</span>' +
      '<span class="br-layer">第 ' + info.layer + ' / ' + LAYERS_PER_REALM + ' 层</span>' +
      '</div>' +
      '<div class="br-bar"><i style="width:' + (k * 100).toFixed(1) + '%;background:' +
      (bt ? '#ff9a5a' : info.color) + '"></i></div>' +
      '<div class="br-num">修为 ' + Math.floor(p.exp) + ' / ' + need +
      (bt ? '　<span class="br-bn">已至瓶颈</span>' : '') + '</div>';

    if (bt) {
      const reqLine = document.createElement('div');
      reqLine.className = 'br-req';
      const stoneOk = p.stones >= req.stones;
      let html =
        '<span class="' + (req.hasPill ? 'ok' : 'no') + '">破境丹 ' +
        (req.hasPill ? '已备 · ' + req.pillName : '缺') + '</span>' +
        '<span class="' + (req.guardOk ? 'ok' : 'no') + '">护脉丹 ' +
        req.guardHave + ' / ' + req.guardNeed + '</span>';
      if (req.condNeed > 0) {
        html += '<span class="' + (req.condOk ? 'ok' : 'no') + '">凝神丹 ' +
          req.condHave + ' / ' + req.condNeed + '</span>';
      }
      html += '<span class="' + (stoneOk ? 'ok' : 'no') + '">灵石 ' + p.stones + ' / ' + req.stones + '</span>';
      reqLine.innerHTML = html;
      box.appendChild(reqLine);

      const can = !!(req.ok);

      const b = document.createElement('button');
      b.className = 'br-btn' + (can ? ' ready' : '');
      b.type = 'button';
      b.textContent = can ? '破　境' : '未备齐';
      b.addEventListener('click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        try { Audio2.play('ui'); } catch (e) { }
        if (G.breakthrough) G.breakthrough();
        renderRealmBox();
      });
      box.appendChild(b);

      const hint = document.createElement('div');
      hint.className = 'br-hint';
      hint.textContent = '护脉丹 / 凝神丹可在商铺、宗门商店与丹炉获得';
      box.appendChild(hint);
    }
  }

  /* ------------------------------ BOSS 血条 ------------------------------ */

  function updateBossBar() {
    const bar = el.bossBar;
    if (!bar) return;
    let m = null;
    try { m = G.bossRef || null; } catch (e) { m = null; }
    if (!m || m.dead) {
      if (!bar.classList.contains('hidden')) bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    const def = MONSTERS[m.type] || {};
    if (el.bbName) el.bbName.textContent = def.name || '首领';
    if (el.bbLv) el.bbLv.textContent = 'Lv.' + m.lv;
    const k = Math.max(0, Math.min(1, m.hp / m.hpMax));
    if (el.bbFill) {
      el.bbFill.style.width = (k * 100).toFixed(1) + '%';
      el.bbFill.className = k < 0.28 ? 'low' : '';
    }
    if (el.bbNum) el.bbNum.textContent = Math.max(0, Math.ceil(m.hp)) + ' / ' + Math.round(m.hpMax);
  }

  /* ------------------------------ 招式栏 ------------------------------ */

  let skillSlots = null;

  function buildSkillBar() {
    const p = G.player;
    const defs = [
      { key: keyName(G.keymap.attack), name: '普攻', cost: 0, id: null },
      { key: keyName(G.keymap.skill1), name: SKILLS[p.skills[0]].name, cost: SKILLS[p.skills[0]].cost, id: p.skills[0] },
      { key: keyName(G.keymap.skill2), name: SKILLS[p.skills[1]].name, cost: SKILLS[p.skills[1]].cost, id: p.skills[1] },
      { key: keyName(G.keymap.ult), name: SKILLS[p.skills[2]].name, cost: SKILLS[p.skills[2]].cost, id: p.skills[2] }
    ];
    el.skillBar.innerHTML = '';
    skillSlots = defs.map((d) => {
      const s = document.createElement('div');
      s.className = 'skill';
      s.innerHTML =
        '<div class="cdmask"></div>' +
        '<div class="cdtext"></div>' +
        '<span class="n">' + d.name + '</span>' +
        '<span class="k">' + d.key + '</span>' +
        (d.cost ? '<span class="cost">' + d.cost + '</span>' : '');
      el.skillBar.appendChild(s);
      return { root: s, mask: s.querySelector('.cdmask'), text: s.querySelector('.cdtext'), def: d };
    });
  }

  function updateSkills() {
    if (!skillSlots) return;
    const p = G.player;
    for (const s of skillSlots) {
      if (!s.def.id) {
        // 普攻：显示连招进度
        s.mask.style.transform = 'scaleY(0)';
        s.text.textContent = p.combo > 0 ? p.combo : '';
        s.root.classList.toggle('ready', true);
        continue;
      }
      const remain = G.cooldowns[s.def.id] || 0;
      const total = SKILLS[s.def.id].cd;
      const k = Math.max(0, Math.min(1, remain / total));
      s.mask.style.transform = 'scaleY(' + k.toFixed(3) + ')';
      s.text.textContent = remain > 0.1 ? Math.ceil(remain) : '';
      const canQ = p.qi >= s.def.cost;
      s.root.classList.toggle('disabled', !canQ);
      s.root.classList.toggle('ready', remain <= 0.05 && canQ);
    }
  }

  /* ------------------------------ 肖像 ------------------------------ */

  function paintPortrait(canvas, opts, scale, footY) {
    const g = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    g.clearRect(0, 0, w, h);
    g.save();
    // 背景
    const bg = g.createRadialGradient(w * 0.4, h * 0.3, 2, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, 'rgba(70,110,150,0.55)');
    bg.addColorStop(1, 'rgba(8,14,20,0.9)');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.translate(w / 2, footY || h * 1.12);
    g.scale(scale || 1.7, scale || 1.7);
    drawFigure(g, 0, 0, Object.assign({
      t: 0.6, facing: Math.PI / 2, moving: false, phase: 0
    }, opts));
    g.restore();
  }

  function refreshPortrait() {
    drawPortraitAvatar(el.portrait, 'p_' + G.player.path, playerSpec(G.player.path, G.player.look));
  }

  function paintNpcFace(npcId) {
    if (PORTRAIT_SPECS[npcId]) {
      drawPortraitFull(el.dlgFace, npcId);
    } else {
      const g = el.dlgFace.getContext('2d');
      g.clearRect(0, 0, el.dlgFace.width, el.dlgFace.height);
    }
  }

  /* ------------------------------ 对话 ------------------------------ */

  function openDialogue(pages, npcId) {
    hideInteract();
    state.dialoguePages = pages;
    state.dlgIndex = 0;
    el.dialogue.classList.remove('hidden');
    paintNpcFace(npcId);
    renderDialoguePage();
    Audio2.play('ui');
  }

  function renderDialoguePage() {
    const pages = state.dialoguePages;
    if (!pages) return;
    const page = pages[state.dlgIndex];
    el.dlgName.textContent = page.who || '';
    el.dlgText.textContent = page.text || '';
    el.dlgOptions.innerHTML = '';
    const opts = page.options || [{ label: '继续', act: { type: 'next' } }];
    opts.forEach((o, i) => {
      const b = document.createElement('div');
      b.className = 'dlg-opt' + (o.primary ? ' primary' : '');
      b.textContent = (i + 1) + '. ' + o.label;
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        chooseOption(o);
      });
      el.dlgOptions.appendChild(b);
    });
  }

  function chooseOption(o) {
    const act = o.act || { type: 'close' };
    if (act.type === 'next') {
      if (state.dlgIndex < state.dialoguePages.length - 1) {
        state.dlgIndex++;
        renderDialoguePage();
      } else {
        closeDialogue();
      }
      return;
    }
    if (act.type === 'close') { closeDialogue(); return; }
    // 其余交给游戏层；无论成败都要保证对话框关掉，避免卡死
    let closed = false;
    try {
      G.onDialogueAction(act);
    } catch (e) {
      console.error('[青云界] 对话动作异常', e);
      try { UI.toast('操作出错：' + (e && e.message ? e.message : e), 'red'); } catch (x) { }
    }
    // onDialogueAction 内部通常会自己关；若因为异常没关，这里兜底
    if (!el.dialogue.classList.contains('hidden')) {
      closeDialogue();
      closed = true;
    }
    return closed;
  }

  function closeDialogue() {
    el.dialogue.classList.add('hidden');
    state.dialoguePages = null;
    G.onDialogueClosed();
  }

  function dialogueOpen() {
    return !el.dialogue.classList.contains('hidden');
  }

  /* ------------------------------ 背包 ------------------------------ */

  function openBag() {
    el.bagPanel.classList.remove('hidden');
    setOverlay(true);
    state.bagSel = null;
    state.bagMulti = false;
    state.bagPick = new Set();
    renderBag();
  }
  function closeBag() { el.bagPanel.classList.add('hidden'); setOverlay(false); }

  function bagOpen() { return !el.bagPanel.classList.contains('hidden'); }

  function qOfEntry(e) {
    return (typeof e.q === 'number') ? e.q : Gear.defQ(e.id);
  }

  function paintItemArt(cv, entry, size) {
    if (!cv) return;
    const d = ITEMS[entry.id];
    if (!d) return;
    try {
      if (isGearKind(d.kind)) GearArt.paint(cv, entry.id, { q: qOfEntry(entry), t: 0 });
      else ItemIcons.paint(cv, entry.id);
    } catch (e) { }
  }

  /* 高清画布：按 devicePixelRatio 放大后备缓冲，CSS 上仍显示为 cssSize 像素 */
  function dprNow() {
    try {
      const d = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      return Math.max(2, Math.min(4, d));
    } catch (e) { return 2; }
  }

  function sharpCanvas(cssSize, cls) {
    const cv = document.createElement('canvas');
    const k = dprNow();
    cv.width = Math.round(cssSize * k);
    cv.height = Math.round(cssSize * k);
    if (cv.style) {
      cv.style.width = cssSize + 'px';
      cv.style.height = cssSize + 'px';
    }
    if (cls) cv.className = cls;
    return cv;
  }

  /* ------------------------------ 批量出售 ------------------------------ */

  function bagPickCount() {
    return state.bagPick ? state.bagPick.size : 0;
  }

  function bagPickTotal() {
    if (!state.bagPick) return 0;
    let sum = 0;
    for (const i of state.bagPick) {
      const it = G.player.bag[i];
      if (it) sum += G.sellPriceOf(it);
    }
    return sum;
  }

  function togglePick(i) {
    if (!state.bagPick) state.bagPick = new Set();
    if (state.bagPick.has(i)) state.bagPick.delete(i);
    else state.bagPick.add(i);
  }

  function sellPicked() {
    if (!state.bagPick || !state.bagPick.size) { toast('先勾选要卖的物品', 'red'); return; }
    const idx = Array.from(state.bagPick).sort((a, b) => b - a);
    let n = 0, coins = 0;
    for (const i of idx) {
      const it = G.player.bag[i];
      if (!it) continue;
      coins += G.sellPriceOf(it);
      n++;
    }
    // 从大到小卖，避免下标错位
    for (const i of idx) {
      const it = G.player.bag[i];
      if (!it) continue;
      G.sellBagAt(i, 99);
    }
    state.bagPick = new Set();
    toast('售出 ' + n + ' 件，得灵石 ' + coins, 'gold');
    try { Audio2.play('coin'); } catch (e) { }
    renderBag();
  }

  function renderBag() {
    const p = G.player;
    el.bagStone.textContent = '灵石 ' + p.stones;
    const st = G.totalStats();
    const total = p.bag.length;
    const slots = (G.bagSlots || 50);
    el.bagStat.textContent = '攻 ' + Math.round(st.atk) + '　防 ' + Math.round(st.def) +
      '　气血 ' + Math.round(p.hp) + '/' + Math.round(p.hpMax) +
      '　攻速 ' + Math.round((st.atkSpd || 0) * 100) + '%　' + total + '/' + slots;

    // 人物立绘 + 境界卡（破境入口）
    try {
      const face = document.getElementById('bagFace');
      if (face) drawPortraitFull(face, 'p_' + p.path, playerSpec(p.path, p.look));
      const info = document.getElementById('bagHeroInfo');
      if (info) {
        const ti = G.currentTitle ? G.currentTitle() : null;
        const rt = G.getRoot ? G.getRoot() : null;
        info.innerHTML = '<b>' + p.name + '</b>　' + PATHS[p.path].name + '<br>' +
          realmName(p.level) + (ti ? '<br><span style="color:' + (ti.color || '#ffdf9a') + '">【' + ti.name + '】</span>' : '') +
          (rt ? '<br><span style="color:' + rt.color + '">' + rt.name + '</span>' : '') +
          '<br>暴击 ' + (st.crit * 100).toFixed(1) + '%　回灵 ' + st.qiRegen.toFixed(1) + '/秒' +
          '<br>攻击间隔 ' + G.attackInterval().toFixed(2) + ' 秒';
      }
      renderRealmBox();
    } catch (e) { }

    // 装备栏（4 槽）
    el.equipCol.innerHTML = '';
    for (const slot of GEAR_SLOTS) {
      const inst = p.equip[slot];
      const d = document.createElement('div');
      d.className = 'equip-slot' + (inst ? ' filled' : '');
      if (inst) {
        const q = qOfEntry(inst);
        d.style.borderColor = Gear.qColor(q);
        const cv = sharpCanvas(44, 'eq-art');
        paintItemArt(cv, inst, 44);
        d.appendChild(cv);
        const nm = document.createElement('span');
        nm.className = 'eq-nm';
        nm.style.color = Gear.qColor(q);
        nm.textContent = ITEMS[inst.id].name;
        d.appendChild(nm);
        const sub = document.createElement('span');
        sub.className = 'eq-sub';
        sub.textContent = SLOT_NAME[slot] + (inst.lv ? ' +' + inst.lv : '') +
          (Gear.broken(inst) ? ' · 损坏' : '');
        d.appendChild(sub);
        d.title = '点击卸下';
        d.addEventListener('click', () => { G.unequip(slot); renderBag(); });
      } else {
        const e2 = document.createElement('span');
        e2.className = 'eq-empty';
        e2.textContent = SLOT_NAME[slot];
        d.appendChild(e2);
      }
      el.equipCol.appendChild(d);
    }

    // 物品格子（5 行 × 10 列）
    el.bagGrid.innerHTML = '';
    if (!state.bagPick) state.bagPick = new Set();
    for (let i = 0; i < slots; i++) {
      const cell = document.createElement('div');
      cell.className = 'bag-cell';
      const it = p.bag[i];
      if (it) {
        const def = ITEMS[it.id];
        if (!def) continue;
        const gear = isGearKind(def.kind);
        const q = qOfEntry(it);
        cell.classList.add('q-' + def.kind);
        cell.classList.add('q-r' + q);
        if (state.bagSel === i) cell.classList.add('sel');
        if (state.bagMulti && state.bagPick.has(i)) cell.classList.add('picked');

        const cv = sharpCanvas(48, 'bag-icon');
        paintItemArt(cv, it, 48);
        cell.appendChild(cv);

        const nm = document.createElement('span');
        nm.className = 'bag-nm';
        nm.style.color = Gear.qColor(q);
        nm.textContent = def.name;
        cell.appendChild(nm);

        if (it.n > 1) {
          const c = document.createElement('span');
          c.className = 'cnt';
          c.textContent = it.n;
          cell.appendChild(c);
        }
        if (gear && it.lv) {
          const lv = document.createElement('span');
          lv.className = 'lvmark';
          lv.textContent = '+' + it.lv;
          cell.appendChild(lv);
        }
        if (gear && Gear.broken(it)) {
          const b = document.createElement('span');
          b.className = 'brk';
          b.textContent = '坏';
          cell.appendChild(b);
        }
        if (state.bagMulti) {
          const box = document.createElement('span');
          box.className = 'pick-box' + (state.bagPick.has(i) ? ' on' : '');
          if (state.bagPick.has(i)) box.textContent = '✓';
          cell.appendChild(box);
        }

        cell.addEventListener('click', () => {
          if (state.bagMulti) {
            togglePick(i);
            renderBag();
            return;
          }
          state.bagSel = i;
          renderBag();
        });
      }
      el.bagGrid.appendChild(cell);
    }

    renderBagBar();
    renderItemDetail();
  }

  /* 行囊底部：批量出售工具条 */
  function renderBagBar() {
    const bar = document.getElementById('bagBar');
    if (!bar) return;
    const p = G.player;
    if (!state.bagPick) state.bagPick = new Set();
    bar.innerHTML = '';

    const btn = document.createElement('button');
    btn.className = 'btn' + (state.bagMulti ? ' gold' : '');
    btn.type = 'button';
    btn.textContent = state.bagMulti ? '退出批量' : '批量出售';
    btn.addEventListener('click', () => {
      state.bagMulti = !state.bagMulti;
      if (!state.bagMulti) state.bagPick = new Set();
      try { Audio2.play('ui'); } catch (e) { }
      renderBag();
    });
    bar.appendChild(btn);

    if (!state.bagMulti) return;

    const all = document.createElement('button');
    all.className = 'btn';
    all.type = 'button';
    all.textContent = '全选';
    all.addEventListener('click', () => {
      state.bagPick = new Set();
      for (let i = 0; i < p.bag.length; i++) state.bagPick.add(i);
      renderBag();
    });
    bar.appendChild(all);

    const none = document.createElement('button');
    none.className = 'btn';
    none.type = 'button';
    none.textContent = '清空';
    none.addEventListener('click', () => {
      state.bagPick = new Set();
      renderBag();
    });
    bar.appendChild(none);

    const info = document.createElement('span');
    info.className = 'pick-info';
    info.textContent = '已选 ' + bagPickCount() + ' 件 · 共 ' + bagPickTotal() + ' 灵石';
    bar.appendChild(info);

    const sell = document.createElement('button');
    sell.className = 'btn gold';
    sell.type = 'button';
    sell.textContent = '售出所选';
    sell.disabled = bagPickCount() === 0;
    sell.addEventListener('click', sellPicked);
    bar.appendChild(sell);
  }

  function renderItemDetail() {
    const p = G.player;
    const it = state.bagSel !== null ? p.bag[state.bagSel] : null;
    if (!it) {
      el.itemDetail.innerHTML = '<div class="detail-empty">选择一件物品</div>';
      return;
    }
    const def = ITEMS[it.id];
    const gear = isGearKind(def.kind);
    const q = qOfEntry(it);
    const qc = Gear.qColor(q);

    let extra = '';
    if (gear) {
      const ratio = Gear.durRatio(it);
      const durCol = ratio > 0.5 ? '#8fe0a0' : ratio > 0.2 ? '#ffd166' : '#ff6a6a';
      extra =
        '<div class="detail-qrow"><span style="color:' + qc + '">' + Gear.qName(q) + '品</span>' +
        (it.lv ? '<em class="detail-lv">淬炼 +' + it.lv + '</em>' : '') + '</div>' +
        '<div class="detail-dur"><div class="dbar"><i style="width:' + (ratio * 100).toFixed(1) +
        '%;background:' + durCol + '"></i></div><span>耐久 ' + Math.round(it.dur || 0) + ' / ' +
        Math.round(it.durMax || 0) + '</span></div>' +
        '<div class="detail-trait">' + (GearArt.trait(it.id) || def.desc) + '</div>' +
        '<div class="detail-stat">' + Gear.statLine(it) + '</div>';
    } else {
      extra = '<div class="detail-desc">' + def.desc + '</div>';
      const st2 = itemStatText(def);
      if (st2) extra += '<div class="detail-stat">' + st2 + '</div>';
      const ue = useEffectText(def);
      if (ue) {
        extra += '<div class="detail-use">' +
          (def.kind === 'manual' ? '研读后永久获得：' : '服用后：') + ue + '</div>';
      }
    }

    el.itemDetail.innerHTML =
      '<div class="detail-top">' +
      '<canvas class="detail-icon" width="216" height="216"></canvas>' +
      '<div><div class="detail-name" style="color:' + qc + '">' + def.name +
      (it.n > 1 ? ' ×' + it.n : '') + '</div>' +
      '<div class="detail-kind">' + (gear ? SLOT_NAME[def.kind] : (KIND_NAME[def.kind] || '')) + '</div></div></div>' +
      extra +
      '<div class="detail-stat" style="color:#c8b88d">售价 ' + G.sellPriceOf(it) + ' 灵石</div>' +
      '<div class="detail-actions"></div>';

    const detailCv = el.itemDetail.querySelector ? el.itemDetail.querySelector('canvas') : null;
    paintItemArt(detailCv, it, 216);

    const actions = el.itemDetail.querySelector('.detail-actions');
    if (!actions) return;

    if (def.kind === 'pill') {
      const b = document.createElement('button');
      b.className = 'btn gold';
      b.textContent = '服用';
      b.addEventListener('click', () => { G.useItem(it.id); renderBag(); });
      actions.appendChild(b);
    } else if (def.kind === 'manual') {
      const b = document.createElement('button');
      b.className = 'btn gold';
      b.textContent = '研　读';
      b.title = '永久提升属性';
      b.addEventListener('click', () => { G.useItem(it.id); renderBag(); });
      actions.appendChild(b);
    }
    if (gear) {
      const b = document.createElement('button');
      b.className = 'btn gold';
      b.textContent = '佩 用';
      b.addEventListener('click', () => {
        G.equipItem(state.bagSel);
        state.bagSel = null;
        renderBag();
      });
      actions.appendChild(b);

      if (!Gear.broken(it)) {
        const m = document.createElement('button');
        m.className = 'btn';
        m.textContent = '合成';
        m.addEventListener('click', () => {
          Panels.state.forgeSel = state.bagSel;
          Panels.openForge();
        });
        actions.appendChild(m);
      }
    }
    if (!gear || def.kind !== 'cloth') {
      const s = document.createElement('button');
      s.className = 'btn';
      s.textContent = '出售';
      s.addEventListener('click', () => {
        G.sellBagAt(state.bagSel, 1);
        state.bagSel = null;
        renderBag();
      });
      actions.appendChild(s);
    }
  }

  /* ------------------------------ 商店 ------------------------------ */

  /* 旧商铺界面保留作兜底，实际统一走新的青云商铺（含买卖分页 / 服饰） */
  function openShop(kind) {
    try {
      if (typeof Panels !== 'undefined') { Panels.openShop('goods'); return; }
    } catch (e) { }
    state.shopKind = kind;
    el.shopTitle.textContent = kind === 'alch' ? '药庐 · 丹药' : '雷记铁铺';
    el.shopPanel.classList.remove('hidden');
    renderShop();
  }
  function closeShop() {
    el.shopPanel.classList.add('hidden');
    try {
      if (typeof Panels !== 'undefined' && Panels.isOpen && Panels.isOpen('gmShopPanel')) {
        document.getElementById('gmShopPanel').classList.add('hidden');
        Panels.refreshOverlay();
      }
    } catch (e) { }
  }

  function shopOpen() {
    if (!el.shopPanel.classList.contains('hidden')) return true;
    try {
      return typeof Panels !== 'undefined' && Panels.isOpen && Panels.isOpen('gmShopPanel');
    } catch (e) { return false; }
  }

  function renderShop() {
    const p = G.player;
    el.shopStone.textContent = '灵石 ' + p.stones;

    el.shopList.innerHTML = '';
    for (const id of SHOP_STOCK) {
      const def = ITEMS[id];
      if (!def) continue;
      const row = document.createElement('div');
      row.className = 'row' + (p.stones < def.price ? ' disabled' : '');
      row.innerHTML = '<canvas class="row-icon" width="30" height="30"></canvas>' +
        '<span class="nm">' + def.name + '</span>' +
        '<span class="tag">' + (KIND_NAME[def.kind] || '') + '</span>' +
        '<span class="pr">' + def.price + '</span>';
      const cv = row.querySelector ? row.querySelector('canvas') : null;
      if (cv) { try { ItemIcons.paint(cv, id); } catch (e) { } }
      row.addEventListener('click', () => { G.buyItem(id); renderShop(); });
      el.shopList.appendChild(row);
    }

    el.sellList.innerHTML = '';
    if (!p.bag.length) {
      el.sellList.innerHTML = '<div class="quest-empty">行囊空空</div>';
    }
    p.bag.forEach((it) => {
      const def = ITEMS[it.id];
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = '<canvas class="row-icon" width="30" height="30"></canvas>' +
        '<span class="nm">' + def.name + (it.n > 1 ? ' ×' + it.n : '') + '</span>' +
        '<span class="pr sell">' + (def.sell || 1) + '</span>';
      const cv = row.querySelector ? row.querySelector('canvas') : null;
      if (cv) { try { ItemIcons.paint(cv, it.id); } catch (e) { } }
      row.addEventListener('click', () => { G.sellItem(it.id); renderShop(); });
      el.sellList.appendChild(row);
    });
  }

  /* ------------------------------ 任务 ------------------------------ */

  /* 任务奖励贴图 */
  function paintRewardIcons(root) {
    if (!root || !root.querySelectorAll) return;
    let list = [];
    try { list = root.querySelectorAll('canvas.rw-ic'); } catch (e) { return; }
    for (let i = 0; i < (list.length || 0); i++) {
      const cv = list[i];
      const id = cv.getAttribute ? cv.getAttribute('data-art') : null;
      if (!id) continue;
      try {
        if (id === 'coin') { if (typeof CoinArt !== 'undefined') CoinArt.paint(cv, 'coin', cv.width); }
        else if (id === 'star') { if (typeof CoinArt !== 'undefined') CoinArt.paint(cv, 'star', cv.width); }
        else {
          const d = ITEMS[id];
          if (!d) continue;
          if (isGearKind(d.kind)) GearArt.paint(cv, id, { q: Gear.defQ(id), t: 0 });
          else ItemIcons.paint(cv, id);
        }
      } catch (e) { }
    }
  }
  function openQuests() {
    el.questPanel.classList.remove('hidden');
    renderQuests();
  }
  function closeQuests() { el.questPanel.classList.add('hidden'); }
  function questOpen() { return !el.questPanel.classList.contains('hidden'); }

  function renderQuests() {
    el.questList.innerHTML = '';
    let any = false;
    for (const id in QUESTS) {
      const q = QUESTS[id];
      const st = G.questStatus(id);
      if (st === 'locked') continue;
      any = true;
      const tier = QUEST_TIER[Math.max(0, Math.min(QUEST_TIER.length - 1, q.tier || 0))];
      const d = document.createElement('div');
      d.className = 'quest tier-' + tier.id + (st === 'done' ? ' done' : '');
      d.style.borderColor = tier.color + (st === 'done' ? '44' : 'cc');
      if (st !== 'done') {
        d.style.boxShadow = '0 0 ' + (8 + tier.id * 4) + 'px ' + tier.glow + (0.16 + tier.id * 0.06).toFixed(2) + ')';
      }

      let objs = '';
      for (const o of q.objectives) {
        const done = G.objectiveDone(q, o);
        objs += '<div class="quest-obj' + (done ? ' ok' : '') + '">' +
          (done ? '✓ ' : '○ ') + G.objectiveText(q, o) + '</div>';
      }
      const rw = [];
      if (q.reward.exp) {
        rw.push('<span class="rw"><canvas class="rw-ic" width="54" height="54" ' +
          'data-art="star"></canvas>修为 ' + q.reward.exp + '</span>');
      }
      if (q.reward.stones) {
        rw.push('<span class="rw"><canvas class="rw-ic" width="54" height="54" ' +
          'data-art="coin"></canvas>灵石 ' + q.reward.stones + '</span>');
      }
      if (q.reward.contrib) {
        rw.push('<span class="rw"><canvas class="rw-ic" width="54" height="54" ' +
          'data-art="coin"></canvas>宗门贡献 ' + q.reward.contrib + '</span>');
      }
      if (q.reward.items) {
        for (const it of q.reward.items) {
          rw.push('<span class="rw"><canvas class="rw-ic" width="54" height="54" ' +
            'data-art="' + it.id + '"></canvas>' + ITEMS[it.id].name + '×' + it.n + '</span>');
        }
      }
      let stateText = '';
      if (st === 'available') stateText = '<span style="color:#8fe0a0">可接取</span>';
      else if (st === 'active') stateText = '<span style="color:#9fd6ff">进行中</span>';
      else if (st === 'ready') stateText = '<span style="color:#ffdf9a">可复命</span>';
      else if (st === 'done') stateText = '<span style="color:#7d8b96">已完成</span>';

      d.innerHTML =
        '<div class="quest-top">' +
        '<span class="quest-tier" style="color:' + tier.color + ';border-color:' + tier.color + '99;' +
        'box-shadow:0 0 10px ' + tier.glow + '0.5)">' + tier.name + '</span>' +
        '<span class="quest-name">' + q.name + '</span>' + stateText + '</div>' +
        '<div class="quest-desc">' + q.desc + '</div>' + objs +
        '<div class="quest-reward"><em>酬谢</em>' + rw.join('') + '</div>';
      el.questList.appendChild(d);
      paintRewardIcons(d);
    }
    if (!any) {
      el.questList.innerHTML = '<div class="quest-empty">尚无任务。去村子里与人攀谈罢。</div>';
    }
  }

  /* ------------------------------ 捏脸 ------------------------------ */

  let customDoneHandler = null;

  function defaultLook(pathId) {
    const P = PATHS[pathId] || PATHS.sword;
    const styleByPath = { sword: 'highBun', mage: 'longLoose', body: 'short', alch: 'topknot' };
    return {
      hairStyle: styleByPath[pathId] || 'highBun',
      hair: P.hair, hairHi: '#4a4155',
      skin: '#f6dcc0', skinShade: '#d9b394',
      eye: pathId === 'mage' ? '#b79bff' : '#7fc8ff',
      robe: P.robe, robeDark: P.robeDark, accent: P.accent, bg: 'cyan',
      /* 高级捏脸 */
      faceW: 1.0, faceLen: 1.0,
      eyeShape: 'almond', brow: 'soft', mouth: 'plain',
      fem: pathId === 'alch', age: 0.35
    };
  }

  /* ------------------------------ 高级捏脸 ------------------------------ */

  const CUSTOM_TABS = [
    { id: 'face', name: '形　貌' },
    { id: 'hair', name: '发　肤' },
    { id: 'eyes', name: '眉　眼' },
    { id: 'robe', name: '道　袍' }
  ];

  function openCustomize(pathId, playerName, onDone) {
    const panel = document.getElementById('customPanel');
    const faceCv = document.getElementById('customFace');
    const opts = document.getElementById('customOpts');
    if (!panel || !opts) { onDone(defaultLook(pathId), playerName); return; }

    const look = defaultLook(pathId);
    let tab = 'face';

    if (faceCv) { faceCv.width = 300; faceCv.height = 400; }

    panel.classList.remove('hidden');
    setOverlay(true);

    const repaint = () => {
      if (!faceCv) return;
      try { drawPortraitFull(faceCv, 'p_' + pathId, playerSpec(pathId, look)); } catch (e) { }
    };

    /* 分组：色块或文字按钮 */
    const group = (title, items, check, set, colorKey) => {
      const wrap = document.createElement('div');
      wrap.className = 'cg-group';
      wrap.innerHTML = '<div class="cg-title">' + title + '</div>';
      const row = document.createElement('div');
      row.className = 'cg-row';
      items.forEach((it) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cg-btn' + (check(it) ? ' on' : '');
        if (colorKey) {
          b.style.background = it[colorKey];
          b.title = it.name;
          b.innerHTML = '<i></i>';
        } else {
          b.textContent = it.name;
        }
        b.addEventListener('click', () => {
          set(it);
          repaint();
          render();
          Audio2.play('ui');
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      return wrap;
    };

    /* 滑动条 */
    const slider = (title, min, max, step, get, set) => {
      const wrap = document.createElement('div');
      wrap.className = 'cg-group';
      wrap.innerHTML = '<div class="cg-title">' + title + '</div>';
      const row = document.createElement('div');
      row.className = 'cg-slider-row';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = min; inp.max = max; inp.step = step;
      inp.value = get();
      const val = document.createElement('span');
      val.className = 'cg-slider-val';
      val.textContent = Number(get()).toFixed(2);
      inp.addEventListener('input', () => {
        set(parseFloat(inp.value));
        val.textContent = Number(inp.value).toFixed(2);
        repaint();
      });
      row.appendChild(inp);
      row.appendChild(val);
      wrap.appendChild(row);
      return wrap;
    };

    const render = () => {
      opts.innerHTML = '';

      const tabs = document.createElement('div');
      tabs.className = 'cg-tabs';
      CUSTOM_TABS.forEach((t) => {
        const d = document.createElement('div');
        d.className = 'cg-tab' + (tab === t.id ? ' on' : '');
        d.textContent = t.name;
        d.addEventListener('click', () => { tab = t.id; render(); Audio2.play('ui'); });
        tabs.appendChild(d);
      });
      opts.appendChild(tabs);

      const body = document.createElement('div');
      body.className = 'cg-body';

      if (tab === 'face') {
        body.appendChild(group('脸　型', LOOK_OPTIONS.faceShape,
          (it) => Math.abs(look.faceW - it.faceW) < 0.001 && Math.abs(look.faceLen - it.faceLen) < 0.001,
          (it) => { look.faceW = it.faceW; look.faceLen = it.faceLen; }));
        body.appendChild(group('骨　相', LOOK_OPTIONS.bone,
          (it) => !!look.fem === it.fem, (it) => { look.fem = it.fem; }));
        body.appendChild(group('年　岁', LOOK_OPTIONS.ageLook,
          (it) => Math.abs((look.age || 0) - it.age) < 0.01, (it) => { look.age = it.age; }));
        body.appendChild(slider('脸　宽', 0.88, 1.12, 0.01,
          () => look.faceW, (v) => { look.faceW = v; }));
        body.appendChild(slider('脸　长', 0.92, 1.12, 0.01,
          () => look.faceLen, (v) => { look.faceLen = v; }));
      } else if (tab === 'hair') {
        body.appendChild(group('发　型', LOOK_OPTIONS.hairStyle,
          (it) => look.hairStyle === it.id, (it) => { look.hairStyle = it.id; }));
        body.appendChild(group('肤　色', LOOK_OPTIONS.skin,
          (it) => look.skin === it.skin,
          (it) => { look.skin = it.skin; look.skinShade = it.shade; }, 'skin'));
        body.appendChild(group('发　色', LOOK_OPTIONS.hair,
          (it) => look.hair === it.hair,
          (it) => { look.hair = it.hair; look.hairHi = it.hi; }, 'hair'));
      } else if (tab === 'eyes') {
        body.appendChild(group('眼　型', LOOK_OPTIONS.eyeShapes,
          (it) => look.eyeShape === it.id, (it) => { look.eyeShape = it.id; }));
        body.appendChild(group('眉　形', LOOK_OPTIONS.browShape,
          (it) => look.brow === it.id, (it) => { look.brow = it.id; }));
        body.appendChild(group('唇　形', LOOK_OPTIONS.mouthShape,
          (it) => look.mouth === it.id, (it) => { look.mouth = it.id; }));
        body.appendChild(group('瞳　色', LOOK_OPTIONS.eye,
          (it) => look.eye === it.eye, (it) => { look.eye = it.eye; }, 'eye'));
      } else {
        body.appendChild(group('道　袍', LOOK_OPTIONS.robe,
          (it) => look.robe === it.robe,
          (it) => {
            look.robe = it.robe; look.robeDark = it.dark;
            look.accent = it.accent; look.bg = it.bg;
          }, 'robe'));
      }

      opts.appendChild(body);

      // 底部：随机 + 重置
      const tools = document.createElement('div');
      tools.className = 'cg-tools';

      const randBtn = document.createElement('button');
      randBtn.type = 'button';
      randBtn.className = 'cg-tool';
      randBtn.textContent = '随机生成';
      randBtn.addEventListener('click', () => {
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const fs = pick(LOOK_OPTIONS.faceShape);
        const sk = pick(LOOK_OPTIONS.skin);
        const hr = pick(LOOK_OPTIONS.hair);
        const rb = pick(LOOK_OPTIONS.robe);
        look.faceW = fs.faceW; look.faceLen = fs.faceLen;
        look.eyeShape = pick(LOOK_OPTIONS.eyeShapes).id;
        look.brow = pick(LOOK_OPTIONS.browShape).id;
        look.mouth = pick(LOOK_OPTIONS.mouthShape).id;
        look.hairStyle = pick(LOOK_OPTIONS.hairStyle).id;
        look.skin = sk.skin; look.skinShade = sk.shade;
        look.hair = hr.hair; look.hairHi = hr.hi;
        look.eye = pick(LOOK_OPTIONS.eye).eye;
        look.robe = rb.robe; look.robeDark = rb.dark;
        look.accent = rb.accent; look.bg = rb.bg;
        look.fem = Math.random() < 0.5;
        look.age = pick(LOOK_OPTIONS.ageLook).age;
        repaint(); render(); Audio2.play('ui');
      });
      tools.appendChild(randBtn);

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'cg-tool';
      resetBtn.textContent = '恢复默认';
      resetBtn.addEventListener('click', () => {
        Object.assign(look, defaultLook(pathId));
        repaint(); render(); Audio2.play('ui');
      });
      tools.appendChild(resetBtn);

      opts.appendChild(tools);
    };

    const doneBtn = document.getElementById('customDone');
    if (doneBtn) {
      if (customDoneHandler && doneBtn.removeEventListener) doneBtn.removeEventListener('click', customDoneHandler);
      customDoneHandler = () => {
        panel.classList.add('hidden');
        setOverlay(false);
        Audio2.play('ui');
        onDone(Object.assign({}, look), playerName);
      };
      doneBtn.addEventListener('click', customDoneHandler);
    }

    render();
    repaint();
    Audio2.play('ui');
  }

  /* ------------------------------ 择道 ------------------------------ */

  function openCreate(onPick) {
    el.createPanel.classList.remove('hidden');
    el.pathCards.innerHTML = '';
    const nameEl = document.getElementById('nameInput');
    if (nameEl && !nameEl.value) nameEl.value = '无涯子';
    for (const id in PATHS) {
      const P = PATHS[id];
      const card = document.createElement('div');
      card.className = 'path-card';
      card.innerHTML =
        '<h3>' + P.name + '</h3>' +
        '<div class="motto">' + P.motto + '</div>' +
        '<div class="pdesc">' + P.desc + '</div>' +
        '<div class="pstat">气血 ' + P.hp + '　灵力 ' + P.qi + '　攻击 ' + P.atk + '　防御 ' + P.def + '</div>' +
        '<div class="perk">' + P.perk + '</div>';
      card.addEventListener('click', () => {
        let nm = nameEl ? String(nameEl.value || '').trim() : '';
        if (!nm) nm = '无涯子';
        el.createPanel.classList.add('hidden');
        Audio2.play('ui');
        onPick(id, nm);
      });
      el.pathCards.appendChild(card);
    }
  }

  /* ------------------------------ CG ------------------------------ */

  function showCG(mapId, onDone) {
    const def = MAPS[mapId];
    state.cgMap = mapId;
    state.cgLines = def.cg.lines;
    state.cgIdx = 0;
    state.cgOnDone = onDone;
    el.cgTitle.textContent = def.cg.title;
    el.cgSub.textContent = def.cg.sub;
    el.cgLine.textContent = state.cgLines[0];
    el.cgPanel.classList.remove('hidden');
    resizeCG();
  }

  function resizeCG() {
    if (!el.cgPanel || el.cgPanel.classList.contains('hidden')) return;
    const c = el.cgCanvas;
    c.width = Math.floor(window.innerWidth * 0.6);
    c.height = Math.floor(window.innerHeight * 0.6);
    drawCGScene(c, state.cgMap || 'village', 0);
  }

  function nextCG(manual) {
    if (el.cgPanel.classList.contains('hidden')) return;
    state.cgIdx++;
    if (state.cgIdx >= state.cgLines.length) {
      el.cgPanel.classList.add('hidden');
      const cb = state.cgOnDone;
      state.cgOnDone = null;
      if (cb) cb();
      return;
    }
    el.cgLine.style.opacity = '0';
    el.cgLine.textContent = state.cgLines[state.cgIdx];
    void el.cgLine.offsetWidth;
    el.cgLine.style.transition = 'opacity .5s';
    el.cgLine.style.opacity = '1';
  }

  function cgOpen() { return !el.cgPanel.classList.contains('hidden'); }

  function tickCG(dt) {
    if (!cgOpen()) return;
    state.cgTimer += dt;
    drawCGScene(el.cgCanvas, state.cgMap || 'village', state.cgTimer);
  }

  /* ------------------------------ 死亡 ------------------------------ */

  function showDead(text) {
    el.deadText.textContent = text || '你的修为散于天地之间……';
    el.deadPanel.classList.remove('hidden');
  }
  function deadOpen() { return !el.deadPanel.classList.contains('hidden'); }

  /* ------------------------------ 挑战进度 ------------------------------ */

  function updateChallengeBar() {
    const bar = el.challengeBar;
    if (!bar) return;

    // 试炼塔 / 深渊优先显示
    let tw = null;
    try { tw = (typeof Tower !== 'undefined' && Tower.isActive()) ? Tower.state() : null; } catch (e) { }
    if (tw) {
      bar.classList.remove('hidden');
      bar.classList.add('tower-mode');
      if (tw.kind === 'abyss') bar.classList.add('abyss-mode'); else bar.classList.remove('abyss-mode');
      el.chName.textContent = tw.cfg.name + ' · 第 ' + tw.floor + ' 层';
      el.chTime.textContent = tw.phase === 'fight' ? Math.max(0, Math.ceil(tw.timeLeft)) + 's' : '待战';
      el.chProg.textContent = Tower.progressText();
      return;
    }
    bar.classList.remove('tower-mode');
    bar.classList.remove('abyss-mode');

    const ch = G.challenge;
    if (!ch || ch.state !== 'running') {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    el.chName.textContent = ch.def.name;
    el.chTime.textContent = Math.max(0, Math.ceil(ch.timeLeft)) + 's';
    let prog = '';
    if (ch.id === 'wave') {
      prog = '第 ' + Math.max(1, ch.waveIndex) + ' / 3 波';
    } else if (ch.id === 'timed') {
      prog = '击杀 ' + ch.killed + ' / ' + ch.need;
    } else {
      prog = ch.killed >= 1 ? '已击碎' : '击碎石傀';
    }
    el.chProg.textContent = prog;
  }

  /* ------------------------------ 任务追踪 ------------------------------ */

  function updateQuestTracker() {
    const e = el.questTracker;
    if (!e) return;
    let cur = null;
    try {
      for (const id in QUESTS) {
        const st = G.questStatus(id);
        if (st === 'ready') { cur = { q: QUESTS[id], st: st }; break; }
        if (st === 'active' && !cur) cur = { q: QUESTS[id], st: st };
      }
    } catch (err) { }
    if (!cur) { e.classList.add('hidden'); return; }

    const q = cur.q;
    const giver = NPCS[q.giver] || {};
    const mapName = giver.map && MAPS[giver.map] ? MAPS[giver.map].name : '此地';
    const objs = q.objectives.map((o) => G.objectiveText(q, o)).join('　');
    const ready = cur.st === 'ready';
    const folded = !!state.questCollapsed;
    e.classList.remove('hidden');
    e.classList.toggle('ready', ready);
    e.classList.toggle('folded', folded);
    e.innerHTML =
      '<div class="qt-head">' +
      '<span class="qt-name">' + q.name + (ready ? ' <i>可复命</i>' : '') + '</span>' +
      '<i class="qt-fold">' + (folded ? '▸' : '▾') + '</i>' +
      '</div>' +
      (folded ? '' :
        '<div class="qt-obj">' + objs + '</div>' +
        '<div class="qt-npc">' + (ready ? '回去找 ' : '寻 ') + giver.name + '　(' + mapName + ')</div>');
    const f = e.querySelector ? e.querySelector('.qt-fold') : null;
    if (f && f.addEventListener) {
      f.addEventListener('click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        state.questCollapsed = !state.questCollapsed;
        updateQuestTracker();
        Audio2.play('ui');
      });
    }
  }

  /* ------------------------------ 道行面板（点头像） ------------------------------ */

  function openStats() {
    let p = el.statsPanel;
    if (!p) {
      p = document.createElement('div');
      p.id = 'statsPanel';
      p.className = 'modal stats-modal hidden';
      document.getElementById('hud').appendChild(p);
      el.statsPanel = p;
      p.addEventListener('click', (ev) => { if (ev.target === p) closeStats(); });
    }
    const st = G.totalStats();
    const pl = G.player;
    const ti = G.currentTitle ? G.currentTitle() : null;
    let towerMax = 0, abyssMax = 0;
    try { towerMax = Tower.maxFloor('tower'); abyssMax = Tower.maxFloor('abyss'); } catch (e) { }
    let totalExp = 0;
    try { totalExp = Rank.totalExpOf(pl.level, pl.exp); } catch (e) { }

    const row = (k, v) => '<div class="srow"><span>' + k + '</span><b>' + v + '</b></div>';
    p.innerHTML =
      '<div class="modal-head"><span>道 行 录</span><button class="x-btn" id="statsClose">✕</button></div>' +
      '<div class="stats-hero"><canvas class="stats-face" width="120" height="150"></canvas>' +
      '<div class="stats-name">' + pl.name + '<em>' + (ti ? ti.name : '未佩称号') + '</em></div></div>' +
      '<div class="stats-grid">' +
      row('流派', PATHS[pl.path].name) + row('境界', realmName(pl.level)) +
      row('灵根', (function () {
        const r = G.getRoot ? G.getRoot() : null;
        if (!r) return '未测';
        return '<span style="color:' + r.color + '">' + r.name + '</span>';
      })()) +
      row('修炼倍率', (function () {
        const r = G.getRoot ? G.getRoot() : null;
        return r && r.mod ? ('×' + r.mod.exp.toFixed(2)) : '×1.00';
      })()) +
      row('攻击', st.atk.toFixed(1)) + row('防御', st.def.toFixed(1)) +
      row('气血', Math.round(pl.hpMax)) + row('灵力', Math.round(pl.qiMax)) +
      row('暴击', (st.crit * 100).toFixed(1) + '%') + row('回灵', st.qiRegen.toFixed(1) + '/秒') +
      row('攻速加成', Math.round((st.atkSpd || 0) * 100) + '%') +
      row('身法', Math.round(st.speed)) + row('灵石', pl.stones) +
      row('修为进度', Math.floor(pl.exp) + ' / ' + expNeed(pl.level) +
        (G.isBottleneck && G.isBottleneck() ? '　<span style="color:#ff9a5a">【瓶颈】</span>' : '')) +
      row('修为总值', Math.round(totalExp).toLocaleString()) +
      row('斩杀妖兽', G.totalKills || 0) +
      row('试炼塔', towerMax + ' 层') + row('深渊', abyssMax + ' 层') +
      '</div>';
    p.classList.remove('hidden');
    setOverlay(true);
    try {
      const face = p.querySelector ? p.querySelector('canvas') : null;
      if (face) drawPortraitFull(face, 'p_' + pl.path, playerSpec(pl.path, pl.look));
    } catch (e) { }
    const b = document.getElementById('statsClose');
    if (b && b.addEventListener) b.addEventListener('click', closeStats);
    Audio2.play('ui');
  }

  function closeStats() {
    if (el.statsPanel) el.statsPanel.classList.add('hidden');
    setOverlay(false);
  }

  /* ------------------------------ 通用 ------------------------------ */

  /** 全屏覆盖：打开大界面时隐藏 HUD 其它元素（含手机摇杆与技能键） */
  function setOverlay(on) {
    const hud = document.getElementById('hud');
    if (hud && hud.classList) hud.classList.toggle('overlay', !!on);
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.toggle('ui-overlay', !!on);
    }
    try { if (typeof Touch !== 'undefined' && Touch.setHidden) Touch.setHidden(!!on); } catch (e) { }
  }

  function modalOpen() {
    let extra = false;
    try { extra = typeof Panels !== 'undefined' && Panels.anyOpen(); } catch (e) { }
    return extra || dialogueOpen() || bagOpen() || shopOpen() || questOpen() ||
      cgOpen() || deadOpen() || !el.createPanel.classList.contains('hidden');
  }

  return {
    init, toast, showInteract, hideInteract, updateHUD,
    buildSkillBar, updateSkills, refreshPortrait, updateChallengeBar, updateQuestTracker,
    updateBossBar,
    openDialogue, closeDialogue, dialogueOpen,
    openBag, closeBag, renderBag, bagOpen,
    openShop, closeShop, renderShop, shopOpen,
    openQuests, closeQuests, questOpen, renderQuests,
    openCreate, openCustomize, showCG, nextCG, cgOpen, tickCG, resizeCG,
    showDead, deadOpen, modalOpen, setOverlay, openStats, closeStats,
    state
  };
})();
