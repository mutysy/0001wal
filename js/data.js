'use strict';

/* =========================================================================
   青云界 · 数据层
   道具 / 流派 / 招式 / 怪物 / NPC / 任务 / 地图 / 剧情
   ========================================================================= */

/* ------------------------------ 境界 ------------------------------ */
const NUM_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘'];
const REALM_DESC = [
  '引气入体，凡骨初开',
  '筑基立鼎，根基始成',
  '结丹成婴，脱胎换骨',
  '元婴出窍，神游太虚',
  '化神归一，言出法随',
  '炼虚合道，移山填海',
  '合体圆满，一念千里',
  '大乘登仙，与天同寿'
];
const REALM_COLOR = ['#9fb4c8', '#6fe08a', '#6fb8ff', '#b98fff', '#ffc24a', '#ff9a5a', '#ff6ad5', '#ff5a5a'];

/** 每境九层 */
const LAYERS_PER_REALM = 9;

function realmIndex(level) {
  return Math.min(REALMS.length - 1, Math.floor((level - 1) / LAYERS_PER_REALM));
}
function realmLayer(level) {
  return ((level - 1) % LAYERS_PER_REALM) + 1;
}
function realmName(level) {
  const r = realmIndex(level);
  const s = realmLayer(level);
  return REALMS[r] + '·' + NUM_CN[s - 1] + '层';
}

/**
 * 修为需求：指数增长
 *   每级 ×1.115，再乘上等级自身的 0.55 次幂，
 *   使得每一境的跨度都明显大于上一境（相当于每 6~7 级翻一倍）。
 */
function expNeed(level) {
  return Math.floor(52 * Math.pow(1.132, level - 1) * Math.pow(level, 0.62));
}

/** 是否卡在本境巅峰（需要破境） */
function isBottleneckLevel(level) {
  return level % LAYERS_PER_REALM === 0 && realmIndex(level) < REALMS.length - 1;
}

/** 破境所需灵石（没有破境丹时的替代代价） */
function breakStoneCost(level) {
  const r = realmIndex(level) + 1;
  return Math.floor(260 * Math.pow(r, 2.15));
}

/* ------------------------------ 品质 ------------------------------ */
/* 0白 1绿 2蓝 3紫 4金 5红 —— 颜色决定图标光晕 */
const QUALITY = [
  { name: '凡品', color: '#d8d8d8', glow: 'rgba(216,216,216,', mul: 1.00 },
  { name: '灵品', color: '#6fe08a', glow: 'rgba(111,224,138,', mul: 1.10 },
  { name: '玄品', color: '#6fb8ff', glow: 'rgba(111,184,255,', mul: 1.22 },
  { name: '地品', color: '#b98fff', glow: 'rgba(185,143,255,', mul: 1.38 },
  { name: '天品', color: '#ffc24a', glow: 'rgba(255,194,74,',  mul: 1.58 },
  { name: '仙品', color: '#ff5a5a', glow: 'rgba(255,90,90,',   mul: 1.85 }
];

function qualityOf(id) {
  const it = ITEMS[id];
  return (it && typeof it.q === 'number') ? it.q : 0;
}

