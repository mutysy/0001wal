'use strict';

/* =========================================================================
   青云界 · 数据层 扩展篇（v0.8 大优化）
   装备耐久 / 品质 / 等级 / 合成 / 服装 / 新丹药药材 / 更多怪物 /
   新地图主题（冰火暗雷）/ 副本 / 宗门 / 秘境 / 炼丹 / 属性升级 / 称号加成
   ========================================================================= */

/* ------------------------------------------------------------------
   1. 装备槽位
------------------------------------------------------------------ */
const GEAR_SLOTS = ['weapon', 'body', 'charm', 'cloth'];
const SLOT_NAME = { weapon: '兵器', body: '护体', charm: '饰品', cloth: '服饰' };

/* ------------------------------------------------------------------
   2. 新道具（装备 / 服装 / 丹药 / 药材 / 修补材料）
------------------------------------------------------------------ */
Object.assign(ITEMS, {

  /* ---------- 白色·凡品 装备 ---------- */
  wp_rust: {
    name: '锈铁刀', kind: 'weapon', price: 30, sell: 12, atk: 3, q: 0,
    desc: '刀口卷刃的旧刀，村中铁匠随手打的。'
  },
  wp_bone: {
    name: '骨杖', kind: 'weapon', price: 34, sell: 13, atk: 2, qi: 8, q: 0,
    desc: '妖兽腿骨所制，勉强能引气。'
  },
  bd_hemp: {
    name: '粗布道袍', kind: 'body', price: 26, sell: 10, def: 3, q: 0,
    desc: '最寻常的麻布衣，胜在便宜。'
  },
  ch_wood: {
    name: '桃木符', kind: 'charm', price: 24, sell: 9, hp: 14, q: 0,
    desc: '桃木刻的护符，乡下人用来辟邪。'
  },

  /* ---------- 绿色·灵品 装备 ---------- */
  bd_light: {
    name: '轻灵软甲', kind: 'body', price: 190, sell: 76, def: 9, speed: 6, q: 1,
    desc: '鳞片薄而韧，几乎不觉其重。'
  },
  wp_bamboo: {
    name: '青竹剑', kind: 'weapon', price: 180, sell: 72, atk: 12, def: 1, q: 1,
    desc: '以灵竹削成，轻巧灵动。'
  },

  /* ---------- 紫色·地品 护体 ---------- */
  bd_ice: {
    name: '玄冰甲', kind: 'body', price: 980, sell: 390, def: 26, hp: 70, q: 3,
    desc: '寒髓凝成的甲片，触之刺骨。'
  },

  /* ---------- 金色·天品 护体 ---------- */
  bd_dragon: {
    name: '龙鳞宝甲', kind: 'body', price: 2600, sell: 1040, def: 42, hp: 150, q: 4,
    desc: '蛟龙蜕鳞所缀，刀枪难入。'
  },

  /* ---------- 红色·仙品 护体 ---------- */
  bd_slayer: {
    name: '弑神战铠', kind: 'body', price: 7200, sell: 2880, def: 68, hp: 320, q: 5,
    desc: '铠上裂痕斑斑，每一道都来自一尊陨落的神。'
  },

  /* ---------- 服装（服饰槽，改变外观 / 微量属性） ---------- */
  cl_white: {
    name: '素心道袍', kind: 'cloth', price: 800, sell: 200, q: 1, def: 4, qi: 8,
    robe: '#f7fbff', robeDark: '#c4d8ec', accent: '#5f9ad2',
    desc: '最正统的道门白衣，清气自生。'
  },
  cl_ink: {
    name: '玄青长衫', kind: 'cloth', price: 800, sell: 200, q: 1, qi: 12,
    robe: '#31496b', robeDark: '#20304a', accent: '#9fd0ff',
    desc: '墨色深沉，行走时衣角如夜云翻卷。'
  },
  cl_cloud: {
    name: '流云羽衣', kind: 'cloth', price: 1800, sell: 450, q: 2, speed: 10, qi: 14,
    robe: '#dfeaf6', robeDark: '#a9bfd8', accent: '#e8d9a8',
    desc: '织入云纹与鹤羽，风过时衣袂飘飘若举。'
  },
  cl_jade: {
    name: '青竹居士服', kind: 'cloth', price: 1800, sell: 450, q: 2, def: 8, hp: 40,
    robe: '#eef7ee', robeDark: '#c2dbc6', accent: '#7fbb8a',
    desc: '幽篁林深处隐士常着，素净无华。'
  },
  cl_fire: {
    name: '赤炎战袍', kind: 'cloth', price: 3200, sell: 800, q: 3, atk: 12, hp: 60,
    robe: '#8a2f22', robeDark: '#5d1c14', accent: '#f0a24c',
    desc: '以火蚕丝织成，近身可闻焦味。'
  },
  cl_ice: {
    name: '寒霜素纱', kind: 'cloth', price: 3200, sell: 800, q: 3, def: 12, qi: 30,
    robe: '#e8f4fb', robeDark: '#b6d2e4', accent: '#8fd8ff',
    desc: '纱薄如蝉翼，却透着彻骨寒意。'
  },
  cl_ghost: {
    name: '幽冥夜行衣', kind: 'cloth', price: 4800, sell: 1200, q: 4, speed: 16, crit: 0.05,
    robe: '#2b2a3e', robeDark: '#171622', accent: '#b98fff',
    desc: '贴身而不反光，是鬼域里最好的颜色。'
  },
  cl_moon: {
    name: '月华霓裳', kind: 'cloth', price: 4800, sell: 1200, q: 4, qi: 60, qiRegen: 3,
    robe: '#eae4ff', robeDark: '#c0b6e0', accent: '#d0c4ff',
    desc: '月光落上去便不再离开，衣上终夜流银。'
  },
  cl_gold: {
    name: '鎏金法衣', kind: 'cloth', price: 8800, sell: 2200, q: 5, def: 30, hp: 120, atk: 14,
    robe: '#d9b45a', robeDark: '#a8823a', accent: '#fff0b8',
    desc: '金线密密绣满经文，一步一响。'
  },
  cl_void: {
    name: '太虚道袍', kind: 'cloth', price: 8800, sell: 2200, q: 5, atk: 20, qi: 80, crit: 0.06,
    robe: '#1f2436', robeDark: '#12151f', accent: '#7fe8ff',
    desc: '衣上星纹缓慢流转，像是另一片天空。'
  },

  /* ---------- 破境丹系列 ---------- */
  pill_break_s: {
    name: '小破境丹', kind: 'pill', price: 420, sell: 170, stack: 9, q: 2,
    desc: '冲关之药，获得约一级境界的修为。', use: { expLevels: 1 }
  },
  pill_break_l: {
    name: '大破境丹', kind: 'pill', price: 3200, sell: 1280, stack: 3, q: 5,
    desc: '丹成时天有异色，可直入四层境界。', use: { expLevels: 4 }
  },
  pill_break: {
    name: '破境丹', kind: 'pill', price: 1200, sell: 480, stack: 5, q: 4,
    desc: '强行冲关，立即获得相当于两级境界的修为。', use: { expLevels: 2 }
  },

  /* ---------- 战斗丹药 ---------- */
  pill_rage: {
    name: '狂气丹', kind: 'pill', price: 260, sell: 100, stack: 9, q: 2,
    desc: '血气翻涌，十息内攻速大增。', use: { buff: { aspd: 0.55, time: 10 } }
  },
  pill_swift: {
    name: '疾风丹', kind: 'pill', price: 240, sell: 95, stack: 9, q: 2,
    desc: '身轻如燕，十息内移速大增。', use: { buff: { move: 0.42, time: 10 } }
  },
  pill_iron: {
    name: '金刚丹', kind: 'pill', price: 300, sell: 118, stack: 9, q: 2,
    desc: '皮肉如铁，十息内所受伤害减半。', use: { buff: { guard: 0.5, time: 10 } }
  },
  pill_heal_l: {
    name: '大还丹', kind: 'pill', price: 320, sell: 126, stack: 9, q: 3,
    desc: '药力浑厚，回复 260 点气血。', use: { hp: 260 }
  },
  pill_qi_l: {
    name: '上品回气丹', kind: 'pill', price: 260, sell: 102, stack: 9, q: 3,
    desc: '灵气充盈，回复 140 点灵力。', use: { qi: 140 }
  },
  pill_god: {
    name: '化神丹', kind: 'pill', price: 2600, sell: 1000, stack: 5, q: 4,
    desc: '永久提升 25 点攻击与 60 点气血上限。', use: { atk: 25, hpMax: 60 }
  },
  pill_evil: {
    name: '九幽丹', kind: 'pill', price: 3600, sell: 1400, stack: 3, q: 5,
    desc: '幽冥之气入体，永久提升 8% 暴击与 20 点攻击。', use: { crit: 0.08, atk: 20 }
  },

  /* ---------- 稀缺药材 ---------- */
  mat_lingzhi: {
    name: '千年灵芝', kind: 'mat', price: 180, sell: 76, stack: 99, q: 3,
    desc: '生于绝壁之上，千年方成一株。'
  },
  mat_ginseng: {
    name: '血参', kind: 'mat', price: 120, sell: 50, stack: 99, q: 2,
    desc: '色如凝血，服之气血翻腾。'
  },
  mat_yin: {
    name: '九阴草', kind: 'mat', price: 200, sell: 84, stack: 99, q: 3,
    desc: '只在阴气极重之地抽芽。'
  },
  mat_icecalyx: {
    name: '玄冰蕊', kind: 'mat', price: 220, sell: 92, stack: 99, q: 3,
    desc: '冰层深处开的花，摘下即刻凝霜。'
  },
  mat_firebloom: {
    name: '赤炎花', kind: 'mat', price: 220, sell: 92, stack: 99, q: 3,
    desc: '生于熔岩裂缝，花瓣自燃不熄。'
  },
  mat_ghost: {
    name: '幽冥芝', kind: 'mat', price: 380, sell: 160, stack: 99, q: 4,
    desc: '以亡魂之气养成的芝草，阴冷刺骨。'
  },
  mat_dragon: {
    name: '龙涎草', kind: 'mat', price: 620, sell: 260, stack: 99, q: 4,
    desc: '传说蛟龙涎水所化，珍稀无比。'
  },

  /* ---------- 修补材料 ---------- */
  mat_iron: {
    name: '玄铁锭', kind: 'mat', price: 60, sell: 26, stack: 99, q: 1,
    desc: '修补兵刃与甲胄的主料。'
  },
  mat_silk: {
    name: '灵蚕丝', kind: 'mat', price: 70, sell: 30, stack: 99, q: 1,
    desc: '织补法袍与软甲的上品材料。'
  },
  mat_sinew: {
    name: '妖筋', kind: 'mat', price: 80, sell: 34, stack: 99, q: 1,
    desc: '妖兽的筋络，坚韧无比，多用修补。'
  }
});

