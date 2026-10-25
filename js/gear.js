'use strict';

/* =========================================================================
   青云界 · 装备核心（品质 / 等级 / 耐久 / 合成 / 修补 / 升级）
   ========================================================================= */

const Gear = (function () {

  const MAX_LV = 10;

  function defQ(id) {
    const it = ITEMS[id];
    return (it && typeof it.q === 'number') ? it.q : 0;
  }

  function qName(q) {
    const Q = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, q | 0))];
    return Q.name;
  }

  function qColor(q) {
    const Q = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, q | 0))];
    return Q.color;
  }

  /** 生成一件装备实例（也是背包条目的形状） */
  function make(id, opt) {
    const it = ITEMS[id];
    if (!it) return null;
    const o = opt || {};
    const q = (typeof o.q === 'number') ? o.q : defQ(id);
    const durMax = Math.round((it.dur || 100) * (1 + q * 0.18));
    return {
      id: id, n: 1,
      q: q,
      lv: o.lv || 0,
      dur: (typeof o.dur === 'number') ? o.dur : durMax,
      durMax: durMax
    };
  }

  /** 品质倍率（相对该道具的固有品质） */
  function qualityMul(id, q) {
    const bq = defQ(id);
    const a = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, q | 0))];
    const b = QUALITY[Math.max(0, Math.min(QUALITY.length - 1, bq))];
    return a.mul / b.mul;
  }

  function lvMul(lv) {
    return 1 + (lv || 0) * 0.10;
  }

  /** 耐久耗尽后的衰减 */
  function durPenalty(inst) {
    if (!inst) return 1;
    if (inst.dur === undefined) return 1;
    if (inst.dur > 0) return 1;
    return 0.35;
  }

  function broken(inst) {
    return !!inst && inst.dur !== undefined && inst.dur <= 0;
  }

  function durRatio(inst) {
    if (!inst || !inst.durMax) return 1;
    return Math.max(0, Math.min(1, inst.dur / inst.durMax));
  }

  /**
   * 一件装备的实际属性（已算品质、等级、耐久衰减）
   * 返回 { atk, def, hp, qi, crit, speed, qiRegen, atkSpd, moveSpd }
   */
  function stats(inst) {
    const out = { atk: 0, def: 0, hp: 0, qi: 0, crit: 0, speed: 0, qiRegen: 0, atkSpd: 0, moveSpd: 0 };
    if (!inst) return out;
    const id = typeof inst === 'string' ? inst : inst.id;
    const it = ITEMS[id];
    if (!it) return out;
    const q = (typeof inst === 'object' && typeof inst.q === 'number') ? inst.q : defQ(id);
    const lv = (typeof inst === 'object' && inst.lv) ? inst.lv : 0;
    const m = qualityMul(id, q) * lvMul(lv) * durPenalty(inst);
    out.atk = (it.atk || 0) * m;
    out.def = (it.def || 0) * m;
    out.hp = (it.hp || 0) * m;
    out.qi = (it.qi || 0) * m;
    out.crit = (it.crit || 0) * m;
    out.speed = (it.speed || 0) * m;
    out.qiRegen = (it.qiRegen || 0) * m;
    out.atkSpd = (it.atkSpd || 0) * m;
    out.moveSpd = (it.moveSpd || 0) * m;
    return out;
  }

  /** 属性对比文本用：返回一行摘要 */
  function statLine(inst) {
    const s = stats(inst);
    const p = [];
    if (s.atk) p.push('攻击 +' + s.atk.toFixed(1));
    if (s.def) p.push('防御 +' + s.def.toFixed(1));
    if (s.hp) p.push('气血 +' + Math.round(s.hp));
    if (s.qi) p.push('灵力 +' + Math.round(s.qi));
    if (s.crit) p.push('暴击 +' + (s.crit * 100).toFixed(1) + '%');
    if (s.speed) p.push('身法 +' + Math.round(s.speed));
    if (s.qiRegen) p.push('回灵 +' + s.qiRegen.toFixed(1));
    if (s.atkSpd) p.push('攻速 +' + Math.round(s.atkSpd * 100) + '%');
    return p.join('　');
  }

  /** 磨损 */
  function wear(inst, amount) {
    if (!inst || inst.dur === undefined) return;
    inst.dur = Math.max(0, inst.dur - amount);
  }

  /* ------------------------------ 修补 ------------------------------ */

  const REPAIR_MAT = {
    weapon: 'mat_iron', body: 'mat_iron', charm: 'mat_silk', cloth: 'mat_silk'
  };

  function repairNeed(inst) {
    if (!inst) return null;
    const missing = Math.max(0, (inst.durMax || 0) - (inst.dur || 0));
    if (missing <= 0) return null;
    const mat = REPAIR_MAT[ITEMS[inst.id] ? ITEMS[inst.id].kind : 'weapon'] || 'mat_iron';
    const q = inst.q || 0;
    return {
      mat: mat,
      matN: Math.max(1, Math.ceil(missing / 45)),
      stones: Math.max(5, Math.round(missing * 0.9 * (1 + q * 0.8)))
    };
  }

  /* ------------------------------ 升级 ------------------------------ */

  function upgradeCost(inst) {
    if (!inst) return Infinity;
    const q = inst.q || 0;
    const lv = inst.lv || 0;
    return Math.floor(120 * (1 + q * 0.85) * Math.pow(lv + 1, 1.75));
  }

  function canUpgrade(inst) {
    return !!inst && (inst.lv || 0) < MAX_LV;
  }

  /* ------------------------------ 合成 ------------------------------ */

  /** 统计背包里某品质的可合成件数 */
  function mergeable(entries, q) {
    return (entries || []).filter((e) => {
      const def = ITEMS[e.id];
      if (!def || !isGearKind(def.kind)) return false;
      return (typeof e.q === 'number' ? e.q : defQ(e.id)) === q;
    });
  }

  function mergeFee(q) {
    return MERGE_CFG.feeByQ[Math.max(0, Math.min(MERGE_CFG.feeByQ.length - 1, q))];
  }

  /* ------------------------------ 掉落用：按品质随机取装备 ------------------------------ */

  /** 从某品质的装备池里随机取一件 id */
  function randomByQuality(q, rnd) {
    const pool = [];
    for (const id in ITEMS) {
      const it = ITEMS[id];
      if (!isGearKind(it.kind)) continue;
      if (it.kind === 'cloth') continue;              // 服装只在商城 / 宗门 / BOSS 出
      if (defQ(id) === q) pool.push(id);
    }
    if (!pool.length) return null;
    const r = rnd || Math.random;
    return pool[Math.floor(r() * pool.length) % pool.length];
  }

  return {
    MAX_LV, defQ, qName, qColor, make, qualityMul, lvMul,
    durPenalty, broken, durRatio, stats, statLine, wear,
    repairNeed, upgradeCost, canUpgrade,
    mergeable, mergeFee, randomByQuality, REPAIR_MAT
  };
})();