/* ------------------------------ 道具 ------------------------------ */
/* kind: pill 丹药 / weapon 兵器 / body 护体 / charm 饰品 / mat 材料 / manual 秘法 */
const ITEMS = {
  pill_qi: {
    name: '回气丹', kind: 'pill', price: 14, sell: 6, stack: 99,
    desc: '以灵草炼成，服下回复 45 点灵力。', use: { qi: 45 }
  },
  pill_heal: {
    name: '疗伤丹', kind: 'pill', price: 22, sell: 9, stack: 99,
    desc: '血竭草调制，回复 80 点气血。', use: { hp: 80 }
  },
  pill_body: {
    name: '锻体丹', kind: 'pill', price: 160, sell: 60, stack: 9,
    desc: '炼体秘药，永久提升 15 点气血上限。', use: { hpMax: 15 }
  },
  pill_spirit: {
    name: '聚灵丹', kind: 'pill', price: 150, sell: 55, stack: 9,
    desc: '收束灵气入体，永久提升 10 点灵力上限。', use: { qiMax: 10 }
  },

  wp_wood: {
    name: '桃木剑', kind: 'weapon', price: 40, sell: 16, atk: 4, qi: 6,
    desc: '初入山门的弟子佩剑，聊胜于无。'
  },
  wp_iron: {
    name: '精铁剑', kind: 'weapon', price: 150, sell: 60, atk: 11, def: 2,
    desc: '凡铁百炼，剑锋锐利。'
  },
  wp_azure: {
    name: '青锋剑', kind: 'weapon', price: 420, sell: 160, atk: 22, qi: 14, crit: 0.08,
    desc: '剑身泛青光，出鞘有清鸣。'
  },
  wp_staff: {
    name: '聚灵木杖', kind: 'weapon', price: 160, sell: 64, atk: 9, qi: 26,
    desc: '桃木为骨，可引气化符。'
  },
  wp_hammer: {
    name: '撼山锤', kind: 'weapon', price: 260, sell: 100, atk: 26, speed: -12,
    desc: '重愈百斤，一击裂石。'
  },

  bd_silk: {
    name: '云纹法袍', kind: 'body', price: 120, sell: 48, def: 6, qi: 10,
    desc: '织入云纹的轻袍，能卸去几分力道。'
  },
  bd_scale: {
    name: '玄甲', kind: 'body', price: 320, sell: 120, def: 16, hp: 40,
    desc: '以玄铁鳞片缀成，护体极佳。'
  },
  ch_jade: {
    name: '清心玉佩', kind: 'charm', price: 140, sell: 56, qi: 20, qiRegen: 2,
    desc: '佩之心神安定，灵气自生。'
  },
  ch_talisman: {
    name: '护身符', kind: 'charm', price: 200, sell: 80, hp: 50, def: 4,
    desc: '长老所绘符箓，可挡灾劫。'
  },

  mat_herb: {
    name: '凝露草', kind: 'mat', price: 8, sell: 4, stack: 99,
    desc: '晨露所凝，疗伤丹药之主料。'
  },
  mat_bamboo: {
    name: '灵竹', kind: 'mat', price: 12, sell: 6, stack: 99,
    desc: '幽篁林深处所产，可制符纸。'
  },
  mat_core: {
    name: '妖丹', kind: 'mat', price: 40, sell: 20, stack: 99,
    desc: '妖兽内丹，蕴含精纯妖气。'
  },
  mat_snow: {
    name: '寒髓', kind: 'mat', price: 70, sell: 30, stack: 99, q: 2,
    desc: '绝顶冰层下的寒髓，极寒之物。'
  },

  /* ---------------- 新增：兵器 ---------------- */
  wp_frost: {
    name: '青霜剑', kind: 'weapon', price: 720, sell: 280, atk: 30, qi: 20, crit: 0.10, q: 2,
    desc: '剑出如霜，寒气逼人。'
  },
  wp_crimson: {
    name: '赤霄刀', kind: 'weapon', price: 1500, sell: 600, atk: 44, hp: 30, crit: 0.12, q: 3,
    desc: '刀身赤如晚霞，一挥斩断长风。'
  },
  wp_void: {
    name: '太虚剑', kind: 'weapon', price: 3200, sell: 1300, atk: 62, qi: 40, crit: 0.16, q: 4,
    desc: '传自太虚剑冢，出鞘无声，剑意通玄。'
  },
  wp_slayer: {
    name: '弑神剑', kind: 'weapon', price: 8000, sell: 3200, atk: 96, qi: 60, crit: 0.22, q: 5,
    desc: '剑成之日，天上落雨三日。据传曾斩过一尊伪神。'
  },

  /* ---------------- 新增：饰品 ---------------- */
  ch_ice: {
    name: '玄冰戒', kind: 'charm', price: 380, sell: 150, qi: 30, def: 4, q: 2,
    desc: '寒玉所制，佩之心静神清。'
  },
  ch_orbs: {
    name: '聚灵珠', kind: 'charm', price: 640, sell: 250, qi: 55, qiRegen: 3, q: 3,
    desc: '珠中自成小天地，聚敛灵气不散。'
  },
  ch_bell: {
    name: '镇魂铃', kind: 'charm', price: 900, sell: 360, hp: 80, def: 8, q: 3,
    desc: '铃响一声，邪祟退散。'
  },
  ch_seal: {
    name: '太一道印', kind: 'charm', price: 2200, sell: 880, atk: 24, qi: 40, crit: 0.08, q: 4,
    desc: '道门法印，铭刻太一真文。'
  },
  ch_blood: {
    name: '血玉髓', kind: 'charm', price: 6000, sell: 2400, atk: 40, hp: 160, crit: 0.18, qiRegen: 4, q: 5,
    desc: '玉中似有血在流。握久了，会听见心跳。'
  },

  /* ---------------- 新增：丹药 ---------------- */
  pill_marrow: {
    name: '洗髓丹', kind: 'pill', price: 520, sell: 200, stack: 9, q: 3,
    desc: '洗涤骨髓，永久提升 40 点气血上限与 8 点攻击。', use: { hpMax: 40, atk: 8 }
  },
  pill_revive: {
    name: '九转还魂丹', kind: 'pill', price: 180, sell: 70, stack: 9, q: 2,
    desc: '重伤之际服下，立刻回复全部气血。', use: { hpFull: true }
  },
  pill_break: {
    name: '破境丹', kind: 'pill', price: 1200, sell: 480, stack: 5, q: 4,
    desc: '强行冲关，立即获得相当于两级境界的修为。', use: { expLevels: 2 }
  },

  /* ---------------- 新增：秘法 ---------------- */
  man_taixuan: {
    name: '太玄经残卷', kind: 'manual', price: 900, sell: 360, stack: 3, q: 3,
    desc: '诵读之后，永久提升 25 点灵力上限与 3 点回灵。', use: { qiMax: 25, qiRegen: 3 }
  },
  man_sword: {
    name: '剑典·残篇', kind: 'manual', price: 1500, sell: 600, stack: 3, q: 4,
    desc: '剑意入骨，永久提升 18 点攻击与 6% 暴击。', use: { atk: 18, crit: 0.06 }
  },
  man_body: {
    name: '大衍锻体诀', kind: 'manual', price: 1400, sell: 560, stack: 3, q: 4,
    desc: '以身为炉，永久提升 90 点气血上限与 10 点防御。', use: { hpMax: 90, def: 10 }
  },
  man_abyss: {
    name: '归墟秘录', kind: 'manual', price: 4200, sell: 1700, stack: 1, q: 5,
    desc: '自深渊带出的禁忌残页，永久提升 30 点攻击、120 点气血。', use: { atk: 30, hpMax: 120 }
  }
};