/* ------------------------------------------------------------------
   3. 装备耐久：按品质给出基础耐久
------------------------------------------------------------------ */
(function fillGearDur() {
  const base = { weapon: 150, body: 170, charm: 130, cloth: 120 };
  for (const id in ITEMS) {
    const it = ITEMS[id];
    if (base[it.kind] === undefined) continue;
    if (typeof it.dur !== 'number') {
      it.dur = Math.round((base[it.kind] + (it.price || 0) * 0.05) * (1 + (it.q || 0) * 0.18));
    }
  }
})();

function isGearKind(kind) {
  return kind === 'weapon' || kind === 'body' || kind === 'charm' || kind === 'cloth';
}

/* ------------------------------------------------------------------
   4. 商城分组
------------------------------------------------------------------ */
/* 只有白（0）绿（1）蓝（2）品质的装备可购 */
const SHOP_GEAR_Q = [0, 1, 2];

const SHOP_GEAR_STOCK = [
  'wp_rust', 'wp_wood', 'wp_bone', 'wp_iron', 'wp_staff', 'wp_bamboo',
  'wp_hammer', 'wp_azure', 'wp_frost',
  'bd_hemp', 'bd_silk', 'bd_light', 'bd_scale',
  'ch_wood', 'ch_jade', 'ch_talisman', 'ch_ice'
];

const SHOP_CLOTH_STOCK = [
  'cl_white', 'cl_ink', 'cl_cloud', 'cl_jade', 'cl_fire', 'cl_ice', 'cl_ghost', 'cl_moon', 'cl_gold', 'cl_void'
];

/* 杂货（丹药 / 材料） */
const SHOP_GOODS_STOCK = [
  'pill_qi', 'pill_heal', 'pill_qi_l', 'pill_heal_l', 'pill_break_s',
  'pill_rage', 'pill_swift', 'pill_iron',
  'mat_iron', 'mat_silk', 'mat_sinew'
];

/* 装备合成：5 件同品质 → 1 件高一品质 */
const MERGE_CFG = {
  need: 5,
  feeByQ: [80, 260, 800, 2400, 7000],
  maxQ: 5
};

/* ------------------------------------------------------------------
   5. 属性升级（技能升级面板）
------------------------------------------------------------------ */
const STAT_UP = [
  { id: 'atk', name: '攻 击', icon: 'atk', per: 3.5, base: 90, desc: '每级 +3.5 攻击' },
  { id: 'hp', name: '气 血', icon: 'hp', per: 22, base: 80, desc: '每级 +22 气血上限' },
  { id: 'def', name: '防 御', icon: 'def', per: 2.4, base: 85, desc: '每级 +2.4 防御' },
  { id: 'spd', name: '移 速', icon: 'spd', per: 6, base: 110, desc: '每级 +6 身法' },
  { id: 'aspd', name: '攻 速', icon: 'aspd', per: 0.05, base: 130, desc: '每级 +5% 攻速' }
];

const STAT_UP_MAX = 40;

function statUpCost(def, lv) {
  return Math.floor(def.base * Math.pow(lv + 1, 1.55));
}

/* ------------------------------------------------------------------
   6. 称号属性加成（佩带生效）
------------------------------------------------------------------ */
(function titleBonus() {
  const B = {
    t_rookie: { hp: 10 },
    t_wander: { hp: 25, qi: 10 },
    t_slayer: { atk: 4, def: 2 },
    t_hunter: { atk: 10, crit: 0.02 },
    t_rich: { hp: 60, qi: 30 },
    t_tower10: { def: 6, hp: 40 },
    t_tower50: { atk: 16, def: 10 },
    t_tower100: { atk: 36, def: 22, crit: 0.05, hp: 160 },
    t_abyss: { atk: 8, crit: 0.03 },
    t_abyss10: { atk: 20, crit: 0.06, hp: 80 },
    t_sect: { def: 4, hp: 30 },
    t_sectelder: { atk: 14, def: 14, hp: 120 },
    t_alch: { qi: 40, qiRegen: 2 },
    t_merge: { atk: 6, def: 6 }
  };
  for (const t of TITLES) t.bonus = B[t.id] || {};
})();

TITLES.push(
  { id: 't_sect', name: '青云弟子', color: '#8fe0a0', cond: { type: 'contrib', value: 100 }, desc: '宗门贡献满百' },
  { id: 't_sectelder', name: '青云长老', color: '#ffc24a', cond: { type: 'contrib', value: 1500 }, desc: '宗门贡献满千五' },
  { id: 't_alch', name: '丹道大家', color: '#b98fff', cond: { type: 'alch', value: 20 }, desc: '成功炼丹二十炉' },
  { id: 't_merge', name: '铸器宗师', color: '#ff8a5a', cond: { type: 'merge', value: 10 }, desc: '合成装备十次' }
);

