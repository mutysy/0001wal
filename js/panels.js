'use strict';

/* =========================================================================
   青云界 · v0.8 新界面
   属性升级 / 装备合成 / 商城 / 铁匠铺 / 炼丹炉 / 宗门 / 副本秘境 / 账号
   所有面板按需创建，避免一次性塞满 DOM
   ========================================================================= */

const Panels = (function () {
  let G = null;
  const S = { forgeSel: null, shopTab: 'goods', accTab: 'login' };
  const created = {};

  function $(id) { return document.getElementById(id); }
  function hud() { return document.getElementById('hud'); }

  /* ------------------------------ 通用 ------------------------------ */

  function mkModal(id, title, extraClass) {
    let root = $(id);
    if (root && created[id]) return root;
    root = document.createElement('div');
    root.id = id;
    root.className = 'modal ' + (extraClass || 'gm-modal') + ' hidden';
    root.innerHTML =
      '<div class="modal-head"><span>' + title + '</span>' +
      '<button class="x-btn gm-x" type="button">✕</button></div>' +
      '<div class="gm-body" id="' + id + 'Body"></div>' +
      '<div class="modal-foot" id="' + id + 'Foot"></div>';
    hud().appendChild(root);
    created[id] = true;
    const x = root.querySelector('.gm-x');
    if (x) x.addEventListener('click', (ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      close(root);
    });
    root.addEventListener('click', (ev) => { if (ev.target === root) close(root); });
    return root;
  }

  function open(root) {
    root.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    try { Audio2.play('ui'); } catch (e) { }
  }

  function close(root) {
    root.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) {
      if (!anyOpen()) UI.setOverlay(false);
    }
  }

  function isOpen(id) {
    if (!created[id]) return false;
    const n = $(id);
    return !!n && n.classList && !n.classList.contains('hidden');
  }

  function btn(label, cls, onClick, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || '');
    b.textContent = label;
    if (disabled) b.disabled = true;
    if (onClick) b.addEventListener('click', (ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      onClick();
    });
    return b;
  }

  function iconFor(it) {
    const cv = document.createElement('canvas');
    const gear = typeof isGearKind === 'function' && isGearKind(ITEMS[it.id].kind);
    const size = gear ? 44 : 34;
    const k = 3;   // 超采样，避免糊
    cv.width = size * k;
    cv.height = size * k;
    cv.className = gear ? 'gm-icon gear' : 'row-icon';
    if (cv.style) {
      cv.style.width = size + 'px';
      cv.style.height = size + 'px';
    }
    try {
      if (gear) GearArt.paint(cv, it.id, { q: typeof it.q === 'number' ? it.q : Gear.defQ(it.id), t: 0 });
      else ItemIcons.paint(cv, it.id);
    } catch (e) { }
    return cv;
  }

  function qTag(q) {
    const s = document.createElement('span');
    s.className = 'gm-qtag';
    s.textContent = Gear.qName(q);
    s.style.color = Gear.qColor(q);
    s.style.borderColor = Gear.qColor(q);
    return s;
  }

  function qOf(entry) {
    return (typeof entry.q === 'number') ? entry.q : Gear.defQ(entry.id);
  }

  /** 商城/商店每行的第二行：装备显示完整属性，丹药材料显示服用效果 */
  function effectLine(id, d) {
    const q = Gear.defQ(id);
    const qc = Gear.qColor(q);
    const qtag = '<span class="gm-q" style="color:' + qc + '">' + Gear.qName(q) + '</span>';

    if (isGearKind(d.kind)) {
      const st = Gear.statLine(Gear.make(id)) || '无附加属性';
      const trait = (typeof GEAR_TRAIT !== 'undefined' && GEAR_TRAIT[id])
        ? '<span class="gm-trait">' + GEAR_TRAIT[id] + '</span>' : '';
      return qtag +
        '<span class="gm-st">' + st + '</span>' +
        '<span class="gm-du">耐久 ' + (d.dur || 0) + '</span>' +
        trait;
    }

    const u = d.use || {};
    const parts = [];
    if (u.hp) parts.push('回复气血 ' + u.hp);
    if (u.qi) parts.push('回复灵力 ' + u.qi);
    if (u.hpFull) parts.push('回满气血');
    if (u.hpMax) parts.push('气血上限 +' + u.hpMax);
    if (u.qiMax) parts.push('灵力上限 +' + u.qiMax);
    if (u.atk) parts.push('攻击 +' + u.atk);
    if (u.def) parts.push('防御 +' + u.def);
    if (u.crit) parts.push('暴击 +' + Math.round(u.crit * 100) + '%');
    if (u.qiRegen) parts.push('回灵 +' + u.qiRegen);
    if (u.expLevels) parts.push('直接 +' + u.expLevels + ' 小境界');

    if (u.buff) {
      if (u.buff.aspd) parts.push('攻速 +' + Math.round(u.buff.aspd * 100) + '% / ' + u.buff.time + ' 秒');
      if (u.buff.move) parts.push('移速 +' + Math.round(u.buff.move * 100) + '% / ' + u.buff.time + ' 秒');
      if (u.buff.guard) parts.push('减伤 ' + Math.round(u.buff.guard * 100) + '% / ' + u.buff.time + ' 秒');
    }

    const txt = parts.length ? parts.join('　') : (d.desc || '');
    return qtag + '<span class="gm-st">' + txt + '</span>';
  }

  /* ==================================================================
     1. 属性升级（技能升级面板）
     ================================================================== */

  const STAT_ICON = {
    atk: (g) => {
      g.strokeStyle = '#ffb27a'; g.lineWidth = 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(7, 23); g.lineTo(21, 9); g.stroke();
      g.beginPath(); g.moveTo(17, 25); g.lineTo(3, 11); g.stroke();
      g.strokeStyle = '#ffe0b0'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(5, 21); g.lineTo(9, 25); g.stroke();
      g.beginPath(); g.moveTo(19, 19); g.lineTo(23, 23); g.stroke();
    },
    hp: (g) => {
      g.fillStyle = '#ff8f8f';
      g.beginPath();
      g.moveTo(12, 24);
      g.bezierCurveTo(-2, 14, 4, 5, 12, 11);
      g.bezierCurveTo(20, 5, 26, 14, 12, 24);
      g.fill();
      g.strokeStyle = '#ffd0d0'; g.lineWidth = 1.2; g.stroke();
    },
    def: (g) => {
      g.fillStyle = '#9fc4e0';
      g.beginPath();
      g.moveTo(12, 4); g.lineTo(21, 8); g.lineTo(21, 15);
      g.quadraticCurveTo(21, 23, 12, 25);
      g.quadraticCurveTo(3, 23, 3, 15);
      g.lineTo(3, 8);
      g.closePath();
      g.fill();
      g.strokeStyle = '#e0f0ff'; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = '#3a5a78'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(12, 9); g.lineTo(12, 20); g.stroke();
    },
    spd: (g) => {
      g.strokeStyle = '#a8f0c0'; g.lineWidth = 2.2; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(4 + i * 2, 8 + i * 5);
        g.quadraticCurveTo(12 + i * 2, 6 + i * 5, 22, 10 + i * 5);
        g.stroke();
      }
    },
    aspd: (g) => {
      g.fillStyle = '#ffe07a';
      g.beginPath();
      g.moveTo(14, 3); g.lineTo(6, 14); g.lineTo(11, 14);
      g.lineTo(9, 25); g.lineTo(19, 12); g.lineTo(13, 12);
      g.closePath();
      g.fill();
      g.strokeStyle = '#fff3c0'; g.lineWidth = 1; g.stroke();
    }
  };

  function SkillUp_open() {
    if (!G) return;
    const root = mkModal('skillUpPanel', '淬 体 炼 神');
    const body = $('skillUpPanelBody');
    const foot = $('skillUpPanelFoot');
    render();

    function render() {
      const p = G.player;
      const st = G.totalStats();
      body.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'gm-hero';
      head.innerHTML =
        '<div class="gm-hero-line">灵石 <b id="suStone">' + p.stones + '</b>' +
        '　攻 ' + st.atk.toFixed(0) + '　防 ' + st.def.toFixed(0) +
        '　血 ' + Math.round(st.hpMax) + '　攻速 ' + (st.atkSpd * 100).toFixed(0) + '%</div>';
      body.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'su-grid';
      STAT_UP.forEach((def) => {
        const lv = (p.statUp && p.statUp[def.id]) || 0;
        const maxed = lv >= STAT_UP_MAX;
        const cost = maxed ? 0 : statUpCost(def, lv);
        const afford = p.stones >= cost;

        const card = document.createElement('div');
        card.className = 'su-card' + (maxed ? ' maxed' : '') + (afford ? '' : ' poor');

        const cv = document.createElement('canvas');
        cv.width = 28; cv.height = 28;
        cv.className = 'su-icon';
        const g2 = cv.getContext('2d');
        g2.clearRect(0, 0, 28, 28);
        try { STAT_ICON[def.icon](g2); } catch (e) { }
        card.appendChild(cv);

        const info = document.createElement('div');
        info.className = 'su-info';
        info.innerHTML =
          '<div class="su-name">' + def.name + ' <em>Lv.' + lv + ' / ' + STAT_UP_MAX + '</em></div>' +
          '<div class="su-desc">' + def.desc + '　当前 +' +
          (def.id === 'aspd' ? (lv * 5) + '%' : (lv * def.per).toFixed(def.id === 'atk' ? 1 : 0)) + '</div>' +
          '<div class="su-bar"><i style="width:' + (lv / STAT_UP_MAX * 100).toFixed(1) + '%"></i></div>';
        card.appendChild(info);

        const act = btn(maxed ? '已满' : ('提升 ' + cost), 'gold su-btn', () => {
          if (G.upgradeStat(def.id)) render();
        }, maxed || !afford);
        card.appendChild(act);
        grid.appendChild(card);
      });
      body.appendChild(grid);

      const tip = document.createElement('div');
      tip.className = 'gm-tip';
      tip.textContent = '灵石可在商铺出售物品、击杀妖兽、开启宝箱与副本中获得。属性永久生效。';
      body.appendChild(tip);

      foot.innerHTML = '<span>属性升级</span><span class="dim">Esc 关闭</span>';
    }

    open(root);
  }

  /* ==================================================================
     2. 装备合成
     ================================================================== */

  function Forge_open() {
    if (!G) return;
    const root = mkModal('forgePanel', '铸 器 · 合 成');
    const body = $('forgePanelBody');
    const foot = $('forgePanelFoot');
    render();

    function render() {
      const p = G.player;
      body.innerHTML = '';

      const info = document.createElement('div');
      info.className = 'gm-tip';
      info.innerHTML = '规则：<b>' + MERGE_CFG.need + ' 件同品质装备</b> 可合成 1 件高一品质的装备。<br>' +
        '先点选作为「主器」的那一件，其余同品质装备会被吞入其中。';
      body.appendChild(info);

      const list = document.createElement('div');
      list.className = 'fg-list';

      const gearEntries = [];
      p.bag.forEach((e, i) => {
        const d = ITEMS[e.id];
        if (!d || !isGearKind(d.kind)) return;
        gearEntries.push({ e: e, i: i });
      });

      if (!gearEntries.length) {
        const empty = document.createElement('div');
        empty.className = 'quest-empty';
        empty.textContent = '行囊里没有可合成的装备';
        list.appendChild(empty);
      }

      // 按品质分组展示
      for (let q = 0; q <= MERGE_CFG.maxQ; q++) {
        const group = gearEntries.filter((x) => qOf(x.e) === q);
        if (!group.length) continue;
        const gh = document.createElement('div');
        gh.className = 'fg-ghead';
        gh.innerHTML = '　' + Gear.qName(q) + ' 品　<em>' + group.length + ' 件</em>';
        gh.style.color = Gear.qColor(q);
        list.appendChild(gh);

        for (const x of group) {
          const d = ITEMS[x.e.id];
          const row = document.createElement('div');
          row.className = 'fg-row' + (S.forgeSel === x.i ? ' sel' : '');
          if (S.forgeSel === x.i) { row.style.borderColor = Gear.qColor(q); row.style.boxShadow = '0 0 14px ' + Gear.qColor(q) + '55'; }

          row.appendChild(iconFor(x.e));
          const nm = document.createElement('div');
          nm.className = 'fg-nm';
          nm.innerHTML = '<b style="color:' + Gear.qColor(q) + '">' + d.name + '</b>' +
            (x.e.lv ? ' <em>+' + x.e.lv + '</em>' : '') +
            '<div class="fg-sub">' + SLOT_NAME[d.kind] + '　' + Gear.statLine(x.e) + '</div>';
          row.appendChild(nm);

          const mark = document.createElement('span');
          mark.className = 'fg-mark';
          mark.textContent = S.forgeSel === x.i ? '主器' : '选择';
          row.appendChild(mark);

          row.addEventListener('click', () => {
            S.forgeSel = (S.forgeSel === x.i) ? null : x.i;
            render();
          });
          list.appendChild(row);
        }
      }
      body.appendChild(list);

      // 选中后的合成条件
      const panel = document.createElement('div');
      panel.className = 'fg-confirm';
      if (S.forgeSel === null || !p.bag[S.forgeSel]) {
        panel.innerHTML = '<span class="dim">请选择一件主器</span>';
      } else {
        const base = p.bag[S.forgeSel];
        const d = ITEMS[base.id];
        const q = qOf(base);
        if (q >= MERGE_CFG.maxQ) {
          panel.innerHTML = '<span style="color:#ff9a8a">仙品已是极致，无法再合</span>';
        } else {
          let same = 0;
          p.bag.forEach((e, i) => {
            if (i === S.forgeSel) return;
            const dd = ITEMS[e.id];
            if (!dd || !isGearKind(dd.kind)) return;
            if (qOf(e) !== q) return;
            same++;
          });
          const need = MERGE_CFG.need - 1;
          const fee = Gear.mergeFee(q);
          const ok = same >= need && p.stones >= fee;
          panel.innerHTML =
            '<div class="fg-c1">' + d.name + ' → <b style="color:' + Gear.qColor(q + 1) + '">' +
            Gear.qName(q + 1) + '</b> 品</div>' +
            '<div class="fg-c2">同品素材 ' + same + ' / ' + need + '　费用 ' + fee + ' 灵石</div>';
          const b = btn('合 成', 'gold', () => {
            if (G.mergeGear(S.forgeSel)) { S.forgeSel = null; render(); }
          }, !ok);
          panel.appendChild(b);
        }
      }
      body.appendChild(panel);

      foot.innerHTML = '<span>灵石 ' + p.stones + '</span><span class="dim">合成后品质提升，属性大幅增强</span>';
    }

    open(root);
  }

  /* ==================================================================
     3. 商城（购买 / 出售）
     ================================================================== */

  const SHOP_TABS = [
    { id: 'goods', name: '丹 药 · 杂 货' },
    { id: 'gear', name: '兵 器 · 护 体' },
    { id: 'cloth', name: '服 饰' },
    { id: 'sell', name: '出 售' }
  ];

  function Shop_open(tab) {
    if (!G) return;
    if (tab) S.shopTab = tab;
    const root = mkModal('gmShopPanel', '青 云 商 铺');
    const body = $('gmShopPanelBody');
    const foot = $('gmShopPanelFoot');
    render();

    function render() {
      const p = G.player;
      body.innerHTML = '';

      const tabs = document.createElement('div');
      tabs.className = 'gm-tabs';
      SHOP_TABS.forEach((t) => {
        const d = document.createElement('div');
        d.className = 'gm-tab' + (S.shopTab === t.id ? ' on' : '');
        d.textContent = t.name;
        d.addEventListener('click', () => { S.shopTab = t.id; render(); });
        tabs.appendChild(d);
      });
      body.appendChild(tabs);

      const list = document.createElement('div');
      list.className = 'list gm-list';

      if (S.shopTab === 'sell') {
        if (!p.bag.length) {
          list.innerHTML = '<div class="quest-empty">行囊空空</div>';
        }
        p.bag.forEach((e, i) => {
          const d = ITEMS[e.id];
          if (!d) return;
          const row = document.createElement('div');
          row.className = 'row gm-row gm-row-2';
          row.appendChild(iconFor(e));
          const nm = document.createElement('span');
          nm.className = 'nm';
          nm.textContent = d.name + (e.n > 1 ? ' ×' + e.n : '') +
            (isGearKind(d.kind) ? '  ' + Gear.qName(qOf(e)) + (e.lv ? ' +' + e.lv : '') : '');
          row.appendChild(nm);
          const pr = document.createElement('span');
          pr.className = 'pr sell';
          pr.textContent = G.sellPriceOf(e);
          row.appendChild(pr);
          const sub = document.createElement('div');
          sub.className = 'gm-sub';
          if (isGearKind(d.kind)) {
            sub.innerHTML = '<span class="gm-st">' + (Gear.statLine(e) || '无附加属性') + '</span>' +
              '<span class="gm-du">耐久 ' + Math.round(e.dur === undefined ? (e.durMax || 0) : e.dur) +
              ' / ' + Math.round(e.durMax || 0) + '</span>';
          } else {
            sub.innerHTML = effectLine(e.id, d);
          }
          row.appendChild(sub);
          row.addEventListener('click', () => {
            G.sellBagAt(i, 1);
            render();
          });
          list.appendChild(row);
        });
      } else {
        let pool = [];
        if (S.shopTab === 'goods') pool = SHOP_GOODS_STOCK;
        else if (S.shopTab === 'gear') pool = SHOP_GEAR_STOCK;
        else pool = SHOP_CLOTH_STOCK;

        // 卡片式货架（与菜单界面同一套视觉语言）
        const grid = document.createElement('div');
        grid.className = 'shop-grid';
        list.appendChild(grid);
        list.classList.remove('gm-list');
        list.classList.add('gm-gridwrap');

        for (const id of pool) {
          const d = ITEMS[id];
          if (!d) continue;
          // 装备只卖白 / 绿 / 蓝品质
          if (S.shopTab === 'gear' && SHOP_GEAR_Q.indexOf(Gear.defQ(id)) < 0) continue;

          const price = G.priceOf(id);
          const afford = p.stones >= price;
          const q = Gear.defQ(id);
          const qc = Gear.qColor(q);
          const gear = isGearKind(d.kind);

          const card = document.createElement('div');
          card.className = 'shop-card r' + (q + 1) + (afford ? '' : ' poor');
          card.style.setProperty('--rc1', qc);
          card.style.setProperty('--rc2', qc);

          const art = document.createElement('div');
          art.className = 'sc-art';
          const cv = iconFor({ id: id, q: q });
          art.appendChild(cv);
          card.appendChild(art);

          const nm = document.createElement('div');
          nm.className = 'sc-name';
          nm.style.color = qc;
          nm.textContent = d.name;
          card.appendChild(nm);

          const tierEl = document.createElement('div');
          tierEl.className = 'sc-tier';
          tierEl.innerHTML = '<span>' + Gear.qName(q) + '</span><em>' +
            (gear ? SLOT_NAME[d.kind] : (ITEM_KIND_NAME[d.kind] || '')) + '</em>';
          card.appendChild(tierEl);

          const st = document.createElement('div');
          st.className = 'sc-stats';
          st.innerHTML = effectLine(id, d);
          card.appendChild(st);

          const footRow = document.createElement('div');
          footRow.className = 'sc-foot';
          const pr = document.createElement('span');
          pr.className = 'sc-price';
          pr.innerHTML = '<b>' + price + '</b>灵石';
          footRow.appendChild(pr);
          footRow.appendChild(btn('购 买', 'gold sc-buy', () => { G.buyItem(id); render(); }, !afford));
          card.appendChild(footRow);

          grid.appendChild(card);
        }
      }

      body.appendChild(list);
      foot.innerHTML = '<span>灵石 ' + p.stones + '</span><span class="dim">点击「购买」买入 / 在「出售」页卖出</span>';
    }

    open(root);
  }

  /* ==================================================================
     4. 铁匠铺（修补 / 升级）
     ================================================================== */

  function Smith_open() {
    if (!G) return;
    const root = mkModal('smithPanel', '雷 记 铁 铺');
    const body = $('smithPanelBody');
    const foot = $('smithPanelFoot');
    render();

    function render() {
      const p = G.player;
      body.innerHTML = '';

      const tip = document.createElement('div');
      tip.className = 'gm-tip';
      tip.textContent = '装备会随战斗磨损，耐久归零后属性只剩三成。修补需对应材料与灵石，淬炼可用灵石提升装备等级。';
      body.appendChild(tip);

      const wrap = document.createElement('div');
      wrap.className = 'sm-wrap';

      GEAR_SLOTS.forEach((slot) => {
        const inst = p.equip[slot];
        const card = document.createElement('div');
        card.className = 'sm-card';

        if (!inst) {
          card.innerHTML = '<div class="sm-empty">' + SLOT_NAME[slot] + '　未佩戴</div>';
          wrap.appendChild(card);
          return;
        }

        const d = ITEMS[inst.id];
        const q = qOf(inst);
        card.style.borderColor = Gear.qColor(q) + '99';

        const hd = document.createElement('div');
        hd.className = 'sm-head';
        hd.innerHTML = '<span style="color:' + Gear.qColor(q) + '">' + d.name + '</span>' +
          (inst.lv ? '<em class="sm-lv">+' + inst.lv + '</em>' : '') +
          '<span class="sm-slot">' + SLOT_NAME[slot] + '</span>';
        card.appendChild(hd);

        const art = document.createElement('canvas');
        art.width = 86; art.height = 86;
        art.className = 'sm-art';
        try { GearArt.paint(art, inst.id, { q: q, t: 0 }); } catch (e) { }
        card.appendChild(art);

        const durRatio = Gear.durRatio(inst);
        const durTxt = inst.dur === undefined ? '—'
          : Math.round(inst.dur) + ' / ' + Math.round(inst.durMax || 0);
        const durCol = durRatio > 0.5 ? '#8fe0a0' : durRatio > 0.2 ? '#ffd166' : '#ff6a6a';
        const dur = document.createElement('div');
        dur.className = 'sm-dur';
        dur.innerHTML = '<div class="sm-durbar"><i style="width:' + (durRatio * 100).toFixed(1) +
          '%;background:' + durCol + '"></i></div><span>耐久 ' + durTxt + '</span>';
        card.appendChild(dur);

        const stat = document.createElement('div');
        stat.className = 'sm-stat';
        stat.textContent = Gear.statLine(inst) || '无附加属性';
        card.appendChild(stat);

        const need = Gear.repairNeed(inst);
        const acts = document.createElement('div');
        acts.className = 'sm-acts';

        if (need) {
          const have = G.bagCount(need.mat);
          const canRep = have >= need.matN && p.stones >= need.stones;
          acts.appendChild(btn('修补（' + ITEMS[need.mat].name + '×' + need.matN + ' + ' + need.stones + '）',
            'gold gm-wide', () => { if (G.repairGear(slot)) render(); }, !canRep));
        } else {
          acts.appendChild(btn('完好无损', '', null, true));
        }

        const maxed = !Gear.canUpgrade(inst);
        const ucost = maxed ? 0 : Gear.upgradeCost(inst);
        acts.appendChild(btn(maxed ? '已满级' : ('淬炼 +' + ((inst.lv || 0) + 1) + '（' + ucost + '）'),
          'gold gm-wide', () => { if (G.upgradeGear(slot)) render(); }, maxed || p.stones < ucost));

        card.appendChild(acts);
        wrap.appendChild(card);
      });

      body.appendChild(wrap);

      const matLine = document.createElement('div');
      matLine.className = 'gm-tip';
      matLine.innerHTML = '修补材料：玄铁锭 <b>' + G.bagCount('mat_iron') + '</b>　灵蚕丝 <b>' +
        G.bagCount('mat_silk') + '</b>　妖筋 <b>' + G.bagCount('mat_sinew') + '</b>';
      body.appendChild(matLine);

      foot.innerHTML = '<span>灵石 ' + p.stones + '</span><span class="dim">耐久只在战斗与受击中损耗</span>';
    }

    open(root);
  }

  /* ==================================================================
     5. 炼丹炉
     ================================================================== */

  function Alchemy_open() {
    if (!G) return;
    const root = mkModal('alchemyPanel', '丹 炉 · 炼 药');
    const body = $('alchemyPanelBody');
    const foot = $('alchemyPanelFoot');
    render();

    function render() {
      const p = G.player;
      body.innerHTML = '';

      const tip = document.createElement('div');
      tip.className = 'gm-tip';
      tip.innerHTML = '以药材入炉，可炼出高阶丹药。丹修有成丹加成，偶得多一枚。' +
        '<br>已炼成丹：<b>' + (p.alchCount || 0) + '</b> 炉';
      body.appendChild(tip);

      const list = document.createElement('div');
      list.className = 'al-list';

      ALCHEMY.forEach((rc) => {
        const out = ITEMS[rc.out.id];
        const card = document.createElement('div');
        card.className = 'al-card';

        const head = document.createElement('div');
        head.className = 'al-head';
        head.appendChild(iconFor({ id: rc.out.id, q: Gear.defQ(rc.out.id) }));
        head.innerHTML += '<div class="al-title"><b style="color:' + Gear.qColor(Gear.defQ(rc.out.id)) + '">' +
          out.name + '</b><em>' + rc.desc + '</em></div>';
        card.appendChild(head);

        const needs = document.createElement('div');
        needs.className = 'al-needs';
        let ok = true;
        for (const nd of rc.need) {
          const have = G.bagCount(nd.id);
          if (have < nd.n) ok = false;
          const s = document.createElement('span');
          s.className = 'al-need' + (have >= nd.n ? ' ok' : '');
          s.innerHTML = (ITEMS[nd.id] ? ITEMS[nd.id].name : nd.id) + ' ' + have + '/' + nd.n;
          needs.appendChild(s);
        }
        card.appendChild(needs);

        const feeOk = p.stones >= rc.fee;
        const act = document.createElement('div');
        act.className = 'al-act';
        act.innerHTML = '<span class="al-fee">' + rc.fee + ' 灵石</span>';
        act.appendChild(btn('开 炉', 'gold', () => { if (G.craftAlchemy(rc.id)) render(); }, !ok || !feeOk));
        card.appendChild(act);

        list.appendChild(card);
      });

      body.appendChild(list);
      foot.innerHTML = '<span>灵石 ' + p.stones + '</span><span class="dim">药材可在野外采集、商铺购买</span>';
    }

    open(root);
  }

  /* ==================================================================
     6. 宗门
     ================================================================== */

  function Sect_open() {
    if (!G) return;
    const root = mkModal('sectPanel', '青 云 宗');
    const body = $('sectPanelBody');
    const foot = $('sectPanelFoot');
    render();

    function render() {
      const p = G.player;
      const rank = G.sectRank();
      body.innerHTML = '';

      const hero = document.createElement('div');
      hero.className = 'sec-hero';
      hero.innerHTML =
        '<div class="sec-name">' + SECT.name + '</div>' +
        '<div class="sec-motto">' + SECT.motto + '</div>' +
        '<div class="sec-rank" style="color:' + rank.color + '">' + rank.name + '</div>' +
        '<div class="sec-contrib">宗门贡献 <b>' + (p.contrib || 0) + '</b></div>';
      body.appendChild(hero);

      // 位阶进度
      const next = SECT.ranks.filter((r) => r.need > (p.contrib || 0))[0];
      const bar = document.createElement('div');
      bar.className = 'sec-bar';
      if (next) {
        const prev = rank.need;
        const k = Math.max(0, Math.min(1, ((p.contrib || 0) - prev) / Math.max(1, next.need - prev)));
        bar.innerHTML = '<div class="sec-barline"><i style="width:' + (k * 100).toFixed(1) + '%"></i></div>' +
          '<span>距「' + next.name + '」还需 ' + Math.max(0, next.need - (p.contrib || 0)) + ' 贡献</span>';
      } else {
        bar.innerHTML = '<span>已至最高位阶</span>';
      }
      body.appendChild(bar);

      // 宗门任务
      const th = document.createElement('div');
      th.className = 'sec-sub';
      th.textContent = '宗 门 任 务';
      body.appendChild(th);

      const pr = p.sectProg || { kill: 0, dungeon: 0, tower: 0 };
      const tl = document.createElement('div');
      tl.className = 'sec-tasks';
      SECT.tasks.forEach((t) => {
        const ready = G.sectTaskReady(t);
        let prog = '', cur = 0, needNum = 0;
        if (t.need.kill) { cur = pr.kill || 0; needNum = t.need.kill; prog = '已斩 ' + cur + ' / ' + needNum; }
        else if (t.need.item) { cur = G.bagCount(t.need.item); needNum = t.need.n; prog = ITEMS[t.need.item].name + ' ' + cur + ' / ' + needNum; }
        else if (t.need.dungeon) { cur = pr.dungeon || 0; needNum = t.need.dungeon; prog = '副本 ' + cur + ' / ' + needNum; }
        else if (t.need.tower) { cur = pr.tower || 0; needNum = t.need.tower; prog = '登塔 ' + cur + ' / ' + needNum; }

        const done = cur >= needNum;
        const row = document.createElement('div');
        row.className = 'sec-task' + (done ? ' done' : '') + (ready ? '' : ' cd');
        row.innerHTML = '<div class="st-name">' + t.name + '</div>' +
          '<div class="st-desc">' + t.desc + '　<span class="' + (done ? 'ok' : '') + '">' + prog + '</span></div>' +
          '<div class="st-rw">贡献 +' + t.reward.contrib + '　灵石 +' + t.reward.stones + '</div>';
        const act = btn(ready ? '提交' : '冷却中', 'gold', () => { if (G.sectAccept(t.id)) render(); }, !ready || !done);
        row.appendChild(act);
        tl.appendChild(row);
      });
      body.appendChild(tl);

      // 宗门商店
      const sh = document.createElement('div');
      sh.className = 'sec-sub';
      sh.textContent = '宗 门 商 店（以贡献兑换）';
      body.appendChild(sh);

      const sl = document.createElement('div');
      sl.className = 'list gm-list sec-shop';
      SECT.shop.forEach((g2, idx) => {
        const d = ITEMS[g2.id];
        if (!d) return;
        const afford = (p.contrib || 0) >= g2.cost;
        const row = document.createElement('div');
        row.className = 'row gm-row gm-row-2' + (afford ? '' : ' disabled');
        row.appendChild(iconFor({ id: g2.id, q: Gear.defQ(g2.id) }));
        const nm = document.createElement('span');
        nm.className = 'nm';
        nm.innerHTML = '<b style="color:' + Gear.qColor(Gear.defQ(g2.id)) + '">' + d.name +
          (g2.n > 1 ? ' ×' + g2.n : '') + '</b>';
        row.appendChild(nm);
        const pr2 = document.createElement('span');
        pr2.className = 'pr';
        pr2.textContent = g2.cost + ' 贡献';
        row.appendChild(pr2);
        row.appendChild(btn('兑', 'gold gm-buy', () => { if (G.sectBuy(idx)) render(); }, !afford));
        const sub = document.createElement('div');
        sub.className = 'gm-sub';
        sub.innerHTML = effectLine(g2.id, d);
        row.appendChild(sub);
        sl.appendChild(row);
      });
      body.appendChild(sl);

      // 宗门战争
      if (G.sectRivals) {
        const wh = document.createElement('div');
        wh.className = 'sec-sub';
        wh.textContent = '宗 门 战 争（胜者夺取对方半数资源）';
        body.appendChild(wh);

        const rivals = G.sectRivals();
        const grid = document.createElement('div');
        grid.className = 'war-grid';
        rivals.forEach((r) => {
          const card = document.createElement('div');
          card.className = 'war-card' + (r.locked ? ' locked' : '');
          card.style.borderColor = r.color + '88';
          card.innerHTML =
            '<div class="wc-top"><b style="color:' + r.color + '">' + r.name + '</b>' +
            '<em>' + (r.locked ? ('需 ' + r.reqLv + ' 级') : ('战力 ×' + r.power)) + '</em></div>' +
            '<div class="wc-desc">' + r.desc + '</div>' +
            '<div class="wc-res"><span>灵石 <b>' + r.wealth + '</b></span>' +
            '<span>贡献 <b>' + r.contrib + '</b></span>' +
            '<span>胜 ' + r.wins + ' / 负 ' + r.lost + '</span></div>';
          const act = document.createElement('div');
          act.className = 'wc-act';
          act.appendChild(btn('宣 战', 'gold', () => {
            if (G.declareWar(r.id)) { close(root); render(); }
          }, !r.canWar));
          card.appendChild(act);
          grid.appendChild(card);
        });
        body.appendChild(grid);
      }

      foot.innerHTML = '<span>贡献 ' + (p.contrib || 0) + '</span><span class="dim">贡献由宗门任务获得</span>';
    }

    open(root);
  }

  /* ==================================================================
     7. 副本 & 秘境
     ================================================================== */

  function Dungeon_open() {
    if (!G) return;
    const root = mkModal('dungeonPanel', '副 本 · 秘 境');
    const body = $('dungeonPanelBody');
    const foot = $('dungeonPanelFoot');
    render();

    function render() {
      const p = G.player;
      body.innerHTML = '';

      // 秘境状态
      const sec = G.secretState();
      const secBox = document.createElement('div');
      secBox.className = 'dg-secret' + (sec.open ? ' open' : '');
      secBox.innerHTML =
        '<div class="dgs-title">' + SECRET_REALM.name + '</div>' +
        '<div class="dgs-desc">' + SECRET_REALM.desc + '</div>' +
        '<div class="dgs-state">' + (sec.open
          ? '开启中　剩余 <b>' + sec.left + '</b> 秒'
          : '下次开启还需 <b>' + sec.next + '</b> 秒') + '</div>';
      const sbtn = btn(sec.open ? '踏入秘境' : '尚未开启', 'gold', () => {
        if (G.enterSecret()) close(root);
      }, !sec.open);
      secBox.appendChild(sbtn);
      body.appendChild(secBox);

      const sub = document.createElement('div');
      sub.className = 'sec-sub';
      sub.textContent = '副 本 列 表';
      body.appendChild(sub);

      const wrap = document.createElement('div');
      wrap.className = 'dg-wrap';

      DUNGEONS.forEach((dg) => {
        const clears = (p.dungeonClears || {})[dg.id] || 0;
        const card = document.createElement('div');
        card.className = 'dg-card';
        card.style.borderColor = dg.color + '88';

        const cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        cv.className = 'dg-art';
        try { drawDungeonArt(cv, dg.theme, dg.color); } catch (e) { }
        card.appendChild(cv);

        const info = document.createElement('div');
        info.className = 'dg-info';
        info.innerHTML =
          '<div class="dg-name" style="color:' + dg.color + '">' + dg.name + '</div>' +
          '<div class="dg-rec">推荐等级 ' + dg.recLv + '　踏破 ' + clears + ' 次</div>' +
          '<div class="dg-desc">' + dg.desc + '</div>';
        card.appendChild(info);

        const acts = document.createElement('div');
        acts.className = 'dg-acts';
        acts.appendChild(btn('进 入', 'gold', () => {
          if (G.enterDungeon(dg.id)) close(root);
        }));
        card.appendChild(acts);

        wrap.appendChild(card);
      });

      body.appendChild(wrap);

      if (G.dungeonRun) {
        const lv = document.createElement('div');
        lv.className = 'gm-tip';
        lv.innerHTML = '当前在副本中。<br>';
        lv.appendChild(btn('离开副本', '', () => { G.leaveDungeon(); close(root); }));
        body.appendChild(lv);
      }

      foot.innerHTML = '<span>秘境每 ' + SECRET_REALM.period + ' 秒开启一次</span>' +
        '<span class="dim">副本内击败首领即算踏破</span>';
    }

    open(root);
  }

  function drawDungeonArt(cv, theme, color) {
    const g = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    const bg = g.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h / 2, w * 0.7);
    bg.addColorStop(0, color + 'aa');
    bg.addColorStop(1, 'rgba(8,10,16,0.95)');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    g.save();
    g.translate(w / 2, h * 0.62);
    if (theme === 'fire') {
      for (let i = 0; i < 7; i++) {
        const x = -30 + i * 10;
        g.fillStyle = 'rgba(255,' + (120 + i * 12) + ',60,0.8)';
        g.beginPath();
        g.moveTo(x, 14);
        g.quadraticCurveTo(x + 7, -6, x + 3, -30 - (i % 3) * 6);
        g.quadraticCurveTo(x - 7, -6, x - 2, 14);
        g.fill();
      }
    } else if (theme === 'ice') {
      for (let i = 0; i < 6; i++) {
        const x = -28 + i * 11;
        g.fillStyle = 'rgba(180,235,255,0.75)';
        g.beginPath();
        g.moveTo(x, 16);
        g.lineTo(x + 5, -20 - (i % 3) * 8);
        g.lineTo(x + 10, 16);
        g.closePath();
        g.fill();
      }
    } else if (theme === 'dark') {
      g.fillStyle = 'rgba(150,110,255,0.6)';
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(-16 + i * 16, -10 + (i % 2) * 10, 12, 0, 6.283);
        g.fill();
      }
      g.fillStyle = 'rgba(255,90,90,0.8)';
      g.beginPath(); g.arc(-16, -10, 3, 0, 6.283); g.fill();
      g.beginPath(); g.arc(16, 0, 3, 0, 6.283); g.fill();
    } else if (theme === 'thunder') {
      g.strokeStyle = 'rgba(220,235,255,0.95)';
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-6, -34);
      g.lineTo(4, -12);
      g.lineTo(-4, -10);
      g.lineTo(8, 16);
      g.stroke();
    } else {
      // void
      g.strokeStyle = 'rgba(150,230,255,0.8)';
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-26 + i * 14, 16);
        g.lineTo(-22 + i * 14, -24);
        g.stroke();
      }
      g.fillStyle = 'rgba(200,240,255,0.9)';
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        g.arc(-30 + (i * 37) % 60, -30 + (i * 53) % 44, 1, 0, 6.283);
        g.fill();
      }
    }
    g.restore();

    g.strokeStyle = color + '99';
    g.lineWidth = 1.6;
    g.strokeRect(1, 1, w - 2, h - 2);
  }

  /* ==================================================================
     8. 账号（本地多账号）
     ================================================================== */

  const ACC_KEY = 'qingyun_accounts';

  function hashPwd(s) {
    // 轻量散列，仅用于本地区分，不是加密
    let h = 5381;
    const str = 'qy$' + String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function loadAccounts() {
    try { return JSON.parse(localStorage.getItem(ACC_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveAccounts(a) {
    try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch (e) { }
  }

  function Account_open() {
    if (!G) return;
    const root = mkModal('accountPanel', '道 号 · 登 录');
    const body = $('accountPanelBody');
    const foot = $('accountPanelFoot');
    render();

    function render() {
      const accs = loadAccounts();
      const names = Object.keys(accs);
      body.innerHTML = '';

      const tip = document.createElement('div');
      tip.className = 'gm-tip';
      tip.innerHTML = '同一个账号（道号 + 密码）在别的浏览器 / 设备上输入，也能接续这份修行。<br>' +
        '<span class="dim">账号仅存于本机浏览器，请勿使用真实密码。</span>';
      body.appendChild(tip);

      // 登录 / 注册
      const form = document.createElement('div');
      form.className = 'acc-form';

      const nameIn = document.createElement('input');
      nameIn.type = 'text';
      nameIn.placeholder = '道号（账号名）';
      nameIn.maxLength = 12;
      nameIn.className = 'acc-input';

      const pwdIn = document.createElement('input');
      pwdIn.type = 'password';
      pwdIn.placeholder = '密码';
      pwdIn.maxLength = 20;
      pwdIn.className = 'acc-input';

      form.appendChild(nameIn);
      form.appendChild(pwdIn);

      const acts = document.createElement('div');
      acts.className = 'acc-acts';

      acts.appendChild(btn('登 录', 'gold', () => {
        const nm = String(nameIn.value || '').trim();
        const pw = String(pwdIn.value || '');
        if (!nm || !pw) { UI.toast('请填写道号与密码', 'red'); return; }
        const a = loadAccounts()[nm];
        if (!a) { UI.toast('查无此账号，请先注册', 'red'); return; }
        if (a.pwd !== hashPwd(pw)) { UI.toast('密码不对', 'red'); return; }
        const sd = G.saveData();
        sd.player = a.save || null;
        G.persistNow();
        UI.toast('登录成功，正在载入……', 'gold');
        setTimeout(() => { try { location.reload(); } catch (e) { } }, 700);
      }));

      acts.appendChild(btn('注册 / 覆盖保存', '', () => {
        const nm = String(nameIn.value || '').trim();
        const pw = String(pwdIn.value || '');
        if (!nm || !pw) { UI.toast('请填写道号与密码', 'red'); return; }
        const all = loadAccounts();
        if (all[nm] && all[nm].pwd !== hashPwd(pw)) { UI.toast('该道号已存在，密码不符', 'red'); return; }
        const snap = G.saveData().player;
        if (!snap) { UI.toast('当前没有可保存的角色', 'red'); return; }
        all[nm] = { pwd: hashPwd(pw), save: snap, at: Date.now() };
        saveAccounts(all);
        UI.toast('账号「' + nm + '」已保存', 'gold');
        render();
      }));

      form.appendChild(acts);
      body.appendChild(form);

      // 已有账号
      const sh = document.createElement('div');
      sh.className = 'sec-sub';
      sh.textContent = '本 机 账 号';
      body.appendChild(sh);

      if (!names.length) {
        const e = document.createElement('div');
        e.className = 'quest-empty';
        e.textContent = '还没有账号。填写道号与密码后点「注册 / 覆盖保存」。';
        body.appendChild(e);
      } else {
        const list = document.createElement('div');
        list.className = 'acc-list';
        names.forEach((nm) => {
          const a = accs[nm];
          const row = document.createElement('div');
          row.className = 'acc-row';
          const lv = a.save ? (a.save.level || 1) : 1;
          row.innerHTML = '<b>' + nm + '</b><em>' +
            (a.save ? (realmName(lv) + ' · ' + PATHS[a.save.path || 'sword'].name) : '空存档') +
            '</em>';
          row.appendChild(btn('用此号登录', 'gold', () => {
            const pw = window.prompt('请输入「' + nm + '」的密码');
            if (pw === null) return;
            if (a.pwd !== hashPwd(pw)) { UI.toast('密码不对', 'red'); return; }
            const sd = G.saveData();
            sd.player = a.save || null;
            G.persistNow();
            UI.toast('登录成功，正在载入……', 'gold');
            setTimeout(() => { try { location.reload(); } catch (e) { } }, 700);
          }));
          list.appendChild(row);
        });
        body.appendChild(list);
      }

      foot.innerHTML = '<span>当前道号：' + (G.player ? G.player.name : '—') + '</span>' +
        '<span class="dim">登录后会重新载入页面</span>';
    }

    open(root);
  }

  /* ------------------------------ 对外 ------------------------------ */

  function init(game) {
    if (G) return;
    G = game;
  }

  /** 关闭所有新面板（Esc 用） */
  function closeAll() {
    let any = false;
    ['skillUpPanel', 'forgePanel', 'gmShopPanel', 'smithPanel', 'alchemyPanel',
      'sectPanel', 'dungeonPanel', 'accountPanel'].forEach((id) => {
      if (isOpen(id)) { $(id).classList.add('hidden'); any = true; }
    });
    if (any && typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
    return any;
  }

  function anyOpen() {
    return ['skillUpPanel', 'forgePanel', 'gmShopPanel', 'smithPanel', 'alchemyPanel',
      'sectPanel', 'dungeonPanel', 'accountPanel'].some(isOpen);
  }

  /** 供外部（ui.js）在关闭面板后同步覆盖层状态 */
  function refreshOverlay() {
    if (typeof UI === 'undefined' || !UI.setOverlay) return;
    let other = false;
    try {
      other = UI.dialogueOpen() || UI.bagOpen() || UI.questOpen() || UI.cgOpen() || UI.deadOpen();
    } catch (e) { }
    UI.setOverlay(other || anyOpen());
  }

  /** 秘境开启提示（由主循环调用） */
  let lastSecretOpen = false;
  function tick() {
    try {
      if (!G || !G.secretState) return;
      const s = G.secretState();
      if (s.open !== lastSecretOpen) {
        lastSecretOpen = s.open;
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast(s.open ? '太虚幻境开启了（副本页可进入）' : '太虚幻境已闭合', s.open ? 'gold' : 'blue');
        }
      }
    } catch (e) { }
  }

  return {
    init,
    openSkillUp: SkillUp_open,
    openForge: Forge_open,
    openShop: Shop_open,
    openSmith: Smith_open,
    openAlchemy: Alchemy_open,
    openSect: Sect_open,
    openDungeon: Dungeon_open,
    openAccount: function () {
      if (typeof Account !== 'undefined' && Account.open) { Account.open(); return; }
      Account_open();
    },
    closeAll, anyOpen, isOpen, refreshOverlay, tick, state: S,
    effectLine
  };
})();

/* 兼容 game.js 里的调用名 */
const Smith = { open: () => Panels.openSmith() };
const Alchemy = { open: () => Panels.openAlchemy() };
const Sect = { open: () => Panels.openSect() };