/* ---------------------------- 修炼方向 ---------------------------- */
const PATHS = {
  sword: {
    id: 'sword', name: '剑修', motto: '一剑破万法',
    desc: '身法轻灵，连招凌厉。近身缠斗时伤害层层攀升，最擅一击制敌。',
    hp: 130, qi: 80, atk: 13, def: 4, speed: 182,
    robe: '#f4f8fd', robeDark: '#c3d6e8', accent: '#5f9ad2', sash: '#b8453c',
    hair: '#262230', glow: 'rgba(150,215,255,',
    weapon: 'sword',
    skills: ['sw_dash', 'sw_qi', 'sw_all'],
    perk: '剑意：普攻三连每段伤害递增，三段收招必定击退'
  },
  mage: {
    id: 'mage', name: '法修', motto: '符动风雷起',
    desc: '以符御法，远程压制。灵力深厚，招式范围广，唯惧近身。',
    hp: 100, qi: 130, atk: 15, def: 2, speed: 172,
    robe: '#2f4a6b', robeDark: '#22354e', accent: '#8fd0ff', sash: '#6b8fc2',
    hair: '#1c1c26', glow: 'rgba(160,190,255,',
    weapon: 'staff',
    skills: ['mg_fire', 'mg_thunder', 'mg_star'],
    perk: '灵韵：灵力回复速度提升，招式消耗略低'
  },
  body: {
    id: 'body', name: '体修', motto: '铁骨镇山河',
    desc: '血肉为兵，硬撼山岳。气血浑厚、防御惊人，拳拳到肉。',
    hp: 190, qi: 60, atk: 12, def: 9, speed: 165,
    robe: '#8a4a33', robeDark: '#63331f', accent: '#e0a45c', sash: '#3d2a1e',
    hair: '#2a2118', glow: 'rgba(255,190,120,',
    weapon: 'fist',
    skills: ['bd_fist', 'bd_charge', 'bd_quake'],
    perk: '铁骨：气血上限更高，受击时短暂减伤'
  },
  alch: {
    id: 'alch', name: '丹修', motto: '灵药续残生',
    desc: '以丹入道，攻守兼备。可自疗续命，亦能引火焚敌，最难被磨死。',
    hp: 115, qi: 110, atk: 11, def: 3, speed: 178,
    robe: '#eef6ee', robeDark: '#c6dcc9', accent: '#7fbb8a', sash: '#a86b3d',
    hair: '#221f28', glow: 'rgba(150,240,190,',
    weapon: 'gourd',
    skills: ['al_mist', 'al_fire', 'al_calm'],
    perk: '药心：服丹效果提升，每 8 秒自回少量气血'
  }
};

/* ------------------------------ 招式 ------------------------------ */
const SKILLS = {
  sw_dash: {
    name: '疾风斩', cost: 14, cd: 3.2, kind: 'dash',
    dmg: 2.4, dist: 150, arc: 1.5, radius: 60,
    desc: '踏风突进，横斩前方之敌。'
  },
  sw_qi: {
    name: '剑气纵横', cost: 16, cd: 4.5, kind: 'proj',
    dmg: 1.9, speed: 620, pierce: 3, w: 26, h: 44, life: 0.7,
    desc: '挥出一道剑气，穿透多名敌人。'
  },
  sw_all: {
    name: '万剑归宗', cost: 46, cd: 12, kind: 'burst',
    dmg: 1.5, radius: 165, hits: 3, interval: 0.28,
    desc: '万剑齐发，连续三轮绞杀周身之敌。'
  },

  mg_fire: {
    name: '烈焰符', cost: 15, cd: 2.6, kind: 'proj',
    dmg: 1.7, speed: 480, w: 26, h: 26, life: 1.1, explode: 66, explodeDmg: 1.2,
    desc: '掷出火符，触敌爆燃并溅射周围。'
  },
  mg_thunder: {
    name: '紫雷诀', cost: 22, cd: 5.5, kind: 'strike',
    dmg: 2.8, radius: 84, range: 330, delay: 0.42,
    desc: '于前方落下一道紫雷，范围内尽数受创。'
  },
  mg_star: {
    name: '星陨', cost: 44, cd: 11, kind: 'proj',
    dmg: 1.1, speed: 400, w: 20, h: 20, life: 1.6, count: 5, spread: 0.5,
    desc: '召五道星光，扇形洒向前方。'
  },

  bd_fist: {
    name: '崩山拳', cost: 12, cd: 2.4, kind: 'arc',
    dmg: 2.2, range: 88, arc: 1.7, knock: 200,
    desc: '一记重拳轰出，击退正面之敌。'
  },
  bd_charge: {
    name: '铁骨撞', cost: 18, cd: 4.8, kind: 'dash',
    dmg: 1.9, dist: 190, radius: 52, arc: 2.2, stun: 0.8,
    desc: '以身撞敌，撞及者短暂僵直。'
  },
  bd_quake: {
    name: '地裂', cost: 42, cd: 10.5, kind: 'burst',
    dmg: 2.6, radius: 155, hits: 1,
    desc: '一脚踏地，震荡八方。'
  },

  al_mist: {
    name: '药雾', cost: 20, cd: 6.5, kind: 'heal',
    heal: 0.34, radius: 130, slow: 0.5, slowTime: 3,
    desc: '散出灵药之雾，自愈并迟滞周围敌人。'
  },
  al_fire: {
    name: '引火符', cost: 16, cd: 3.2, kind: 'proj',
    dmg: 1.5, speed: 440, w: 24, h: 24, life: 1.0, burn: 3, burnDmg: 0.35,
    desc: '引燃符纸掷出，命中后灼烧敌人。'
  },
  al_calm: {
    name: '清心咒', cost: 38, cd: 11, kind: 'heal',
    heal: 0.22, qi: 40, radius: 0, shield: 3,
    desc: '凝神静气，回复气血与灵力并短暂护体。'
  }
};

