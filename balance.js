'use strict';
/* 经验曲线与破境数值核对 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const vm = require('vm');
const ctx = { console, Math, Object, Array, JSON, Date, String, Number, parseInt, parseFloat, isNaN };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8'), ctx, { filename: 'data.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data2.js'), 'utf8'), ctx, { filename: 'data2.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'gear.js'), 'utf8'), ctx, { filename: 'gear.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'root.js'), 'utf8'), ctx, { filename: 'root.js' });

const expNeed = vm.runInContext('expNeed', ctx);
const realmName = vm.runInContext('realmName', ctx);
const realmIndex = vm.runInContext('realmIndex', ctx);
const isBottleneckLevel = vm.runInContext('isBottleneckLevel', ctx);
const breakStoneCost = vm.runInContext('breakStoneCost', ctx);
const REALMS = vm.runInContext('REALMS', ctx);
const TITLES = vm.runInContext('TITLES', ctx);

console.log('等级  境界        需求        相对上境');
let total = 0;
let prevRealm = -1;
for (let lv = 1; lv <= 72; lv++) {
  const n = expNeed(lv);
  total += n;
  const ri = realmIndex(lv);
  const isFirst = ri !== prevRealm;
  prevRealm = ri;
  if (lv <= 10 || isFirst || lv % 9 === 0) {
    console.log(
      String(lv).padStart(3) + '  ' + realmName(lv).padEnd(10) +
      String(n).padStart(11) + '   ' +
      (isFirst ? '★进入' + REALMS[ri] : '') +
      (isBottleneckLevel(lv) ? '  [瓶颈·破境需 ' + breakStoneCost(lv) + ' 灵石]' : '')
    );
  }
}
console.log('');
console.log('升到 72 级总修为: ' + total.toLocaleString());
console.log('从 1 级到 9 级(炼气圆满)总修为: ' +
  Array.from({ length: 9 }, (_, i) => expNeed(i + 1)).reduce((a, b) => a + b, 0).toLocaleString());
console.log('');
console.log('境界称号数量: ' + TITLES.filter((t) => t.cond && t.cond.type === 'realm').length);
TITLES.filter((t) => t.cond && t.cond.type === 'realm').forEach((t) => {
  console.log('  ' + t.id.padEnd(9) + t.name.padEnd(6) + ' 加成 ' + JSON.stringify(t.bonus));
});

// 灵根分布抽样
const Root = vm.runInContext('Root', ctx);
const dist = {};
for (let i = 0; i < 20000; i++) {
  const r = Root.roll();
  dist[r.short] = (dist[r.short] || 0) + 1;
}
console.log('');
console.log('灵根分布（20000 次抽样）:');
Object.keys(dist).sort().forEach((k) => {
  console.log('  ' + k.padEnd(8) + (dist[k] / 200).toFixed(1) + '%');
});