/* ------------------------------------------------------------------
   7. 更多怪物
------------------------------------------------------------------ */
Object.assign(MONSTERS, {
  slime: {
    name: '灵液怪', hp: 46, atk: 6, def: 0, speed: 74, exp: 14, stones: [2, 7],
    body: '#8fe6b0', belly: '#c6f5d8', eye: '#2b4a3a', size: 0.85,
    drop: [{ id: 'mat_herb', p: 0.3 }]
  },
  bat: {
    name: '岩蝠', hp: 58, atk: 8, def: 1, speed: 132, exp: 19, stones: [3, 9],
    body: '#5a5060', belly: '#82738c', eye: '#ff9a6a', size: 0.9, fly: true,
    drop: [{ id: 'mat_sinew', p: 0.35 }]
  },
  frostwolf: {
    name: '霜狼', hp: 150, atk: 18, def: 4, speed: 122, exp: 52, stones: [12, 26],
    body: '#a8c8de', belly: '#e0f0f8', eye: '#7fe8ff', size: 1.05,
    drop: [{ id: 'mat_icecalyx', p: 0.3 }, { id: 'mat_core', p: 0.4 }]
  },
  flameghost: {
    name: '炎魔', hp: 210, atk: 26, def: 3, speed: 96, exp: 78, stones: [20, 40],
    body: '#d4562c', belly: '#ffb066', eye: '#fff2b0', size: 1.15, ghost: true,
    drop: [{ id: 'mat_firebloom', p: 0.35 }, { id: 'mat_core', p: 0.45 }]
  },
  shade: {
    name: '暗影刺客', hp: 165, atk: 30, def: 2, speed: 148, exp: 88, stones: [24, 48],
    body: '#3a3350', belly: '#584c74', eye: '#c08fff', size: 1.0, cls: 'rogue',
    drop: [{ id: 'mat_ghost', p: 0.22 }, { id: 'mat_sinew', p: 0.4 }]
  },
  venom: {
    name: '毒砂蛛', hp: 130, atk: 20, def: 5, speed: 104, exp: 60, stones: [16, 32],
    body: '#6a7a3a', belly: '#9cb05a', eye: '#e0ff6a', size: 1.0,
    drop: [{ id: 'mat_ginseng', p: 0.28 }, { id: 'mat_core', p: 0.3 }]
  },
  thunderbird: {
    name: '雷鸦', hp: 175, atk: 28, def: 3, speed: 158, exp: 92, stones: [26, 52],
    body: '#4a4a72', belly: '#7a7aa8', eye: '#a8e0ff', size: 1.0, fly: true, cls: 'archer',
    drop: [{ id: 'mat_lingzhi', p: 0.2 }, { id: 'mat_core', p: 0.4 }]
  },
  boneknight: {
    name: '骨将', hp: 420, atk: 34, def: 14, speed: 76, exp: 160, stones: [50, 96],
    body: '#cfc7b0', belly: '#e8e2d0', eye: '#8fe3ff', size: 1.3, cls: 'brute',
    drop: [{ id: 'mat_iron', p: 0.6 }, { id: 'bd_scale', p: 0.15 }, { id: 'mat_ghost', p: 0.2 }]
  },
  magmabeast: {
    name: '熔岩兽', hp: 520, atk: 40, def: 16, speed: 68, exp: 190, stones: [60, 120],
    body: '#8a3a22', belly: '#e07a3a', eye: '#ffd166', size: 1.4, cls: 'brute',
    drop: [{ id: 'mat_firebloom', p: 0.5 }, { id: 'mat_iron', p: 0.5 }]
  },
  icelord: {
    name: '冰魄', hp: 480, atk: 38, def: 18, speed: 88, exp: 185, stones: [58, 112],
    body: '#bfe4f5', belly: '#eaf7ff', eye: '#4fa8e0', size: 1.25, ghost: true, cls: 'mage',
    drop: [{ id: 'mat_icecalyx', p: 0.55 }, { id: 'mat_snow', p: 0.4 }]
  },
  voideye: {
    name: '虚空之瞳', hp: 620, atk: 46, def: 12, speed: 100, exp: 240, stones: [80, 160],
    body: '#2a2440', belly: '#463a6a', eye: '#ff5a5a', size: 1.2, ghost: true, cls: 'mage',
    drop: [{ id: 'mat_dragon', p: 0.25 }, { id: 'ch_orbs', p: 0.1 }]
  },

  /* ---------- BOSS ---------- */
  boss_golem: {
    name: '石傀王', hp: 1600, atk: 52, def: 22, speed: 62, exp: 620, stones: [220, 400],
    body: '#6f6a5c', belly: '#9a9282', eye: '#ff8a3a', size: 1.9, boss: true, cls: 'brute',
    drop: [{ id: 'bd_dragon', p: 0.18 }, { id: 'mat_iron', p: 1 }, { id: 'pill_break', p: 0.3 }]
  },
  boss_fire: {
    name: '炎帝残魂', hp: 2400, atk: 66, def: 20, speed: 88, exp: 980, stones: [340, 620],
    body: '#c2401c', belly: '#ff9a4a', eye: '#fff0a0', size: 1.8, boss: true, ghost: true, cls: 'mage',
    drop: [{ id: 'cl_fire', p: 0.2 }, { id: 'mat_firebloom', p: 1 }, { id: 'pill_god', p: 0.2 }]
  },
  boss_ice: {
    name: '玄冰女皇', hp: 2800, atk: 70, def: 28, speed: 92, exp: 1180, stones: [380, 700],
    body: '#9fd6ee', belly: '#e8f8ff', eye: '#3f88c0', size: 1.75, boss: true, cls: 'mage',
    drop: [{ id: 'cl_ice', p: 0.2 }, { id: 'bd_ice', p: 0.18 }, { id: 'mat_icecalyx', p: 1 }]
  },
  boss_dark: {
    name: '幽冥鬼王', hp: 3200, atk: 82, def: 24, speed: 110, exp: 1420, stones: [440, 820],
    body: '#241c33', belly: '#463a5e', eye: '#ff5a5a', size: 1.9, boss: true, ghost: true, cls: 'rogue',
    drop: [{ id: 'cl_ghost', p: 0.2 }, { id: 'ch_blood', p: 0.12 }, { id: 'mat_ghost', p: 1 }]
  },
  boss_void: {
    name: '虚无主', hp: 5200, atk: 104, def: 34, speed: 104, exp: 2600, stones: [900, 1600],
    body: '#1a1830', belly: '#3a3460', eye: '#7fe8ff', size: 2.1, boss: true, ghost: true, cls: 'brute',
    drop: [{ id: 'cl_void', p: 0.2 }, { id: 'wp_slayer', p: 0.12 }, { id: 'pill_break_l', p: 0.3 }]
  }
});

/* ------------------------------------------------------------------
   8. 新地图（冰 / 火 / 暗 / 雷）与副本地图
------------------------------------------------------------------ */
Object.assign(MAPS, {
  fire: {
    id: 'fire', name: '赤炎熔谷', cols: 112, rows: 94, seed: 88421,
    type: 'wild', theme: 'fire',
    band: { deep: 0.10, water: 0.16, sand: 0.20, grass: 0.38, forest: 0.62, hill: 0.80, rock: 0.945 },
    monsters: [{ type: 'flameghost', n: 7 }, { type: 'magmabeast', n: 3 }, { type: 'bat', n: 5 }],
    herbs: 12,
    anchor: { tx: 56, ty: 80, name: '熔谷火阵' },
    exits: [
      { tx: 56, ty: 90, to: 'peak', name: '谷口 · 回寒山绝顶' },
      { tx: 56, ty: 4, to: 'thunder', name: '谷北 · 通往雷泽' }
    ],
    cg: {
      title: '赤炎熔谷', sub: '地火不熄，百年一喷',
      lines: [
        '谷底裂开一道长缝，赤色岩浆在里头缓缓翻身。',
        '炎魔自火中走出，每一步都留下焦黑的脚印。',
        '热浪扑面，你却觉得筋骨被烤得越发通透。'
      ]
    }
  },
  ice: {
    id: 'ice', name: '玄冰渊', cols: 108, rows: 96, seed: 31507,
    type: 'wild', theme: 'ice',
    band: { deep: 0.12, water: 0.20, sand: 0.26, grass: 0.46, forest: 0.60, hill: 0.78, rock: 0.93 },
    monsters: [{ type: 'frostwolf', n: 8 }, { type: 'icelord', n: 4 }, { type: 'ghost', n: 4 }],
    herbs: 14,
    anchor: { tx: 54, ty: 82, name: '冰渊寒阵' },
    exits: [
      { tx: 54, ty: 92, to: 'peak', name: '渊口 · 回寒山绝顶' },
      { tx: 54, ty: 4, to: 'dark', name: '渊北 · 通往幽冥鬼域' }
    ],
    cg: {
      title: '玄冰渊', sub: '万载不化，寒气锁魂',
      lines: [
        '渊壁上下尽是幽蓝的冰，光在其中折了很多次才肯出来。',
        '霜狼在冰面上无声地跑，冰魄则悬在半空一动不动。',
        '呼出的气立刻结成霜，落地便碎。'
      ]
    }
  },
  dark: {
    id: 'dark', name: '幽冥鬼域', cols: 104, rows: 92, seed: 66013,
    type: 'wild', theme: 'dark',
    band: { deep: 0.11, water: 0.18, sand: 0.22, grass: 0.42, forest: 0.66, hill: 0.83, rock: 0.955 },
    monsters: [{ type: 'shade', n: 7 }, { type: 'boneknight', n: 4 }, { type: 'voideye', n: 2 }, { type: 'ghost', n: 5 }],
    herbs: 10,
    anchor: { tx: 52, ty: 80, name: '鬼域阴阵' },
    exits: [
      { tx: 52, ty: 90, to: 'ice', name: '域口 · 回玄冰渊' }
    ],
    cg: {
      title: '幽冥鬼域', sub: '阴阳交界，生人勿近',
      lines: [
        '这里没有影子，因为光根本落不下来。',
        '地上的白骨排成一条路，不知通向何处。',
        '有人在极远处唤你的名字，声音与你一模一样。'
      ]
    }
  },
  thunder: {
    id: 'thunder', name: '雷泽', cols: 110, rows: 90, seed: 19477,
    type: 'wild', theme: 'thunder',
    band: { deep: 0.10, water: 0.21, sand: 0.25, grass: 0.44, forest: 0.62, hill: 0.80, rock: 0.95 },
    monsters: [{ type: 'thunderbird', n: 8 }, { type: 'venom', n: 5 }, { type: 'ape', n: 3 }],
    herbs: 12,
    anchor: { tx: 55, ty: 78, name: '雷泽引阵' },
    exits: [
      { tx: 55, ty: 88, to: 'fire', name: '出口 · 回赤炎熔谷' }
    ],
    cg: {
      title: '雷泽', sub: '雷落如水，泽中藏妖',
      lines: [
        '泽上终年乌云压低，紫白的雷一道道砸进浅水。',
        '雷鸦在雷里穿行，翅膀一扇便带出一串电光。',
        '你握紧兵器，听见自己骨头里也在噼啪作响。'
      ]
    }
  },

  /* ---------- 副本（每张副本一张独立地图） ---------- */
  dg_fire: {
    id: 'dg_fire', name: '赤炎洞窟', cols: 62, rows: 56, seed: 70211,
    type: 'wild', theme: 'fire', dungeon: true, recLv: 8,
    band: { deep: 0.06, water: 0.12, sand: 0.18, grass: 0.42, forest: 0.64, hill: 0.84, rock: 0.96 },
    monsters: [{ type: 'flameghost', n: 8 }, { type: 'magmabeast', n: 2 }, { type: 'boss_fire', n: 1 }],
    herbs: 5,
    anchor: { tx: 31, ty: 46, name: '洞窟入口阵' },
    exits: [],
    cg: {
      title: '赤炎洞窟', sub: '副本 · 火',
      lines: ['洞壁赤红如烙铁，深处的呼吸声大得不像活物。', '炎帝的残魂守在最里面，等着下一个闯进来的人。']
    }
  },
  dg_ice: {
    id: 'dg_ice', name: '寒霜秘境', cols: 62, rows: 56, seed: 41190,
    type: 'wild', theme: 'ice', dungeon: true, recLv: 12,
    band: { deep: 0.08, water: 0.16, sand: 0.22, grass: 0.46, forest: 0.62, hill: 0.82, rock: 0.95 },
    monsters: [{ type: 'frostwolf', n: 7 }, { type: 'icelord', n: 3 }, { type: 'boss_ice', n: 1 }],
    herbs: 5,
    anchor: { tx: 31, ty: 46, name: '秘境入口阵' },
    exits: [],
    cg: {
      title: '寒霜秘境', sub: '副本 · 冰',
      lines: ['整座秘境是一座冰雕的城，街巷俱全，就是没有活人。', '玄冰女皇坐在冰阶最高处，睫毛上挂着千年的霜。']
    }
  },
  dg_dark: {
    id: 'dg_dark', name: '幽冥古墓', cols: 62, rows: 56, seed: 55321,
    type: 'wild', theme: 'dark', dungeon: true, recLv: 16,
    band: { deep: 0.07, water: 0.14, sand: 0.20, grass: 0.44, forest: 0.66, hill: 0.84, rock: 0.96 },
    monsters: [{ type: 'boneknight', n: 6 }, { type: 'shade', n: 5 }, { type: 'boss_dark', n: 1 }],
    herbs: 4,
    anchor: { tx: 31, ty: 46, name: '古墓入口阵' },
    exits: [],
    cg: {
      title: '幽冥古墓', sub: '副本 · 暗',
      lines: ['墓道两侧排着石俑，每一张脸都朝着你。', '鬼王在墓室正中,胸口挂着一串还在跳的心脏。']
    }
  },
  dg_thunder: {
    id: 'dg_thunder', name: '雷池试炼', cols: 62, rows: 56, seed: 62007,
    type: 'wild', theme: 'thunder', dungeon: true, recLv: 20,
    band: { deep: 0.08, water: 0.18, sand: 0.24, grass: 0.44, forest: 0.62, hill: 0.82, rock: 0.95 },
    monsters: [{ type: 'thunderbird', n: 8 }, { type: 'venom', n: 4 }],
    herbs: 4,
    anchor: { tx: 31, ty: 46, name: '雷池入口阵' },
    exits: [],
    cg: {
      title: '雷池试炼', sub: '副本 · 雷',
      lines: ['一池子雷水翻着紫白的浪，没人知道有多深。', '每一道雷落下，都在问你同一个问题。']
    }
  },
  dg_void: {
    id: 'dg_void', name: '太虚剑冢', cols: 62, rows: 56, seed: 91001,
    type: 'wild', theme: 'void', dungeon: true, recLv: 25,
    band: { deep: 0.07, water: 0.13, sand: 0.19, grass: 0.42, forest: 0.64, hill: 0.82, rock: 0.95 },
    monsters: [{ type: 'voideye', n: 6 }, { type: 'shade', n: 4 }, { type: 'boss_void', n: 1 }],
    herbs: 3,
    anchor: { tx: 31, ty: 46, name: '剑冢入口阵' },
    exits: [],
    cg: {
      title: '太虚剑冢', sub: '副本 · 虚空',
      lines: ['无数断剑插在地上，风过时齐齐低鸣。', '虚无主就坐在剑丛中央，等你拔剑。']
    }
  }
});

