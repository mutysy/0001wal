'use strict';

/* =========================================================================
   青云界 · 修为榜（单机，真实记录）
   ---------------------------------------------------------------
   榜上条目全部来自真实游玩产生的存档：
     1) 本机当前存档（实时同步）
     2) 本机历次存档（重新择道时保留旧道号的记录）
     3) 其他机器上的朋友通过「铭牌」导入的记录
   没有任何 AI 假数据。
   ========================================================================= */

const Rank = (function () {
  let G = null;

  /* 修为总值 = 各层累计所需 + 当前层进度 */
  function totalExpOf(level, exp) {
    let sum = exp || 0;
    for (let l = 1; l < level; l++) sum += expNeed(l);
    return sum;
  }

  function store() {
    const sd = G.saveData();
    if (!Array.isArray(sd.rank)) sd.rank = [];
    return sd.rank;
  }

  function init(game) {
    G = game;
    store();
  }

  /** 把当前角色写入榜单（同名覆盖，保留最高修为，避免回档掉名次） */
  function upsertSelf() {
    if (!G || !G.player || !G.player.name) return;
    const p = G.player;
    const list = store();
    const total = totalExpOf(p.level, p.exp);
    let e = null;
    for (const x of list) if (x.name === p.name) { e = x; break; }
    if (!e) {
      list.push({ name: p.name, path: p.path, level: p.level, exp: p.exp, total: total, updatedAt: Date.now() });
    } else if (total >= (e.total || 0)) {
      // 只升不降：重新择道后旧记录不会被低等级冲掉
      e.path = p.path;
      e.level = p.level;
      e.exp = p.exp;
      e.total = total;
      e.updatedAt = Date.now();
    }
    G.persistNow();
  }

  /** 导入道友铭牌 */
  function importCode(code) {
    const data = decode(code);
    if (!data) return { ok: false, msg: '铭牌无法识别' };
    const list = store();
    const total = totalExpOf(data.level, data.exp);
    let e = null;
    for (const x of list) if (x.name === data.name) { e = x; break; }
    if (e) {
      if (total <= (e.total || 0)) return { ok: false, msg: data.name + ' 已在榜上，且修为不低' };
      e.path = data.path; e.level = data.level; e.exp = data.exp; e.total = total; e.updatedAt = Date.now();
    } else {
      list.push({
        name: data.name, path: data.path, level: data.level, exp: data.exp,
        total: total, updatedAt: Date.now(), external: true
      });
    }
    G.persistNow();
    return { ok: true, msg: '已录入「' + data.name + '」' };
  }

  /** 生成当前角色的铭牌码 */
  function code() {
    const p = G.player;
    return encode({ name: p.name, path: p.path, level: p.level, exp: Math.floor(p.exp) });
  }

  /* ------------------------------ 铭牌编解码 ------------------------------ */

  function encode(d) {
    const raw = [d.name, d.path, d.level, Math.floor(d.exp)].join('|');
    try {
      return 'QY1' + btoa(unescape(encodeURIComponent(raw))).replace(/=+$/, '');
    } catch (e) {
      return '';
    }
  }

  function decode(str) {
    if (!str) return null;
    const s = String(str).trim().replace(/\s+/g, '');
    if (s.indexOf('QY1') !== 0) return null;
    try {
      let b = s.slice(3).replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      const raw = decodeURIComponent(escape(atob(b)));
      const parts = raw.split('|');
      if (parts.length < 4) return null;
      const name = parts[0].slice(0, 12);
      const path = ['sword', 'mage', 'body', 'alch'].indexOf(parts[1]) >= 0 ? parts[1] : 'sword';
      const level = Math.max(1, Math.min(99, parseInt(parts[2], 10) || 1));
      const exp = Math.max(0, parseInt(parts[3], 10) || 0);
      if (!name) return null;
      return { name: name, path: path, level: level, exp: exp };
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------ 榜单 ------------------------------ */

  function list() {
    if (!G) return [];
    const p = G.player;
    const rows = store().map((e) => ({
      name: e.name,
      path: e.path,
      level: e.level,
      exp: e.exp,
      total: e.total || totalExpOf(e.level, e.exp),
      me: !!(p && p.name === e.name),
      external: !!e.external
    }));
    // 当前角色若还没写入，也先算进来
    if (p && p.name && !rows.some((r) => r.me)) {
      rows.push({
        name: p.name, path: p.path, level: p.level, exp: p.exp,
        total: totalExpOf(p.level, p.exp), me: true, external: false
      });
    }
    rows.sort((a, b) => b.total - a.total);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }

  function myRank() {
    for (const r of list()) if (r.me) return r;
    return null;
  }

  function gapToNext() {
    const rows = list();
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].me) continue;
      if (i === 0) return null;
      return { name: rows[i - 1].name, diff: rows[i - 1].total - rows[i].total };
    }
    return null;
  }

  function remove(name) {
    const list = store();
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].name === name) list.splice(i, 1);
    }
    G.persistNow();
  }

  function clearAll() {
    const sd = G.saveData();
    sd.rank = [];
    G.persistNow();
  }

  return {
    init, list, myRank, gapToNext, upsertSelf, importCode, code,
    remove, clearAll, totalExpOf, encode, decode
  };
})();
