'use strict';

/* =========================================================================
   青云界 · NPC 对话（依任务状态动态生成对话页）
   一页 = { text: '…', options: [{ label, act }] }
   act: {type:'close'} / {type:'accept',quest} / {type:'complete',quest} / {type:'shop', which}
   ========================================================================= */

function _opt(label, act) { return { label: label, act: act || { type: 'close' } }; }

/** 该 NPC 名下、当前可交付的任务 */
function _readyQuest(G, npcId) {
  for (const id in QUESTS) {
    if (QUESTS[id].giver === npcId && G.questStatus(id) === 'ready') return id;
  }
  return null;
}

/** 该 NPC 名下、当前可接取的任务 */
function _availableQuest(G, npcId) {
  for (const id in QUESTS) {
    if (QUESTS[id].giver === npcId && G.questStatus(id) === 'available') return id;
  }
  return null;
}

/** 该 NPC 名下、进行中的任务 */
function _activeQuest(G, npcId) {
  for (const id in QUESTS) {
    if (QUESTS[id].giver === npcId && G.questStatus(id) === 'active') return id;
  }
  return null;
}

const OFFER_TEXT = {
  q_main1: '「你就是青石村新来的那个孩子吧。」\n老人垂目，拂尘轻扫过阶前落叶，「入我门墙，先要知道这山门从何而来。去村口看看那块石碑——看完回来，我有一句话给你。」',
  q_herb: '「呀，来得正好。」\n药庐里蒸腾着苦香，女子头也不抬地捣着药，「凝露草只剩最后一把了。村外草地、幽篁林里都长着，帮我采三株回来，我给你配些好东西。」',
  q_lake: '「后生，坐。」\n老翁拍了拍身边的石头，鱼竿一动不动，「后山湖心那处旧址，水面静得能照见人的心。我这把老骨头走不动了——你去替我看一眼，水色如何。」',
  q_hunt: '「你来得正好。」\n守山弟子收剑入鞘，眉头紧锁，「落霞谷的妖狼下山伤了人。我须守着山门走不开，你若敢去，替我除去五头。」',
  q_boss: '「回来了。」\n玄清子将一枚玉简推到你面前，「寒山绝顶有石傀守着冰窟，百年不曾移动。如今冰层生变……去会一会它，活着回来。」'
};

const TURNIN_TEXT = {
  q_main1: '「看过了？」\n老人缓缓点头，「那块碑上刻的不是名字，是三百年前守村而死的十七人。修仙路长，先记住脚下的土，再谈天上的道。」',
  q_herb: '「凑齐了。」\n她接过草叶对着光看了看，随手扔进药炉，「成色不错。这几颗丹你收着——丹修也好，剑修也罢，活下来才有以后。」',
  q_lake: '「水还是那样清啊。」\n老翁望着湖面出神，好一会儿才笑道，「静水无波，才能照见来路。你既看了，这份心气便算是有了。」',
  q_hunt: '「五头，一头不少。」\n李行舟握拳一礼，「你比我想的能打。这剑是村中旧物，与其挂在墙上落灰，不如给你。」',
  q_boss: '「石傀碎了？」\n玄清子沉默良久，忽然一叹，「冰窟里那具尸骨……是我师兄。这一局棋，终究是我晚了三百年。这剑，你配得上。」'
};

const DONE_TEXT = {
  npc_master: '「修行在己，不在人言。」\n老人闭目打坐，再不多语。',
  npc_alchemist: '「丹药我这儿有，灵石你带够没？」',
  npc_smith: '「兵刃家伙，只管挑。」',
  npc_young: '「听说村口那古阵能传送到别处去，只要你在地图上把它刻录下来，往后哪儿都能回来。」\n他压低声音，「不过我劝你先练练手，落霞谷里的妖狼可不好对付。」',
  npc_angler: '「心不静，钓不上鱼。」\n老翁笑眯眯地看着浮子。',
  npc_guard: '「山门有我守着，你自去。」'
};

/* ------------------------------ 各 NPC ------------------------------ */

function pagesOf(G, npcId) {
  const npc = NPCS[npcId];
  const who = npc.name;
  const pages = [];

  // 1) 有任务可交付
  const rq = _readyQuest(G, npcId);
  if (rq) {
    pages.push({
      who, text: TURNIN_TEXT[rq] || '「做得不错。」',
      options: [_opt('复命（' + QUESTS[rq].name + '）', { type: 'complete', quest: rq })]
    });
    return pages;
  }

  // 2) 有任务可接取
  const aq = _availableQuest(G, npcId);
  if (aq) {
    pages.push({
      who, text: OFFER_TEXT[aq] || '「可愿助我一臂之力？」',
      options: [
        _opt('接下此托（' + QUESTS[aq].name + '）', { type: 'accept', quest: aq }),
        _opt('容我思量', { type: 'close' })
      ]
    });
    return pages;
  }

  // 3) 任务进行中
  const act = _activeQuest(G, npcId);
  if (act) {
    const q = QUESTS[act];
    let objTxt = '';
    try {
      objTxt = (q.objectives || []).map(function (o) { return G.objectiveText(q, o); }).join('　');
    } catch (e) { objTxt = ''; }
    pages.push({
      who, text: '「' + q.name + '」尚未了结。\n' + objTxt,
      options: [
        _opt('再听一遍', { type: 'again', quest: act }),
        _opt('这就去办', { type: 'close' })
      ]
    });
    return pages;
  }

  // 4) 闲聊 / 商店
  const idle = DONE_TEXT[npcId] || '「……」';
  if (npcId === 'npc_smith') {
    pages.push({
      who, text: idle,
      options: [
        _opt('看看货架（买卖）', { type: 'shop', which: 'smith' }),
        _opt('离开', { type: 'close' })
      ]
    });
  } else if (npcId === 'npc_alchemist') {
    pages.push({
      who, text: idle,
      options: [
        _opt('求些丹药（买卖）', { type: 'shop', which: 'alch' }),
        _opt('离开', { type: 'close' })
      ]
    });
  } else {
    pages.push({ who, text: idle, options: [_opt('告辞', { type: 'close' })] });
  }
  return pages;
}

/* ------------------------- 初始引导（首次入村） ------------------------- */

const INTRO_PAGES = [
  {
    who: '旁白',
    text: '青石村，辰时。\n雾气缠在山腰，屋舍的窗纸还没透出灯。'
  },
  {
    who: '旁白',
    text: '你在村中长大。十六岁那年，山门派来执事在村口立了石碑，说凡有灵根者，皆可入山。'
  },
  {
    who: '玄清子',
    text: '「你叫无涯子，是么。」\n老人打量着你，「根骨尚可，心性如何，还得看你自己走多远。」'
  },
  {
    who: '玄清子',
    text: '「村中有几件小事，先做起来。缺什么，去铁匠雷九斤那儿添置，药庐的苏青萝手上有丹。」\n「记住了——打不过就跑，跑不掉就磕药，死了可没人给你收尸。」'
  }
];
