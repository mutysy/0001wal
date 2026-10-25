'use strict';

/* =========================================================================
   青云界 · 图鉴
   收录所有装备 / 丹药 / 材料 / 秘法，标注品质、属性、获取途径与合成方式
   ========================================================================= */

const Codex = (function () {
  let G = null;
  let panel = null;
  let tab = 'weapon';
  let sel = null;

  const TABS = [
    { id: 'weapon', name: '兵 器', kinds: ['weapon'] },
    { id: 'body', name: '护 体', kinds: ['body'] },
    { id: 'charm', name: '饰 品', kinds: ['charm'] },
    { id: 'cloth', name: '服 饰', kinds: ['cloth'] },
    { id: 'pill', name: '丹 药', kinds: ['pill'] },
    { id: 'mat', name: '材 料', kinds: ['mat'] },
    { id: 'manual', name: '秘 法', kinds: ['manual'] }
  ];

  function $(id) { return document.getElementById(id); }

  function init(game) { if (!G) G = game; }

  function seen() {
    const sd = G ? G.saveData() : null;
    if (!sd) return {};
    if (!sd.seenItems) sd.seenItems = {};
    return sd.seenItems;
  }

  function markSeen(id) {
    const s = seen();
    if (s[id]) return;
    s[id] = true;
    try { G.persistNow(); } catch (e) { }
  }

  /** 把当前身家（行囊 + 已佩）一次性记为已收录 */
  function sweep() {
    if (!G || !G.player) return;
    const s = seen();
    const p = G.player;
    (p.bag || []).forEach(function (it) { if (it && it.id) s[it.id] = true; });
    const eq = p.equipped || {};
    for (const k in eq) if (eq[k] && eq[k].id) s[eq[k].id] = true;
    try { G.persistNow(); } catch (e) { }
  }

  function isSeen(id) { return !!seen()[id]; }

  /** 某道具的全部获取途径 */
  function sourcesOf(id) {
    const out = [];
    const d = ITEMS[id];
    if (!d) return out;

    if (typeof SHOP_GOODS_STOCK !== 'undefined' && SHOP_GOODS_STOCK.indexOf(id) >= 0) out.push('商铺 · 丹药杂货');
    if (typeof SHOP_GEAR_STOCK !== 'undefined' && SHOP_GEAR_STOCK.indexOf(id) >= 0) out.push('商铺 · 兵器护体');
    if (typeof SHOP_CLOTH_STOCK !== 'undefined' && SHOP_CLOTH_STOCK.indexOf(id) >= 0) out.push('商铺 · 服饰');

    if (typeof SECT !== 'undefined' && SECT && SECT.shop) {
      if (SECT.shop.some(function (g) { return g.id === id; })) out.push('宗门商店（贡献兑换）');
    }
    if (typeof ALCHEMY !== 'undefined') {
      const rc = ALCHEMY.filter(function (a) { return a.out && a.out.id === id; })[0];
      if (rc) out.push('炼丹炉 · ' + rc.name + '（' + rc.need.map(function (n) {
        return (ITEMS[n.id] ? ITEMS[n.id].name : n.id) + '×' + n.n;
      }).join(' + ') + '，炉费 ' + rc.fee + '）');
    }

    // 妖兽掉落
    const drops = [];
    if (typeof MONSTERS !== 'undefined') {
      for (const mt in MONSTERS) {
        const m = MONSTERS[mt];
        if ((m.drop || []).some(function (x) { return x.id === id; })) drops.push(m.name);
      }
    }
    if (drops.length) out.push('妖兽掉落：' + drops.slice(0, 5).join('、') + (drops.length > 5 ? ' 等' : ''));

    // 等级奖励
    if (typeof LEVEL_REWARDS !== 'undefined') {
      const lr = LEVEL_REWARDS.filter(function (r) {
        return (r.items || []).some(function (x) { return x.id === id; });
      });
      if (lr.length) out.push('等级奖励：' + lr.map(function (r) { return r.lv + ' 级'; }).join('、'));
    }

    // 任务奖励
    if (typeof QUESTS !== 'undefined') {
      const qs = [];
      for (const qid in QUESTS) {
        if ((QUESTS[qid].reward && QUESTS[qid].reward.items || []).some(function (x) { return x.id === id; })) {
          qs.push(QUESTS[qid].name);
        }
      }
      if (qs.length) out.push('任务奖励：' + qs.slice(0, 4).join('、'));
    }

    // 合成
    if (typeof isGearKind === 'function' && isGearKind(d.kind)) {
      out.push('装备合成：消耗 5 件低一品阶装备合成 1 件' + Gear.qName(Gear.defQ(id)) + '（见铸器面板）');
    }

    if (!out.length) out.push('首领掉落 / 秘境与副本产出');
    return out;
  }

  function itemsOf(t) {
    const out = [];
    for (const id in ITEMS) {
      if (t.kinds.indexOf(ITEMS[id].kind) >= 0) out.push(id);
    }
    // 按品质从高到低
    out.sort(function (a, b) {
      const qa = Gear.defQ(a), qb = Gear.defQ(b);
      if (qb !== qa) return qb - qa;
      return (ITEMS[a].price || 0) - (ITEMS[b].price || 0);
    });
    return out;
  }

  function tabProgress(t) {
    const list = itemsOf(t);
    let got = 0;
    for (const id of list) if (isSeen(id)) got++;
    return { got: got, total: list.length };
  }

  /* ------------------------------ 界面 ------------------------------ */

  function ensure() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'codexPanel';
    panel.className = 'modal gm-modal hidden';
    (document.getElementById('hud') || document.body).appendChild(panel);
  }

  function open(t) {
    ensure();
    if (t) tab = t;
    try { sweep(); } catch (e) { }
    render();
    panel.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    try { Audio2.play('ui'); } catch (e) { }
  }

  function close() {
    if (!panel) return;
    panel.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
  }

  function isOpen() {
    return !!panel && !panel.classList.contains('hidden');
  }

  function select(id) {
    sel = id || null;
    if (isOpen()) render();
  }

  function iconFor(id) {
    const d = ITEMS[id];
    const gear = typeof isGearKind === 'function' && isGearKind(d.kind);
    const size = gear ? 46 : 40;
    const cv = document.createElement('canvas');
    cv.width = size * 3;
    cv.height = size * 3;
    cv.style.width = size + 'px';
    cv.style.height = size + 'px';
    try {
      if (gear) GearArt.paint(cv, id, { q: Gear.defQ(id), t: 0 });
      else ItemIcons.paint(cv, id);
    } catch (e) { }
    return cv;
  }

  function render() {
    ensure();
    panel.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'modal-head';
    head.innerHTML = '<span>图 鉴</span><button class="x-btn gm-x" type="button">✕</button>';
    panel.appendChild(head);
    const xb = head.querySelector('.gm-x');
    if (xb) xb.addEventListener('click', close);

    const body = document.createElement('div');
    body.className = 'gm-body';
    panel.appendChild(body);

    // 总进度
    let allGot = 0, allTotal = 0;
    const tprog = {};
    TABS.forEach(function (t) {
      const pr = tabProgress(t);
      tprog[t.id] = pr;
      allGot += pr.got;
      allTotal += pr.total;
    });

    const tip = document.createElement('div');
    tip.className = 'gm-tip';
    tip.innerHTML = '点击任意条目可查看<b>品质、属性、获取途径与合成方式</b>。' +
      '　收录进度 <b>' + allGot + ' / ' + allTotal + '</b>' +
      (allGot >= allTotal && allTotal > 0 ? '　<span style="color:#ffd24a">已全部集齐</span>' : '');
    body.appendChild(tip);

    // 页签
    const tabs = document.createElement('div');
    tabs.className = 'gm-tabs';
    TABS.forEach(function (t) {
      const d = document.createElement('div');
      d.className = 'gm-tab' + (tab === t.id ? ' on' : '');
      d.textContent = t.name + ' ' + tprog[t.id].got + '/' + tprog[t.id].total;
      d.addEventListener('click', function () { tab = t.id; sel = null; render(); });
      tabs.appendChild(d);
    });
    body.appendChild(tabs);

    // 列表
    const t = TABS.filter(function (x) { return x.id === tab; })[0] || TABS[0];
    const list = itemsOf(t);

    const wrap = document.createElement('div');
    wrap.className = 'codex-wrap';

    const grid = document.createElement('div');
    grid.className = 'codex-grid';
    list.forEach(function (id) {
      const d = ITEMS[id];
      const known = isSeen(id);
      const q = Gear.defQ(id);
      const qc = Gear.qColor(q);
      const cell = document.createElement('div');
      cell.className = 'codex-cell' + (known ? '' : ' locked') + (sel === id ? ' sel' : '');
      if (known) cell.style.borderColor = qc + 'aa';
      cell.appendChild(iconFor(id));
      const nm = document.createElement('span');
      nm.className = 'cx-nm';
      nm.textContent = known ? d.name : '？？？';
      if (known) nm.style.color = qc;
      cell.appendChild(nm);
      const tag = document.createElement('span');
      tag.className = 'cx-q';
      tag.textContent = known ? Gear.qName(q) : '未获得';
      tag.style.color = known ? qc : '#66727c';
      cell.appendChild(tag);
      cell.addEventListener('click', function () {
        sel = (sel === id) ? null : id;
        if (known) markSeen(id);
        render();
      });
      grid.appendChild(cell);
    });
    wrap.appendChild(grid);

    // 详情
    const side = document.createElement('div');
    side.className = 'codex-detail';
    if (!sel || !ITEMS[sel]) {
      side.innerHTML = '<div class="detail-empty">选择一件查看详情</div>';
    } else {
      const d = ITEMS[sel];
      const known = isSeen(sel);
      const q = Gear.defQ(sel);
      const qc = Gear.qColor(q);
      const gear = typeof isGearKind === 'function' && isGearKind(d.kind);

      const stat = gear ? (Gear.statLine(Gear.make(sel)) || '无附加属性') : '';
      const useTxt = (function () {
        const u = d.use || {};
        const p = [];
        if (u.hp) p.push('回复气血 ' + u.hp);
        if (u.qi) p.push('回复灵力 ' + u.qi);
        if (u.hpMax) p.push('气血上限 +' + u.hpMax);
        if (u.qiMax) p.push('灵力上限 +' + u.qiMax);
        if (u.atk) p.push('攻击 +' + u.atk);
        if (u.def) p.push('防御 +' + u.def);
        if (u.crit) p.push('暴击 +' + (u.crit * 100).toFixed(1) + '%');
        if (u.expLevels) p.push('境界 +' + u.expLevels + ' 层');
        return p.join('　');
      })();

      const srcList = known ? sourcesOf(sel) : ['尚未获得，暂无法查看'];
      side.innerHTML =
        '<div class="cx-top">' +
        '<div class="cx-art"></div>' +
        '<div><div class="cx-name" style="color:' + qc + '">' + (known ? d.name : '？？？') + '</div>' +
        '<div class="cx-line" style="color:' + qc + '">' + Gear.qName(q) + ' · ' +
        (ITEM_KIND_NAME[d.kind] || '') + '</div>' +
        '<div class="cx-line dim">售价 ' + (d.sell || 0) + ' 灵石</div>' +
        '</div></div>' +
        (known
          ? ('<div class="cx-sec">属性</div><div class="cx-body">' +
            ((stat || useTxt) || d.desc || '—') + '</div>' +
            '<div class="cx-sec">获取方式</div><div class="cx-body"><ul>' +
            srcList.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>' +
            (GEAR_TRAIT[sel] ? '<div class="cx-trait">' + GEAR_TRAIT[sel] + '</div>' : ''))
          : ('<div class="cx-sec">获取方式</div><div class="cx-body dim">获得一次后即可在图鉴中查看完整信息</div>'));

      const art = side.querySelector('.cx-art');
      if (art) art.appendChild(iconFor(sel));
    }
    wrap.appendChild(side);
    body.appendChild(wrap);

    // 收齐奖励
    const foot = document.createElement('div');
    foot.className = 'modal-foot';
    let claimedAll = false;
    try { claimedAll = !!(G.saveData().codexRewardAll); } catch (e) { }
    const canAll = allGot >= allTotal && allTotal > 0 && !claimedAll;
    const btn = document.createElement('button');
    btn.className = 'btn' + (canAll ? ' gold' : '');
    btn.type = 'button';
    btn.textContent = claimedAll ? '集齐奖励已领' : (canAll ? '领取集齐奖励' : '集齐全部图鉴可领奖励');
    btn.disabled = !canAll;
    btn.addEventListener('click', function () {
      if (!canAll) return;
      try {
        const sd = G.saveData();
        sd.codexRewardAll = true;
        G.persistNow();
        G.addItem('pill_break_l', 1);
        G.addItem('mat_dragon', 3);
        G.addItem('ch_blood', 1);
        G.player.stones += 20000;
        G.player.contrib = (G.player.contrib || 0) + 3000;
        Audio2.play('levelup');
        UI.toast('图鉴集齐！大破境丹 ×1、龙涎草 ×3、血玉髓 ×1、灵石 +20000、贡献 +3000', 'gold');
      } catch (e) { }
      render();
    });
    foot.appendChild(btn);
    const cnt = document.createElement('span');
    cnt.className = 'dim';
    cnt.textContent = '收录 ' + allGot + ' / ' + allTotal;
    foot.appendChild(cnt);
    panel.appendChild(foot);
  }

  return { init, open, close, openPanel: open, isOpen, select, markSeen, mark: markSeen, sweep, isSeen, sourcesOf };
})();