/* 原野图的连接：绝顶往后接火谷与冰渊 */
(function linkPeak() {
  const peak = MAPS.peak;
  if (!peak) return;
  peak.exits = peak.exits || [];
  const has = (to) => peak.exits.some((e) => e.to === to);
  if (!has('fire')) peak.exits.push({ tx: 62, ty: 10, to: 'fire', name: '东麓 · 通往赤炎熔谷' });
  if (!has('ice')) peak.exits.push({ tx: 38, ty: 10, to: 'ice', name: '西麓 · 通往玄冰渊' });
})();

/* 怪物等级区间补全 */
Object.assign(MONSTER_LV, {
  fire: [18, 24],
  ice: [22, 28],
  dark: [28, 36],
  thunder: [24, 32],
  dg_fire: [20, 26],
  dg_ice: [24, 30],
  dg_dark: [30, 38],
  dg_thunder: [34, 42],
  dg_void: [40, 52]
});

/* ------------------------------------------------------------------
   9. 副本定义
------------------------------------------------------------------ */
const DUNGEONS = [
  {
    id: 'dg_fire', name: '赤炎洞窟', theme: 'fire', recLv: 8, color: '#ff8a4a',
    desc: '地火焚烧千年的洞窟，炎帝残魂盘踞其中。',
    reward: { stones: [300, 520], exp: 900, items: [{ id: 'mat_firebloom', n: 3 }, { id: 'pill_heal_l', n: 2 }] }
  },
  {
    id: 'dg_ice', name: '寒霜秘境', theme: 'ice', recLv: 12, color: '#7fd8ff',
    desc: '冰雕的古城，玄冰女皇守着万载寒髓。',
    reward: { stones: [420, 700], exp: 1300, items: [{ id: 'mat_icecalyx', n: 3 }, { id: 'bd_ice', n: 1 }] }
  },
  {
    id: 'dg_dark', name: '幽冥古墓', theme: 'dark', recLv: 16, color: '#b98fff',
    desc: '鬼王以心脏为灯，墓道里的石俑会睁眼。',
    reward: { stones: [560, 900], exp: 1800, items: [{ id: 'mat_ghost', n: 3 }, { id: 'pill_break_s', n: 1 }] }
  },
  {
    id: 'dg_thunder', name: '雷池试炼', theme: 'thunder', recLv: 20, color: '#a8e0ff',
    desc: '雷水翻涌的池子，落雷一次比一次重。',
    reward: { stones: [700, 1100], exp: 2400, items: [{ id: 'mat_lingzhi', n: 3 }, { id: 'pill_qi_l', n: 3 }] }
  },
  {
    id: 'dg_void', name: '太虚剑冢', theme: 'void', recLv: 25, color: '#7fe8ff',
    desc: '万剑埋骨之地，虚无主在此等候。',
    reward: { stones: [1200, 1900], exp: 4200, items: [{ id: 'mat_dragon', n: 2 }, { id: 'pill_break_l', n: 1 }] }
  }
];

/* ------------------------------------------------------------------
   10. 宗门
------------------------------------------------------------------ */
const SECT = {
  id: 'qingyun',
  name: '青云宗',
  motto: '云深不知处，剑起即为峰',
  desc: '青石村后山的老牌宗门。弟子千余，凭贡献换取丹药、装备与秘法。',
  ranks: [
    { name: '外门弟子', need: 0, color: '#cfd6de' },
    { name: '内门弟子', need: 200, color: '#8fe0a0' },
    { name: '真传弟子', need: 600, color: '#6fb8ff' },
    { name: '执事', need: 1500, color: '#b98fff' },
    { name: '长老', need: 3200, color: '#ffc24a' },
    { name: '宗主', need: 6800, color: '#ff5a5a' }
  ],
  tasks: [
    { id: 'st_clear', name: '清扫妖患', desc: '斩杀 12 只妖兽', need: { kill: 12 }, reward: { contrib: 40, stones: 140 }, cd: 240 },
    { id: 'st_herb', name: '采药供奉', desc: '上缴 5 株凝露草', need: { item: 'mat_herb', n: 5 }, reward: { contrib: 55, stones: 120 }, cd: 240 },
    { id: 'st_core', name: '取妖丹', desc: '上缴 3 枚妖丹', need: { item: 'mat_core', n: 3 }, reward: { contrib: 70, stones: 200 }, cd: 300 },
    { id: 'st_dungeon', name: '副都历练', desc: '踏破任意副本一次', need: { dungeon: 1 }, reward: { contrib: 120, stones: 380 }, cd: 480 },
    { id: 'st_tower', name: '登塔试炼', desc: '试炼塔再进 5 层', need: { tower: 5 }, reward: { contrib: 90, stones: 260 }, cd: 420 }
  ],
  shop: [
    { id: 'pill_break_s', cost: 180 },
    { id: 'pill_heal_l', cost: 120, n: 2 },
    { id: 'pill_qi_l', cost: 110, n: 2 },
    { id: 'mat_iron', cost: 60, n: 2 },
    { id: 'mat_silk', cost: 60, n: 2 },
    { id: 'pill_god', cost: 900 },
    { id: 'man_taixuan', cost: 700 },
    { id: 'cl_jade', cost: 1200 },
    { id: 'wp_frost', cost: 900 },
    { id: 'pill_break_l', cost: 2600 }
  ]
};

function sectRankOf(contrib) {
  let r = SECT.ranks[0];
  for (const x of SECT.ranks) if (contrib >= x.need) r = x;
  return r;
}