/* ------------------------------ 连招 ------------------------------ */
const COMBO_STEPS = [
  { dmg: 1.0, arc: 1.25, range: 74, name: '一段' },
  { dmg: 1.2, arc: 1.35, range: 78, name: '二段' },
  { dmg: 1.75, arc: 1.85, range: 88, name: '三段', knock: 170 }
];

/* ------------------------------ 怪物 ------------------------------ */
const MONSTERS = {
  wolf: {
    name: '妖狼', hp: 70, atk: 9, def: 1, speed: 108, exp: 22, stones: [4, 10],
    body: '#6a6a76', belly: '#8f8f9c', eye: '#ffd166', size: 1,
    drop: [{ id: 'mat_core', p: 0.35 }]
  },
  ape: {
    name: '山魈', hp: 130, atk: 14, def: 3, speed: 84, exp: 38, stones: [8, 18],
    body: '#5b4636', belly: '#7d6249', eye: '#ff7b4a', size: 1.15,
    drop: [{ id: 'mat_core', p: 0.55 }, { id: 'pill_heal', p: 0.15 }]
  },
  ghost: {
    name: '幽魂', hp: 90, atk: 12, def: 0, speed: 92, exp: 34, stones: [10, 22],
    body: '#7fd8e8', belly: '#bfeef7', eye: '#ffffff', size: 1.0,
    ghost: true,
    drop: [{ id: 'mat_core', p: 0.5 }, { id: 'pill_qi', p: 0.2 }]
  },
  golem: {
    name: '石傀', hp: 320, atk: 22, def: 8, speed: 58, exp: 110, stones: [30, 60],
    body: '#8a8578', belly: '#a9a496', eye: '#8fe3ff', size: 1.5,
    drop: [{ id: 'mat_snow', p: 0.7 }, { id: 'bd_scale', p: 0.12 }]
  }
};

