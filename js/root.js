'use strict';

/* =========================================================================
   青云界 · 灵根检测
   开局测灵根 → 灵根品阶决定这一世的修炼速度与底子（决定开局强度）
   ========================================================================= */

const Root = (function () {

  /* ------------------------------ 五行 ------------------------------ */
  const ELEMS = [
    { id: 'metal', name: '金', color: '#ffe9a8', atk: 0.070, def: 0.020, desc: '锋锐' },
    { id: 'wood', name: '木', color: '#8fe0a0', hp: 0.090, qiRegen: 0.60, desc: '生发' },
    { id: 'water', name: '水', color: '#7fc8ff', qi: 0.110, crit: 0.006, desc: '绵长' },
    { id: 'fire', name: '火', color: '#ff8a5a', atk: 0.085, crit: 0.012, desc: '暴烈' },
    { id: 'earth', name: '土', color: '#d8b47a', def: 0.105, hp: 0.045, desc: '厚载' }
  ];

  /* 变异灵根（稀有） */
  const MUTATE = [
    { id: 'thunder', name: '雷', color: '#aab8ff', atk: 0.130, crit: 0.035, qi: 0.050, desc: '天罚' },
    { id: 'ice', name: '冰', color: '#9fe4ff', def: 0.090, qi: 0.090, crit: 0.012, desc: '凝绝' },
    { id: 'wind', name: '风', color: '#b8f0d0', speed: 0.070, crit: 0.020, desc: '无相' },
    { id: 'dark', name: '暗', color: '#b98fff', atk: 0.110, hp: 0.060, qi: 0.050, desc: '噬灵' }
  ];

  /* ------------------------------ 品阶 ------------------------------ */
  const TIERS = [
    {
      count: 5, name: '五行杂灵根', short: '伪灵根', q: 0, color: '#9aa6b2',
      expMul: 0.82, hpMul: 1.14, qiMul: 1.00, atkMul: 1.00, defMul: 1.06, crit: 0, speedMul: 1.00,
      desc: '五行俱全而俱不精，修行最是艰难。但底子厚实，最耐折腾。'
    },
    {
      count: 4, name: '四灵根', short: '杂灵根', q: 1, color: '#8fe0a0',
      expMul: 1.00, hpMul: 1.06, qiMul: 1.04, atkMul: 1.00, defMul: 1.03, crit: 0, speedMul: 1.00,
      desc: '资质平平，胜在可兼修数道，路走得宽。'
    },
    {
      count: 3, name: '三灵根', short: '常灵根', q: 2, color: '#6fb8ff',
      expMul: 1.18, hpMul: 1.00, qiMul: 1.06, atkMul: 1.03, defMul: 1.00, crit: 0.005, speedMul: 1.00,
      desc: '中人之姿，勤能补拙。多数修士止于此。'
    },
    {
      count: 2, name: '双灵根', short: '上灵根', q: 3, color: '#b98fff',
      expMul: 1.40, hpMul: 1.00, qiMul: 1.10, atkMul: 1.05, defMul: 1.00, crit: 0.010, speedMul: 1.02,
      desc: '两道精纯，修行顺畅，已是宗门争抢的好苗子。'
    },
    {
      count: 1, name: '天灵根', short: '单灵根', q: 4, color: '#ffc24a',
      expMul: 1.68, hpMul: 1.00, qiMul: 1.18, atkMul: 1.08, defMul: 1.00, crit: 0.015, speedMul: 1.03,
      desc: '一气独纯，万中无一。灵气入体几无损耗。'
    },
    {
      count: 0, name: '变异灵根', short: '异灵根', q: 5, color: '#ff5a5a',
      expMul: 1.52, hpMul: 1.02, qiMul: 1.12, atkMul: 1.14, defMul: 1.02, crit: 0.035, speedMul: 1.05,
      desc: '灵根异变，跳出五行之外。天资奇高，却多短命。'
    }
  ];

  function tierOf(count) {
    return TIERS.filter((t) => t.count === count)[0] || TIERS[2];
  }

  /* ------------------------------ 抽灵根 ------------------------------ */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** 抽一次灵根，返回完整结果对象 */
  function roll() {
    const r = Math.random();
    let tier, elems = [], mutated = false;

    if (r < 0.06) {
      // 变异灵根：1~2 种变异属性
      tier = tierOf(0);
      mutated = true;
      const pool = shuffle(MUTATE);
      const n = Math.random() < 0.32 ? 2 : 1;
      elems = pool.slice(0, n);
    } else {
      let count;
      if (r < 0.16) count = 1;
      else if (r < 0.40) count = 2;
      else if (r < 0.72) count = 3;
      else if (r < 0.92) count = 4;
      else count = 5;
      tier = tierOf(count);
      elems = shuffle(ELEMS).slice(0, count);
    }

    const mod = {
      exp: tier.expMul,
      hpMul: tier.hpMul,
      qiMul: tier.qiMul,
      atkMul: tier.atkMul,
      defMul: tier.defMul,
      crit: tier.crit,
      speedMul: tier.speedMul,
      atk: 0, def: 0, hp: 0, qi: 0, speed: 0, qiRegen: 0
    };

    // 各属性按占比叠加
    const share = 1 / Math.max(1, elems.length) * (mutated ? 1 : 1);
    for (const e of elems) {
      mod.atk += (e.atk || 0) * share;
      mod.def += (e.def || 0) * share;
      mod.hp += (e.hp || 0) * share;
      mod.qi += (e.qi || 0) * share;
      mod.speed += (e.speed || 0) * share;
      mod.qiRegen += (e.qiRegen || 0) * share;
      mod.crit += (e.crit || 0) * share * (mutated ? 1.3 : 1);
    }

    const elemNames = elems.map((e) => e.name).join('');
    const name = mutated
      ? ('变异灵根 · ' + elemNames)
      : (tier.count === 1 ? ('天灵根 · ' + elemNames) : (tier.name + ' · ' + elemNames));

    return {
      tier: tier.count,
      tierName: tier.name,
      short: tier.short,
      q: tier.q,
      color: tier.color,
      name: name,
      elems: elems.map((e) => ({ id: e.id, name: e.name, color: e.color, desc: e.desc })),
      mutated: mutated,
      mod: mod,
      desc: tier.desc,
      at: Date.now()
    };
  }

  /* ------------------------------ 加成结算 ------------------------------ */

  /** 把灵根加成套用到属性上（game.js 的 totalStats 调用） */
  function applyToStats(root, st) {
    if (!root || !root.mod) return st;
    const m = root.mod;
    st.atk = st.atk * (m.atkMul || 1) + st.atk * (m.atk || 0);
    st.def = st.def * (m.defMul || 1) + st.def * (m.def || 0);
    st.hpMax = st.hpMax * (m.hpMul || 1) + st.hpMax * (m.hp || 0);
    st.qiMax = st.qiMax * (m.qiMul || 1) + st.qiMax * (m.qi || 0);
    st.crit = (st.crit || 0) + (m.crit || 0);
    st.speed = st.speed * (m.speedMul || 1) * (1 + (m.speed || 0));
    st.qiRegen = (st.qiRegen || 0) + (m.qiRegen || 0);
    return st;
  }

  function expMul(root) {
    return (root && root.mod && root.mod.exp) ? root.mod.exp : 1;
  }

  /** 一行摘要，用于道行录 / 行囊 */
  function summary(root) {
    if (!root) return '未测灵根';
    return root.name;
  }

  function modLines(root) {
    if (!root || !root.mod) return [];
    const m = root.mod;
    const out = [];
    out.push('修炼速度 ×' + m.exp.toFixed(2));
    if (Math.abs(m.atkMul - 1) > 0.001 || m.atk) out.push('攻击 ×' + (m.atkMul * (1 + m.atk)).toFixed(2));
    if (Math.abs(m.defMul - 1) > 0.001 || m.def) out.push('防御 ×' + (m.defMul * (1 + m.def)).toFixed(2));
    if (Math.abs(m.hpMul - 1) > 0.001 || m.hp) out.push('气血 ×' + (m.hpMul * (1 + m.hp)).toFixed(2));
    if (Math.abs(m.qiMul - 1) > 0.001 || m.qi) out.push('灵力 ×' + (m.qiMul * (1 + m.qi)).toFixed(2));
    if (m.crit) out.push('暴击 +' + (m.crit * 100).toFixed(1) + '%');
    if (Math.abs(m.speedMul - 1) > 0.001 || m.speed) out.push('身法 ×' + (m.speedMul * (1 + m.speed)).toFixed(2));
    if (m.qiRegen) out.push('回灵 +' + m.qiRegen.toFixed(1));
    return out;
  }

  /* ------------------------------ 界面 ------------------------------ */

  let panel = null;
  let cv = null, g = null, raf = 0;
  let spinning = false;
  let spinT = 0;
  let spinDur = 1.6;
  let angle = 0;
  let angleV = 0;
  let result = null;
  let rolled = 0;       // 已探次数
  let onDone = null;

  function mkPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'rootPanel';
    panel.className = 'full hidden';
    panel.innerHTML =
      '<div class="root-wrap">' +
      '  <div class="root-title">测 灵 根</div>' +
      '  <div class="root-sub">灵根天定，一探便知此世能走多远</div>' +
      '  <div class="root-stage"><canvas id="rootCanvas" width="380" height="380"></canvas></div>' +
      '  <div class="root-result" id="rootResult"></div>' +
      '  <div class="root-btns" id="rootBtns"></div>' +
      '</div>';
    (document.getElementById('hud') || document.body).appendChild(panel);
    cv = document.getElementById('rootCanvas');
    g = cv.getContext('2d');
  }

  function openDone(res) {
    if (!onDone) return;
    const cb = onDone;
    onDone = null;
    panel.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
    cb(res);
  }

  function open(cb) {
    mkPanel();
    onDone = cb || null;
    result = null;
    rolled = 0;
    angle = 0; angleV = 0; spinning = false; spinT = 0;
    panel.classList.remove('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(true);
    renderButtons();
    renderResult();
    draw();
    loop();
    try { Audio2.play('ui'); } catch (e) { }
  }

  function renderButtons() {
    const box = document.getElementById('rootBtns');
    if (!box) return;
    box.innerHTML = '';

    if (!result) {
      const b = document.createElement('button');
      b.id = 'rootSpinBtn';
      b.className = 'start-btn';
      b.textContent = spinning ? '探 灵 中…' : '探　灵';
      b.disabled = spinning;
      b.addEventListener('click', () => startSpin());
      box.appendChild(b);
      return;
    }

    const take = document.createElement('button');
    take.id = 'rootTakeBtn';
    take.className = 'start-btn';
    take.textContent = '承 此 灵 根 · 入 世';
    take.addEventListener('click', () => {
      try { Audio2.play('levelup'); } catch (e) { }
      openDone(result);
    });
    box.appendChild(take);

    if (rolled < 2) {
      const again = document.createElement('button');
      again.id = 'rootAgainBtn';
      again.className = 'root-again';
      again.textContent = '再探一次（仅余 1 次）';
      again.addEventListener('click', () => {
        result = null;
        renderResult();
        startSpin();
      });
      box.appendChild(again);
    }
  }

  function renderResult() {
    const box = document.getElementById('rootResult');
    if (!box) return;
    if (!result) {
      box.innerHTML = '<div class="root-hint">' +
        (rolled === 0 ? '点「探灵」将手按于五行镜上，静待灵根显形。' : '灵根尚未探出。') +
        '</div>';
      return;
    }
    const lines = modLines(result);
    box.innerHTML =
      '<div class="root-card" style="border-color:' + result.color + 'aa;box-shadow:0 0 26px ' + result.color + '44">' +
      '<div class="rc-top">' +
      '<span class="rc-tier" style="color:' + result.color + ';border-color:' + result.color + '">' + result.short + '</span>' +
      '<span class="rc-name" style="color:' + result.color + '">' + result.name + '</span>' +
      '</div>' +
      '<div class="rc-elems">' +
      result.elems.map((e) => '<span class="rc-elem" style="color:' + e.color + ';border-color:' + e.color + '99">' +
        e.name + '·' + e.desc + '</span>').join('') +
      '</div>' +
      '<div class="rc-mods">' + lines.map((l) => '<span>' + l + '</span>').join('') + '</div>' +
      '<div class="rc-desc">' + result.desc + '</div>' +
      '</div>';
  }

  function startSpin() {
    if (spinning) return;
    spinning = true;
    spinT = 0;
    spinDur = 1.5 + Math.random() * 0.4;
    angleV = 16 + Math.random() * 4;
    result = roll();
    rolled++;
    renderButtons();
    renderResult();
    try { Audio2.play('cast'); } catch (e) { }
  }

  /* ------------------------------ 绘制 ------------------------------ */

  const TAU = 6.2832;

  function draw() {
    if (!g) return;
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.42;
    g.clearRect(0, 0, W, H);

    // 背光
    const bg = g.createRadialGradient(cx, cy, 8, cx, cy, R * 1.6);
    bg.addColorStop(0, 'rgba(90,140,200,0.30)');
    bg.addColorStop(0.55, 'rgba(30,50,80,0.18)');
    bg.addColorStop(1, 'rgba(4,8,14,0)');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    g.save();
    g.translate(cx, cy);
    g.rotate(angle);

    // 五行扇区
    const n = ELEMS.length;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU - Math.PI / 2;
      const a1 = ((i + 1) / n) * TAU - Math.PI / 2;
      const e = ELEMS[i];
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, R, a0, a1);
      g.closePath();
      const grd = g.createRadialGradient(0, 0, R * 0.15, 0, 0, R);
      grd.addColorStop(0, hexA(e.color, 0.06));
      grd.addColorStop(1, hexA(e.color, 0.34));
      g.fillStyle = grd;
      g.fill();
      g.strokeStyle = hexA(e.color, 0.55);
      g.lineWidth = 1.2;
      g.stroke();

      // 属性字
      g.save();
      g.rotate((a0 + a1) / 2 + Math.PI / 2);
      g.textAlign = 'center';
      g.font = '600 30px "STKaiti","KaiTi",serif';
      g.fillStyle = e.color;
      g.shadowColor = e.color;
      g.shadowBlur = 18;
      g.fillText(e.name, 0, -R * 0.62);
      g.restore();
    }

    // 内圈符环
    g.strokeStyle = 'rgba(180,220,255,0.42)';
    g.lineWidth = 1.4;
    for (const rr of [R * 0.78, R * 0.5, R * 0.3]) {
      g.beginPath();
      g.arc(0, 0, rr, 0, TAU);
      g.stroke();
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78);
      g.lineTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86);
      g.stroke();
    }
    g.restore();

    // 中央灵镜
    g.save();
    g.translate(cx, cy);
    const core = g.createRadialGradient(-R * 0.06, -R * 0.06, R * 0.02, 0, 0, R * 0.3);
    core.addColorStop(0, 'rgba(255,255,255,0.95)');
    core.addColorStop(0.42, 'rgba(170,215,255,0.55)');
    core.addColorStop(1, 'rgba(60,110,180,0.05)');
    g.fillStyle = core;
    g.beginPath();
    g.arc(0, 0, R * 0.3, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(220,240,255,0.7)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, R * 0.3, 0, TAU);
    g.stroke();

    // 已探出的灵根：中央显示元素
    if (result && !spinning) {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = '700 ' + Math.round(R * 0.22) + 'px "STKaiti","KaiTi",serif';
      g.fillStyle = result.color;
      g.shadowColor = result.color;
      g.shadowBlur = 22;
      g.fillText(result.elems.map((e) => e.name).join(''), 0, 0);
    }
    g.restore();

    // 指针
    g.save();
    g.translate(cx, cy);
    g.beginPath();
    g.moveTo(0, -R * 1.02);
    g.lineTo(-6, -R * 0.86);
    g.lineTo(6, -R * 0.86);
    g.closePath();
    g.fillStyle = 'rgba(255,240,200,0.95)';
    g.shadowColor = 'rgba(255,220,150,0.9)';
    g.shadowBlur = 14;
    g.fill();
    g.restore();
  }

  function hexA(hex, a) {
    const s = String(hex).replace('#', '');
    const n = parseInt(s, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  let lastT = 0;
  function loop() {
    if (!panel || panel.classList.contains('hidden')) { raf = 0; return; }

    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (!lastT) lastT = now;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;

    if (spinning) {
      spinT += dt;
      // 缓出减速
      const k = Math.min(1, spinT / spinDur);
      angleV = (16 + Math.random() * 4) * (1 - Math.pow(k, 2.2)) + 0.6;
      angle += angleV * dt;
      if (k >= 1) {
        spinning = false;
        angleV = 0;
        // 对准结果元素所在的扇区
        const first = result.elems[0];
        const idx = Math.max(0, ELEMS.map((e) => e.id).indexOf(first.id));
        const target = -(idx / ELEMS.length) * TAU;
        angle = target;
        renderButtons();
        renderResult();
        try { Audio2.play('levelup'); } catch (e) { }
        burst();
      }
    } else {
      angle += dt * 0.22;
    }

    draw();
    tickBurst(dt);
    raf = requestAnimationFrame(loop);
  }

  /* 探出结果时的一圈光爆 */
  let burstT = 0, burstOn = false;
  function burst() { burstOn = true; burstT = 0; }
  function tickBurst(dt) {
    if (!burstOn) return;
    burstT += dt;
    if (burstT > 0.9) { burstOn = false; return; }
    if (!g || !cv) return;
    const cx = cv.width / 2, cy = cv.height / 2;
    const R = Math.min(cv.width, cv.height) * 0.42;
    const k = burstT / 0.9;
    g.save();
    g.translate(cx, cy);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = hexA(result.color, (1 - k) * 0.8);
    g.lineWidth = 3 * (1 - k) + 0.6;
    g.beginPath();
    g.arc(0, 0, R * (0.3 + k * 0.95), 0, TAU);
    g.stroke();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + k * 1.2;
      const d0 = R * (0.32 + k * 0.5);
      const d1 = d0 + R * 0.16 * (1 - k);
      g.beginPath();
      g.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      g.lineTo(Math.cos(a) * d1, Math.sin(a) * d1);
      g.stroke();
    }
    g.restore();
  }

  function close() {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
    if (panel) panel.classList.add('hidden');
    if (typeof UI !== 'undefined' && UI.setOverlay) UI.setOverlay(false);
  }

  /** 自动测试用：立刻抽一次并直接接受 */
  function forceAccept() {
    const r = roll();
    result = r;
    rolled = 1;
    if (onDone) openDone(r);
    else if (panel) panel.classList.add('hidden');
    return r;
  }

  return {
    roll, open, close, forceAccept, applyToStats, expMul, summary, modLines,
    ELEMS, MUTATE, TIERS, tierOf
  };
})();
