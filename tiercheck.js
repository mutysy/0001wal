'use strict';
/* 称号十品阶核对 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const sandbox = {
  console, Math, Object, Array, JSON, Date, String, Number,
  parseInt, parseFloat, isNaN, isFinite,
  Uint8Array, Int16Array, Int32Array, Float32Array, Set, Map
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const f of ['data.js', 'data2.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: f });
}
const TITLES = vm.runInContext('TITLES', sandbox);
const TITLE_RARE = vm.runInContext('TITLE_RARE', sandbox);
const titleTierName = vm.runInContext('titleTierName', sandbox);

console.log('称号品阶分布（共 ' + TITLES.length + ' 枚，' + TITLE_RARE.length + ' 个品阶）');
console.log('='.repeat(82));
const byTier = {};
for (const t of TITLES) (byTier[t.rare] = byTier[t.rare] || []).push(t);

for (let i = 1; i <= 10; i++) {
  const list = byTier[i] || [];
  const r = TITLE_RARE[i - 1];
  console.log(
    String(i).padStart(2) + ' ' + (r.name + '品') + '  ' +
    ('攻+' + r.atk + ' 防+' + r.def + ' 血+' + r.hp + ' 灵+' + r.qi + ' 暴+' + (r.crit * 100).toFixed(1) + '%').padEnd(40) +
    ' ' + list.length + ' 枚' + (list.length ? '：' + list.map((x) => x.name).join('、') : '（空）')
  );
}
console.log('='.repeat(82));

// 校验：品阶越高，基础属性必须越大
let ok = true;
for (let i = 1; i < TITLE_RARE.length; i++) {
  const a = TITLE_RARE[i - 1], b = TITLE_RARE[i];
  if (!(b.atk > a.atk && b.def > a.def && b.hp > a.hp && b.qi > a.qi && b.crit > a.crit)) {
    ok = false;
    console.log('✗ 第 ' + (i + 1) + ' 阶属性没有高于第 ' + i + ' 阶');
  }
}
console.log(ok ? '✓ 十阶属性严格递增' : '✗ 属性曲线有问题');

// 抽查实际称号加成
console.log('');
console.log('抽查若干称号实际加成：');
for (const id of ['t_rookie', 't_slayer', 't_hunter', 't_tower50', 't_tower100', 't_realm0', 't_realm3', 't_realm7']) {
  const t = TITLES.filter((x) => x.id === id)[0];
  if (!t) continue;
  console.log('  ' + titleTierName(t.rare) + ' ' + t.name.padEnd(6) +
    ' 攻+' + t.bonus.atk + ' 防+' + t.bonus.def + ' 血+' + t.bonus.hp +
    ' 灵+' + t.bonus.qi + ' 暴+' + (t.bonus.crit * 100).toFixed(1) + '%');
}

// 十阶是否都有称号
const missing = [];
for (let i = 1; i <= 10; i++) if (!byTier[i] || !byTier[i].length) missing.push(i);
console.log('');
console.log(missing.length ? ('✗ 没有称号的品阶: ' + missing.join('、')) : '✓ 十个品阶都至少有一枚称号');
process.exit((ok && !missing.length) ? 0 : 1);