/* ------------------------------------------------------------------
   11. 秘境（限时开启）
------------------------------------------------------------------ */
const SECRET_REALM = {
  id: 'secret',
  name: '太虚幻境',
  desc: '每隔一段时间自行开启，境中灵气浓郁，妖兽精纯。',
  period: 180,        // 每 180 秒（游戏内按真实时间）开启一次
  duration: 90,       // 每次开启持续 90 秒
  map: 'dg_thunder',
  color: '#c9a6ff'
};

/* ------------------------------------------------------------------
   12. 炼丹
------------------------------------------------------------------ */
const ALCHEMY = [
  {
    id: 'al_heal', name: '疗伤丹', out: { id: 'pill_heal', n: 1 }, fee: 20,
    need: [{ id: 'mat_herb', n: 2 }],
    desc: '两株凝露草，炼成一枚疗伤丹。'
  },
  {
    id: 'al_qi', name: '回气丹', out: { id: 'pill_qi', n: 1 }, fee: 20,
    need: [{ id: 'mat_bamboo', n: 2 }],
    desc: '灵竹化气，凝作回气丹。'
  },
  {
    id: 'al_heal_l', name: '大还丹', out: { id: 'pill_heal_l', n: 1 }, fee: 90,
    need: [{ id: 'pill_heal', n: 2 }, { id: 'mat_ginseng', n: 1 }],
    desc: '以成丹为引，再入血参，药力倍增。'
  },
  {
    id: 'al_qi_l', name: '上品回气丹', out: { id: 'pill_qi_l', n: 1 }, fee: 90,
    need: [{ id: 'pill_qi', n: 2 }, { id: 'mat_lingzhi', n: 1 }],
    desc: '千年灵芝托底，灵气不易散。'
  },
  {
    id: 'al_break_s', name: '小破境丹', out: { id: 'pill_break_s', n: 1 }, fee: 160,
    need: [{ id: 'mat_lingzhi', n: 1 }, { id: 'mat_core', n: 3 }, { id: 'mat_yin', n: 1 }],
    desc: '九阴草与妖丹同炼，可小冲一关。'
  },
  {
    id: 'al_break', name: '破境丹', out: { id: 'pill_break', n: 1 }, fee: 420,
    need: [{ id: 'pill_break_s', n: 2 }, { id: 'mat_icecalyx', n: 2 }],
    desc: '以玄冰镇住丹性，冲关之力更稳。'
  },
  {
    id: 'al_break_l', name: '大破境丹', out: { id: 'pill_break_l', n: 1 }, fee: 1200,
    need: [{ id: 'pill_break', n: 2 }, { id: 'mat_dragon', n: 1 }, { id: 'mat_firebloom', n: 2 }],
    desc: '龙涎草与赤炎花同炉，丹成则四境齐开。'
  },
  {
    id: 'al_rage', name: '狂气丹', out: { id: 'pill_rage', n: 1 }, fee: 70,
    need: [{ id: 'mat_ginseng', n: 2 }],
    desc: '血参性烈，服之气血翻涌。'
  },
  {
    id: 'al_evil', name: '九幽丹', out: { id: 'pill_evil', n: 1 }, fee: 900,
    need: [{ id: 'mat_ghost', n: 2 }, { id: 'mat_yin', n: 3 }, { id: 'mat_core', n: 5 }],
    desc: '幽冥芝为主，引九幽之气入丹。'
  },
  {
    id: 'al_god', name: '化神丹', out: { id: 'pill_god', n: 1 }, fee: 700,
    need: [{ id: 'mat_dragon', n: 1 }, { id: 'mat_lingzhi', n: 3 }],
    desc: '药力极厚，非大境界者不可轻服。'
  }
];

/* ------------------------------------------------------------------
   13. 任务品质 / 难度
------------------------------------------------------------------ */
const QUEST_TIER = [
  { id: 0, name: '凡', color: '#9aa6b2', glow: 'rgba(154,166,178,', mul: 1.00 },
  { id: 1, name: '良', color: '#8fe0a0', glow: 'rgba(143,224,160,', mul: 1.25 },
  { id: 2, name: '玄', color: '#6fb8ff', glow: 'rgba(111,184,255,', mul: 1.55 },
  { id: 3, name: '地', color: '#b98fff', glow: 'rgba(185,143,255,', mul: 1.90 },
  { id: 4, name: '天', color: '#ffc24a', glow: 'rgba(255,194,74,', mul: 2.40 },
  { id: 5, name: '仙', color: '#ff5a5a', glow: 'rgba(255,90,90,', mul: 3.00 }
];

/* 给已有任务标定品质 */
Object.assign(QUESTS, {
  q_main1: Object.assign(QUESTS.q_main1, { tier: 1 }),
  q_herb: Object.assign(QUESTS.q_herb, { tier: 1 }),
  q_lake: Object.assign(QUESTS.q_lake, { tier: 0 }),
  q_hunt: Object.assign(QUESTS.q_hunt, { tier: 2 }),
  q_boss: Object.assign(QUESTS.q_boss, { tier: 3 }),

  /* 新增任务 */
  q_wolfpack: {
    id: 'q_wolfpack', name: '谷中狼患', giver: 'npc_guard', prereq: 'q_main1', tier: 2,
    desc: '落霞谷的狼越聚越多，李行舟请你再清除八头。',
    objectives: [{ type: 'kill', text: '击杀妖狼', monster: 'wolf', count: 8 }],
    reward: { exp: 420, stones: 130, items: [{ id: 'mat_iron', n: 2 }] }
  },
  q_ice: {
    id: 'q_ice', name: '寒霜之约', giver: 'npc_master', prereq: 'q_boss', tier: 4,
    desc: '玄清子说玄冰渊下有一物与你有缘，去取回来。',
    objectives: [{ type: 'kill', text: '击杀冰魄', monster: 'icelord', count: 3 }],
    reward: { exp: 1200, stones: 460, items: [{ id: 'bd_ice', n: 1 }, { id: 'pill_break_s', n: 1 }] }
  },
  q_smith: {
    id: 'q_smith', name: '百炼成钢', giver: 'npc_smith', prereq: 'q_hunt', tier: 2,
    desc: '雷九斤要你带三块玄铁锭回来，他要试新炉。',
    objectives: [{ type: 'collect', text: '收集玄铁锭', item: 'mat_iron', count: 3 }],
    reward: { exp: 260, stones: 90, items: [{ id: 'wp_bamboo', n: 1 }] }
  },
  q_sect: {
    id: 'q_sect', name: '青云入门', giver: 'npc_master', prereq: 'q_main1', tier: 3,
    desc: '若要真正入青云宗门墙，先斩三头山魈以示心志。',
    objectives: [{ type: 'kill', text: '击杀山魈', monster: 'ape', count: 3 }],
    reward: { exp: 560, stones: 180, contrib: 120, items: [{ id: 'pill_break_s', n: 1 }] }
  }
});

/* ------------------------------------------------------------------
   14. 每件装备的独门描述（立绘时展示的“特别之处”）
------------------------------------------------------------------ */
const GEAR_TRAIT = {
  wp_rust: '刀口卷刃，却意外地顺手',
  wp_wood: '桃木辟邪，鬼物近身则微亮',
  wp_bone: '兽骨中空，引气时会有低鸣',
  wp_iron: '百炼凡铁，剑脊有一道未磨平的褶',
  wp_staff: '桃木成杖，顶端缠着一缕旧符',
  wp_bamboo: '灵竹削成，轻若无物',
  wp_hammer: '重愈百斤，落地裂石',
  wp_azure: '剑身泛青，出鞘有清鸣',
  wp_frost: '剑出如霜，刃上常凝薄冰',
  wp_crimson: '刀身赤如晚霞，一挥斩断长风',
  wp_void: '出鞘无声，剑意通玄',
  wp_slayer: '剑成之日，天上落雨三日',
  bd_hemp: '最寻常的麻布，胜在便宜',
  bd_silk: '织入云纹，能卸去几分力道',
  bd_light: '鳞片薄而韧，几乎不觉其重',
  bd_scale: '玄铁鳞片层叠，护体极佳',
  bd_ice: '寒髓凝成的甲片，触之刺骨',
  bd_dragon: '蛟龙蜕鳞所缀，刀枪难入',
  bd_slayer: '铠上裂痕斑斑，每一道都来自一尊神',
  ch_wood: '乡下人辟邪用的桃符',
  ch_jade: '佩之心神安定，灵气自生',
  ch_talisman: '长老所绘符箓，可挡灾劫',
  ch_ice: '寒玉所制，佩之心静神清',
  ch_orbs: '珠中自成小天地，聚敛灵气不散',
  ch_bell: '铃响一声，邪祟退散',
  ch_seal: '道门法印，铭刻太一真文',
  ch_blood: '玉中似有血在流，握久了会听见心跳',
  cl_white: '最正统的道门白衣，清气自生',
  cl_ink: '墨色深沉，衣角如夜云翻卷',
  cl_cloud: '织入云纹与鹤羽，风过若举',
  cl_jade: '幽篁林隐士常着，素净无华',
  cl_fire: '火蚕丝织成，近身可闻焦味',
  cl_ice: '纱薄如蝉翼，却透着彻骨寒意',
  cl_ghost: '贴身不反光，是鬼域里最好的颜色',
  cl_moon: '月光落上去便不再离开',
  cl_gold: '金线密密绣满经文，一步一响',
  cl_void: '衣上星纹缓慢流转，像另一片天空'
};

