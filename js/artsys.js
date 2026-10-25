'use strict';

/* =========================================================================
   青云界 · 立绘图片系统
   把 PNG 丢进 assets/portraits/ 与 assets/sprites/ 即可替换程序化绘制。
   找不到文件时自动回落到程序化美术，绝不报错。
   ========================================================================= */

const Art = (function () {

  const P_BASE = 'assets/portraits/';
  const S_BASE = 'assets/sprites/';

  /* 全部可替换的角色槽位 */
  const PORTRAIT_KEYS = [
    { key: 'p_sword', name: '玩家 · 剑修立绘' },
    { key: 'p_mage', name: '玩家 · 法修立绘' },
    { key: 'p_body', name: '玩家 · 体修立绘' },
    { key: 'p_alch', name: '玩家 · 丹修立绘' },
    { key: 'npc_master', name: '玄清子（执事）' },
    { key: 'npc_alchemist', name: '苏青萝（药庐）' },
    { key: 'npc_smith', name: '雷九斤（铁匠）' },
    { key: 'npc_young', name: '阿七（杂役）' },
    { key: 'npc_angler', name: '柳翁（钓叟）' },
    { key: 'npc_guard', name: '李行舟（守山）' }
  ];

  /* 世界里走动的角色（单张正面像即可，会按朝向自动镜像） */
  const SPRITE_KEYS = [
    { key: 'p_sword', name: '玩家 · 剑修' },
    { key: 'p_mage', name: '玩家 · 法修' },
    { key: 'p_body', name: '玩家 · 体修' },
    { key: 'p_alch', name: '玩家 · 丹修' },
    { key: 'npc_master', name: '玄清子' },
    { key: 'npc_alchemist', name: '苏青萝' },
    { key: 'npc_smith', name: '雷九斤' },
    { key: 'npc_young', name: '阿七' },
    { key: 'npc_angler', name: '柳翁' },
    { key: 'npc_guard', name: '李行舟' }
  ];

  const P = {};   // portraitKey -> { img, ok, done }
  const S = {};   // spriteKey  -> { img, ok, done }
  let loading = 0;
  let allDone = false;
  let started = false;
  const doneCbs = [];

  function hasImage() {
    try { return typeof Image !== 'undefined'; } catch (e) { return false; }
  }

  function flushDone() {
    if (allDone) return;
    allDone = true;
    const cbs = doneCbs.slice();
    doneCbs.length = 0;
    for (const cb of cbs) { try { cb(); } catch (e) { } }
  }

  function load(map, base, key) {
    if (map[key]) return map[key];
    const rec = { img: null, ok: false, done: false, key: key };
    map[key] = rec;
    if (!hasImage()) { rec.done = true; return rec; }

    loading++;
    let im;
    try { im = new Image(); } catch (e) { rec.done = true; loading--; return rec; }
    im.onload = function () {
      rec.img = im;
      rec.ok = true;
      rec.done = true;
      loading--;
      if (loading <= 0) flushDone();
    };
    im.onerror = function () {
      rec.ok = false;
      rec.done = true;
      loading--;
      if (loading <= 0) flushDone();
    };
    im.src = base + key + '.png';
    return rec;
  }

  /** 注册「全部加载完」回调；已经加载完则立刻执行（不会重复触发） */
  function onReady(cb) {
    if (typeof cb !== 'function') return;
    if (allDone) { try { cb(); } catch (e) { } return; }
    doneCbs.push(cb);
  }

  /** 预加载所有槽位（只启动一次） */
  function preload(onAllDone) {
    if (onAllDone) onReady(onAllDone);
    if (started) return;
    started = true;
    if (!hasImage()) { flushDone(); return; }

    for (const p of PORTRAIT_KEYS) load(P, P_BASE, p.key);
    for (const s of SPRITE_KEYS) load(S, S_BASE, s.key);
    if (loading <= 0) flushDone();
  }

  /** 取立绘图片；没有则返回 null（调用方回落程序化绘制） */
  function portrait(key) {
    let rec = P[key];
    if (!rec) rec = load(P, P_BASE, key);
    if (!rec.done) return null;
    return rec.ok ? rec.img : null;
  }

  function sprite(key) {
    let rec = S[key];
    if (!rec) rec = load(S, S_BASE, key);
    if (!rec.done) return null;
    return rec.ok ? rec.img : null;
  }

  function hasPortrait(key) {
    const r = P[key];
    return !!(r && r.ok && r.img);
  }
  function hasSprite(key) {
    const r = S[key];
    return !!(r && r.ok && r.img);
  }

  /** 统计：给 ?debug=art 用 */
  function report() {
    return {
      portrait: PORTRAIT_KEYS.map((k) => ({ key: k.key, name: k.name, ok: hasPortrait(k.key) })),
      sprite: SPRITE_KEYS.map((k) => ({ key: k.key, name: k.name, ok: hasSprite(k.key) })),
      anyPortrait: PORTRAIT_KEYS.some((k) => hasPortrait(k.key)),
      anySprite: SPRITE_KEYS.some((k) => hasSprite(k.key))
    };
  }

  /**
   * 画进立绘框（整张铺满，居中裁剪）
   */
  function drawInto(canvas, img) {
    if (!canvas || !img || !canvas.getContext) return false;
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.clearRect(0, 0, W, H);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;
    // cover
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return true;
  }

  /**
   * 画进圆形头像框（自动取图片上部的人脸区域）
   */
  function drawAvatar(canvas, img) {
    if (!canvas || !img || !canvas.getContext) return false;
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.clearRect(0, 0, W, H);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;
    // 取上部 52% 高度、居中的方块作为头部
    const box = Math.min(iw, ih * 0.52);
    const sx = (iw - box) / 2;
    const sy = ih * 0.04;
    g.save();
    if (g.beginPath && g.arc) {
      g.beginPath();
      g.arc(W / 2, H / 2, W / 2, 0, 6.2832);
      g.clip();
    }
    g.drawImage(img, sx, sy, box, box, 0, 0, W, H);
    g.restore();
    return true;
  }

  function isLoading() { return loading > 0; }

  return {
    preload, onReady, portrait, sprite, hasPortrait, hasSprite,
    drawInto, drawAvatar, report, isLoading,
    PORTRAIT_KEYS, SPRITE_KEYS,
    P_BASE, S_BASE
  };
})();
