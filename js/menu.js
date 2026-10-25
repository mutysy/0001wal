'use strict';

/* =========================================================================
   青云界 · 菜单（设置：按键 / 音量）与 活动（签到 / 挑战）
   ========================================================================= */

const Menu = (function () {
  let G = null;
  const el = {};
  let tab = 'settings';
  let listening = null;     // 正在等待按键的动作名

  function $(id) { return document.getElementById(id); }

  function init(game) {
    G = game;
    ['menuPanel', 'menuTabs', 'menuBody', 'menuTitle', 'menuClose'].forEach((id) => el[id] = $(id));
    if (!el.menuPanel) return;
    el.menuPanel.addEventListener('click', (e) => {
      if (e.target === el.menuPanel) close();
    });
    if (el.menuClose) {
      el.menuClose.addEventListener('click', (e) => { e.stopPropagation(); close(); Audio2.play('uiBack'); });
    }
  }

  function isOpen() { return el.menuPanel && !el.menuPanel.classList.contains('hidden'); }

  function open(which) {
    if (!el.menuPanel) return;
    tab = which || 'settings';
    el.menuPanel.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    render();
  }

  function close() {
    if (!el.menuPanel) return;
    listening = null;
    el.menuPanel.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
  }

  const TAB_ICONS = {
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    activity: '<svg viewBox="0 0 24 24"><path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z"/><path d="M12 20v2"/></svg>',
    rank: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 13v4M9 20h6"/></svg>',
    titles: '<svg viewBox="0 0 24 24"><path d="M4 17l2-9 4 4 2-6 2 6 4-4 2 9z"/><path d="M4 20h16"/></svg>'
  };

  function render() {
    const titles = {
      settings: '设 置', activity: '活 动', rank: '排 行 榜', titles: '称 号'
    };
    el.menuTitle.textContent = titles[tab] || '设 置';
    el.menuTabs.innerHTML = '';
    [['settings', '操作与音量'], ['activity', '活动'], ['rank', '排行榜'], ['titles', '称号']].forEach(([key, label]) => {
      const d = document.createElement('div');
      d.className = 'menu-tab' + (tab === key ? ' on' : '');
      d.innerHTML = (TAB_ICONS[key] || '') + '<span>' + label + '</span>';
      d.addEventListener('click', () => { tab = key; render(); Audio2.play('ui'); });
      el.menuTabs.appendChild(d);
    });
    el.menuBody.innerHTML = '';
    if (tab === 'settings') renderSettings();
    else if (tab === 'rank') renderRank();
    else if (tab === 'titles') renderTitles();
    else renderActivity();
  }

  /* ------------------------------ 称号 ------------------------------ */

  function renderTitles() {
    const wrap = document.createElement('div');
    wrap.className = 'title-wrap';
    const cur = G.currentTitle ? G.currentTitle() : null;
    const items = G.getTitles ? G.getTitles() : [];

    wrap.innerHTML =
      '<div class="rank-head">' +
      '<div class="rk-title">称 号</div>' +
      '<div class="rk-sub">当前佩戴：<b style="color:' + (cur ? cur.color : '#8f98a2') + '">' +
      (cur ? cur.name : '无') + '</b>　点击徽章佩戴 / 再点卸下，称号会浮于角色头顶</div>' +
      '</div>';

    const groups = [
      { key: 'on', name: '佩 戴 中', list: items.filter((t) => t.equipped) },
      { key: 'got', name: '已 获 得', list: items.filter((t) => t.unlocked && !t.equipped) },
      { key: 'no', name: '未 获 得', list: items.filter((t) => !t.unlocked) }
    ];

    const bonusText = (b) => {
      if (!b) return '';
      const p = [];
      if (b.atk) p.push('攻+' + b.atk);
      if (b.def) p.push('防+' + b.def);
      if (b.hp) p.push('血+' + b.hp);
      if (b.qi) p.push('灵+' + b.qi);
      if (b.crit) p.push('暴+' + (b.crit * 100).toFixed(0) + '%');
      if (b.qiRegen) p.push('回灵+' + b.qiRegen);
      return p.join(' ');
    };

    const condText = (c) => {
      if (!c) return '';
      if (c.type === 'level') return '境界达 ' + c.value + ' 级';
      if (c.type === 'kill') return '斩杀 ' + c.value + ' 只妖兽';
      if (c.type === 'stones') return '积攒 ' + c.value + ' 灵石';
      if (c.type === 'tower') return '试炼塔至第 ' + c.value + ' 层';
      if (c.type === 'abyss') return '深渊至第 ' + c.value + ' 层';
      if (c.type === 'contrib') return '宗门贡献 ' + c.value;
      if (c.type === 'alch') return '炼丹 ' + c.value + ' 炉';
      if (c.type === 'merge') return '合成装备 ' + c.value + ' 次';
      if (c.type === 'realm') return '境界：' + REALMS[Math.min(REALMS.length - 1, c.value)];
      return '';
    };

    for (const g of groups) {
      if (!g.list.length) continue;

      const head = document.createElement('div');
      head.className = 'tt-group';
      head.innerHTML = '<span>' + g.name + '</span><em>' + g.list.length + ' 枚</em>';
      wrap.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'tt-grid';

      for (const t of g.list) {
        const rare = TITLE_RARE[Math.max(0, Math.min(TITLE_RARE.length - 1, (t.rare || 1) - 1))];
        const tier = Math.max(1, Math.min(10, t.rare || 1));
        const card = document.createElement('div');
        card.className = 'tt-card r' + tier +
          (t.unlocked ? '' : ' locked') +
          (t.equipped ? ' on' : '');
        card.style.setProperty('--rc1', rare.c1);
        card.style.setProperty('--rc2', rare.c2);
        card.style.setProperty('--rg', rare.glow);

        const bt = bonusText(t.bonus);
        card.innerHTML =
          '<i class="orn tl"></i><i class="orn tr"></i><i class="orn bl"></i><i class="orn br"></i>' +
          '<i class="deco rays"></i>' +
          '<i class="deco frame"></i>' +
          '<i class="deco curls"></i>' +
          '<i class="deco wings"></i>' +
          '<i class="deco crest"></i>' +
          '<i class="deco shimmer"></i>' +
          '<div class="tt-glowbg"></div>' +
          '<div class="tt-rare">' + rare.name + '</div>' +
          '<div class="tt-tier">' + rare.name + '品</div>' +
          '<div class="tt-name">' + t.name + '</div>' +
          '<div class="tt-deco"><i></i><b>◆</b><i></i></div>' +
          '<div class="tt-desc">' + (t.desc || condText(t.cond)) + '</div>' +
          (bt ? '<div class="tt-bonus">' + bt + '</div>' : '') +
          '<div class="tt-foot">' +
          (t.equipped ? '佩 戴 中' : (t.unlocked ? '点 击 佩 戴' : '未 获 得')) +
          '</div>' +
          (t.unlocked ? '' : '<div class="tt-lock">锁</div>');

        if (t.unlocked) {
          card.addEventListener('click', () => {
            G.equipTitle(t.id);
            try { Audio2.play('ui'); } catch (e) { }
            render();
          });
        }
        grid.appendChild(card);
      }

      wrap.appendChild(grid);
    }

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'quest-empty';
      empty.textContent = '尚无称号';
      wrap.appendChild(empty);
    }

    el.menuBody.appendChild(wrap);
  }

  /* ------------------------------ 每日常规任务 ------------------------------ */

  function renderDailyBlock(parent) {
    if (!G.dailyList) return;
    const list = G.dailyList();
    const box = document.createElement('div');
    box.className = 'act-block';
    box.innerHTML = '<h4>每日常规<em>每日零点重置</em></h4>';
    const wrap = document.createElement('div');
    wrap.className = 'daily-list';

    list.forEach(function (d) {
      const row = document.createElement('div');
      row.className = 'daily' + (d.claimed ? ' done' : '') + (d.done && !d.claimed ? ' ready' : '');

      const nm = document.createElement('div');
      nm.className = 'dl-nm';
      nm.innerHTML = '<b>' + d.name + '</b><em>' + d.desc + '</em>';
      row.appendChild(nm);

      const bar = document.createElement('div');
      bar.className = 'dl-bar';
      const k = Math.min(1, d.cur / Math.max(1, d.need));
      bar.innerHTML = '<i style="width:' + (k * 100).toFixed(1) + '%"></i>' +
        '<span>' + d.cur + ' / ' + d.need + '</span>';
      row.appendChild(bar);

      const rw = document.createElement('div');
      rw.className = 'dl-rw';
      const r = d.reward || {};
      const parts = [];
      if (r.stones) parts.push('灵石 ' + r.stones);
      if (r.exp) parts.push('修为 ' + r.exp);
      if (r.contrib) parts.push('贡献 ' + r.contrib);
      if (r.items) for (const it of r.items) parts.push(ITEMS[it.id].name + '×' + it.n);
      rw.textContent = parts.join('　');
      row.appendChild(rw);

      const b = document.createElement('button');
      b.className = 'btn' + (d.done && !d.claimed ? ' gold' : '');
      b.type = 'button';
      b.textContent = d.claimed ? '已 领' : (d.done ? '领 取' : '未完成');
      b.disabled = d.claimed || !d.done;
      b.addEventListener('click', function () {
        if (G.dailyClaim(d.id)) render();
      });
      row.appendChild(b);

      wrap.appendChild(row);
    });

    box.appendChild(wrap);
    parent.appendChild(box);
  }
  /* ------------------------------ 排行榜 ------------------------------ */

  function renderRank() {
    const wrap = document.createElement('div');
    wrap.className = 'rank-wrap';
    let rows = [], me = null, gap = null;
    try {
      rows = Rank.list();
      me = Rank.myRank();
      gap = Rank.gapToNext();
    } catch (e) { rows = []; }

    /* ---- 头部 ---- */
    const head = document.createElement('div');
    head.className = 'rank-head';
    let sub = '';
    if (me) {
      sub = '你（<b>' + me.name + '</b>）位列第 <b>' + me.rank + '</b> 名';
      sub += gap
        ? '，距上一位「' + gap.name + '」还差 <b>' + Math.round(gap.diff) + '</b> 修为'
        : '，<b>已居榜首</b>';
    }
    if (rows.length < 2) {
      sub += '<br><span style="color:#9fd6ff">榜上只有你一人 —— 让朋友也来玩，或请他们发你一枚「铭牌」。</span>';
    }
    head.innerHTML = '<div class="rk-title">修 为 榜</div><div class="rk-sub">' + sub + '</div>';
    wrap.appendChild(head);

    /* ---- 榜单 ---- */
    const listEl = document.createElement('div');
    listEl.className = 'rank-list';
    for (const r of rows) {
      const pathName = PATHS[r.path] ? PATHS[r.path].name : '散修';
      const row = document.createElement('div');
      row.className = 'rank-row' + (r.me ? ' me' : '') + (r.rank <= 3 ? ' top' + r.rank : '');
      row.innerHTML =
        '<span class="rk-no">' + r.rank + '</span>' +
        '<span class="rk-name">' + r.name + (r.me ? ' <i>你</i>' : '') + '</span>' +
        '<span class="rk-path">' + pathName + '</span>' +
        '<span class="rk-realm">' + realmName(r.level) + '</span>' +
        '<span class="rk-exp">' + Math.round(r.total).toLocaleString() + '</span>';
      if (!r.me) {
        const del = document.createElement('span');
        del.className = 'rk-del';
        del.textContent = '×';
        del.title = '移出榜单';
        del.addEventListener('click', (ev) => {
          ev.stopPropagation();
          Rank.remove(r.name);
          render();
        });
        row.appendChild(del);
      }
      listEl.appendChild(row);
    }
    wrap.appendChild(listEl);

    /* ---- 铭牌收发 ---- */
    const tools = document.createElement('div');
    tools.className = 'rank-tools';
    tools.innerHTML =
      '<div class="rt-block">' +
      '<div class="rt-t">我 的 铭 牌</div>' +
      '<div class="rt-d">把这段铭牌发给朋友，他们粘进右侧「录入道友」，你就能出现在他们的榜上。</div>' +
      '<textarea readonly id="myCode" class="rt-code"></textarea>' +
      '<button class="btn" id="copyCode">复制铭牌</button>' +
      '</div>' +
      '<div class="rt-block">' +
      '<div class="rt-t">录 入 道 友</div>' +
      '<div class="rt-d">粘贴朋友发来的铭牌（QY1 开头），即可加入榜单。</div>' +
      '<textarea id="inCode" class="rt-code" placeholder="QY1..."></textarea>' +
      '<button class="btn gold" id="addCode">录 入</button>' +
      '</div>';
    wrap.appendChild(tools);

    const foot = document.createElement('div');
    foot.className = 'rank-foot';
    foot.textContent = '榜单只统计真实游玩记录：本机当前存档、历次存档，以及导入的道友铭牌。修为总值 = 各层境界所需修为累计 + 当前层进度。';
    wrap.appendChild(foot);

    el.menuBody.appendChild(wrap);

    /* ---- 事件 ---- */
    const myCode = tools.querySelector('#myCode');
    if (myCode) {
      try { myCode.value = Rank.code(); } catch (e) { myCode.value = ''; }
    }
    const copyBtn = tools.querySelector('#copyCode');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        let v = '';
        try { v = Rank.code(); } catch (e) { }
        let done = false;
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(v);
            done = true;
          }
        } catch (e) { }
        if (!done && myCode) {
          try { myCode.select(); done = document.execCommand('copy'); } catch (e) { done = false; }
        }
        UI.toast(done ? '铭牌已复制' : '请手动选中复制', done ? 'gold' : 'blue');
      });
    }
    const addBtn = tools.querySelector('#addCode');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const inp = tools.querySelector('#inCode');
        const r = Rank.importCode(inp ? String(inp.value || '') : '');
        UI.toast(r.msg, r.ok ? 'gold' : 'red');
        if (r.ok) { Audio2.play('coin'); render(); }
      });
    }
  }

  /* ------------------------------ 设置 ------------------------------ */

  function renderSettings() {
    const box = document.createElement('div');
    box.className = 'settings-grid';

    // ——— 按键 ———
    const keys = document.createElement('div');
    keys.className = 'settings-col';
    keys.innerHTML = '<h4>操作按键<em>点击右侧按键后按下新键即可更改</em></h4>';
    const list = document.createElement('div');
    list.className = 'keylist';
    for (const action in KEYMAP_DEFAULT) {
      const row = document.createElement('div');
      row.className = 'keyrow';
      const lab = document.createElement('span');
      lab.className = 'kl';
      lab.textContent = KEYMAP_LABELS[action] || action;
      const btn = document.createElement('button');
      btn.className = 'kbtn' + (listening === action ? ' listening' : '');
      btn.textContent = listening === action ? '按下新键…' : keyName(G.keymap[action]);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        listening = action;
        render();
        Audio2.play('ui');
      });
      row.appendChild(lab);
      row.appendChild(btn);
      list.appendChild(row);
    }
    keys.appendChild(list);

    const reset = document.createElement('button');
    reset.className = 'btn';
    reset.textContent = '恢复默认按键';
    reset.style.marginTop = '10px';
    reset.addEventListener('click', () => {
      G.resetKeymap();
      listening = null;
      render();
      Audio2.play('ui');
    });
    keys.appendChild(reset);
    box.appendChild(keys);

    // ——— 音量 ———
    const vol = document.createElement('div');
    vol.className = 'settings-col';
    vol.innerHTML = '<h4>音量<em>音效与音乐皆为实时合成</em></h4>';
    const v = Audio2.getVolume();
    [['master', '主音量'], ['music', '背景音乐'], ['sfx', '音效']].forEach(([key, label]) => {
      const wrap = document.createElement('div');
      wrap.className = 'volrow';
      wrap.innerHTML = '<span class="vl">' + label + '</span>';
      const sl = document.createElement('input');
      sl.type = 'range';
      sl.min = '0';
      sl.max = '100';
      sl.value = Math.round(v[key] * 100);
      const num = document.createElement('span');
      num.className = 'vn';
      num.textContent = sl.value;
      sl.addEventListener('input', () => {
        Audio2.setVolume(key, Number(sl.value) / 100);
        num.textContent = sl.value;
        G.saveSettings();
      });
      sl.addEventListener('change', () => Audio2.play('ui'));
      wrap.appendChild(sl);
      wrap.appendChild(num);
      vol.appendChild(wrap);
    });

    const tip = document.createElement('div');
    tip.className = 'settings-tip';
    tip.textContent = '提示：音频需在首次点击或按键后才会启动，这是浏览器的自动播放限制。';
    vol.appendChild(tip);

    // 音效试听
    const test = document.createElement('button');
    test.className = 'btn';
    test.textContent = '试听音效';
    test.style.marginTop = '10px';
    test.addEventListener('click', () => Audio2.play('slash'));
    vol.appendChild(test);

    box.appendChild(vol);

    // ——— 存档 ———
    const saveCol = document.createElement('div');
    saveCol.className = 'settings-col';
    saveCol.innerHTML = '<h4>存档<em>自动保存于本机浏览器</em></h4>';
    const info = document.createElement('div');
    info.className = 'settings-tip';
    const p = G.player;
    info.innerHTML = '境界：<b>' + realmName(p.level) + '</b>　灵石：<b>' + p.stones + '</b><br>' +
      '等级、修为、背包、装备、任务、已刻录石碑、签到记录与按键设置都会保存。<br>' +
      '换浏览器 / 清缓存会丢失进度。';
    saveCol.appendChild(info);

    // 手动存档
    const saveNow = document.createElement('button');
    saveNow.className = 'btn gold';
    saveNow.style.marginTop = '12px';
    saveNow.textContent = '立 即 存 档';
    saveNow.addEventListener('click', () => {
      if (G.manualSave) G.manualSave(); else G.saveNow(false);
      const t = new Date();
      info.innerHTML = info.innerHTML.split('<br><span')[0] +
        '<br><span style="color:#8fe0a0">已于 ' + t.getHours() + ':' +
        ('0' + t.getMinutes()).slice(-2) + ':' + ('0' + t.getSeconds()).slice(-2) + ' 存档</span>';
    });
    saveCol.appendChild(saveNow);

    // 账号登录
    const accBtn = document.createElement('button');
    accBtn.className = 'btn';
    accBtn.style.marginTop = '8px';
    accBtn.textContent = '道号登录 / 注册';
    accBtn.addEventListener('click', () => {
      if (typeof Panels !== 'undefined') Panels.openAccount();
    });
    saveCol.appendChild(accBtn);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.style.marginTop = '12px';
    newBtn.textContent = '重新择道（清空存档）';
    newBtn.addEventListener('click', () => {
      let ok = true;
      if (typeof confirm === 'function') ok = confirm('确定清空存档、重新择道吗？此操作不可撤销。');
      if (ok) G.resetSave();
    });
    saveCol.appendChild(newBtn);

    box.appendChild(saveCol);

    el.menuBody.appendChild(box);

    renderTouchConfig();
  }

  /* ------------------------------ 触屏按键自定义 ------------------------------ */

  function renderTouchConfig() {
    if (!G.getTouchCfg || !G.setTouchCfg) return;
    const cfg = G.getTouchCfg();

    const wrap = document.createElement('div');
    wrap.className = 'settings-col touch-cfg';
    wrap.innerHTML = '<h4>触屏按键<em>大小 · 位置 · 透明度（手机 / 触屏生效）</em></h4>';

    const tip = document.createElement('div');
    tip.className = 'settings-tip';
    tip.style.marginTop = '0';
    tip.style.marginBottom = '10px';
    tip.textContent = '开始游戏后才显示虚拟按键；桌面端可以打开下面的开关预览。';
    wrap.appendChild(tip);

    const list = document.createElement('div');
    list.className = 'tlist';

    const row = (label, node) => {
      const d = document.createElement('div');
      d.className = 'trow';
      const l = document.createElement('span');
      l.className = 'tlabel';
      l.textContent = label;
      d.appendChild(l);
      d.appendChild(node);
      list.appendChild(d);
      return d;
    };

    const slider = (label, key, min, max, step, fmt) => {
      const box = document.createElement('div');
      box.className = 'tslider';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = min; inp.max = max; inp.step = step;
      inp.value = cfg[key];
      const val = document.createElement('b');
      val.className = 'tval';
      const show = (v) => { val.textContent = fmt ? fmt(v) : String(v); };
      show(cfg[key]);
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        show(v);
        G.setTouchCfg({ [key]: v });
      });
      box.appendChild(inp);
      box.appendChild(val);
      row(label, box);
    };

    const toggle = (label, key, onText, offText) => {
      const b = document.createElement('button');
      b.className = 'btn tbtn' + (cfg[key] ? ' gold' : '');
      b.textContent = cfg[key] ? onText : offText;
      b.addEventListener('click', () => {
        const next = !G.getTouchCfg()[key];
        G.setTouchCfg({ [key]: next });
        b.classList.toggle('gold', next);
        b.textContent = next ? onText : offText;
        Audio2.play('ui');
      });
      row(label, b);
    };

    toggle('显示触屏按键', 'show', '开 启', '关 闭');

    // 摇杆左右：循环切换（不走布尔 toggle）
    (function sideRow() {
      const b = document.createElement('button');
      b.className = 'btn tbtn';
      const refresh = () => {
        const on = G.getTouchCfg().joySide === 'right';
        b.classList.toggle('gold', on);
        b.textContent = on ? '在 右 侧' : '在 左 侧';
      };
      refresh();
      b.addEventListener('click', () => {
        const cur = G.getTouchCfg().joySide === 'right' ? 'left' : 'right';
        G.setTouchCfg({ joySide: cur });
        refresh();
        Audio2.play('ui');
      });
      row('摇杆位置', b);
    })();

    slider('摇杆大小', 'joySize', 80, 210, 2, (v) => v + ' px');
    slider('摇杆水平', 'joyX', 4, 240, 2, (v) => v + ' px');
    slider('摇杆垂直', 'joyY', 4, 240, 2, (v) => v + ' px');
    slider('按键大小', 'btnScale', 0.6, 1.8, 0.05, (v) => '×' + Number(v).toFixed(2));
    slider('按键水平', 'padX', 2, 240, 2, (v) => v + ' px');
    slider('按键垂直', 'padY', 2, 240, 2, (v) => v + ' px');
    slider('整体透明度', 'opacity', 0.25, 1, 0.05, (v) => Math.round(v * 100) + '%');

    wrap.appendChild(list);

    const reset = document.createElement('button');
    reset.className = 'btn';
    reset.style.marginTop = '12px';
    reset.textContent = '恢复默认布局';
    reset.addEventListener('click', () => {
      G.resetTouchCfg();
      Audio2.play('ui');
      render();
    });
    wrap.appendChild(reset);

    el.menuBody.appendChild(wrap);
  }

  /** 由 game.js 转发 keydown，用于改键 */
  function handleKey(e) {
    if (!listening) return false;
    const reserved = ['Escape'];
    if (reserved.indexOf(e.code) >= 0) { listening = null; render(); return true; }
    G.setKeybinding(listening, e.code);
    Audio2.play('ui');
    listening = null;
    render();
    return true;
  }

  function isListening() { return !!listening; }

  /* ------------------------------ 活动 ------------------------------ */

  function renderActivity() {
    const wrap = document.createElement('div');
    wrap.className = 'act-wrap';

    /* ---- 签到 ---- */
    const ck = document.createElement('div');
    ck.className = 'act-block';
    const st = G.getCheckinState();
    ck.innerHTML = '<h4>每日签到<em>连续签到奖励递增</em></h4>' +
      '<div class="ck-tip">' + (st.canClaim ? '今日尚未签到' : '今日已签到，明日再来') + '</div>';
    const grid = document.createElement('div');
    grid.className = 'ck-grid';
    CHECKIN_REWARDS.forEach((r, i) => {
      const done = i < st.day;
      const today = i === st.day && st.canClaim;
      const cell = document.createElement('div');
      cell.className = 'ck-cell' + (done ? ' done' : '') + (today ? ' today' : '');
      const rw = rewardText(r);
      cell.innerHTML = '<div class="ck-day">第 ' + (i + 1) + ' 日</div>' +
        '<div class="ck-rw">' + rw + '</div>' +
        (done ? '<div class="ck-mark">✓</div>' : '');
      if (today) {
        cell.addEventListener('click', () => {
          G.claimCheckin();
          Audio2.play('coin');
          render();
        });
      }
      grid.appendChild(cell);
    });
    ck.appendChild(grid);
    wrap.appendChild(ck);

    /* ---- 挑战 ---- */
    const ch = document.createElement('div');
    ch.className = 'act-block';
    ch.innerHTML = '<h4>试炼挑战<em>完成后可得厚赏</em></h4>';
    const list = document.createElement('div');
    list.className = 'ch-list';
    for (const c of CHALLENGES) {
      const cd = G.challengeCooldown(c.id);
      const running = G.challenge && G.challenge.id === c.id && G.challenge.state === 'running';
      const card = document.createElement('div');
      card.className = 'ch-card' + (cd > 0 ? ' dim' : '');
      card.innerHTML =
        '<div class="ch-icon">' + c.icon + '</div>' +
        '<div class="ch-main">' +
        '<div class="ch-name">' + c.name + '</div>' +
        '<div class="ch-desc">' + c.desc + '</div>' +
        '<div class="ch-reward">酬谢：' + rewardText(c.reward) + '</div>' +
        '</div>';
      const btn = document.createElement('button');
      btn.className = 'btn gold';
      if (running) btn.textContent = '进行中';
      else if (cd > 0) btn.textContent = Math.ceil(cd) + 's';
      else btn.textContent = '开始';
      btn.disabled = running || cd > 0;
      btn.addEventListener('click', () => {
        close();
        G.startChallenge(c.id);
      });
      card.appendChild(btn);
      list.appendChild(card);
    }
    ch.appendChild(list);
    wrap.appendChild(ch);

    /* ---- 等级奖励 ---- */
    const lvBlock = document.createElement('div');
    lvBlock.className = 'act-block';
    lvBlock.innerHTML = '<h4>境界奖励<em>达到对应等级即可领取</em></h4>';
    const lvList = document.createElement('div');
    lvList.className = 'lv-list';
    let anyLv = false;
    const rewards = G.getLevelRewards ? G.getLevelRewards() : [];
    for (const r of rewards) {
      if (r.locked) continue;
      anyLv = true;
      const row = document.createElement('div');
      row.className = 'lv-row' + (r.claimed ? ' claimed' : (r.canClaim ? ' ready' : ''));
      row.innerHTML =
        '<span class="lv-lv">Lv.' + r.lv + '</span>' +
        '<span class="lv-rw">' + rewardText(r.reward) + '</span>' +
        '<span class="lv-st">' + (r.claimed ? '已领取' : (r.canClaim ? '可领取' : '未达成')) + '</span>';
      if (r.canClaim) {
        row.addEventListener('click', () => {
          G.claimLevelReward(r.lv);
          Audio2.play('coin');
          render();
        });
      }
      lvList.appendChild(row);
    }
    if (!anyLv) {
      lvList.innerHTML = '<div class="quest-empty">继续修行，达到 2 级即可领取首份奖励</div>';
    }
    lvBlock.appendChild(lvList);
    wrap.appendChild(lvBlock);

    /* ---- 试炼塔 / 深渊 ---- */
    const mkTrial = (kind, cfg, title, note, cls) => {
      const block = document.createElement('div');
      block.className = 'act-block';
      block.innerHTML = '<h4>' + title + '<em>' + note + '</em></h4>';
      const tmax = (typeof Tower !== 'undefined') ? Tower.maxFloor(kind) : 0;
      const active = (typeof Tower !== 'undefined') && Tower.isActive();
      const card = document.createElement('div');
      card.className = 'ch-card tower-card ' + cls + (active ? ' dim' : '');
      card.innerHTML =
        '<div class="ch-icon tower">' + (kind === 'abyss' ? '渊' : '塔') + '</div>' +
        '<div class="ch-main">' +
        '<div class="ch-name">' + cfg.name + '</div>' +
        '<div class="ch-desc">已破至第 <b>' + tmax + '</b> 层 / 共 ' + cfg.maxFloor + ' 层。' +
        (kind === 'abyss'
          ? '渊底妖王凶悍异常，然厚赏之中藏有仙品红装。'
          : '每层清尽妖物即可登层，每 ' + cfg.bossEvery + ' 层有守关妖王。') +
        '</div>' +
        '<div class="ch-reward">下一层：第 ' + Math.min(cfg.maxFloor, tmax + 1) + ' 层' +
        (tmax >= cfg.maxFloor ? '（已通关，可重来）' : '') + '</div>' +
        '</div>';
      const btn = document.createElement('button');
      btn.className = 'btn gold';
      if (active) { btn.textContent = '进行中'; btn.disabled = true; }
      else btn.textContent = tmax >= cfg.maxFloor ? '重入' : '进入';
      btn.addEventListener('click', () => {
        close();
        if (typeof Tower !== 'undefined') Tower.start(kind, tmax >= cfg.maxFloor ? 1 : tmax + 1);
      });
      card.appendChild(btn);
      block.appendChild(card);
      wrap.appendChild(block);
    };

    mkTrial('tower', (typeof TOWER_CFG !== 'undefined' ? TOWER_CFG : {}), '试炼塔', '共 100 层 · 每 10 层守关', '');
    mkTrial('abyss', (typeof ABYSS_CFG !== 'undefined' ? ABYSS_CFG : {}), '深渊归墟', '共 30 层 · 每 3 层妖王 · 红装', 'abyss-card');

    renderDailyBlock(wrap);

    el.menuBody.appendChild(wrap);
  }

  function rewardText(r) {
    const parts = [];
    if (r.exp) parts.push('修为+' + r.exp);
    if (r.stones) parts.push('灵石+' + r.stones);
    if (r.items) {
      for (const it of r.items) parts.push(ITEMS[it.id].name + '×' + it.n);
    }
    return parts.join(' ') || '—';
  }

  /** 活动面板实时刷新（挑战倒计时） */
  function tick() {
    if (!isOpen() || tab !== 'activity') return;
    // 只在冷却数字变化明显时重绘，避免每帧重建 DOM
    if (G.challenge && G.challenge.state === 'running') return;
    const now = performance.now();
    if (!tick._last || now - tick._last > 500) {
      tick._last = now;
      render();
    }
  }

  return { init, open, close, isOpen, handleKey, isListening, tick, render };
})();
