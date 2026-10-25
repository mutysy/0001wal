'use strict';

/* =========================================================================
   青云界 · 音频层
   全部音效与音乐由 Web Audio 实时合成，无任何音频文件
   ========================================================================= */

const Audio2 = (function () {
  let ac = null;
  let masterGain, musicGain, sfxGain, delayNode, delayGain;
  let unlocked = false;
  let musicTimer = null;
  let musicOn = false;

  const vol = { master: 0.55, music: 0.30, sfx: 0.65 };

  /* ------------------------------ 初始化 ------------------------------ */

  function init() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ac = new AC();
    } catch (e) { return false; }

    masterGain = ac.createGain();
    masterGain.gain.value = vol.master;
    masterGain.connect(ac.destination);

    musicGain = ac.createGain();
    musicGain.gain.value = vol.music;
    musicGain.connect(masterGain);

    sfxGain = ac.createGain();
    sfxGain.gain.value = vol.sfx;
    sfxGain.connect(masterGain);

    // 简易混响（延迟反馈）
    delayNode = ac.createDelay(0.6);
    delayNode.delayTime.value = 0.22;
    delayGain = ac.createGain();
    delayGain.gain.value = 0.24;
    const fb = ac.createGain();
    fb.gain.value = 0.3;
    delayNode.connect(delayGain);
    delayGain.connect(fb);
    fb.connect(delayNode);
    delayGain.connect(masterGain);

    return true;
  }

  function unlock() {
    if (!init()) return;
    if (ac.state === 'suspended') ac.resume();
    unlocked = true;
    if (!musicOn) startMusic();
  }

  function ready() { return !!ac && unlocked; }

  /* ------------------------------ 基础音色 ------------------------------ */

  function tone(opt) {
    if (!ready()) return;
    const t0 = ac.currentTime + (opt.delay || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(opt.freq, t0);
    if (opt.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opt.to), t0 + opt.dur);

    const peak = opt.gain === undefined ? 0.2 : opt.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opt.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opt.dur);

    osc.connect(g);
    g.connect(opt.bus === 'music' ? musicGain : sfxGain);
    if (opt.verb) g.connect(delayNode);
    osc.start(t0);
    osc.stop(t0 + opt.dur + 0.05);
  }

  function noise(opt) {
    if (!ready()) return;
    const t0 = ac.currentTime + (opt.delay || 0);
    const dur = opt.dur || 0.15;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const k = 1 - i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(k, opt.shape || 2);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const flt = ac.createBiquadFilter();
    flt.type = opt.filter || 'bandpass';
    flt.frequency.setValueAtTime(opt.freq || 1200, t0);
    if (opt.to) flt.frequency.exponentialRampToValueAtTime(Math.max(80, opt.to), t0 + dur);
    flt.Q.value = opt.q === undefined ? 1.2 : opt.q;
    const g = ac.createGain();
    g.gain.setValueAtTime(opt.gain === undefined ? 0.25 : opt.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(sfxGain);
    if (opt.verb) g.connect(delayNode);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ------------------------------ 音效库 ------------------------------ */

  const SFX = {
    slash: () => {
      noise({ dur: 0.14, freq: 2600, to: 900, gain: 0.22, q: 0.9 });
      tone({ type: 'triangle', freq: 720, to: 300, dur: 0.1, gain: 0.05 });
    },
    hit: () => {
      noise({ dur: 0.1, freq: 700, to: 180, gain: 0.3, q: 0.7, shape: 3 });
      tone({ type: 'square', freq: 180, to: 70, dur: 0.09, gain: 0.09 });
    },
    crit: () => {
      noise({ dur: 0.16, freq: 1400, to: 240, gain: 0.34, q: 0.6, shape: 3 });
      tone({ type: 'sawtooth', freq: 320, to: 90, dur: 0.14, gain: 0.1 });
      tone({ type: 'sine', freq: 1400, to: 700, dur: 0.2, gain: 0.07, delay: 0.02, verb: true });
    },
    cast: () => {
      tone({ type: 'sine', freq: 420, to: 1100, dur: 0.22, gain: 0.11, verb: true });
      noise({ dur: 0.2, freq: 900, to: 2600, gain: 0.07, q: 2 });
    },
    ult: () => {
      tone({ type: 'sawtooth', freq: 90, to: 46, dur: 0.9, gain: 0.16 });
      tone({ type: 'sine', freq: 300, to: 1400, dur: 0.5, gain: 0.12, verb: true });
      noise({ dur: 0.7, freq: 300, to: 3200, gain: 0.16, q: 1.6, shape: 1.5 });
      tone({ type: 'triangle', freq: 1200, to: 300, dur: 0.7, gain: 0.09, delay: 0.1, verb: true });
    },
    thunder: () => {
      noise({ dur: 0.45, freq: 1800, to: 120, gain: 0.3, q: 0.5, shape: 1.2 });
      tone({ type: 'square', freq: 70, to: 40, dur: 0.5, gain: 0.14 });
    },
    dash: () => {
      noise({ dur: 0.22, freq: 500, to: 2400, gain: 0.16, q: 2.4 });
    },
    heal: () => {
      tone({ type: 'sine', freq: 660, dur: 0.3, gain: 0.09, verb: true });
      tone({ type: 'sine', freq: 990, dur: 0.35, gain: 0.07, delay: 0.06, verb: true });
    },
    pickup: () => {
      tone({ type: 'triangle', freq: 880, to: 1320, dur: 0.12, gain: 0.09 });
    },
    coin: () => {
      tone({ type: 'triangle', freq: 1180, dur: 0.08, gain: 0.08 });
      tone({ type: 'triangle', freq: 1560, dur: 0.1, gain: 0.06, delay: 0.06 });
    },
    levelup: () => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.4, gain: 0.11, delay: i * 0.09, verb: true }));
      tone({ type: 'sine', freq: 262, dur: 0.9, gain: 0.08, verb: true });
    },
    ui: () => {
      tone({ type: 'sine', freq: 900, dur: 0.05, gain: 0.045 });
    },
    uiBack: () => {
      tone({ type: 'sine', freq: 520, dur: 0.07, gain: 0.045 });
    },
    teleport: () => {
      tone({ type: 'sine', freq: 220, to: 880, dur: 0.55, gain: 0.11, verb: true });
      noise({ dur: 0.5, freq: 400, to: 3000, gain: 0.1, q: 1.8 });
    },
    bind: () => {
      tone({ type: 'triangle', freq: 392, dur: 0.5, gain: 0.1, verb: true });
      tone({ type: 'triangle', freq: 587, dur: 0.6, gain: 0.08, delay: 0.12, verb: true });
      tone({ type: 'sine', freq: 784, dur: 0.8, gain: 0.07, delay: 0.24, verb: true });
    },
    death: () => {
      tone({ type: 'sawtooth', freq: 300, to: 60, dur: 1.2, gain: 0.16 });
      noise({ dur: 1.0, freq: 800, to: 80, gain: 0.14, q: 0.6, shape: 1.5 });
    },
    quest: () => {
      tone({ type: 'triangle', freq: 784, dur: 0.25, gain: 0.1, verb: true });
      tone({ type: 'triangle', freq: 1046, dur: 0.35, gain: 0.08, delay: 0.1, verb: true });
    }
  };

  function play(name) {
    if (!ready()) return;
    const f = SFX[name];
    if (f) try { f(); } catch (e) { /* 忽略音频异常 */ }
  }

  /* ------------------------------ 背景音乐 ------------------------------ */

  // 五声音阶（宫商角徵羽）
  const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  const MELODY = [0, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 2, 3, 1, 0, 2];
  let step = 0;

  function musicStep() {
    if (!ready() || !musicOn) return;
    const n = MELODY[step % MELODY.length];
    const f = SCALE[n];
    // 主旋律
    tone({ type: 'triangle', freq: f, dur: 1.1, gain: 0.055, bus: 'music', verb: true });
    // 低音（每四拍）
    if (step % 4 === 0) {
      tone({ type: 'sine', freq: SCALE[0] / 2, dur: 1.8, gain: 0.05, bus: 'music' });
    }
    // 偶尔点缀
    if (step % 8 === 6) {
      tone({ type: 'sine', freq: f * 2, dur: 0.7, gain: 0.03, bus: 'music', verb: true, delay: 0.25 });
    }
    step++;
  }

  function startMusic() {
    if (musicOn) return;
    musicOn = true;
    if (!musicTimer) musicTimer = setInterval(musicStep, 780);
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  /* ------------------------------ 音量 ------------------------------ */

  function applyVolume() {
    if (!ac) return;
    const t = ac.currentTime;
    masterGain.gain.setTargetAtTime(vol.master, t, 0.05);
    musicGain.gain.setTargetAtTime(vol.music, t, 0.05);
    sfxGain.gain.setTargetAtTime(vol.sfx, t, 0.05);
  }

  function setVolume(key, v) {
    vol[key] = Math.max(0, Math.min(1, v));
    if (vol.sfx <= 0.001 && key === 'sfx') { /* 静音 */ }
    applyVolume();
  }

  function getVolume() { return Object.assign({}, vol); }

  return { unlock, ready, play, setVolume, getVolume, startMusic, stopMusic, vol };
})();