/* ------------------------------------------------------------------
   15. 高级捏脸选项（形貌 / 眉眼 / 唇形）
------------------------------------------------------------------ */
Object.assign(LOOK_OPTIONS, {
  faceShape: [
    { id: 'oval', name: '鹅蛋', faceW: 1.00, faceLen: 1.00 },
    { id: 'slim', name: '清瘦', faceW: 0.94, faceLen: 1.05 },
    { id: 'round', name: '圆润', faceW: 1.07, faceLen: 0.95 },
    { id: 'square', name: '方正', faceW: 1.05, faceLen: 0.98 },
    { id: 'long', name: '修长', faceW: 0.92, faceLen: 1.08 }
  ],
  browShape: [
    { id: 'soft', name: '远山眉' },
    { id: 'sharp', name: '剑　眉' },
    { id: 'thin', name: '柳叶眉' },
    { id: 'thick', name: '浓　眉' }
  ],
  eyeShapes: [
    { id: 'almond', name: '杏　眼' },
    { id: 'phoenix', name: '凤　眼' },
    { id: 'round', name: '圆　眼' },
    { id: 'narrow', name: '细　长' },
    { id: 'gentle', name: '含　情' }
  ],
  mouthShape: [
    { id: 'plain', name: '薄　唇' },
    { id: 'full', name: '丰　唇' },
    { id: 'smile', name: '含　笑' }
  ],
  bone: [
    { id: 'male', name: '英　挺', fem: false },
    { id: 'female', name: '清　雅', fem: true }
  ],
  ageLook: [
    { id: 'young', name: '少　年', age: 0.25 },
    { id: 'prime', name: '盛　年', age: 0.45 },
    { id: 'elder', name: '长　者', age: 0.75 }
  ]
});

/* ------------------------------------------------------------------
   16. 境界称号（每突破一大境界自动获得）
------------------------------------------------------------------ */
(function realmTitles() {
  const names = ['引气入体', '筑基立鼎', '金丹在握', '元婴出窍',
    '化神归一', '炼虚合道', '合体圆满', '大乘登仙'];
  for (let i = 0; i < REALMS.length; i++) {
    TITLES.push({
      id: 't_realm' + i,
      name: names[i],
      color: REALM_COLOR[i],
      cond: { type: 'realm', value: i },
      desc: REALMS[i] + '境 · ' + REALM_DESC[i],
      bonus: {
        atk: i * 6,
        def: i * 4,
        hp: i * 70,
        qi: i * 30,
        crit: i * 0.01
      }
    });
  }
})();

/* ------------------------------------------------------------------
   17. 道具类别名（全局，供所有界面复用）
------------------------------------------------------------------ */
const ITEM_KIND_NAME = {
  pill: '丹药', weapon: '兵器', body: '护体', charm: '饰品',
  mat: '材料', manual: '秘法', cloth: '服饰'
};

/* ------------------------------------------------------------------
   18. 称号品阶（10 阶，品质越高边框越气派、属性越强）
------------------------------------------------------------------ */
const TITLE_RARE = [
  { name: '凡', c1: '#9aa6b2', c2: '#5a6470', glow: 'rgba(154,166,178,',
    atk: 2,  def: 1,  hp: 20,  qi: 8,   crit: 0 },
  { name: '灵', c1: '#8fe0a0', c2: '#31734a', glow: 'rgba(143,224,160,',
    atk: 4,  def: 3,  hp: 45,  qi: 18,  crit: 0.005 },
  { name: '玄', c1: '#7fc8ff', c2: '#31678f', glow: 'rgba(127,200,255,',
    atk: 7,  def: 5,  hp: 80,  qi: 30,  crit: 0.010 },
  { name: '地', c1: '#b98fff', c2: '#5f3f9e', glow: 'rgba(185,143,255,',
    atk: 11, def: 8,  hp: 130, qi: 46,  crit: 0.016 },
  { name: '天', c1: '#ffc24a', c2: '#9c6f14', glow: 'rgba(255,194,74,',
    atk: 17, def: 13, hp: 190, qi: 66,  crit: 0.022 },
  { name: '王', c1: '#ff9a5a', c2: '#98400f', glow: 'rgba(255,154,90,',
    atk: 25, def: 19, hp: 270, qi: 92,  crit: 0.030 },
  { name: '皇', c1: '#ffd86a', c2: '#a8791c', glow: 'rgba(255,216,106,',
    atk: 36, def: 27, hp: 380, qi: 128, crit: 0.039 },
  { name: '尊', c1: '#ff7ad5', c2: '#95206f', glow: 'rgba(255,122,213,',
    atk: 50, def: 38, hp: 520, qi: 172, crit: 0.050 },
  { name: '圣', c1: '#ff5a5a', c2: '#8e1f1f', glow: 'rgba(255,90,90,',
    atk: 70, def: 53, hp: 700, qi: 230, crit: 0.063 },
  { name: '仙', c1: '#ddfff4', c2: '#5fc9b0', glow: 'rgba(221,255,244,',
    atk: 96, def: 74, hp: 950, qi: 305, crit: 0.080 }
];

/* 每枚称号的品阶与偏科方向 */
const TITLE_TIER = {
  t_rookie:   { rare: 1,  focus: 'balanced' },
  t_wander:   { rare: 2,  focus: 'qi' },
  t_slayer:   { rare: 3,  focus: 'atk' },
  t_sect:     { rare: 3,  focus: 'balanced' },
  t_rich:     { rare: 4,  focus: 'hp' },
  t_alch:     { rare: 4,  focus: 'qi' },
  t_merge:    { rare: 4,  focus: 'atk' },
  t_hunter:   { rare: 5,  focus: 'atk' },
  t_tower10:  { rare: 5,  focus: 'balanced' },
  t_abyss:    { rare: 6,  focus: 'atk' },
  t_tower50:  { rare: 7,  focus: 'balanced' },
  t_sectelder:{ rare: 7,  focus: 'def' },
  t_abyss10:  { rare: 8,  focus: 'atk' },
  t_tower100: { rare: 9,  focus: 'atk' }
};

/* 偏科系数 */
const TITLE_FOCUS = {
  balanced: { atk: 1.0, def: 1.0, hp: 1.0, qi: 1.0, crit: 1.0 },
  atk:      { atk: 1.55, def: 0.60, hp: 0.65, qi: 0.80, crit: 1.25 },
  def:      { atk: 0.60, def: 1.55, hp: 1.25, qi: 0.80, crit: 0.85 },
  hp:       { atk: 0.55, def: 0.95, hp: 1.65, qi: 0.90, crit: 0.80 },
  qi:       { atk: 0.80, def: 0.70, hp: 0.75, qi: 1.70, crit: 1.05 }
};

(function assignTitleTiers() {
  for (const t of TITLES) {
    let info = TITLE_TIER[t.id];
    if (!info) {
      const m = /^t_realm(\d+)$/.exec(t.id);
      if (m) {
        const ri = Number(m[1]);
        const rare = [2, 3, 4, 5, 6, 7, 8, 10][ri] || 2;
        const focus = ['balanced', 'hp', 'atk', 'qi', 'atk', 'qi', 'balanced', 'balanced'][ri] || 'balanced';
        info = { rare: rare, focus: focus };
      } else {
        info = { rare: 2, focus: 'balanced' };
      }
    }
    t.rare = Math.max(1, Math.min(10, info.rare));
    const base = TITLE_RARE[t.rare - 1];
    const f = TITLE_FOCUS[info.focus] || TITLE_FOCUS.balanced;
    t.bonus = {
      atk: Math.round(base.atk * f.atk),
      def: Math.round(base.def * f.def),
      hp: Math.round(base.hp * f.hp),
      qi: Math.round(base.qi * f.qi),
      crit: Math.round(base.crit * f.crit * 1000) / 1000
    };
  }
})();

/* 称号品阶名（给界面用） */
function titleTierName(rare) {
  const r = TITLE_RARE[Math.max(0, Math.min(TITLE_RARE.length - 1, (rare || 1) - 1))];
  return r.name + '品';
}

/* 每阶的「强者气息」等级：1..10，界面据此挂不同的装饰 */
function titleTierLevel(rare) {
  return Math.max(1, Math.min(10, rare || 1));
}

