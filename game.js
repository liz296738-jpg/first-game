(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const ui = {
    startScreen: document.getElementById('startScreen'),
    levelUpScreen: document.getElementById('levelUpScreen'),
    pauseScreen: document.getElementById('pauseScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    restartBtn: document.getElementById('restartBtn'),
    upgradeCards: document.getElementById('upgradeCards'),
    hud: document.getElementById('hud'),
    levelText: document.getElementById('levelText'),
    hpFill: document.getElementById('hpFill'),
    xpFill: document.getElementById('xpFill'),
    timerText: document.getElementById('timerText'),
    waveText: document.getElementById('waveText'),
    killsText: document.getElementById('killsText'),
    coresText: document.getElementById('coresText'),
    resultTime: document.getElementById('resultTime'),
    resultKills: document.getElementById('resultKills'),
    resultLevel: document.getElementById('resultLevel'),
    resultCores: document.getElementById('resultCores'),
    bestText: document.getElementById('bestText'),
    toast: document.getElementById('toast'),
    stageText: document.getElementById('stageText'),
    buildTags: document.getElementById('buildTags'),
    dashFill: document.getElementById('dashFill'),
    dashText: document.getElementById('dashText'),
    dashBtn: document.getElementById('dashBtn'),
    debugPanel: document.getElementById('debugPanel'),
  };

  const W = canvas.width;
  const H = canvas.height;
  const BUDGET = Object.freeze({
    enemies: 180, spawnSignals: 48, projectiles: 620, enemyProjectiles: 340, particles: 680, rings: 96, texts: 120, afterimages: 24,
  });
  const FEEL = Object.freeze({
    shakeMax: 12.5,
    ambientDriftX: 2.4,
    ambientDriftY: 1.6,
    impactRingChance: .24,
  });
  const keys = new Set();
  let animationId = 0;
  let lastFrame = performance.now();
  let toastTimer = 0;
  let fpsSmoothed = 60;
  let debugVisible = false;

  const BIOMES = [
    {
      name: '星落回廊',
      skyA: '#070913', skyB: '#0f1731', skyC: '#121731',
      accent: '#7b6dff', accent2: '#52e0ff', grid: 'rgba(137,155,255,.16)',
      hazeA: 'rgba(115,91,255,.22)', hazeB: 'rgba(82,224,255,.16)', floor: 'rgba(255,255,255,.08)',
      silhouette: '#0b1022', vignette: 'rgba(4,5,8,.46)',
    },
    {
      name: '苍辉花庭',
      skyA: '#071119', skyB: '#102431', skyC: '#0d1f20',
      accent: '#67f0bf', accent2: '#8df7ff', grid: 'rgba(114,255,213,.12)',
      hazeA: 'rgba(55,208,164,.18)', hazeB: 'rgba(141,247,255,.12)', floor: 'rgba(197,255,233,.06)',
      silhouette: '#09171d', vignette: 'rgba(5,9,10,.42)',
    },
    {
      name: '余晖圣所',
      skyA: '#110814', skyB: '#281025', skyC: '#24161c',
      accent: '#ff8c87', accent2: '#ffdc90', grid: 'rgba(255,193,152,.11)',
      hazeA: 'rgba(255,115,137,.16)', hazeB: 'rgba(255,214,133,.12)', floor: 'rgba(255,229,195,.06)',
      silhouette: '#1e0d15', vignette: 'rgba(9,4,6,.44)',
    }
  ];

  const touch = {
    active: false,
    id: null,
    sx: 0,
    sy: 0,
    x: 0,
    y: 0,
  };

  const state = {
    mode: 'menu',
    time: 0,
    wave: 1,
    kills: 0,
    cores: 0,
    spawnTimer: 0,
    eliteTimer: 0,
    directorTimer: 0,
    directorBudget: 0,
    directorEncounter: 'CALM',
    encounterCount: 0,
    lastEncounterId: '',
    nextBossAt: 55,
    shake: 0,
    flash: 0,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    gems: [],
    particles: [],
    texts: [],
    stars: [],
    nebulae: [],
    dust: [],
    props: [],
    rings: [],
    banners: [],
    spawnSignals: [],
    afterimages: [],
    lastStageIndex: 0,
  };

  const player = {
    x: W / 2,
    y: H / 2,
    r: 18,
    speed: 250,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNeed: 24,
    damage: 24,
    fireRate: 2.7,
    fireTimer: 0,
    bulletSpeed: 700,
    projectileCount: 1,
    spread: 0.16,
    pierce: 0,
    crit: 0.08,
    magnet: 95,
    regen: 0,
    invuln: 0,
    orbitCount: 0,
    orbitDamage: 18,
    orbitRadius: 54,
    orbitSpeed: 2.4,
    novaLevel: 0,
    novaTimer: 7,
    droneLevel: 0,
    droneFireTimer: 0,
    shield: 0,
    lifesteal: 0,
    angle: -Math.PI / 2,
    thrust: 0,
    vx: 0,
    vy: 0,
    dashCooldown: 0,
    dashCooldownMax: 1.15,
    dashTimer: 0,
    dashDuration: .18,
    dashSpeed: 760,
    dashDirX: 1,
    dashDirY: 0,
    dashAfterimageTimer: 0,
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function distSq(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function chance(v) { return Math.random() < v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function alphaColor(color, alpha) {
    return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, (_, r, g, b) => `rgba(${r.trim()}, ${g.trim()}, ${b.trim()}, ${alpha})`);
  }
  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function currentBiomeIndex() {
    return Math.floor(state.time / 75) % BIOMES.length;
  }
  function biome() {
    return BIOMES[currentBiomeIndex()];
  }

  function bestRecord() {
    try { return JSON.parse(localStorage.getItem('void-descent-best')) || { time: 0, kills: 0 }; }
    catch { return { time: 0, kills: 0 }; }
  }

  function updateBest() {
    const best = bestRecord();
    const isBetter = state.time > best.time || (Math.abs(state.time - best.time) < 1 && state.kills > best.kills);
    if (isBetter) localStorage.setItem('void-descent-best', JSON.stringify({ time: state.time, kills: state.kills }));
    renderBest();
  }

  function renderBest() {
    const best = bestRecord();
    ui.bestText.textContent = `${formatTime(best.time)} · ${best.kills} 击杀`;
  }

  function showToast(text, ms = 1350) {
    ui.toast.textContent = text;
    ui.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), ms);
  }

  function banner(text) {
    state.banners.push({ text, life: 2.1, max: 2.1 });
  }

  function makeAtmosphere() {
    state.stars = Array.from({ length: 205 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: .45 + Math.random() * 1.65,
      a: .10 + Math.random() * .46,
      tw: Math.random() * Math.PI * 2,
      z: .16 + Math.random() * .92,
      tint: Math.random() < .14 ? 1 : (Math.random() < .12 ? 2 : 0),
    }));
    state.nebulae = Array.from({ length: 7 }, (_, i) => ({
      x: rand(-.08 * W, 1.08 * W), y: rand(-.08 * H, 1.08 * H), r: rand(150, 340),
      dx: rand(-5, 5), dy: rand(-4, 4),
      a: rand(.055, .145),
      hue: i % 3,
      phase: rand(0, Math.PI * 2),
      depth: rand(.25, 1),
    }));
    state.dust = Array.from({ length: 58 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(12, 48),
      a: rand(.012, .035),
      z: rand(.08, .32),
    }));
    state.props = Array.from({ length: 9 }, (_, i) => ({
      x: (i + .45) * (W / 9),
      y: H - rand(34, 116),
      w: rand(44, 96),
      h: rand(90, 210),
      type: i % 3,
      sway: rand(0, Math.PI * 2),
      depth: rand(.2, .75),
    }));
  }

  function resetPlayer() {
    Object.assign(player, {
      x: W / 2, y: H / 2, r: 18, speed: 250,
      hp: 100, maxHp: 100, level: 1, xp: 0, xpNeed: 24,
      damage: 24, fireRate: 2.7, fireTimer: 0, bulletSpeed: 700,
      projectileCount: 1, spread: 0.16, pierce: 0, crit: 0.08,
      magnet: 95, regen: 0, invuln: 0,
      orbitCount: 0, orbitDamage: 18, orbitRadius: 54, orbitSpeed: 2.4,
      novaLevel: 0, novaTimer: 7, droneLevel: 0, droneFireTimer: 0,
      shield: 0, lifesteal: 0,
      angle: -Math.PI / 2, thrust: 0,
      vx: 0, vy: 0, dashCooldown: 0, dashCooldownMax: 1.15, dashTimer: 0, dashDuration: .18, dashSpeed: 760,
      dashDirX: 1, dashDirY: 0, dashAfterimageTimer: 0,
    });
  }

  function resetState() {
    Object.assign(state, {
      mode: 'playing', time: 0, wave: 1, kills: 0, cores: 0,
      spawnTimer: .75, eliteTimer: 24, directorTimer: 5.5, directorBudget: 0, directorEncounter: 'CALM', encounterCount: 0, lastEncounterId: '', nextBossAt: 55, shake: 0, flash: 0,
      enemies: [], projectiles: [], enemyProjectiles: [], gems: [], particles: [], texts: [], rings: [], banners: [], spawnSignals: [], afterimages: [],
      lastStageIndex: 0,
    });
    resetPlayer();
    makeAtmosphere();
  }

  function startGame() {
    resetState();
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.levelUpScreen.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    ui.pauseBtn.textContent = '暂停';
    banner(BIOMES[0].name);
    lastFrame = performance.now();
  }

  function togglePause(force) {
    if (!['playing', 'paused'].includes(state.mode)) return;
    const pause = typeof force === 'boolean' ? force : state.mode === 'playing';
    state.mode = pause ? 'paused' : 'playing';
    ui.pauseScreen.classList.toggle('hidden', !pause);
    ui.pauseBtn.textContent = pause ? '继续' : '暂停';
    lastFrame = performance.now();
  }

  function gameOver() {
    state.mode = 'gameover';
    ui.hud.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');
    ui.gameOverScreen.classList.remove('hidden');
    ui.resultTime.textContent = formatTime(state.time);
    ui.resultKills.textContent = state.kills;
    ui.resultLevel.textContent = player.level;
    ui.resultCores.textContent = state.cores;
    updateBest();
  }

  const ENEMY_CONFIGS = {
    drone: { r: 14, hp: 42, speed: 76, damage: 11, color: '#ff6f91', xp: 7 },
    swift: { r: 10, hp: 27, speed: 132, damage: 9, color: '#ffb45f', xp: 8 },
    brute: { r: 22, hp: 118, speed: 54, damage: 20, color: '#d45fff', xp: 16 },
    caster: { r: 13, hp: 58, speed: 68, damage: 12, color: '#7de2ff', xp: 12 },
    boss: { r: 34, hp: 660, speed: 50, damage: 24, color: '#f6f8ff', xp: 60 },
  };

  const ENEMY_THREAT = Object.freeze({
    drone: 1,
    swift: 1.35,
    caster: 2.4,
    brute: 3.2,
    boss: 12,
  });

  const ENCOUNTER_TEMPLATES = Object.freeze([
    { id: 'drift-line', name: '漂移列阵', minTime: 0, cost: 4.5, weight: 4 },
    { id: 'needle-pincer', name: '针翼夹击', minTime: 18, cost: 6.2, weight: 3.5 },
    { id: 'bulwark-screen', name: '重盾推进', minTime: 38, cost: 8.2, weight: 2.6 },
    { id: 'crossfire', name: '远星交叉火力', minTime: 52, cost: 8.8, weight: 2.7 },
    { id: 'spearhead', name: '星骸矛头', minTime: 68, cost: 10.2, weight: 2.2 },
    { id: 'closing-net', name: '四向合围', minTime: 84, cost: 11.4, weight: 2.1 },
    { id: 'elite-anchor', name: '精英锚点', minTime: 105, cost: 12.6, weight: 1.35 },
  ]);

  function randomSpawnPoint(boss = false) {
    const edge = Math.floor(Math.random() * 4);
    const margin = boss ? 56 : 42;
    if (edge === 0) return { x: rand(-margin, W + margin), y: -margin, edge };
    if (edge === 1) return { x: W + margin, y: rand(-margin, H + margin), edge };
    if (edge === 2) return { x: rand(-margin, W + margin), y: H + margin, edge };
    return { x: -margin, y: rand(-margin, H + margin), edge };
  }

  function edgeSpawnPoint(edge, lane = .5, margin = 42) {
    const t = clamp(lane, .06, .94);
    if (edge === 0) return { x: W * t, y: -margin, edge };
    if (edge === 1) return { x: W + margin, y: H * t, edge };
    if (edge === 2) return { x: W * (1 - t), y: H + margin, edge };
    return { x: -margin, y: H * (1 - t), edge };
  }

  function queueEnemy(kind = null, elite = false, boss = false, spawnPoint = null, delay = 0) {
    if (state.enemies.length + state.spawnSignals.length >= BUDGET.enemies || state.spawnSignals.length >= BUDGET.spawnSignals) return false;
    const pos = spawnPoint || randomSpawnPoint(boss);
    const max = boss ? 1.35 : elite ? .92 : .42;
    state.spawnSignals.push({ kind, elite, boss, x: pos.x, y: pos.y, edge: pos.edge, delay: Math.max(0, delay), life: max, max });
    if (boss) { banner('异常质量正在接近'); showToast('高能反应：准备迎击', 1200); }
    return true;
  }

  function encounterThreat(kind, elite = false) {
    return (ENEMY_THREAT[kind] || 1) * (elite ? 3.15 : 1);
  }

  function currentEncounterBudget() {
    const timeGrowth = state.time / 17;
    const levelGrowth = Math.max(0, player.level - 1) * .16;
    return clamp(5 + timeGrowth + levelGrowth, 5, 18);
  }

  function weightedEncounterChoice(candidates) {
    let total = candidates.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of candidates) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return candidates[candidates.length - 1];
  }

  function scheduleEncounter(template, budget) {
    const baseEdge = Math.floor(Math.random() * 4);
    const opposite = (baseEdge + 2) % 4;
    const sideA = (baseEdge + 1) % 4;
    const sideB = (baseEdge + 3) % 4;
    let spent = 0;
    let sequence = 0;

    const add = (kind, edge, lane, elite = false, delay = null) => {
      const cost = encounterThreat(kind, elite);
      if (spent + cost > budget + .2) return false;
      const queued = queueEnemy(kind, elite, false, edgeSpawnPoint(edge, lane), delay ?? sequence * .07);
      if (!queued) return false;
      spent += cost;
      sequence += 1;
      return true;
    };

    if (template.id === 'drift-line') {
      [0.2, 0.36, 0.52, 0.68, 0.84].forEach((lane, i) => add(i === 2 && state.time > 28 ? 'swift' : 'drone', baseEdge, lane));
    } else if (template.id === 'needle-pincer') {
      [0.28, 0.5, 0.72].forEach(lane => add('swift', baseEdge, lane));
      [0.3, 0.5, 0.7].forEach(lane => add('swift', opposite, lane, false, .1 + sequence * .06));
    } else if (template.id === 'bulwark-screen') {
      add('brute', baseEdge, .36);
      add('brute', baseEdge, .64);
      [0.18, 0.5, 0.82].forEach(lane => add('drone', baseEdge, lane, false, .12 + sequence * .06));
    } else if (template.id === 'crossfire') {
      add('caster', baseEdge, .5);
      add('caster', opposite, .5, false, .16);
      [0.28, 0.72].forEach(lane => add('drone', sideA, lane, false, .2 + sequence * .05));
      [0.32, 0.68].forEach(lane => add('drone', sideB, lane, false, .22 + sequence * .05));
    } else if (template.id === 'spearhead') {
      add('brute', baseEdge, .5);
      add('swift', baseEdge, .28, false, .08);
      add('swift', baseEdge, .72, false, .12);
      [0.14, 0.38, 0.62, 0.86].forEach(lane => add('drone', baseEdge, lane, false, .16 + sequence * .05));
    } else if (template.id === 'closing-net') {
      [0, 1, 2, 3].forEach((edge, i) => {
        add(i % 2 ? 'swift' : 'drone', edge, .38, false, i * .08);
        add('drone', edge, .66, false, .16 + i * .08);
      });
    } else if (template.id === 'elite-anchor') {
      const eliteKind = state.time > 135 && chance(.42) ? 'caster' : 'brute';
      add(eliteKind, baseEdge, .5, true, 0);
      [0.22, 0.38, 0.62, 0.78].forEach((lane, i) => add(i % 2 ? 'swift' : 'drone', baseEdge, lane, false, .16 + i * .07));
    }

    let filler = 0;
    while (spent + ENEMY_THREAT.drone <= budget && filler < 8) {
      const edge = Math.floor(Math.random() * 4);
      if (!add(state.time > 62 && chance(.26) ? 'swift' : 'drone', edge, rand(.16, .84), false, .28 + filler * .055)) break;
      filler += 1;
    }

    state.directorBudget = Math.round(budget * 10) / 10;
    state.directorEncounter = template.name;
    state.lastEncounterId = template.id;
    state.encounterCount += 1;
  }

  function runEncounterDirector() {
    const bossActive = state.enemies.some(e => e.boss) || state.spawnSignals.some(s => s.boss);
    if (bossActive) {
      state.directorEncounter = 'BOSS';
      state.directorTimer = 3.2;
      return;
    }

    const budget = currentEncounterBudget();
    let candidates = ENCOUNTER_TEMPLATES.filter(item => item.minTime <= state.time && item.cost <= budget + .35);
    const alternates = candidates.filter(item => item.id !== state.lastEncounterId);
    if (alternates.length) candidates = alternates;
    if (!candidates.length) candidates = [ENCOUNTER_TEMPLATES[0]];
    const template = weightedEncounterChoice(candidates);
    scheduleEncounter(template, budget);

    const pace = clamp(8.4 - state.time / 105, 5.6, 8.4);
    state.directorTimer = rand(pace * .84, pace * 1.18);
  }

  function spawnEnemy(kind = null, elite = false, boss = false, spawnPoint = null) {
    const pos = spawnPoint || randomSpawnPoint(boss);
    const x = pos.x;
    const y = pos.y;

    const difficulty = 1 + state.time / 150;
    if (!kind) {
      const roll = Math.random();
      kind = 'drone';
      if (state.time > 80 && roll < .14) kind = 'brute';
      else if (state.time > 52 && roll < .28) kind = 'caster';
      else if (state.time > 26 && roll < .44) kind = 'swift';
    }
    if (boss) kind = 'boss';

    const c = ENEMY_CONFIGS[kind];
    const mult = boss ? 1.65 : elite ? 4 : 1;
    const enemy = {
      type: kind,
      x, y,
      r: c.r * (elite ? 1.22 : 1),
      hp: c.hp * difficulty * mult,
      maxHp: c.hp * difficulty * mult,
      speed: c.speed * (1 + state.time / 950) * (elite ? .92 : 1),
      damage: c.damage * (1 + state.time / 260) * (elite ? 1.55 : 1),
      color: boss ? '#ffe9ff' : elite ? '#69f0ff' : c.color,
      xp: Math.round(c.xp * (boss ? 10 : elite ? 7 : 1)),
      elite,
      boss,
      hit: 0,
      dead: false,
      phase: Math.random() * Math.PI * 2,
      shootTimer: rand(1.2, 2.4),
      burstTimer: rand(.8, 1.4),
      attackCharge: 0,
      attackChargeMax: 0,
      attackAngle: 0,
      pendingAttack: null,
    };
    state.enemies.push(enemy);
    if (boss) { banner('虚空先驱降临'); showToast('Boss 出现', 1600); }
    else if (elite) showToast('精英信号出现');
  }

  function nearestEnemy(origin = player, limit = Infinity) {
    let best = null;
    let bestD = limit;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = distSq(origin, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function fireAt(target, source = player, damageScale = 1, color = '#c7f8ff', speedScale = 1, size = 4, pierce = null) {
    const base = Math.atan2(target.y - source.y, target.x - source.x);
    const count = source === player ? player.projectileCount : Math.min(1 + Math.floor(player.droneLevel / 2), 2);
    for (let i = 0; i < count; i++) {
      const localSpread = source === player ? player.spread : 0.08;
      const offset = (i - (count - 1) / 2) * localSpread;
      const a = base + offset;
      const crit = source === player && Math.random() < player.crit;
      const damage = (source === player ? player.damage : player.damage * .55) * damageScale * (crit ? 2 : 1);
      state.projectiles.push({
        x: source.x + Math.cos(a) * (source.r ? source.r + 7 : 18),
        y: source.y + Math.sin(a) * (source.r ? source.r + 7 : 18),
        vx: Math.cos(a) * player.bulletSpeed * speedScale,
        vy: Math.sin(a) * player.bulletSpeed * speedScale,
        r: crit ? size + 1.2 : size,
        damage,
        life: 1.8,
        pierce: pierce ?? (source === player ? player.pierce : 0),
        crit,
        color,
        hitIds: new Set(),
      });
    }
    for (let i = 0; i < 3; i++) {
      state.particles.push({ x: source.x, y: source.y, vx: rand(-30, 30), vy: rand(-30, 30), life: .18, max: .18, size: rand(1, 3), color });
    }
  }

  function enemyShoot(enemy, spreadCount = 1, speed = 220) {
    const base = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    for (let i = 0; i < spreadCount; i++) {
      const offset = (i - (spreadCount - 1) / 2) * 0.22;
      const a = base + offset;
      state.enemyProjectiles.push({
        x: enemy.x + Math.cos(a) * (enemy.r + 4),
        y: enemy.y + Math.sin(a) * (enemy.r + 4),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: enemy.boss ? 7 : 5,
        damage: enemy.damage * (enemy.boss ? .72 : .6),
        life: enemy.boss ? 5 : 4,
        color: enemy.boss ? '#ffd37c' : enemy.color,
        fromBoss: enemy.boss,
      });
    }
  }

  function addRing(x, y, radius, color, width = 4, life = .45) {
    if (state.rings.length >= BUDGET.rings) state.rings.shift();
    state.rings.push({ x, y, radius, color, width, life, max: life });
  }

  function addShake(amount) {
    state.shake = Math.min(FEEL.shakeMax, Math.max(state.shake, amount));
  }

  function damageEnemy(enemy, amount, hitColor = '#dffbff', crit = false) {
    enemy.hp -= amount;
    enemy.hit = 1;
    state.texts.push({ x: enemy.x, y: enemy.y - enemy.r, text: `${crit ? '✦ ' : ''}${Math.round(amount)}`, life: .48, color: crit ? '#ffe56b' : hitColor });
    for (let j = 0; j < 5; j++) state.particles.push({ x: enemy.x, y: enemy.y, vx: rand(-75,75), vy: rand(-75,75), life: .24, max: .24, size: rand(1,3), color: crit ? '#ffe56b' : hitColor });
    if (crit || enemy.elite || enemy.boss || chance(FEEL.impactRingChance)) {
      addRing(enemy.x, enemy.y, crit ? 17 : enemy.elite ? 15 : 11, crit ? '#ffe56b' : hitColor, crit ? 2 : 1.3, crit ? .18 : .13);
    }
    if (crit) addShake(1.7);
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    state.kills += 1;
    const gemCount = enemy.boss ? 22 : enemy.elite ? 9 : 1;
    for (let i = 0; i < gemCount; i++) {
      state.gems.push({
        x: enemy.x + rand(-15, 15), y: enemy.y + rand(-15, 15),
        vx: rand(-35, 35), vy: rand(-35, 35),
        value: Math.max(1, Math.round(enemy.xp / gemCount)), r: enemy.boss ? 7 : enemy.elite ? 6 : 5,
      });
    }
    if (enemy.elite) state.cores += enemy.boss ? 3 : 1;
    if (enemy.boss) {
      player.hp = Math.min(player.maxHp, player.hp + 28);
      showToast('Boss 击破 · 恢复生命并获得晶核', 1700);
      banner('Boss 已歼灭');
    }
    if (player.lifesteal > 0 && !enemy.dead) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
    for (let i = 0; i < (enemy.boss ? 38 : enemy.elite ? 24 : 10); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(35, enemy.boss ? 230 : enemy.elite ? 190 : 120);
      state.particles.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.25, .72), max: .72, size: rand(1.5, 4.8), color: enemy.color });
    }
    addRing(enemy.x, enemy.y, enemy.boss ? 140 : enemy.elite ? 90 : 42, enemy.color, enemy.boss ? 6 : 4, enemy.boss ? .82 : .45);
    addShake(enemy.boss ? 12.5 : enemy.elite ? 8.5 : 2.8);
  }

  function addXp(value) {
    player.xp += value;
    while (player.xp >= player.xpNeed) {
      player.xp -= player.xpNeed;
      player.level += 1;
      player.xpNeed = Math.floor(player.xpNeed * 1.22 + 8);
      openUpgrade();
      break;
    }
  }

  function getUpgradePool() {
    const pool = [
      { id: 'damage', icon: 'DMG', rarity: 'common', name: '过载弹头', desc: '伤害提高 22%。', apply: () => { player.damage *= 1.22; } },
      { id: 'rate', icon: 'RPM', rarity: 'common', name: '超频扳机', desc: '射速提高 18%。', apply: () => { player.fireRate *= 1.18; } },
      { id: 'speed', icon: 'SPD', rarity: 'common', name: '相位步伐', desc: '移动速度提高 12%。', apply: () => { player.speed *= 1.12; } },
      { id: 'hp', icon: 'HP', rarity: 'common', name: '生物装甲', desc: '最大生命 +24，并立即回复 24。', apply: () => { player.maxHp += 24; player.hp = Math.min(player.maxHp, player.hp + 24); } },
      { id: 'bullet', icon: 'VEL', rarity: 'common', name: '磁轨加速', desc: '弹速提高 20%，伤害再提高 5%。', apply: () => { player.bulletSpeed *= 1.20; player.damage *= 1.05; } },
      { id: 'multi', icon: '+1', rarity: 'uncommon', name: '分裂火控', desc: '额外发射 1 枚投射物。', apply: () => { player.projectileCount = Math.min(7, player.projectileCount + 1); } },
      { id: 'pierce', icon: 'PEN', rarity: 'common', name: '穿甲协议', desc: '子弹额外穿透 1 个敌人。', apply: () => { player.pierce += 1; } },
      { id: 'crit', icon: 'CRT', rarity: 'common', name: '弱点标记', desc: '暴击率 +10%。', apply: () => { player.crit = Math.min(.65, player.crit + .10); } },
      { id: 'magnet', icon: 'MAG', rarity: 'common', name: '引力核心', desc: '经验吸附范围 +55。', apply: () => { player.magnet += 55; } },
      { id: 'regen', icon: 'REC', rarity: 'uncommon', name: '自修复纳米群', desc: '每秒回复 0.8 生命。', apply: () => { player.regen += .8; } },
      { id: 'lifesteal', icon: 'VMP', rarity: 'rare', name: '嗜能回流', desc: '击杀时恢复少量生命。', apply: () => { player.lifesteal += 0.6; } },
    ];

    if (player.orbitCount === 0) pool.push({ id: 'orbit-unlock', icon: 'ORB', rarity: 'rare', name: '轨道灵刃', desc: '获得 2 枚环绕灵刃，持续切割近身目标。', apply: () => { player.orbitCount = 2; player.orbitDamage = 22; } });
    else pool.push({ id: 'orbit-boost', icon: 'ORB', rarity: 'uncommon', name: '灵刃共振', desc: '增加 1 枚灵刃，并提高灵刃伤害。', apply: () => { player.orbitCount = Math.min(6, player.orbitCount + 1); player.orbitDamage *= 1.24; player.orbitRadius += 5; } });

    if (player.novaLevel === 0) pool.push({ id: 'nova-unlock', icon: 'NOVA', rarity: 'rare', name: '脉冲新星', desc: '周期性释放环形冲击波。', apply: () => { player.novaLevel = 1; player.novaTimer = 4; } });
    else pool.push({ id: 'nova-boost', icon: 'NOVA', rarity: 'uncommon', name: '新星扩幅', desc: '脉冲新星伤害和范围提高，并缩短冷却。', apply: () => { player.novaLevel = Math.min(5, player.novaLevel + 1); player.novaTimer = Math.max(0, player.novaTimer - 1.3); } });

    if (player.droneLevel === 0) pool.push({ id: 'drone-unlock', icon: 'DRN', rarity: 'rare', name: '拂晓无人机', desc: '获得 1 台无人机辅助射击。', apply: () => { player.droneLevel = 1; } });
    else pool.push({ id: 'drone-boost', icon: 'DRN', rarity: 'uncommon', name: '无人机列阵', desc: '提高无人机数量与火力。', apply: () => { player.droneLevel = Math.min(3, player.droneLevel + 1); } });

    if (player.shield < 3) pool.push({ id: 'shield', icon: 'AEG', rarity: 'rare', name: '虚空护幕', desc: '获得 1 层护盾，可抵消一次受击。', apply: () => { player.shield += 1; } });

    return pool;
  }

  function pickUpgrades() {
    const rarityWeight = { common: 1, uncommon: 1.15, rare: 1.25 };
    const pool = getUpgradePool().map(up => ({ ...up, score: Math.random() * rarityWeight[up.rarity] }));
    pool.sort((a, b) => b.score - a.score);
    return pool.slice(0, 3);
  }

  function openUpgrade() {
    state.mode = 'upgrade';
    ui.levelUpScreen.classList.remove('hidden');
    ui.upgradeCards.innerHTML = '';
    for (const up of pickUpgrades()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'upgrade-card';
      btn.innerHTML = `<span class="upgrade-icon">${up.icon}</span><h3>${up.name}</h3><p>${up.desc}</p><em>${up.rarity}</em><small>选择强化 →</small>`;
      btn.addEventListener('click', () => {
        up.apply();
        ui.levelUpScreen.classList.add('hidden');
        state.mode = 'playing';
        lastFrame = performance.now();
        showToast(up.name);
      }, { once: true });
      ui.upgradeCards.appendChild(btn);
    }
  }

  function playerInput() {
    let dx = 0, dy = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

    if (touch.active) {
      const tx = touch.x - touch.sx;
      const ty = touch.y - touch.sy;
      const mag = Math.hypot(tx, ty);
      if (mag > 6) { dx += tx / Math.max(42, mag); dy += ty / Math.max(42, mag); }
    }

    const mag = Math.hypot(dx, dy);
    if (mag > 0) { dx /= mag; dy /= mag; }
    return { dx, dy };
  }

  function requestDash() {
    if (state.mode !== 'playing' || player.dashCooldown > 0 || player.dashTimer > 0) return false;
    const input = playerInput();
    const moving = Math.hypot(input.dx, input.dy) > .05;
    const dx = moving ? input.dx : Math.cos(player.angle);
    const dy = moving ? input.dy : Math.sin(player.angle);
    player.dashDirX = dx;
    player.dashDirY = dy;
    player.dashTimer = player.dashDuration;
    player.dashCooldown = player.dashCooldownMax;
    player.dashAfterimageTimer = 0;
    player.invuln = Math.max(player.invuln, player.dashDuration + .05);
    player.angle = Math.atan2(dy, dx);
    addRing(player.x, player.y, 30, biome().accent2, 2.4, .25);
    addShake(3.2);
    return true;
  }

  function playerNovaDamage() {
    return player.damage * (.95 + player.novaLevel * .42);
  }

  function triggerNova() {
    const radius = 110 + player.novaLevel * 28;
    const damage = playerNovaDamage();
    addRing(player.x, player.y, radius, biome().accent2, 6, .72);
    addShake(6);
    showToast('脉冲新星', 700);
    for (const e of state.enemies) {
      if (e.dead) continue;
      const dx = e.x - player.x, dy = e.y - player.y;
      if (dx * dx + dy * dy <= (radius + e.r) * (radius + e.r)) {
        damageEnemy(e, damage, '#b6fbff', false);
      }
    }
  }

  function orbitDamageTick(dt) {
    if (!player.orbitCount) return;
    for (let i = 0; i < player.orbitCount; i++) {
      const a = state.time * player.orbitSpeed + i * (Math.PI * 2 / player.orbitCount);
      const ox = player.x + Math.cos(a) * player.orbitRadius;
      const oy = player.y + Math.sin(a) * player.orbitRadius;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const rr = e.r + 10;
        const dx = ox - e.x, dy = oy - e.y;
        if (dx * dx + dy * dy <= rr * rr && chance(dt * 7)) {
          damageEnemy(e, player.orbitDamage * dt * 5.5, '#dcd2ff');
        }
      }
    }
  }

  function getDroneSlots() {
    const slots = [];
    const count = player.droneLevel;
    for (let i = 0; i < count; i++) {
      const angle = state.time * .8 + i * ((Math.PI * 2) / Math.max(1, count)) + Math.PI * .2;
      const radius = 72 + count * 7;
      slots.push({ x: player.x + Math.cos(angle) * radius, y: player.y + Math.sin(angle) * (radius * .66), r: 10 });
    }
    return slots;
  }

  function takePlayerHit(amount) {
    if (player.invuln > 0) return false;
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = .32;
      addRing(player.x, player.y, 60, '#dff7ff', 4, .42);
      showToast('护盾抵消伤害', 600);
      return true;
    }
    player.hp -= amount;
    player.invuln = .58;
    addShake(9);
    state.flash = .75;
    state.texts.push({ x: player.x, y: player.y - 28, text: `-${Math.round(amount)}`, life: .65, color: '#ff7d8d' });
    if (player.hp <= 0) { player.hp = 0; gameOver(); }
    return true;
  }

  function applyEnemySeparation(dt) {
    const cellSize = 64;
    const grid = new Map();
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (e.dead) continue;
      const cx = Math.floor(e.x / cellSize), cy = Math.floor(e.y / cellSize);
      const key = cx + ',' + cy;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    }

    for (let i = 0; i < state.enemies.length; i++) {
      const a = state.enemies[i];
      if (a.dead) continue;
      const cx = Math.floor(a.x / cellSize), cy = Math.floor(a.y / cellSize);
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const list = grid.get(gx + ',' + gy);
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const b = state.enemies[j];
            if (!b || b.dead) continue;
            let dx = b.x - a.x, dy = b.y - a.y;
            let d2 = dx * dx + dy * dy;
            const minD = (a.r + b.r) * .72;
            if (d2 >= minD * minD) continue;
            if (d2 < .01) { dx = rand(-1, 1); dy = rand(-1, 1); d2 = dx * dx + dy * dy; }
            const d = Math.sqrt(d2);
            const overlap = minD - d;
            const nx = dx / d, ny = dy / d;
            const aMass = a.boss ? 4 : a.elite ? 2 : 1;
            const bMass = b.boss ? 4 : b.elite ? 2 : 1;
            const total = aMass + bMass;
            const push = overlap * Math.min(1, dt * 18);
            a.x -= nx * push * (bMass / total);
            a.y -= ny * push * (bMass / total);
            b.x += nx * push * (aMass / total);
            b.y += ny * push * (aMass / total);
          }
        }
      }
    }
  }

  function enforceBudgets() {
    if (state.projectiles.length > BUDGET.projectiles) state.projectiles.splice(0, state.projectiles.length - BUDGET.projectiles);
    if (state.enemyProjectiles.length > BUDGET.enemyProjectiles) state.enemyProjectiles.splice(0, state.enemyProjectiles.length - BUDGET.enemyProjectiles);
    if (state.particles.length > BUDGET.particles) state.particles.splice(0, state.particles.length - BUDGET.particles);
    if (state.rings.length > BUDGET.rings) state.rings.splice(0, state.rings.length - BUDGET.rings);
    if (state.texts.length > BUDGET.texts) state.texts.splice(0, state.texts.length - BUDGET.texts);
    if (state.afterimages.length > BUDGET.afterimages) state.afterimages.splice(0, state.afterimages.length - BUDGET.afterimages);
  }

  function update(dt) {
    if (state.mode !== 'playing') return;

    state.time += dt;
    state.wave = Math.floor(state.time / 25) + 1;
    state.flash = Math.max(0, state.flash - dt * 3);
    state.shake *= Math.pow(.05, dt);
    player.invuln = Math.max(0, player.invuln - dt);

    const stageIndex = currentBiomeIndex();
    if (stageIndex !== state.lastStageIndex) {
      state.lastStageIndex = stageIndex;
      banner(BIOMES[stageIndex].name);
      showToast(`进入：${BIOMES[stageIndex].name}`, 1200);
    }

    if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

    const input = playerInput();
    const moving = Math.hypot(input.dx, input.dy) > .05;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);

    if (player.dashTimer > 0) {
      player.dashTimer = Math.max(0, player.dashTimer - dt);
      player.dashAfterimageTimer -= dt;
      player.vx = player.dashDirX * player.dashSpeed;
      player.vy = player.dashDirY * player.dashSpeed;
      player.thrust += (1.25 - player.thrust) * Math.min(1, dt * 20);
      if (player.dashAfterimageTimer <= 0) {
        state.afterimages.push({ x: player.x, y: player.y, angle: player.angle, life: .22, max: .22 });
        player.dashAfterimageTimer = .035;
      }
    } else {
      const targetVX = input.dx * player.speed;
      const targetVY = input.dy * player.speed;
      const responsiveness = moving ? 12.5 : 18;
      const blend = 1 - Math.exp(-responsiveness * dt);
      player.vx = lerp(player.vx, targetVX, blend);
      player.vy = lerp(player.vy, targetVY, blend);
      const velocityMag = Math.hypot(player.vx, player.vy);
      if (velocityMag > 8) {
        const desired = Math.atan2(player.vy, player.vx);
        const delta = ((desired - player.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        player.angle += delta * Math.min(1, dt * 9.5);
      }
      player.thrust += ((moving ? 1 : 0) - player.thrust) * Math.min(1, dt * 9);
    }

    player.x = clamp(player.x + player.vx * dt, player.r + 8, W - player.r - 8);
    player.y = clamp(player.y + player.vy * dt, player.r + 8, H - player.r - 8);

    if ((moving || player.dashTimer > 0) && chance(dt * (player.dashTimer > 0 ? 70 : 32))) {
      const back = player.angle + Math.PI;
      const side = rand(-7, 7);
      state.particles.push({
        x: player.x + Math.cos(back) * 18 + Math.cos(back + Math.PI / 2) * side,
        y: player.y + Math.sin(back) * 18 + Math.sin(back + Math.PI / 2) * side,
        vx: Math.cos(back) * rand(player.dashTimer > 0 ? 100 : 55, player.dashTimer > 0 ? 220 : 130) + rand(-14, 14),
        vy: Math.sin(back) * rand(player.dashTimer > 0 ? 100 : 55, player.dashTimer > 0 ? 220 : 130) + rand(-14, 14),
        life: rand(.22, .45), max: .45, size: rand(1.2, player.dashTimer > 0 ? 4.2 : 3.2),
        color: chance(.33) ? '#917cff' : '#65eaff', glow: player.dashTimer > 0 ? 17 : 10,
      });
    }

    // Ambient pressure keeps the field alive; major difficulty comes from authored encounter packs.
    const ambientRate = Math.max(.56, 1.28 - state.time / 520);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const ambientKind = state.time > 50 && chance(.18) ? 'swift' : 'drone';
      queueEnemy(ambientKind);
      state.spawnTimer = ambientRate * rand(.82, 1.18);
    }

    state.directorTimer -= dt;
    if (state.directorTimer <= 0) runEncounterDirector();

    state.eliteTimer -= dt;
    if (state.eliteTimer <= 0) {
      queueEnemy(state.time > 75 && chance(.34) ? 'caster' : null, true, false);
      state.eliteTimer = Math.max(22, 34 - state.time / 75);
    }

    if (state.time >= state.nextBossAt) {
      queueEnemy('boss', true, true);
      state.nextBossAt += 58;
      state.directorTimer = Math.max(state.directorTimer, 4.5);
    }

    player.fireTimer -= dt;
    const target = nearestEnemy();
    if (target && player.fireTimer <= 0) {
      fireAt(target);
      player.fireTimer = 1 / player.fireRate;
    }

    if (player.novaLevel > 0) {
      player.novaTimer -= dt;
      const cd = Math.max(3.4, 9 - player.novaLevel * .9);
      if (player.novaTimer <= 0) {
        triggerNova();
        player.novaTimer = cd;
      }
    }

    orbitDamageTick(dt);

    if (player.droneLevel > 0) {
      player.droneFireTimer -= dt;
      if (player.droneFireTimer <= 0) {
        const drones = getDroneSlots();
        drones.forEach((d, idx) => {
          const t = nearestEnemy(d, 420 * 420);
          if (t) fireAt(t, d, 0.9 + player.droneLevel * .12, '#8dffcf', .82, 3.4, 0);
        });
        player.droneFireTimer = Math.max(.34, .96 - player.droneLevel * .12);
      }
    }

    for (let i = state.spawnSignals.length - 1; i >= 0; i--) {
      const signal = state.spawnSignals[i];
      if (signal.delay > 0) {
        signal.delay -= dt;
        continue;
      }
      signal.life -= dt;
      if (signal.life <= 0) {
        spawnEnemy(signal.kind, signal.elite, signal.boss, signal);
        state.spawnSignals.splice(i, 1);
      }
    }

    for (const p of state.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) p.life = 0;
    }

    for (const p of state.enemyProjectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      const rr = player.r + p.r;
      const dx = p.x - player.x, dy = p.y - player.y;
      if (dx * dx + dy * dy <= rr * rr) {
        takePlayerHit(p.damage);
        p.life = 0;
        addRing(p.x, p.y, 34, p.color, 3, .24);
        if (state.mode === 'gameover') return;
      }
    }

    for (const e of state.enemies) {
      if (e.dead) continue;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const baseDirX = dx / d;
      const baseDirY = dy / d;
      if (e.type === 'caster') {
        const desired = 220;
        const dir = d < desired ? -1 : 1;
        e.x += (baseDirX * dir - baseDirY * Math.sin(state.time * 2 + e.phase) * .1) * e.speed * dt;
        e.y += (baseDirY * dir + baseDirX * Math.sin(state.time * 2 + e.phase) * .1) * e.speed * dt;
        e.shootTimer -= dt;
        if (e.shootTimer <= 0 && d < 540 && e.attackCharge <= 0) {
          e.attackCharge = e.elite ? .52 : .46;
          e.attackChargeMax = e.attackCharge;
          e.attackAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.pendingAttack = 'caster';
          e.shootTimer = e.elite ? 1.55 : 1.95;
        }
      } else if (e.boss) {
        const wobble = Math.sin(state.time * 2 + e.phase) * .18;
        e.x += (baseDirX - baseDirY * wobble) * e.speed * dt;
        e.y += (baseDirY + baseDirX * wobble) * e.speed * dt;
        e.burstTimer -= dt;
        if (e.burstTimer <= 0 && e.attackCharge <= 0) {
          e.attackCharge = .68;
          e.attackChargeMax = .68;
          e.attackAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.pendingAttack = 'boss';
          e.burstTimer = 1.35;
        }
      } else {
        const wobble = e.elite ? Math.sin(state.time * 3 + e.phase) * .18 : 0;
        e.x += (baseDirX - baseDirY * wobble) * e.speed * dt;
        e.y += (baseDirY + baseDirX * wobble) * e.speed * dt;
      }
      if (e.attackCharge > 0) {
        e.attackCharge -= dt;
        if (e.attackCharge <= 0 && e.pendingAttack) {
          const savedX = player.x, savedY = player.y;
          player.x = e.x + Math.cos(e.attackAngle) * 300;
          player.y = e.y + Math.sin(e.attackAngle) * 300;
          if (e.pendingAttack === 'boss') {
            enemyShoot(e, 5, 250);
            addRing(e.x, e.y, 56, '#ffd37c', 4, .32);
          } else {
            enemyShoot(e, e.elite ? 2 : 1, e.elite ? 260 : 220);
          }
          player.x = savedX; player.y = savedY;
          e.pendingAttack = null;
        }
      }
      e.hit = Math.max(0, e.hit - dt * 6);

      const minD = player.r + e.r;
      if (d < minD) {
        const hitTaken = takePlayerHit(e.damage);
        if (hitTaken) {
          const knock = e.boss ? 310 : e.elite ? 250 : 205;
          player.vx += baseDirX * knock;
          player.vy += baseDirY * knock;
          const enemyKick = e.boss ? 4 : e.elite ? 10 : 18;
          e.x -= baseDirX * enemyKick;
          e.y -= baseDirY * enemyKick;
          addRing(player.x, player.y, 34, '#ff8da0', 2.6, .2);
        }
        if (state.mode === 'gameover') return;
      }
    }

    applyEnemySeparation(dt);

    for (let pi = state.projectiles.length - 1; pi >= 0; pi--) {
      const p = state.projectiles[pi];
      if (p.life <= 0) { state.projectiles.splice(pi, 1); continue; }
      let remove = false;
      for (let ei = 0; ei < state.enemies.length; ei++) {
        const e = state.enemies[ei];
        if (e.dead || p.hitIds.has(ei)) continue;
        const rr = p.r + e.r;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        if (dx * dx + dy * dy <= rr * rr) {
          p.hitIds.add(ei);
          damageEnemy(e, p.damage, p.color, p.crit);
          if (player.lifesteal > 0 && e.dead) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
          if (p.pierce > 0) p.pierce -= 1;
          else remove = true;
          break;
        }
      }
      if (remove) state.projectiles.splice(pi, 1);
    }

    state.enemies = state.enemies.filter(e => !e.dead);
    state.enemyProjectiles = state.enemyProjectiles.filter(p => p.life > 0);

    for (let i = state.gems.length - 1; i >= 0; i--) {
      const g = state.gems[i];
      g.vx *= Math.pow(.05, dt);
      g.vy *= Math.pow(.05, dt);
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < player.magnet) {
        const force = 260 + (player.magnet - d) * 6;
        g.x += dx / d * force * dt;
        g.y += dy / d * force * dt;
      }
      if (d < player.r + g.r + 7) {
        addXp(g.value);
        state.gems.splice(i, 1);
        if (state.mode === 'upgrade') break;
      }
    }

    for (let i = state.afterimages.length - 1; i >= 0; i--) {
      state.afterimages[i].life -= dt;
      if (state.afterimages[i].life <= 0) state.afterimages.splice(i, 1);
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .985; p.vy *= .985; p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const t = state.texts[i]; t.y -= 32 * dt; t.life -= dt;
      if (t.life <= 0) state.texts.splice(i, 1);
    }
    for (let i = state.rings.length - 1; i >= 0; i--) {
      const r = state.rings[i];
      r.radius += 160 * dt;
      r.life -= dt;
      if (r.life <= 0) state.rings.splice(i, 1);
    }
    for (let i = state.banners.length - 1; i >= 0; i--) {
      state.banners[i].life -= dt;
      if (state.banners[i].life <= 0) state.banners.splice(i, 1);
    }

    enforceBudgets();
  }

  function drawBackdropLayer(colors) {
    const px = player.x / W - .5;
    const py = player.y / H - .5;

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, colors.skyA);
    g.addColorStop(.48, colors.skyB);
    g.addColorStop(1, colors.skyC);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // A broad celestial light band keeps the frame composed without competing with threats.
    ctx.save();
    ctx.translate(W * .53, H * .45);
    ctx.rotate(-.22);
    const beam = ctx.createLinearGradient(-W * .65, 0, W * .65, 0);
    beam.addColorStop(0, 'rgba(255,255,255,0)');
    beam.addColorStop(.43, alphaColor(colors.hazeA, .025));
    beam.addColorStop(.56, alphaColor(colors.hazeB, .055));
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(-W * .75, -72, W * 1.5, 144);
    ctx.restore();

    for (const n of state.nebulae) {
      const driftX = Math.sin(state.time * .055 + n.phase) * 24 - px * 28 * n.depth;
      const driftY = Math.cos(state.time * .043 + n.phase) * 18 - py * 20 * n.depth;
      const color = n.hue === 0 ? colors.hazeA : n.hue === 1 ? colors.hazeB : 'rgba(210,220,255,.08)';
      const x = n.x + driftX, y = n.y + driftY;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, n.r);
      grad.addColorStop(0, alphaColor(color, n.a));
      grad.addColorStop(.34, alphaColor(color, n.a * .53));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - n.r, y - n.r, n.r * 2, n.r * 2);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const d of state.dust) {
      const x = ((d.x - px * 90 * d.z) % W + W) % W;
      const y = ((d.y - py * 64 * d.z) % H + H) % H;
      const dg = ctx.createRadialGradient(x, y, 0, x, y, d.r);
      dg.addColorStop(0, alphaColor(colors.hazeB, d.a));
      dg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = dg;
      ctx.fillRect(x-d.r, y-d.r, d.r*2, d.r*2);
    }
    ctx.restore();

    // Far broken orbit ring.
    ctx.save();
    ctx.translate(W * .82 - px * 26, H * .27 - py * 18);
    ctx.rotate(-.47 + Math.sin(state.time * .015) * .018);
    ctx.strokeStyle = alphaColor(colors.hazeB, .09);
    ctx.lineWidth = 22;
    ctx.beginPath(); ctx.ellipse(0, 0, 335, 112, 0, .17, 4.85); ctx.stroke();
    ctx.strokeStyle = alphaColor(colors.hazeB, .18);
    ctx.lineWidth = 1.15;
    ctx.beginPath(); ctx.ellipse(0, 0, 335, 112, 0, .12, 5.05); ctx.stroke();
    ctx.strokeStyle = alphaColor(colors.hazeA, .12);
    ctx.beginPath(); ctx.ellipse(0, 0, 285, 92, 0, 3.45, 5.72); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = .27 + i * .19;
      const x = Math.cos(a) * 335, y = Math.sin(a) * 112;
      ctx.strokeStyle = 'rgba(214,228,255,.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 11, y + 13); ctx.stroke();
    }
    ctx.restore();

    // Distant eclipsed body.
    const planetX = W * .12 - px * 32;
    const planetY = H * .83 - py * 22;
    const pr = 120;
    const pg = ctx.createRadialGradient(planetX - 35, planetY - 44, 4, planetX, planetY, pr);
    pg.addColorStop(0, alphaColor(colors.hazeA, .13));
    pg.addColorStop(.55, 'rgba(25,31,62,.12)');
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(planetX, planetY, pr, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = alphaColor(colors.hazeB, .09);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(planetX, planetY, pr*.72, 3.58, 5.52); ctx.stroke();

    for (const star of state.stars) {
      let x = star.x - px * 72 * star.z - state.time * (.5 + star.z * 1.4);
      let y = star.y - py * 50 * star.z + Math.sin(state.time * .06 + star.tw) * 1.8 * star.z;
      x = ((x % W) + W) % W;
      y = ((y % H) + H) % H;
      ctx.globalAlpha = star.a * (.72 + Math.sin(state.time * (1.2 + star.z) + star.tw) * .28);
      ctx.fillStyle = star.tint === 1 ? '#bcf8ff' : star.tint === 2 ? '#d6ccff' : '#f1f5ff';
      if (star.z > .82) { ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 5; }
      const ss = star.s * (.68 + star.z * .55);
      ctx.fillRect(x, y, ss, ss);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // Navigation filaments - barely visible, preserving the original sci-fi language without a hard grid.
    ctx.save();
    ctx.globalAlpha = .07;
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = .7;
    const grid = 104;
    const ox = (state.time * 2.2) % grid;
    for (let x = -grid + ox; x < W + grid; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, H*.68); ctx.lineTo(x + 180, H); ctx.stroke();
    }
    ctx.restore();
  }

  function drawProps(colors) {
    const px = player.x / W - .5;
    ctx.save();
    for (const p of state.props) {
      const offset = Math.sin(state.time * .24 + p.sway) * 3;
      const x = p.x - px * 24 * p.depth;
      ctx.globalAlpha = .25 + p.depth * .22;
      ctx.fillStyle = colors.silhouette;
      ctx.strokeStyle = alphaColor(colors.hazeB, .12);
      ctx.lineWidth = 1;
      if (p.type === 0) {
        ctx.beginPath();
        ctx.moveTo(x - p.w * .35, H + 10);
        ctx.lineTo(x - p.w * .13, p.y + offset);
        ctx.lineTo(x + p.w * .1, p.y - p.h * .12 + offset);
        ctx.lineTo(x + p.w * .36, H + 10);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - p.w*.05, p.y+20); ctx.lineTo(x + p.w*.02, H); ctx.stroke();
      } else if (p.type === 1) {
        ctx.fillRect(x - p.w * .11, p.y + offset, p.w * .22, p.h);
        ctx.beginPath(); ctx.ellipse(x, p.y + offset, p.w * .45, p.w * .15, 0, Math.PI, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, p.y + 18 + offset, p.w * .31, p.w * .09, 0, Math.PI, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, p.y + offset);
        ctx.lineTo(x + p.w * .32, H + 10);
        ctx.lineTo(x - p.w * .32, H + 10);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, p.y + 12); ctx.lineTo(x, H); ctx.stroke();
      }
    }
    ctx.restore();

    const floorGlow = ctx.createLinearGradient(0, H * .56, 0, H);
    floorGlow.addColorStop(0, 'rgba(255,255,255,0)');
    floorGlow.addColorStop(1, colors.floor);
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, H * .55, W, H * .45);
  }

  function drawBackground() {
    const colors = biome();
    drawBackdropLayer(colors);
    drawProps(colors);

    const focus = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 260);
    focus.addColorStop(0, alphaColor(colors.hazeA, .08));
    focus.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = focus;
    ctx.fillRect(player.x - 260, player.y - 260, 520, 520);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * .15, W / 2, H / 2, H * .74);
    vignette.addColorStop(.55, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, colors.vignette);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGem(g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(state.time * 2.2 + g.x);
    ctx.fillStyle = '#5ee9ff';
    ctx.shadowColor = '#5ee9ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, -g.r); ctx.lineTo(g.r * .72, 0); ctx.lineTo(0, g.r); ctx.lineTo(-g.r * .72, 0); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSpawnSignals() {
    for (const signal of state.spawnSignals) {
      if (signal.delay > 0) continue;
      const x = clamp(signal.x, 22, W - 22);
      const y = clamp(signal.y, 22, H - 22);
      const progress = 1 - signal.life / signal.max;
      const pulse = .72 + Math.sin(progress * Math.PI * 7) * .18;
      const color = signal.boss ? '#ffd98f' : signal.elite ? '#6cecff' : '#ff789b';
      ctx.save();
      ctx.globalAlpha = (.28 + progress * .58) * pulse;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = signal.boss ? 22 : 13;
      ctx.lineWidth = signal.boss ? 2.2 : 1.4;
      const radius = (signal.boss ? 34 : signal.elite ? 25 : 17) * (1.45 - progress * .45);
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha *= .65;
      ctx.beginPath(); ctx.arc(x, y, radius * .58, 0, Math.PI * 2); ctx.stroke();
      const inward = Math.atan2(H / 2 - y, W / 2 - x);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(inward) * (signal.boss ? 72 : 42), y + Math.sin(inward) * (signal.boss ? 72 : 42)); ctx.stroke();
      ctx.restore();
    }
  }

  function drawAfterimages() {
    for (const afterimage of state.afterimages) {
      const life = Math.max(0, afterimage.life / afterimage.max);
      ctx.save();
      ctx.globalAlpha = life * .25;
      ctx.translate(afterimage.x, afterimage.y);
      ctx.rotate(afterimage.angle);
      ctx.fillStyle = biome().accent2;
      ctx.shadowColor = biome().accent2;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(24,0);ctx.lineTo(2,8);ctx.lineTo(-8,17);ctx.lineTo(-13,7);ctx.lineTo(-20,0);ctx.lineTo(-13,-7);ctx.lineTo(-8,-17);ctx.lineTo(2,-8);ctx.closePath();ctx.fill();
      ctx.restore();
    }
  }

  function drawAttackTelegraph(e) {
    if (!(e.attackCharge > 0) || !(e.attackChargeMax > 0)) return;
    const progress = 1 - e.attackCharge / e.attackChargeMax;
    const color = e.boss ? '#ffd98f' : '#7be9ff';
    const length = e.boss ? 330 : 180;
    ctx.save();
    ctx.globalAlpha = .22 + progress * .5;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.1 + progress * 1.8;
    ctx.setLineDash([9, 8]);
    ctx.beginPath();
    ctx.moveTo(e.x + Math.cos(e.attackAngle) * (e.r + 8), e.y + Math.sin(e.attackAngle) * (e.r + 8));
    ctx.lineTo(e.x + Math.cos(e.attackAngle) * length, e.y + Math.sin(e.attackAngle) * length);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 8 + progress * 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const scale = 1 + Math.sin(state.time * 4 + e.phase) * .035;
    ctx.scale(scale, scale);
    const aim = Math.atan2(player.y - e.y, player.x - e.x);
    ctx.rotate(e.boss || e.elite ? 0 : aim);
    ctx.shadowColor = e.color;
    ctx.shadowBlur = e.boss ? 32 : e.elite ? 25 : (e.hit > 0 ? 18 : 10);
    ctx.fillStyle = e.hit > 0 ? '#ffffff' : e.color;
    ctx.strokeStyle = e.hit > 0 ? '#ffffff' : e.color;

    if (e.boss) {
      ctx.rotate(state.time * .18);
      ctx.globalAlpha = .17;
      ctx.lineWidth = 1.1;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath(); ctx.arc(0,0,e.r*(.82+ring*.28),0,Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let i=0;i<14;i++) {
        const a=i/14*Math.PI*2;
        const rr=i%2?e.r*.54:e.r;
        i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#130e18'; ctx.beginPath(); ctx.arc(0,0,e.r*.48,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffe3a5'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0,0,e.r*.26,0,Math.PI*2); ctx.stroke();
      ctx.rotate(-state.time*.43);
      for (let i=0;i<3;i++) {
        const a=i/3*Math.PI*2;
        ctx.fillStyle='#fff0bf'; ctx.beginPath(); ctx.arc(Math.cos(a)*e.r*.67,Math.sin(a)*e.r*.67,2.2,0,Math.PI*2); ctx.fill();
      }
    } else if (e.elite) {
      ctx.rotate(state.time * .27);
      ctx.globalAlpha=.2; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(0,0,e.r*1.22,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2, rr=i%2?e.r*.58:e.r;
        i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#08131c';ctx.beginPath();ctx.arc(0,0,e.r*.4,0,Math.PI*2);ctx.fill();
    } else if (e.type === 'swift') {
      ctx.beginPath(); ctx.moveTo(e.r*1.3,0); ctx.lineTo(-e.r*.82,e.r*.72); ctx.lineTo(-e.r*.42,0); ctx.lineTo(-e.r*.82,-e.r*.72); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#140d0b'; ctx.beginPath(); ctx.moveTo(e.r*.38,0);ctx.lineTo(-e.r*.45,e.r*.25);ctx.lineTo(-e.r*.45,-e.r*.25);ctx.closePath();ctx.fill();
    } else if (e.type === 'brute') {
      ctx.lineWidth=e.r*.3;
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2;
        i?ctx.lineTo(Math.cos(a)*e.r*.75,Math.sin(a)*e.r*.75):ctx.moveTo(Math.cos(a)*e.r*.75,Math.sin(a)*e.r*.75);
      }
      ctx.closePath();ctx.stroke();
      ctx.fillStyle='#100a18';ctx.beginPath();ctx.arc(0,0,e.r*.34,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=e.hit>0?'#fff':'#d69aff';ctx.beginPath();ctx.arc(e.r*.05,0,e.r*.11,0,Math.PI*2);ctx.fill();
    } else if (e.type === 'caster') {
      ctx.rotate(-aim + state.time*.35);
      ctx.lineWidth=3.5;
      ctx.beginPath(); ctx.arc(0,0,e.r*.8,.3,Math.PI*1.45); ctx.stroke();
      ctx.rotate(Math.PI);
      ctx.beginPath(); ctx.arc(0,0,e.r*1.05,.2,1.35); ctx.stroke();
      ctx.fillStyle=e.hit>0?'#fff':e.color;ctx.beginPath();ctx.arc(0,0,e.r*.55,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#07121a';ctx.beginPath();ctx.arc(0,0,e.r*.25,0,Math.PI*2);ctx.fill();
    } else {
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI*2, rr=i%2?e.r*.7:e.r;
        i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#120a12';ctx.beginPath();ctx.arc(0,0,e.r*.39,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,225,235,.7)';ctx.fillRect(e.r*.08,-1,e.r*.34,2);
    }
    ctx.restore();
    drawAttackTelegraph(e);

    if (e.elite || e.hp < e.maxHp || e.boss) {
      const w = e.r * (e.boss ? 3.1 : 2.35);
      ctx.fillStyle = 'rgba(1,3,10,.58)';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w, 3);
      const hg=ctx.createLinearGradient(e.x-w/2,0,e.x+w/2,0);
      hg.addColorStop(0,e.boss?'#ffd27c':e.elite?'#64eaff':'#ff6f91');
      hg.addColorStop(1,e.boss?'#fff2bd':e.elite?'#9d85ff':'#ffab8c');
      ctx.fillStyle=hg;
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w * Math.max(0, e.hp / e.maxHp), 3);
    }
  }

  function drawPlayer() {
    const colors = biome();
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    if (player.invuln > 0 && Math.floor(player.invuln * 18) % 2 === 0) ctx.globalAlpha = .4;

    if (player.thrust > .04) {
      const flame = 10 + player.thrust * 19 + Math.sin(state.time * 28) * 2 * player.thrust;
      const eg = ctx.createLinearGradient(-13, 0, -18-flame, 0);
      eg.addColorStop(0, 'rgba(235,254,255,.95)');
      eg.addColorStop(.3, alphaColor(colors.hazeB,.85));
      eg.addColorStop(1, alphaColor(colors.hazeA,0));
      ctx.fillStyle=eg;ctx.shadowColor=colors.accent2;ctx.shadowBlur=17;
      ctx.beginPath();ctx.moveTo(-13,-5);ctx.lineTo(-18-flame,0);ctx.lineTo(-13,5);ctx.closePath();ctx.fill();
    }

    ctx.shadowColor = player.shield > 0 ? '#dcfbff' : colors.accent;
    ctx.shadowBlur = player.shield > 0 ? 36 : 26;
    const hull = ctx.createLinearGradient(-18,-14,24,12);
    hull.addColorStop(0, colors.accent);
    hull.addColorStop(.52, '#b4adff');
    hull.addColorStop(1, colors.accent2);
    ctx.fillStyle=hull;
    ctx.beginPath();
    ctx.moveTo(24,0);ctx.lineTo(2,8);ctx.lineTo(-8,17);ctx.lineTo(-13,7);ctx.lineTo(-20,0);ctx.lineTo(-13,-7);ctx.lineTo(-8,-17);ctx.lineTo(2,-8);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#070b17';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-4,7);ctx.lineTo(-11,0);ctx.lineTo(-4,-7);ctx.closePath();ctx.fill();
    ctx.shadowColor='#dfffff';ctx.shadowBlur=14;ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(2,0,3.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(230,250,255,.65)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(8,-5);ctx.lineTo(-9,-13);ctx.moveTo(8,5);ctx.lineTo(-9,13);ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(state.time*.43);
    ctx.strokeStyle=alphaColor(colors.hazeB,.35);ctx.lineWidth=1.1;ctx.shadowColor=colors.accent2;ctx.shadowBlur=9;
    ctx.beginPath();ctx.arc(0,0,player.r+12,.18,1.9);ctx.stroke();
    ctx.rotate(Math.PI);ctx.strokeStyle=alphaColor(colors.hazeA,.28);ctx.beginPath();ctx.arc(0,0,player.r+15,.25,1.45);ctx.stroke();
    if (player.shield > 0) {
      ctx.rotate(-state.time*.7);ctx.strokeStyle='rgba(220,251,255,.72)';ctx.lineWidth=1.5;ctx.shadowColor='#dffcff';ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(0,0,player.r+20,.18,Math.PI*1.62);ctx.stroke();
    }
    ctx.restore();

    if (player.orbitCount > 0) {
      for (let i = 0; i < player.orbitCount; i++) {
        const a = state.time * player.orbitSpeed + i * (Math.PI * 2 / player.orbitCount);
        const ox = player.x + Math.cos(a) * player.orbitRadius;
        const oy = player.y + Math.sin(a) * player.orbitRadius;
        ctx.save();ctx.translate(ox,oy);ctx.rotate(a*2);ctx.shadowColor='#cabdff';ctx.shadowBlur=13;
        const og=ctx.createLinearGradient(-8,-8,8,8);og.addColorStop(0,'#efe9ff');og.addColorStop(1,'#8f7cff');ctx.fillStyle=og;
        ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.restore();
      }
    }

    if (player.droneLevel > 0) {
      for (const d of getDroneSlots()) {
        ctx.save();ctx.translate(d.x,d.y);ctx.rotate(-state.time*.9);ctx.shadowColor='#8dffcf';ctx.shadowBlur=12;
        ctx.fillStyle='#a7ffdc';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(0,6);ctx.lineTo(-7,0);ctx.lineTo(0,-6);ctx.closePath();ctx.fill();
        ctx.fillStyle='#073027';ctx.beginPath();ctx.arc(1,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }
  }

  function drawTouchStick() {
    if (!touch.active) return;
    ctx.save();
    ctx.globalAlpha = .35;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(touch.sx, touch.sy, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const dx = touch.x - touch.sx, dy = touch.y - touch.sy;
    const mag = Math.hypot(dx, dy) || 1;
    const rr = Math.min(30, mag);
    ctx.beginPath(); ctx.arc(touch.sx + dx / mag * rr, touch.sy + dy / mag * rr, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawBanners() {
    if (!state.banners.length) return;
    const b = state.banners[0];
    const t = 1 - b.life / b.max;
    const alpha = Math.min(1, b.life * 1.3, t * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 34px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.text, W / 2, 88 + t * 4);
    ctx.font = '700 12px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.fillText('STAGE SHIFT', W / 2, 58 + t * 4);
    ctx.restore();
  }

  function draw() {
    ctx.save();
    const sx = state.shake > .25 ? rand(-state.shake, state.shake) : 0;
    const sy = state.shake > .25 ? rand(-state.shake, state.shake) : 0;
    const driftX = Math.sin(state.time * .13) * FEEL.ambientDriftX + Math.sin(state.time * .037 + 1.7) * .8;
    const driftY = Math.cos(state.time * .11) * FEEL.ambientDriftY + Math.sin(state.time * .043) * .55;
    ctx.translate(sx + driftX, sy + driftY);

    drawBackground();
    drawSpawnSignals();

    for (const r of state.rings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / r.max);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    for (const g of state.gems) drawGem(g);

    for (const p of state.projectiles) {
      ctx.save();
      const speed=Math.hypot(p.vx,p.vy)||1, nx=p.vx/speed, ny=p.vy/speed;
      const trail=p.crit?27:19;
      const pg=ctx.createLinearGradient(p.x-nx*trail,p.y-ny*trail,p.x,p.y);
      pg.addColorStop(0,'rgba(100,230,255,0)');pg.addColorStop(1,p.crit?'#ffe89d':p.color);
      ctx.strokeStyle=pg;ctx.lineWidth=p.crit?3.2:2.2;ctx.shadowColor=p.crit?'#ffd36c':p.color;ctx.shadowBlur=p.crit?18:12;
      ctx.beginPath();ctx.moveTo(p.x-nx*trail,p.y-ny*trail);ctx.lineTo(p.x,p.y);ctx.stroke();
      ctx.fillStyle=p.crit?'#fff6cf':'#f2feff';ctx.beginPath();ctx.arc(p.x,p.y,p.crit?3.4:2.6,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    for (const p of state.enemyProjectiles) {
      ctx.save();
      const speed=Math.hypot(p.vx,p.vy)||1,nx=p.vx/speed,ny=p.vy/speed;
      const trail=p.fromBoss?25:16;
      ctx.strokeStyle=p.color;ctx.globalAlpha=.6;ctx.lineWidth=p.fromBoss?3:2;ctx.shadowColor=p.color;ctx.shadowBlur=p.fromBoss?17:11;
      ctx.beginPath();ctx.moveTo(p.x-nx*trail,p.y-ny*trail);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r*.72,0,Math.PI*2);ctx.fill();ctx.restore();
    }

    drawAfterimages();
    for (const e of state.enemies) drawEnemy(e);
    drawPlayer();

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      if (p.glow) { ctx.shadowColor=p.color; ctx.shadowBlur=p.glow; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 13px system-ui';
    for (const t of state.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 2.2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    drawTouchStick();
    drawBanners();
    ctx.restore();

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,70,90,${state.flash * .11})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function updateBuildTags() {
    const tags = [
      `ATK ${Math.round(player.damage)}`,
      `射速 ${player.fireRate.toFixed(1)}`,
      `弹丸 ${player.projectileCount}`,
    ];
    if (player.orbitCount) tags.push(`灵刃 ${player.orbitCount}`);
    if (player.novaLevel) tags.push(`新星 ${player.novaLevel}`);
    if (player.droneLevel) tags.push(`无人机 ${player.droneLevel}`);
    if (player.shield) tags.push(`护盾 ${player.shield}`);
    ui.buildTags.innerHTML = tags.map(t => `<span>${t}</span>`).join('');
  }

  function updateHud() {
    if (state.mode === 'menu') return;
    ui.levelText.textContent = player.level;
    ui.hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    ui.xpFill.style.width = `${(player.xp / player.xpNeed) * 100}%`;
    ui.timerText.textContent = formatTime(state.time);
    ui.waveText.textContent = `WAVE ${state.wave}`;
    ui.killsText.textContent = state.kills;
    ui.coresText.textContent = state.cores;
    ui.stageText.textContent = biome().name;
    const dashReady = player.dashCooldown <= 0;
    const dashRatio = dashReady ? 1 : 1 - player.dashCooldown / player.dashCooldownMax;
    if (ui.dashFill) ui.dashFill.style.transform = 'scaleX(' + clamp(dashRatio, 0, 1) + ')';
    if (ui.dashText) ui.dashText.textContent = dashReady ? 'READY' : player.dashCooldown.toFixed(1) + 's';
    if (ui.dashBtn) ui.dashBtn.classList.toggle('cooling', !dashReady);
    if (debugVisible && ui.debugPanel) {
      ui.debugPanel.textContent =
        'FPS ' + Math.round(fpsSmoothed) +
        '\nENEMY ' + state.enemies.length + ' + ' + state.spawnSignals.length + ' queued' +
        '\nPROJECTILE ' + (state.projectiles.length + state.enemyProjectiles.length) +
        '\nFX ' + (state.particles.length + state.rings.length + state.afterimages.length) + '/' + (BUDGET.particles + BUDGET.rings + BUDGET.afterimages) +
        '\nBUDGET E ' + state.enemies.length + '/' + BUDGET.enemies +
        '\nDIRECTOR ' + state.directorEncounter + ' [' + state.directorBudget.toFixed(1) + ']';
    }
    updateBuildTags();
  }

  function loop(now) {
    const dt = Math.min(.033, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (dt > 0) fpsSmoothed = lerp(fpsSmoothed, Math.min(144, 1 / dt), .08);
    update(dt);
    draw();
    updateHud();
    animationId = requestAnimationFrame(loop);
  }

  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('pointerdown', (ev) => {
    if (state.mode !== 'playing') return;
    const p = canvasPoint(ev);
    if (p.x > W * .58) return;
    touch.active = true; touch.id = ev.pointerId; touch.sx = p.x; touch.sy = p.y; touch.x = p.x; touch.y = p.y;
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!touch.active || ev.pointerId !== touch.id) return;
    const p = canvasPoint(ev); touch.x = p.x; touch.y = p.y;
  });
  const releaseTouch = (ev) => {
    if (ev.pointerId !== touch.id) return;
    touch.active = false; touch.id = null;
  };
  canvas.addEventListener('pointerup', releaseTouch);
  canvas.addEventListener('pointercancel', releaseTouch);

  window.addEventListener('keydown', (ev) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(ev.code)) ev.preventDefault();
    keys.add(ev.code);
    if ((ev.code === 'Space' || ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') && !ev.repeat) requestDash();
    if (ev.code === 'F3' && !ev.repeat) {
      debugVisible = !debugVisible;
      if (ui.debugPanel) ui.debugPanel.classList.toggle('hidden', !debugVisible);
    }
    if ((ev.code === 'KeyP' || ev.code === 'Escape') && !ev.repeat) {
      if (state.mode === 'playing') togglePause(true);
      else if (state.mode === 'paused') togglePause(false);
    }
  });
  window.addEventListener('keyup', (ev) => keys.delete(ev.code));
  window.addEventListener('blur', () => {
    keys.clear();
    if (state.mode === 'playing') togglePause(true);
  });

  ui.startBtn.addEventListener('click', startGame);
  ui.restartBtn.addEventListener('click', startGame);
  ui.pauseBtn.addEventListener('click', () => {
    if (state.mode === 'playing') togglePause(true);
    else if (state.mode === 'paused') togglePause(false);
  });
  ui.resumeBtn.addEventListener('click', () => togglePause(false));
  if (ui.dashBtn) ui.dashBtn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); requestDash(); });

  makeAtmosphere();
  renderBest();
  updateBuildTags();
  draw();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
})();