/* ------------------------------ 地图 ------------------------------ */
const MAPS = {
  village: {
    id: 'village', name: '青石村', cols: 140, rows: 100, seed: 20240518,
    type: 'village',
    band: { deep: 0.115, water: 0.185, sand: 0.235, grass: 0.56, forest: 0.745, hill: 0.87, rock: 0.962 },
    monsters: [],
    herbs: 10,
    anchor: { tx: 57, ty: 88, name: '村口古阵' },
    exits: [{ tx: 64, ty: 92, to: 'valley', name: '山门 · 通往落霞谷' }],
    cg: {
      title: '青石村',
      sub: '云深不知处',
      lines: [
        '青石村依山而建，屋舍错落，炊烟缠着云雾一同升起。',
        '村口的古阵早已无人驱使，只余石纹间流转的微光。',
        '你在此长大，也在此第一次动了入山求道的心。'
      ]
    }
  },
  valley: {
    id: 'valley', name: '落霞谷', cols: 120, rows: 96, seed: 7712,
    type: 'wild',
    band: { deep: 0.10, water: 0.17, sand: 0.21, grass: 0.44, forest: 0.70, hill: 0.86, rock: 0.955 },
    monsters: [{ type: 'wolf', n: 9 }, { type: 'ape', n: 5 }],
    herbs: 16,
    anchor: { tx: 60, ty: 82, name: '谷口石阵' },
    exits: [
      { tx: 60, ty: 92, to: 'village', name: '谷口 · 回青石村' },
      { tx: 60, ty: 5, to: 'forest', name: '谷北 · 通往幽篁林' }
    ],
    cg: {
      title: '落霞谷',
      sub: '残阳如血，妖气未散',
      lines: [
        '谷中终年落霞不散，红云压得很低，像是谁在山脊上留了一道旧伤。',
        '妖狼成群出没，山魈据石而居，寻常弟子不敢独行。',
        '你握紧了手中的兵器，第一次听见了自己的心跳。'
      ]
    }
  },
  forest: {
    id: 'forest', name: '幽篁林', cols: 110, rows: 92, seed: 31777,
    type: 'wild',
    band: { deep: 0.12, water: 0.19, sand: 0.23, grass: 0.34, forest: 0.86, hill: 0.94, rock: 0.985 },
    monsters: [{ type: 'ape', n: 7 }, { type: 'ghost', n: 6 }],
    herbs: 20,
    anchor: { tx: 55, ty: 78, name: '林口竹阵' },
    exits: [
      { tx: 55, ty: 88, to: 'valley', name: '林口 · 回落霞谷' },
      { tx: 55, ty: 5, to: 'peak', name: '林北 · 通往寒山绝顶' }
    ],
    cg: {
      title: '幽篁林',
      sub: '竹影摇灯，鬼语喃喃',
      lines: [
        '千竿灵竹遮天，日头透不下来，只余满林青碧的幽光。',
        '据说死于林中的修士，魂灵散不去，化作幽魂在林间游荡。',
        '竹叶擦过衣襟的声音，听起来像有人在低声念你的名字。'
      ]
    }
  },
  peak: {
    id: 'peak', name: '寒山绝顶', cols: 100, rows: 90, seed: 55021,
    type: 'wild',
    band: { deep: 0.09, water: 0.15, sand: 0.19, grass: 0.34, forest: 0.52, hill: 0.68, rock: 0.86 },
    monsters: [{ type: 'golem', n: 4 }, { type: 'ghost', n: 6 }, { type: 'ape', n: 3 }],
    herbs: 10,
    anchor: { tx: 50, ty: 74, name: '绝顶冰阵' },
    exits: [{ tx: 50, ty: 86, to: 'forest', name: '冰崖 · 回幽篁林' }],
    cg: {
      title: '寒山绝顶',
      sub: '万古玄冰，不见人迹',
      lines: [
        '再往上便没有路了，只有风，和被风磨了千年的冰。',
        '石傀守着峰顶的秘密，它们比山还要沉默。',
        '寒气透骨，你却觉得体内有什么东西，正被这片冷唤醒。'
      ]
    }
  }
};

/* ------------------------------ NPC ------------------------------ */
/* 每张地图的 NPC，位置为地图瓦片坐标 */
const NPCS = {
  npc_master: {
    map: 'village', tx: 64, ty: 56, name: '玄清子', title: '青石村执事',
    path: 'mage', robe: '#e9edf5', robeDark: '#c2cbdd', accent: '#9b7fd0', sash: '#6a5a9a',
    hair: '#c9c6d4', glow: 'rgba(190,170,255,'
  },
  npc_alchemist: {
    map: 'village', tx: 87, ty: 68, name: '苏青萝', title: '药庐主人',
    path: 'alch', robe: '#eaf5ea', robeDark: '#c3dcc5', accent: '#7fbb8a', sash: '#a86b3d',
    hair: '#2c2430', glow: 'rgba(150,240,190,'
  },
  npc_smith: {
    map: 'village', tx: 44, ty: 68, name: '雷九斤', title: '铁匠 · 杂货',
    path: 'body', robe: '#7a4a33', robeDark: '#5a3320', accent: '#e0a45c', sash: '#3d2a1e',
    hair: '#241c14', glow: 'rgba(255,170,100,', shop: true
  },
  npc_young: {
    map: 'village', tx: 74, ty: 76, name: '阿七', title: '杂役弟子',
    path: 'sword', robe: '#dfe6ef', robeDark: '#b6c2d2', accent: '#8aa8c8', sash: '#8a8a99',
    hair: '#2a2630', glow: 'rgba(170,200,240,'
  },
  npc_angler: {
    map: 'village', tx: 45, ty: 56, name: '柳翁', title: '湖畔钓叟',
    path: 'alch', robe: '#cfd8cf', robeDark: '#a7b3a7', accent: '#7f9a7f', sash: '#6b5a45',
    hair: '#d8d4c8', glow: 'rgba(190,220,190,'
  },
  npc_guard: {
    map: 'village', tx: 60, ty: 86, name: '李行舟', title: '守山弟子',
    path: 'sword', robe: '#e6ecf4', robeDark: '#b9c6d6', accent: '#7f9ec4', sash: '#4a5a74',
    hair: '#232028', glow: 'rgba(150,190,255,'
  }
};