/* ------------------------------------------------------------------
   19. 试炼塔新增怪物与首领
------------------------------------------------------------------ */
Object.assign(MONSTERS, {
  boneDragon: {
    name: '骨龙', hp: 780, atk: 48, def: 16, speed: 92, exp: 320, stones: [90, 170],
    body: '#d8d2bc', belly: '#f0ecdc', eye: '#7fe8ff', size: 1.62, cls: 'brute',
    drop: [{ id: 'mat_iron', p: 0.7 }, { id: 'pill_break_s', p: 0.18 }, { id: 'mat_dragon', p: 0.12 }]
  },
  dreadknight: {
    name: '大刀亡灵骑士', hp: 620, atk: 52, def: 18, speed: 84, exp: 280, stones: [80, 150],
    body: '#5a5a6e', belly: '#8a8aa0', eye: '#ff5a5a', size: 1.36, cls: 'brute',
    drop: [{ id: 'mat_iron', p: 0.6 }, { id: 'wp_crimson', p: 0.05 }, { id: 'mat_ghost', p: 0.25 }]
  },
  charger: {
    name: '突进虎', hp: 420, atk: 44, def: 8, speed: 168, exp: 210, stones: [60, 120],
    body: '#d8a24a', belly: '#f0d090', eye: '#ffd166', size: 1.18, cls: 'rogue',
    drop: [{ id: 'mat_sinew', p: 0.6 }, { id: 'mat_core', p: 0.4 }]
  },

  /* ---------- 新首领 ---------- */
  boss_darkdragon: {
    name: '黑暗圣龙', hp: 9000, atk: 130, def: 40, speed: 100, exp: 4200, stones: [520, 980],
    body: '#241a34', belly: '#4a3566', eye: '#c08fff', size: 2.3, boss: true, ghost: true, cls: 'brute',
    drop: [{ id: 'cl_ghost', p: 0.25 }, { id: 'ch_blood', p: 0.16 }, { id: 'pill_break_l', p: 0.2 }]
  },
  boss_lightdragon: {
    name: '光明圣龙', hp: 11000, atk: 145, def: 48, speed: 104, exp: 5200, stones: [680, 1200],
    body: '#e8f4ff', belly: '#ffffff', eye: '#ffd166', size: 2.3, boss: true, cls: 'mage',
    drop: [{ id: 'cl_moon', p: 0.25 }, { id: 'bd_dragon', p: 0.18 }, { id: 'pill_break_l', p: 0.24 }]
  },
  boss_glutton: {
    name: '饕餮巨兽', hp: 14000, atk: 120, def: 36, speed: 70, exp: 6000, stones: [800, 1400],
    body: '#7a6a3a', belly: '#b8a05a', eye: '#ff8a3a', size: 2.7, boss: true, cls: 'brute',
    drop: [{ id: 'bd_slayer', p: 0.12 }, { id: 'pill_god', p: 0.3 }, { id: 'mat_dragon', p: 0.5 }]
  }
});

/* 试炼塔：每 10 层轮换的守关首领 */
const TOWER_BOSSES = [
  { type: 'boss_golem', mul: 2.4 },
  { type: 'boss_darkdragon', mul: 2.2 },
  { type: 'boss_lightdragon', mul: 2.2 },
  { type: 'boss_glutton', mul: 2.4 },
  { type: 'boss_void', mul: 2.6 }
];

/* 试炼塔：分层段的杂兵池 */
const TOWER_MOBS = [
  { from: 1, pool: ['wolf', 'ape'] },
  { from: 8, pool: ['ghost', 'charger'] },
  { from: 18, pool: ['dreadknight', 'charger', 'venom'] },
  { from: 28, pool: ['boneDragon', 'dreadknight', 'shade'] },
  { from: 40, pool: ['boneDragon', 'boneknight', 'voideye'] },
  { from: 55, pool: ['boneDragon', 'voideye', 'magmabeast'] },
  { from: 70, pool: ['boneDragon', 'icelord', 'voideye'] }
];

function towerMobPool(floor) {
  let pool = TOWER_MOBS[0].pool;
  for (const seg of TOWER_MOBS) if (floor >= seg.from) pool = seg.pool;
  return pool;
}

function towerBossFor(floor) {
  const idx = Math.floor(floor / 10) - 1;
  return TOWER_BOSSES[Math.max(0, Math.min(TOWER_BOSSES.length - 1, idx))];
}

/* ------------------------------------------------------------------
   20. 每日常规任务
----------------------------------------------------------------- */
const DAILY_QUESTS = [
  {
    id: 'd_kill', name: '每日诛妖', icon: 'kill',
    desc: '斩杀 20 只妖兽', need: { kill: 20 },
    reward: { stones: 260, exp: 400, contrib: 30 }
  },
  {
    id: 'd_tower', name: '每日登塔', icon: 'tower',
    desc: '在试炼塔中破 3 层', need: { tower: 3 },
    reward: { stones: 320, exp: 520, items: [{ id: 'pill_break_s', n: 1 }] }
  },
  {
    id: 'd_herb', name: '采药修习', icon: 'herb',
    desc: '采集 6 株药材', need: { herb: 6 },
    reward: { stones: 180, items: [{ id: 'pill_heal', n: 3 }] }
  },
  {
    id: 'd_alch', name: '炼一炉丹', icon: 'alch',
    desc: '炼制 2 次丹药', need: { alch: 2 },
    reward: { stones: 240, items: [{ id: 'mat_lingzhi', n: 2 }] }
  }
];

/* ------------------------------------------------------------------
   21. 破境辅助丹药（高阶破境必备）
------------------------------------------------------------------ */
Object.assign(ITEMS, {
  pill_guard: {
    name: '护脉丹', kind: 'pill', price: 380, sell: 150, stack: 99, q: 3,
    desc: '护住经脉，破境时护住心脉不被冲垮。破境必需之物。',
    use: { hpFull: true }
  },
  pill_condense: {
    name: '凝神丹', kind: 'pill', price: 620, sell: 250, stack: 99, q: 4,
    desc: '凝神定念，稳固道基。冲关中境以上必备。',
    use: { qiMax: 15, hpMax: 25 }
  }
});

/* 破境：越高的境界需要越多护脉丹 */
function breakGuardNeed(level) {
  const r = realmIndex(level);
  return Math.max(1, r);              // 炼气→1、筑基→2 …大乘→7
}
function breakCondenseNeed(level) {
  const r = realmIndex(level);
  return r >= 3 ? (r - 2) : 0;        // 元婴境起才需要凝神丹
}

/* ------------------------------------------------------------------
   22. 扩充称号（更多收集目标）
------------------------------------------------------------------ */
(function moreTitles() {
  const extra = [
    { id: 't_lv10', name: '炼气大成', color: '#9fb4c8', cond: { type: 'level', value: 10 }, desc: '境界至炼气圆满', rare: 3, focus: 'balanced' },
    { id: 't_lv20', name: '筑基有成', color: '#6fe08a', cond: { type: 'level', value: 20 }, desc: '境界至筑基', rare: 4, focus: 'hp' },
    { id: 't_lv30', name: '金丹在握', color: '#6fb8ff', cond: { type: 'level', value: 30 }, desc: '境界至金丹', rare: 5, focus: 'atk' },
    { id: 't_lv40', name: '元婴初成', color: '#b98fff', cond: { type: 'level', value: 40 }, desc: '境界至元婴', rare: 6, focus: 'qi' },
    { id: 't_lv50', name: '化神临世', color: '#ffc24a', cond: { type: 'level', value: 50 }, desc: '境界至化神', rare: 7, focus: 'atk' },
    { id: 't_kill500', name: '斩妖五百', color: '#8fe0a0', cond: { type: 'kill', value: 500 }, desc: '斩杀五百只妖兽', rare: 5, focus: 'atk' },
    { id: 't_kill1000', name: '斩妖千数', color: '#ff9a5a', cond: { type: 'kill', value: 1000 }, desc: '斩杀一千只妖兽', rare: 7, focus: 'atk' },
    { id: 't_stone10k', name: '腰缠万贯', color: '#ffd86a', cond: { type: 'stones', value: 10000 }, desc: '身家一万灵石', rare: 6, focus: 'hp' },
    { id: 't_tower30', name: '登塔三十', color: '#6fb8ff', cond: { type: 'tower', value: 30 }, desc: '试炼塔至第三十层', rare: 5, focus: 'def' },
    { id: 't_tower70', name: '登塔七十', color: '#b98fff', cond: { type: 'tower', value: 70 }, desc: '试炼塔至第七十层', rare: 8, focus: 'def' },
    { id: 't_abyss20', name: '归墟二十', color: '#ff5a5a', cond: { type: 'abyss', value: 20 }, desc: '深渊踏破二十层', rare: 9, focus: 'atk' },
    { id: 't_contrib5k', name: '宗门柱石', color: '#ffd86a', cond: { type: 'contrib', value: 5000 }, desc: '宗门贡献五千', rare: 7, focus: 'def' },
    { id: 't_alch50', name: '丹道宗师', color: '#c8a8ff', cond: { type: 'alch', value: 50 }, desc: '炼丹五十炉', rare: 6, focus: 'qi' },
    { id: 't_merge30', name: '铸器圣手', color: '#ff8a5a', cond: { type: 'merge', value: 30 }, desc: '合成装备三十次', rare: 6, focus: 'atk' }
  ];
  for (const t of extra) {
    if (TITLES.some(function (x) { return x.id === t.id; })) continue;
    const base = TITLE_RARE[Math.max(0, Math.min(TITLE_RARE.length - 1, t.rare - 1))];
    const f = TITLE_FOCUS[t.focus] || TITLE_FOCUS.balanced;
    TITLES.push({
      id: t.id, name: t.name, color: t.color, cond: t.cond, desc: t.desc,
      rare: t.rare,
      bonus: {
        atk: Math.round(base.atk * f.atk),
        def: Math.round(base.def * f.def),
        hp: Math.round(base.hp * f.hp),
        qi: Math.round(base.qi * f.qi),
        crit: Math.round(base.crit * f.crit * 1000) / 1000
      }
    });
  }
})();

