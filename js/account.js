'use strict';

/* =========================================================================
   青云界 · 账号与多角色
   一个账号（道号 + 密码）下可以存多个角色，各自独立存档，随时切换。
   存档保存在本机 localStorage；换设备登录同一道号可接续（需自行导出）。
   ========================================================================= */

const Account = (function () {

  const KEY = 'qingyun_accounts';
  let panel = null;
  let tab = 'login';       // login | chars
  let pendingUser = null;

  function G() { return (typeof window !== 'undefined' && window.__qingyun) ? window.__qingyun.G : null; }

  function hash(s) {
    let h = 5381;
    const str = 'qy#' + String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveAll(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { }
  }

  /** 把老版本（单存档）迁移成多角色结构 */
  function norm(acc) {
    if (!acc) return null;
    if (!acc.chars) {
      acc.chars = [];
      if (acc.save) {
        acc.chars.push({
          id: 'c' + (Date.now().toString(36)),
          name: (acc.save && acc.save.name) || '旧角色',
          path: (acc.save && acc.save.path) || 'sword',
          level: (acc.save && acc.save.level) || 1,
          at: acc.at || Date.now(),
          save: acc.save
        });
        delete acc.save;
      }
    }
    return acc;
  }

  function users() {
    const all = loadAll();
    return Object.keys(all).map((u) => norm(all[u])).filter(Boolean);
  }

  function getUser(user) {
    const all = loadAll();
    return norm(all[user]);
  }

  function putUser(user, acc) {
    const all = loadAll();
    all[user] = acc;
    saveAll(all);
  }

  /* ------------------------------ 当前身份 ------------------------------ */

  function authOf() {
    const g = G();
    if (!g) return null;
    const sd = g.saveData();
    return sd.auth || null;
  }

  function setAuth(a) {
    const g = G();
    if (!g) return;
    const sd = g.saveData();
    if (a) sd.auth = a; else delete sd.auth;
    g.persistNow();
  }

  /** 存档时把角色快照同步进账号（由 game.js 的 saveGame 调用） */
  function syncCurrent(snap) {
    const g = G();
    if (!g || !snap) return;
    const sd = g.saveData();
    const auth = sd.auth;
    if (!auth || !auth.user) return;

    const acc = getUser(auth.user);
    if (!acc) return;

    if (!auth.charId) {
      // 新角色首次存档：登记进列表
      const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 100).toString(36);
      acc.chars.push({
        id: id,
        name: snap.name || '无名',
        path: snap.path || 'sword',
        level: snap.level || 1,
        at: Date.now(),
        save: snap
      });
      putUser(auth.user, acc);
      setAuth({ user: auth.user, charId: id });
      return;
    }

    let found = null;
    for (const c of acc.chars) if (c.id === auth.charId) found = c;
    if (!found) {
      acc.chars.push({
        id: auth.charId,
        name: snap.name || '无名',
        path: snap.path || 'sword',
        level: snap.level || 1,
        at: Date.now(),
        save: snap
      });
    } else {
      found.name = snap.name || found.name;
      found.path = snap.path || found.path;
      found.level = snap.level || found.level;
      found.at = Date.now();
      found.save = snap;
    }
    putUser(auth.user, acc);
  }

  /* ------------------------------ 操作 ------------------------------ */

  function register(user, pwd) {
    user = String(user || '').trim();
    pwd = String(pwd || '');
    if (!user || !pwd) return { ok: false, msg: '请填写道号与密码' };
    if (user.length > 12) return { ok: false, msg: '道号最多 12 字' };
    const all = loadAll();
    if (all[user]) return { ok: false, msg: '该道号已存在' };
    putUser(user, { pwd: hash(pwd), chars: [], at: Date.now() });
    return { ok: true, msg: '账号已创建' };
  }

  function login(user, pwd) {
    user = String(user || '').trim();
    pwd = String(pwd || '');
    if (!user || !pwd) return { ok: false, msg: '请填写道号与密码' };
    const acc = getUser(user);
    if (!acc) return { ok: false, msg: '查无此账号，请先注册' };
    if (acc.pwd !== hash(pwd)) return { ok: false, msg: '密码不对' };
    acc.at = Date.now();
    putUser(user, acc);
    pendingUser = user;
    tab = 'chars';
    return { ok: true, msg: '登录成功', chars: acc.chars };
  }

  /** 用某个角色进入游戏：写入主存档并重载 */
  function enter(user, charId) {
    const g = G();
    if (!g) return false;
    const acc = getUser(user);
    if (!acc) return false;
    const c = acc.chars.filter((x) => x.id === charId)[0];
    if (!c) return false;
    const sd = g.saveData();
    sd.player = c.save || null;
    sd.auth = { user: user, charId: charId };
    g.persistNow();
    try { UI.toast('正在载入「' + (c.name || '无名') + '」…', 'gold'); } catch (e) { }
    setTimeout(function () { try { location.reload(); } catch (e) { } }, 500);
    return true;
  }

  /** 新建角色：清空当前角色但保留账号，回到开始界面重新择道 */
  function newChar(user) {
    const g = G();
    if (!g) return false;
    const sd = g.saveData();
    sd.player = null;
    sd.auth = { user: user, charId: null };
    g.persistNow();
    try { UI.toast('请重新择道，新角色会自动存进「' + user + '」', 'gold'); } catch (e) { }
    setTimeout(function () { try { location.reload(); } catch (e) { } }, 500);
    return true;
  }

  function removeChar(user, charId) {
    const acc = getUser(user);
    if (!acc) return false;
    acc.chars = acc.chars.filter((x) => x.id !== charId);
    putUser(user, acc);
    const auth = authOf();
    if (auth && auth.charId === charId) setAuth({ user: user, charId: null });
    return true;
  }

  function logout() {
    setAuth(null);
    pendingUser = null;
    tab = 'login';
  }

  function currentInfo() {
    const auth = authOf();
    if (!auth || !auth.user) return null;
    const acc = getUser(auth.user);
    if (!acc) return null;
    const c = auth.charId ? acc.chars.filter((x) => x.id === auth.charId)[0] : null;
    return { user: auth.user, charId: auth.charId, char: c || null, count: acc.chars.length };
  }

  /* ------------------------------ 界面 ------------------------------ */

  function ensure() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'accPanel';
    panel.className = 'modal gm-modal hidden';
    (document.getElementById('hud') || document.body).appendChild(panel);
  }

  function close() {
    if (!panel) return;
    panel.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
  }

  function open() {
    ensure();
    const info = currentInfo();
    tab = info && info.user ? 'chars' : 'login';
    if (info && info.user) pendingUser = info.user;
    render();
    panel.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    try { Audio2.play('ui'); } catch (e) { }
  }

  function el2(tag, cls, text) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text !== undefined) d.textContent = text;
    return d;
  }

  function btn(label, cls, fn) {
    const b = el2('button', 'btn ' + (cls || ''), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  function render() {
    ensure();
    panel.innerHTML = '';
    const head = el2('div', 'modal-head');
    head.innerHTML = '<span>道 号 · 多 角 色</span><button class="x-btn gm-x" type="button">✕</button>';
    panel.appendChild(head);
    const x = head.querySelector('.gm-x');
    if (x) x.addEventListener('click', close);

    const body = el2('div', 'gm-body');
    panel.appendChild(body);

    const info = currentInfo();
    const user = pendingUser || (info && info.user) || null;

    const tip = el2('div', 'gm-tip');
    tip.innerHTML = '一个道号下可以保存<b>多个角色</b>，各自进度独立，随时切换，不用清档重来。<br>' +
      '<span class="dim">账号与角色都只存在本机浏览器里，清缓存会丢，请勿使用真实密码。</span>';
    body.appendChild(tip);

    if (!user) {
      /* ---- 登录 / 注册 ---- */
      const form = el2('div', 'acc-form');
      const nameIn = el2('input', 'acc-input');
      nameIn.type = 'text';
      nameIn.placeholder = '道号（账号名）';
      nameIn.maxLength = 12;
      const pwdIn = el2('input', 'acc-input');
      pwdIn.type = 'password';
      pwdIn.placeholder = '密码';
      pwdIn.maxLength = 20;
      form.appendChild(nameIn);
      form.appendChild(pwdIn);

      const acts = el2('div', 'acc-acts');
      acts.appendChild(btn('登 录', 'gold', function () {
        const r = login(nameIn.value, pwdIn.value);
        try { UI.toast(r.msg, r.ok ? 'gold' : 'red'); } catch (e) { }
        if (r.ok) render();
      }));
      acts.appendChild(btn('注 册', '', function () {
        const r = register(nameIn.value, pwdIn.value);
        try { UI.toast(r.msg, r.ok ? 'gold' : 'red'); } catch (e) { }
        if (r.ok) {
          pendingUser = String(nameIn.value || '').trim();
          tab = 'chars';
          render();
        }
      }));
      form.appendChild(acts);
      body.appendChild(form);

      const uh = el2('div', 'sec-sub', '本 机 已 有 道 号');
      body.appendChild(uh);
      const list = el2('div', 'acc-list');
      const all = users();
      if (!all.length) {
        const emp = el2('div', 'quest-empty', '还没有任何道号。填写道号与密码后点「注册」。');
        list.appendChild(emp);
      }
      all.forEach(function (acc, i) {
        const nm = Object.keys(loadAll())[i];
        const row = el2('div', 'acc-row');
        row.innerHTML = '<b>' + nm + '</b><em>' + acc.chars.length + ' 个角色</em>';
        row.appendChild(btn('选 中', 'gold', function () {
          pendingUser = nm;
          tab = 'chars';
          nameIn.value = nm;
          render();
        }));
        list.appendChild(row);
      });
      body.appendChild(list);
      return;
    }

    /* ---- 已选道号：角色列表 ---- */
    const acc = getUser(user);
    const bar = el2('div', 'acc-bar');
    bar.innerHTML = '<b>' + user + '</b><span>共 ' + (acc ? acc.chars.length : 0) + ' 个角色</span>';
    const right = el2('div', 'acc-bar-r');
    right.appendChild(btn('新 建 角 色', 'gold', function () {
      newChar(user);
    }));
    right.appendChild(btn('切 换 道 号', '', function () {
      logout();
      pendingUser = null;
      tab = 'login';
      render();
    }));
    bar.appendChild(right);
    body.appendChild(bar);

    const chars = acc ? acc.chars : [];
    const grid = el2('div', 'acc-grid');
    if (!chars.length) {
      const emp = el2('div', 'quest-empty', '这个道号还没有角色。点「新建角色」去择道吧。');
      grid.appendChild(emp);
    }
    chars.forEach(function (c) {
      const cur = info && info.charId === c.id;
      const card = el2('div', 'acc-card' + (cur ? ' cur' : ''));
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      cv.className = 'acc-face';
      try {
        drawPortraitAvatar(cv, 'p_' + (c.path || 'sword'),
          playerSpec(c.path || 'sword', (c.save && c.save.look) || null));
      } catch (e) { }
      card.appendChild(cv);

      const meta = el2('div', 'acc-meta');
      const sp = (typeof PATHS !== 'undefined' && PATHS[c.path || 'sword']) ? PATHS[c.path || 'sword'].name : '散修';
      const rn = (typeof realmName === 'function') ? realmName(c.level || 1) : ('Lv.' + (c.level || 1));
      meta.innerHTML = '<b>' + (c.name || '无名') + '</b>' +
        '<em>' + sp + ' · ' + rn + '</em>' +
        '<i>' + (cur ? '当前角色' : '') + '</i>';
      card.appendChild(meta);

      const acts = el2('div', 'acc-card-acts');
      if (cur) {
        const b = btn('进 入 游 戏', 'gold', function () { close(); });
        acts.appendChild(b);
      } else {
        acts.appendChild(btn('进 入', 'gold', function () { enter(user, c.id); }));
      }
      acts.appendChild(btn('删 除', 'acc-del', function () {
        let ok = true;
        if (typeof confirm === 'function') ok = confirm('确定删除角色「' + (c.name || '无名') + '」？此操作不可撤销。');
        if (ok) { removeChar(user, c.id); render(); }
      }));
      card.appendChild(acts);
      grid.appendChild(card);
    });
    body.appendChild(grid);

    const foot = el2('div', 'modal-foot');
    foot.innerHTML = '<span>' + (info && info.user ? ('当前道号：' + info.user) : '未登入') + '</span>' +
      '<span class="dim">切换角色会自动保存当前进度</span>';
    panel.appendChild(foot);
  }

  return {
    open, close, render, register, login, enter, newChar, removeChar, logout,
    syncCurrent, currentInfo, users, getUser, hash, loadAll
  };
})();