/* ------------------------------ 任务 ------------------------------ */
const QUESTS = {
  q_main1: {
    id: 'q_main1', name: '初入仙门', giver: 'npc_master', prereq: null,
    desc: '玄清子让你去村口山门前的石碑看看，再回来复命。',
    objectives: [
      { type: 'visit', text: '前往山门石碑', at: 'village_stela', r: 110 }
    ],
    reward: { exp: 140, stones: 30, items: [{ id: 'pill_heal', n: 2 }, { id: 'wp_wood', n: 1 }] }
  },
  q_herb: {
    id: 'q_herb', name: '采药济世', giver: 'npc_alchemist', prereq: 'q_main1',
    desc: '苏青萝缺三株凝露草，村外草地与幽篁林中皆有生长。',
    objectives: [{ type: 'collect', text: '采集凝露草', item: 'mat_herb', count: 3 }],
    reward: { exp: 180, stones: 40, items: [{ id: 'pill_qi', n: 3 }, { id: 'ch_jade', n: 1 }] }
  },
  q_lake: {
    id: 'q_lake', name: '湖畔静坐', giver: 'npc_angler', prereq: 'q_main1',
    desc: '柳翁说湖心亭旧址最适合静心，去看看那儿的水色。',
    objectives: [{ type: 'visit', text: '前往湖畔旧址', at: 'village_lake', r: 130 }],
    reward: { exp: 120, stones: 25, items: [{ id: 'pill_body', n: 1 }] }
  },
  q_hunt: {
    id: 'q_hunt', name: '落霞除妖', giver: 'npc_guard', prereq: 'q_main1',
    desc: '落霞谷妖狼伤人，李行舟托你除去五头。',
    objectives: [{ type: 'kill', text: '击杀妖狼', monster: 'wolf', count: 5 }],
    reward: { exp: 320, stones: 80, items: [{ id: 'wp_iron', n: 1 }] }
  },
  q_boss: {
    id: 'q_boss', name: '绝顶石傀', giver: 'npc_master', prereq: 'q_hunt',
    desc: '寒山绝顶有石傀守着一处冰窟，玄清子欲知其究竟。',
    objectives: [{ type: 'kill', text: '击杀石傀', monster: 'golem', count: 1 }],
    reward: { exp: 600, stones: 200, items: [{ id: 'wp_azure', n: 1 }, { id: 'pill_spirit', n: 2 }] }
  }
};

/* 任务触发点（世界坐标由地图瓦片换算） */
const QUEST_POINTS = {
  village_stela: { map: 'village', tx: 60, ty: 87, name: '山门石碑' },
  village_lake: { map: 'village', tx: 44, ty: 65, name: '湖畔旧址' }
};

/* ------------------------------ 商店 ------------------------------ */
const SHOP_STOCK = [
  'pill_qi', 'pill_heal', 'pill_body', 'pill_spirit', 'pill_revive',
  'wp_iron', 'wp_staff', 'wp_hammer', 'wp_frost',
  'bd_silk', 'bd_scale', 'ch_jade', 'ch_talisman', 'ch_ice'
];

/* ------------------------------ 捏脸选项 ------------------------------ */
const LOOK_OPTIONS = {
  hairStyle: [
    { id: 'highBun', name: '高髻' },
    { id: 'topknot', name: '束发' },
    { id: 'longLoose', name: '披发' },
    { id: 'twinBun', name: '双髻' },
    { id: 'short', name: '短发' }
  ],
  skin: [
    { id: 'pale', name: '凝脂', skin: '#fae4cf', shade: '#ddb89c' },
    { id: 'warm', name: '暖玉', skin: '#f6dcc0', shade: '#d9b394' },
    { id: 'tan', name: '麦色', skin: '#e9c39a', shade: '#c49a72' },
    { id: 'cold', name: '冷白', skin: '#fbf1e6', shade: '#e0cbb8' }
  ],
  hair: [
    { id: 'ink', name: '墨黑', hair: '#262230', hi: '#453e52' },
    { id: 'blue', name: '黛青', hair: '#22283a', hi: '#3d4761' },
    { id: 'brown', name: '栗褐', hair: '#3a2a20', hi: '#5c4433' },
    { id: 'silver', name: '霜白', hair: '#cfcad6', hi: '#e8e4ee' }
  ],
  eye: [
    { id: 'azure', name: '青碧', eye: '#7fc8ff' },
    { id: 'violet', name: '紫瞳', eye: '#b79bff' },
    { id: 'amber', name: '琥珀', eye: '#ffb066' },
    { id: 'jade', name: '翠微', eye: '#8fe6b0' },
    { id: 'crimson', name: '赤眸', eye: '#ff7a7a' }
  ],
  robe: [
    { id: 'snow', name: '素白', robe: '#f7fbff', dark: '#c4d8ec', accent: '#5f9ad2', bg: 'cyan' },
    { id: 'ink', name: '玄青', robe: '#31496b', dark: '#20304a', accent: '#9fd0ff', bg: 'violet' },
    { id: 'ember', name: '赤霞', robe: '#8a4a33', dark: '#5d3020', accent: '#e0a45c', bg: 'amber' },
    { id: 'jade', name: '月白', robe: '#eef7ee', dark: '#c2dbc6', accent: '#7fbb8a', bg: 'emerald' },
    { id: 'rust', name: '赭石', robe: '#a86b4a', dark: '#6d422a', accent: '#e8c07a', bg: 'amber' },
    { id: 'night', name: '夜阑', robe: '#2b2a3e', dark: '#1a1928', accent: '#b98fff', bg: 'violet' }
  ]
};