/* ------------------------------------------------------------------
   23. 护脉丹 / 凝神丹 上架与丹方（破境必需）
------------------------------------------------------------------ */
(function stockBreakAids() {
  if (SHOP_GOODS_STOCK.indexOf('pill_guard') < 0) SHOP_GOODS_STOCK.push('pill_guard');
  if (SHOP_GOODS_STOCK.indexOf('pill_condense') < 0) SHOP_GOODS_STOCK.push('pill_condense');
  if (SECT.shop && !SECT.shop.some(function (g) { return g.id === 'pill_guard'; })) {
    SECT.shop.push({ id: 'pill_guard', cost: 90, n: 2 });
    SECT.shop.push({ id: 'pill_condense', cost: 150, n: 1 });
  }
  if (typeof ALCHEMY !== 'undefined') {
    if (!ALCHEMY.some(function (a) { return a.id === 'al_guard'; })) {
      ALCHEMY.push({
        id: 'al_guard', name: '护脉丹', out: { id: 'pill_guard', n: 1 }, fee: 60,
        need: [{ id: 'mat_ginseng', n: 2 }, { id: 'mat_herb', n: 3 }],
        desc: '血参护脉，凝露草养气，破境必备。'
      });
    }
    if (!ALCHEMY.some(function (a) { return a.id === 'al_condense'; })) {
      ALCHEMY.push({
        id: 'al_condense', name: '凝神丹', out: { id: 'pill_condense', n: 1 }, fee: 140,
        need: [{ id: 'mat_lingzhi', n: 1 }, { id: 'mat_yin', n: 2 }],
        desc: '千年灵芝与九阴草同炉，凝神定念。'
      });
    }
  }
})();

/* ------------------------------------------------------------------
   24. 扩展品质：圣品 / 神品
------------------------------------------------------------------ */
QUALITY.push({ name: '圣品', color: '#eafcff', glow: 'rgba(234,252,255,', mul: 2.15 });
QUALITY.push({ name: '神品', color: '#ff8ae0', glow: 'rgba(255,138,224,', mul: 2.55 });

/* 合成上限提到神品 */
MERGE_CFG.maxQ = 7;
MERGE_CFG.feeByQ = [80, 260, 800, 2400, 7000, 18000, 42000];

/* 圣品 / 神品装备 */
Object.assign(ITEMS, {
  wp_saint: {
    name: '太乙仙剑', kind: 'weapon', price: 24000, sell: 9600, atk: 168, qi: 120, crit: 0.30, q: 6,
    desc: '剑身上流转着三千道篆文，出鞘时天色会暗一瞬。',
    atkSpd: 0.12
  },
  wp_divine: {
    name: '鸿蒙剑', kind: 'weapon', price: 68000, sell: 27000, atk: 260, qi: 200, crit: 0.40, q: 7,
    desc: '开天辟地之前便已存在的一缕剑气，凝而成剑。',
    atkSpd: 0.2
  },
  bd_saint: {
    name: '九霄圣甲', kind: 'body', price: 22000, sell: 8800, def: 110, hp: 620, q: 6,
    desc: '九重天光织成的甲，落地时会有云纹浮现。'
  },
  bd_divine: {
    name: '混沌道袍', kind: 'body', price: 62000, sell: 24800, def: 175, hp: 1200, qi: 220, q: 7,
    desc: '道袍上什么都没有，看一眼却像看尽了诸天。'
  },
  ch_saint: {
    name: '太初玉简', kind: 'charm', price: 20000, sell: 8000, atk: 70, qi: 160, crit: 0.12, qiRegen: 6, q: 6,
    desc: '简上只刻了两个字，据说读懂的人都没再回来。'
  },
  ch_divine: {
    name: '轮回印', kind: 'charm', price: 58000, sell: 23200, atk: 130, hp: 400, qi: 260, crit: 0.22, q: 7,
    desc: '一枚能让你多活一世的印，代价是记得所有前世。'
  }
});

/* 新装备立绘规格（复用既有画法，换配色与纹样） */
(function newGearArt() {
  if (typeof GearArt === 'undefined' || !GearArt.specOf) return;
  const W = (function () {
    try { return GearArt.__specs || null; } catch (e) { return null; }
  })();
})();

function isGearKindSafe(kind) { return typeof isGearKind === 'function' ? isGearKind(kind) : false; }

/* ------------------------------------------------------------------
   25. 其他宗门与宗门战争
------------------------------------------------------------------ */
const SECT_RIVALS = [
  { id: 'xuanming', name: '玄冥派', color: '#8f7fff', reqLv: 3, power: 1.0, wealth: 3200, contrib: 420,
    desc: '修阴煞之气的旁门，弟子多在夜里出没。' },
  { id: 'chiyan', name: '赤炎教', color: '#ff7a4a', reqLv: 6, power: 1.35, wealth: 5600, contrib: 680,
    desc: '以火为尊，行事最是霸道。' },
  { id: 'youming', name: '幽冥殿', color: '#b06aff', reqLv: 10, power: 1.8, wealth: 9200, contrib: 980,
    desc: '与鬼域来往密切，据说殿中供着活人。' },
  { id: 'tiangong', name: '天工门', color: '#ffd86a', reqLv: 15, power: 2.3, wealth: 15000, contrib: 1500,
    desc: '擅铸器布阵，山门本身就是一座大阵。' },
  { id: 'taixu', name: '太虚剑宗', color: '#7fe8ff', reqLv: 22, power: 3.1, wealth: 28000, contrib: 2600,
    desc: '万剑归宗之正统，剑修心中的圣地。' },
  { id: 'wangu', name: '万骨魔宗', color: '#ff5a5a', reqLv: 30, power: 4.3, wealth: 52000, contrib: 4400,
    desc: '以尸骨筑城，历代宗主的骨头都还立在殿上。' }
];

/* 宣战派出的敌人池 */
const SECT_WAR_MOBS = [
  { maxPower: 1.2, pool: ['dreadknight', 'charger', 'venom'] },
  { maxPower: 2.0, pool: ['boneDragon', 'dreadknight', 'shade'] },
  { maxPower: 3.2, pool: ['boneDragon', 'boneknight', 'voideye'] },
  { maxPower: 9.9, pool: ['boneDragon', 'voideye', 'magelord_proxy'] }
];

function sectWarPool(power) {
  for (const g of SECT_WAR_MOBS) if (power <= g.maxPower) {
    return g.pool.filter(function (t) { return typeof MONSTERS !== 'undefined' && MONSTERS[t]; });
  }
  return ['boneDragon'];
}

/* ------------------------------------------------------------------
   26. 宗门弟子（人形对手，非妖兽）
------------------------------------------------------------------ */
Object.assign(MONSTERS, {
  sect_outer: {
    name: '外门弟子', hp: 320, atk: 30, def: 6, speed: 122, exp: 160, stones: [40, 80],
    body: '#dfe6ef', belly: '#b6c2d2', eye: '#7fc8ff', size: 1.0,
    human: true, path: 'sword', weapon: 'sword',
    robe: '#dfe6ef', robeDark: '#aebbcb', accent: '#7f9ec4', hair: '#2a2630', glow: 'rgba(170,200,240,',
    drop: [{ id: 'mat_iron', p: 0.4 }, { id: 'pill_heal', p: 0.2 }]
  },
  sect_inner: {
    name: '内门弟子', hp: 560, atk: 44, def: 12, speed: 130, exp: 260, stones: [70, 130],
    body: '#e9edf5', belly: '#c2cbdd', eye: '#b79bff', size: 1.04,
    human: true, path: 'mage', weapon: 'staff',
    robe: '#e9edf5', robeDark: '#b8b3cc', accent: '#9b7fd0', hair: '#1c1c26', glow: 'rgba(190,170,255,',
    drop: [{ id: 'mat_silk', p: 0.4 }, { id: 'pill_qi', p: 0.25 }]
  },
  sect_elder: {
    name: '长老', hp: 1200, atk: 66, def: 20, speed: 112, exp: 620, stones: [160, 300],
    body: '#e9e7f2', belly: '#b8b3cc', eye: '#ffd166', size: 1.12,
    human: true, path: 'body', weapon: 'fist',
    robe: '#e9e7f2', robeDark: '#b8b3cc', accent: '#9b7fd0', hair: '#cfcad6', glow: 'rgba(255,225,150,',
    drop: [{ id: 'pill_guard', p: 0.5 }, { id: 'pill_condense', p: 0.25 }, { id: 'mat_iron', p: 0.6 }]
  }
});

/* 车轮战编排：外门 ×3 → 内门 ×2 → 长老 ×1（按对方战力微调） */
function sectWarRounds(power) {
  const p = Math.max(0.6, power || 1);
  const out = [];
  const outer = Math.min(5, 2 + Math.round(p * 0.8));
  const inner = Math.min(4, 1 + Math.round(p * 0.7));
  const elder = Math.min(3, 1 + Math.floor(p * 0.5));
  for (let i = 0; i < outer; i++) out.push('sect_outer');
  for (let i = 0; i < inner; i++) out.push('sect_inner');
  for (let i = 0; i < elder; i++) out.push('sect_elder');
  return out;
}