/* ------------------------------ 品质补全 ------------------------------ */
(function fillQuality() {
  const byKind = { pill: 1, weapon: 1, body: 1, charm: 1, mat: 0, manual: 3 };
  const over = {
    wp_wood: 0, wp_iron: 1, wp_azure: 2, wp_staff: 1, wp_hammer: 1,
    bd_silk: 1, bd_scale: 2, ch_jade: 2, ch_talisman: 2,
    pill_qi: 1, pill_heal: 1, pill_body: 2, pill_spirit: 2,
    mat_herb: 0, mat_bamboo: 0, mat_core: 1, mat_snow: 2
  };
  for (const id in ITEMS) {
    if (typeof ITEMS[id].q !== 'number') {
      ITEMS[id].q = over[id] !== undefined ? over[id] : (byKind[ITEMS[id].kind] || 0);
    }
  }
})();

/* ------------------------------ 怪物等级 ------------------------------ */
/* 不同地图的怪物等级区间 */
const MONSTER_LV = {
  village: [1, 2],
  valley: [3, 6],
  forest: [7, 11],
  peak: [12, 17],
  tower: [1, 17],
  abyss: [20, 30]
};

/* ------------------------------ 称号 ------------------------------ */
/* cond.type: level 等级 / kill 击杀总数 / tower 塔层 / stones 灵石 / abyss 深渊层数 */
const TITLES = [
  { id: 't_rookie', name: '初入山门', color: '#d8d8d8', cond: { type: 'level', value: 1 }, desc: '踏上仙途的第一日' },
  { id: 't_wander', name: '散修游方', color: '#9fe6a0', cond: { type: 'level', value: 5 }, desc: '境界至炼气五层' },
  { id: 't_slayer', name: '除妖卫道', color: '#6fe08a', cond: { type: 'kill', value: 30 }, desc: '斩杀三十只妖兽' },
  { id: 't_hunter', name: '万妖避路', color: '#6fb8ff', cond: { type: 'kill', value: 150 }, desc: '斩杀一百五十只妖兽' },
  { id: 't_rich', name: '富甲一方', color: '#ffc24a', cond: { type: 'stones', value: 3000 }, desc: '身家三千灵石' },
  { id: 't_tower10', name: '登塔十层', color: '#6fb8ff', cond: { type: 'tower', value: 10 }, desc: '试炼塔至第十层' },
  { id: 't_tower50', name: '半山揽月', color: '#b98fff', cond: { type: 'tower', value: 50 }, desc: '试炼塔至第五十层' },
  { id: 't_tower100', name: '绝顶问仙', color: '#ff5a5a', cond: { type: 'tower', value: 100 }, desc: '试炼塔登顶' },
  { id: 't_abyss', name: '深入归墟', color: '#ff5a5a', cond: { type: 'abyss', value: 3 }, desc: '深渊踏破三层' },
  { id: 't_abyss10', name: '归墟之主', color: '#ff5a5a', cond: { type: 'abyss', value: 10 }, desc: '深渊踏破十层' }
];

/* ------------------------------ 等级奖励 ------------------------------ */
const LEVEL_REWARDS = [
  { lv: 2, stones: 80 },
  { lv: 3, stones: 120, items: [{ id: 'pill_heal', n: 3 }] },
  { lv: 4, stones: 160, items: [{ id: 'pill_qi', n: 3 }] },
  { lv: 5, stones: 260, items: [{ id: 'wp_iron', n: 1 }] },
  { lv: 6, exp: 200, items: [{ id: 'man_taixuan', n: 1 }] },
  { lv: 8, stones: 400, items: [{ id: 'ch_ice', n: 1 }] },
  { lv: 10, stones: 600, items: [{ id: 'wp_frost', n: 1 }] },
  { lv: 12, items: [{ id: 'pill_marrow', n: 1 }] },
  { lv: 15, stones: 900, items: [{ id: 'ch_orbs', n: 1 }] },
  { lv: 18, items: [{ id: 'man_body', n: 1 }] },
  { lv: 20, stones: 1500, items: [{ id: 'wp_crimson', n: 1 }] },
  { lv: 25, items: [{ id: 'man_sword', n: 1 }] }
];

/* ------------------------------ 试炼塔 / 深渊 ------------------------------ */
const TOWER_CFG = {
  name: '试炼塔', maxFloor: 100, bossEvery: 10,
  levelBase: 1, levelPerFloor: 0.16,
  timeBase: 50, timePerFloor: 1.2,
  color: '#ffdf9a'
};

const ABYSS_CFG = {
  name: '深渊归墟', maxFloor: 30, bossEvery: 3,
  levelBase: 20, levelPerFloor: 0.6,
  timeBase: 70, timePerFloor: 2,
  color: '#ff5a5a'
};

/* 敌人类型（塔/深渊/野外共用） */
const ENEMY_CLASS = {
  brute: { label: '肉盾', hpMul: 2.2, atkMul: 0.85, spdMul: 0.7, sizeMul: 1.25, expMul: 1.4 },
  archer: { label: '射手', hpMul: 0.85, atkMul: 1.05, spdMul: 1.05, sizeMul: 0.95, expMul: 1.15, ranged: 220 },
  mage: { label: '法师', hpMul: 0.8, atkMul: 1.25, spdMul: 0.9, sizeMul: 0.95, expMul: 1.35, ranged: 260 },
  rogue: { label: '刺客', hpMul: 0.9, atkMul: 1.1, spdMul: 1.35, sizeMul: 0.9, expMul: 1.2 }
};

/* ---------------------------- 快捷键提示 ---------------------------- */
const KEY_HINT = [  ['WASD', '行走'],
  ['J', '普攻三连'],
  ['K', 'L', '招式'],
  ['U', '绝招'],
  ['Shift', '闪身'],
  ['E', '交互'],
  ['B', '背包'],
  ['Q', '任务'],
  ['空格', '打坐调息']
];

/* ------------------------------ 按键映射 ------------------------------ */
const KEYMAP_DEFAULT = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
  attack: 'KeyJ', skill1: 'KeyK', skill2: 'KeyL', ult: 'KeyU',
  dodge: 'ShiftLeft', interact: 'KeyE', bag: 'KeyB', quest: 'KeyQ',
  map: 'KeyM', menu: 'Escape', rest: 'Space'
};

const KEYMAP_LABELS = {
  up: '向前行走', down: '向后行走', left: '向左行走', right: '向右行走',
  attack: '普攻连招', skill1: '招式一', skill2: '招式二', ult: '绝招',
  dodge: '闪身', interact: '交互 / 拾取', bag: '行囊',
  quest: '任务录', map: '传送图志', menu: '菜单', rest: '盘膝调息'
};

function keyName(code) {
  if (!code) return '—';
  const map = {
    KeyA: 'A', KeyB: 'B', KeyC: 'C', KeyD: 'D', KeyE: 'E', KeyF: 'F', KeyG: 'G',
    KeyH: 'H', KeyI: 'I', KeyJ: 'J', KeyK: 'K', KeyL: 'L', KeyM: 'M', KeyN: 'N',
    KeyO: 'O', KeyP: 'P', KeyQ: 'Q', KeyR: 'R', KeyS: 'S', KeyT: 'T', KeyU: 'U',
    KeyV: 'V', KeyW: 'W', KeyX: 'X', KeyY: 'Y', KeyZ: 'Z',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
    Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
    Space: '空格', Escape: 'Esc', ShiftLeft: '左Shift', ShiftRight: '右Shift',
    ControlLeft: '左Ctrl', ControlRight: '右Ctrl', AltLeft: '左Alt', AltRight: '右Alt',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Tab: 'Tab', Enter: '回车', Backspace: '退格'
  };
  return map[code] || code.replace('Key', '').replace('Digit', '');
}

/* ------------------------------ 活动 ------------------------------ */

/* 地图奖励箱：每次开启随机一份 */
const CHEST_LOOT = [
  { w: 26, stones: [25, 70] },
  { w: 20, stones: [60, 140] },
  { w: 14, exp: 40 },
  { w: 10, exp: 90 },
  { w: 12, items: [{ id: 'pill_heal', n: 1 }] },
  { w: 12, items: [{ id: 'pill_qi', n: 1 }] },
  { w: 8, items: [{ id: 'mat_herb', n: 2 }] },
  { w: 6, items: [{ id: 'mat_core', n: 1 }] },
  { w: 4, items: [{ id: 'wp_iron', n: 1 }], rare: true },
  { w: 4, items: [{ id: 'bd_silk', n: 1 }], rare: true },
  { w: 3, items: [{ id: 'ch_jade', n: 1 }], rare: true },
  { w: 2, items: [{ id: 'wp_azure', n: 1 }], rare: true }
];

const CHECKIN_REWARDS = [
  { stones: 60 },
  { items: [{ id: 'pill_heal', n: 2 }] },
  { stones: 100 },
  { items: [{ id: 'pill_qi', n: 3 }] },
  { exp: 150 },
  { items: [{ id: 'ch_jade', n: 1 }] },
  { stones: 220, exp: 200, items: [{ id: 'pill_body', n: 1 }] }
];

const CHALLENGES = [
  {
    id: 'wave', name: '妖潮试炼', icon: '潮',
    desc: '三轮妖兽自四方逼来，将其尽数击退。',
    reward: { stones: 150, exp: 220, items: [{ id: 'pill_heal', n: 2 }] },
    cd: 150
  },
  {
    id: 'timed', name: '限时除妖', icon: '限',
    desc: '九十息之内击杀十二只妖兽。',
    reward: { stones: 220, exp: 320, items: [{ id: 'pill_qi', n: 2 }] },
    cd: 210
  },
  {
    id: 'boss', name: '石傀挑战', icon: '傀',
    desc: '唤出一头强化石傀，将其击碎。',
    reward: { stones: 320, exp: 520, items: [{ id: 'bd_scale', n: 1 }] },
    cd: 300
  }
];
