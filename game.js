import { BUDGET, FEEL, VFX_PROFILES, VFX_PROFILE_ORDER } from './src/config/runtime.js';
import { BIOMES } from './src/data/biomes.js';
import { ENEMY_CONFIGS } from './src/data/enemies.js';
import { clamp, distSq, rand, chance, lerp, alphaColor, formatTime } from './src/core/math.js';
import { getUIElements } from './src/ui/elements.js';
import { createRunState, createPlayerState } from './src/core/state.js';
import { drawBackground as renderBackground } from './src/render/background.js';
import { drawGem as renderGem, drawHazards as renderHazards, drawSpawnSignals as renderSpawnSignals, drawAfterimages as renderAfterimages, drawEnemy as renderEnemy, drawPlayer as renderPlayer, drawPlayerDeath as renderPlayerDeath, drawTouchStick as renderTouchStick, drawBanners as renderBanners } from './src/render/entities.js';
import { drawProjectiles as renderProjectiles } from './src/render/projectiles.js';
import { AFFINITIES } from './src/data/upgrades.js';
import { STARTER_WEAPON_ID, getWeapon, getPlayableWeapons } from './src/data/weapons.js';
import { buildUpgradePool, applyUpgradeEffects } from './src/systems/upgrades.js';
import { injectAnomalyOffer } from './src/systems/anomalies.js';
import { ANOMALIES } from './src/data/anomalies.js';
import { syncResonances, hasResonance, getActiveResonances } from './src/systems/resonances.js';
import { runEncounterDirector as directEncounter } from './src/systems/director.js';
import { scheduleAmbientHazard as scheduleHazard, updateHazards as simulateHazards } from './src/systems/hazards.js';
import { updatePlayerProjectiles, updateEnemyProjectiles } from './src/systems/projectiles.js';
import { equipWeapon } from './src/systems/weapons.js';
import { beginPlayerDeath, updatePlayerDeath } from './src/systems/death.js';
import { requestDash as tryDash, updatePlayerMovement } from './src/systems/movement.js';
import { updateSectorOneObjectives, sectorMissionText } from './src/systems/sector-one.js';
import { spawnRiftHazard } from './src/systems/hazards.js';
import { initializeObservatory, updateObservatory, updateBossBeams } from './src/systems/observatory.js';
import { drawSectorObjective, drawWorldEvent } from './src/render/world.js';
import { drawObservatoryBeams } from './src/render/observatory.js';

(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const ui = getUIElements();

  const W = canvas.width;
  const H = canvas.height;
  const keys = new Set();
  let animationId = 0;
  let lastFrame = performance.now();
  let toastTimer = 0;
  let fpsSmoothed = 60;
  let debugVisible = false;
  let selectedWeaponId = localStorage.getItem('void-descent-weapon') || STARTER_WEAPON_ID;
  if (!getPlayableWeapons().some(weapon => weapon.id === selectedWeaponId)) selectedWeaponId = STARTER_WEAPON_ID;
  let vfxMode = localStorage.getItem('void-descent-vfx') || 'standard';
  if (!VFX_PROFILES[vfxMode]) vfxMode = 'standard';

  function vfxProfile() {
    return VFX_PROFILES[vfxMode];
  }

  function refreshVfxButton() {
    if (!ui.vfxBtn) return;
    ui.vfxBtn.textContent = `特效 · ${vfxProfile().label}`;
  }

  function cycleVfxQuality() {
    const index = VFX_PROFILE_ORDER.indexOf(vfxMode);
    vfxMode = VFX_PROFILE_ORDER[(index + 1) % VFX_PROFILE_ORDER.length];
    localStorage.setItem('void-descent-vfx', vfxMode);
    refreshVfxButton();
    showToast(`特效质量：${vfxProfile().label}`, 850);
  }

  const touch = {
    active: false,
    id: null,
    sx: 0,
    sy: 0,
    x: 0,
    y: 0,
  };

  const state = createRunState();

  const player = createPlayerState(W, H);
  equipWeapon(player, getWeapon(selectedWeaponId));

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
    Object.assign(player, createPlayerState(W, H));
    equipWeapon(player, getWeapon(selectedWeaponId));
  }

  function renderWeaponChoices() {
    if (!ui.weaponChoices) return;
    ui.weaponChoices.innerHTML = getPlayableWeapons().map(weapon => {
      const active = weapon.id === selectedWeaponId ? ' active' : '';
      return `<button class="weapon-choice${active}" type="button" data-weapon="${weapon.id}">
        <span class="weapon-code">${weapon.code}</span>
        <strong>${weapon.name}</strong>
        <p>${weapon.description}</p>
        <em aria-hidden="true"></em>
      </button>`;
    }).join('');

    for (const button of ui.weaponChoices.querySelectorAll('[data-weapon]')) {
      button.addEventListener('click', () => {
        selectedWeaponId = button.dataset.weapon;
        localStorage.setItem('void-descent-weapon', selectedWeaponId);
        renderWeaponChoices();
      });
    }

    const selected = getWeapon(selectedWeaponId);
    const startLabel = ui.startBtn?.querySelector('span');
    if (startLabel) startLabel.textContent = `以「${selected.name}」进入玻璃荒原`;
  }

  function resetState() {
    Object.assign(state, createRunState('playing'));
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
    if (ui.resultBuild) {
      const resonanceTags = getActiveResonances(player)
        .map(resonance => `<span class="resonance">共鸣 · ${resonance.name}</span>`);
      const anomalyMap = new Map(ANOMALIES.map(anomaly => [anomaly.id, anomaly]));
      const anomalyTags = player.anomalies
        .map(id => anomalyMap.get(id))
        .filter(Boolean)
        .map(anomaly => `<span class="anomaly">异常 · ${anomaly.name}</span>`);
      ui.resultBuild.innerHTML = [
        `<span class="weapon">武器 · ${player.weaponName}</span>`,
        ...resonanceTags,
        ...anomalyTags,
      ].join('');
    }
    updateBest();
  }

  function randomSpawnPoint(boss = false) {
    const edge = Math.floor(Math.random() * 4);
    const margin = boss ? 56 : 42;
    if (edge === 0) return { x: rand(-margin, W + margin), y: -margin, edge };
    if (edge === 1) return { x: W + margin, y: rand(-margin, H + margin), edge };
    if (edge === 2) return { x: rand(-margin, W + margin), y: H + margin, edge };
    return { x: -margin, y: rand(-margin, H + margin), edge };
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
    if (boss && !kind) kind = 'boss';

    const c = ENEMY_CONFIGS[kind];
    const mult = boss ? 1.65 : elite ? 4 : 1;
    const enemy = {
      spawnId: state.nextEntityId++,
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
    if (kind === 'observatory') initializeObservatory(enemy);
    state.enemies.push(enemy);
    if (kind === 'observatory') {
      banner('The Observatory · 观测者');
      showToast('扇区核心已锁定：规避扫描轴线', 1750);
    } else if (boss) {
      banner('虚空先驱降临');
      showToast('Boss 出现', 1600);
    } else if (elite) showToast('精英信号出现');
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

  function fireAt(target, source = player, damageScale = 1, color = null, speedScale = 1, size = null, pierce = null) {
    const weapon = source === player ? getWeapon(player.weaponId) : null;
    const projectileColor = color ?? weapon?.projectile?.color ?? '#c7f8ff';
    const projectileSize = size ?? weapon?.projectile?.size ?? 4;
    const projectileLife = weapon?.projectile?.lifetime ?? 1.8;
    const base = Math.atan2(target.y - source.y, target.x - source.x);
    const count = source === player ? player.projectileCount : Math.min(1 + Math.floor(player.droneLevel / 2), 2);
    const localSpread = source === player ? player.spread : 0.08;

    const emitProjectile = (angle, localDamageScale = damageScale, localColor = projectileColor, allowCrit = true) => {
      const crit = source === player && allowCrit && Math.random() < player.crit;
      const damage = (source === player ? player.damage : player.damage * 0.55) * localDamageScale * (crit ? 2 : 1);
      state.projectiles.push({
        x: source.x + Math.cos(angle) * (source.r ? source.r + 7 : 18),
        y: source.y + Math.sin(angle) * (source.r ? source.r + 7 : 18),
        vx: Math.cos(angle) * player.bulletSpeed * speedScale,
        vy: Math.sin(angle) * player.bulletSpeed * speedScale,
        r: crit ? projectileSize + 1.2 : projectileSize,
        damage,
        life: projectileLife,
        pierce: pierce ?? (source === player ? player.pierce : 0),
        crit,
        color: localColor,
        hitIds: new Set(),
      });
    };

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * localSpread;
      emitProjectile(base + offset);
    }

    if (source === player) {
      player.primaryVolleyCounter += 1;
      if (hasResonance(player, 'corona-repeater') && player.primaryVolleyCounter % 5 === 0) {
        emitProjectile(base - 0.24, damageScale * 0.68, '#ffd693', false);
        emitProjectile(base + 0.24, damageScale * 0.68, '#ffd693', false);
        addRing(player.x, player.y, 23, '#ffd693', 1.8, 0.18);
      }
    }

    for (let i = 0; i < 3; i++) {
      state.particles.push({ x: source.x, y: source.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.18, max: 0.18, size: rand(1, 3), color });
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
    const scaled = amount * vfxProfile().shakeScale;
    state.shake = Math.min(FEEL.shakeMax * vfxProfile().shakeScale, Math.max(state.shake, scaled));
  }

  function damageEnemy(enemy, amount, hitColor = '#dffbff', crit = false) {
    enemy.hp -= amount;
    enemy.hit = 1;
    enemy.lastHitCrit = crit;
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
      if (enemy.type === 'observatory') {
        state.sectorBossDefeated = true;
        state.cores += 2;
        addRing(enemy.x, enemy.y, 190, '#ffd693', 7, 1.05);
        addRing(enemy.x, enemy.y, 250, '#8ff4ff', 2.5, 1.18);
        showToast('观测者崩解 · 扇区核心解除锁定', 1900);
        banner('The Observatory · Signal Lost');
      } else {
        showToast('Boss 击破 · 恢复生命并获得晶核', 1700);
        banner('Boss 已歼灭');
      }
    }
    if (player.lifesteal > 0) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);

    if (enemy.lastHitCrit && hasResonance(player, 'blackstar-rupture')) {
      const ruptureRadius = 92;
      const ruptureDamage = player.damage * 0.55;
      addRing(enemy.x, enemy.y, ruptureRadius, '#d2a8ff', 3.4, 0.38);
      for (const target of state.enemies) {
        if (target === enemy || target.dead) continue;
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        if (dx * dx + dy * dy <= (ruptureRadius + target.r) * (ruptureRadius + target.r)) {
          damageEnemy(target, ruptureDamage, '#d2a8ff', false);
        }
      }
    }
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

  function pickUpgrades() {
    const rarityWeight = { common: 1, uncommon: 1.15, rare: 1.25 };
    const pool = buildUpgradePool(player).map(up => ({ ...up, score: Math.random() * rarityWeight[up.rarity] }));
    pool.sort((a, b) => b.score - a.score);
    return injectAnomalyOffer(player, pool.slice(0, 3));
  }

  function openUpgrade() {
    state.mode = 'upgrade';
    ui.levelUpScreen.classList.remove('hidden');
    ui.upgradeCards.innerHTML = '';
    for (const up of pickUpgrades()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `upgrade-card${up.kind === 'anomaly' ? ' anomaly-card' : ''}`;
      const affinity = AFFINITIES[up.affinity];
      const tradeoff = up.kind === 'anomaly'
        ? `<div class="anomaly-tradeoff"><span>收益 · ${up.upside}</span><b>代价 · ${up.downside}</b></div>`
        : '';
      btn.innerHTML = `<span class="upgrade-icon">${up.icon}</span><span class="upgrade-affinity affinity-${up.affinity}">${affinity.label}<b>${affinity.code}</b></span><h3>${up.name}</h3><p>${up.desc}</p>${tradeoff}<em>${up.rarity}</em><small>${up.kind === 'anomaly' ? '接受异常 →' : '选择强化 →'}</small>`;
      btn.addEventListener('click', () => {
        applyUpgradeEffects(player, up);
        const unlocked = syncResonances(player);
        ui.levelUpScreen.classList.add('hidden');
        state.mode = 'playing';
        lastFrame = performance.now();
        if (up.kind === 'anomaly') {
          banner(`异常 · ${up.name}`);
          showToast(`${up.upside} / ${up.downside}`, 1800);
        } else if (unlocked.length) {
          const resonance = unlocked[0];
          banner(`共鸣 · ${resonance.name}`);
          showToast(resonance.description, 1900);
        } else {
          showToast(up.name);
        }
      }, { once: true });
      ui.upgradeCards.appendChild(btn);
    }
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
    const weapon = getWeapon(player.weaponId);
    const hitRate = weapon.behavior === 'orbit-primary' ? (weapon.orbit?.hitRate || 7.2) : 7;
    const baseDamage = weapon.base?.damage || 24;
    const weaponScaling = Math.max(.55, player.damage / Math.max(1, baseDamage));
    const contactDamage = player.orbitDamage * .09 * weaponScaling;

    for (let i = 0; i < player.orbitCount; i++) {
      const a = state.time * player.orbitSpeed + i * (Math.PI * 2 / player.orbitCount);
      const ox = player.x + Math.cos(a) * player.orbitRadius;
      const oy = player.y + Math.sin(a) * player.orbitRadius;
      for (const e of state.enemies) {
        if (e.dead) continue;
        const rr = e.r + (weapon.orbit?.bladeSize || 10);
        const dx = ox - e.x, dy = oy - e.y;
        if (dx * dx + dy * dy <= rr * rr && chance(dt * hitRate)) {
          damageEnemy(e, contactDamage, weapon.behavior === 'orbit-primary' ? '#c7dcff' : '#dcd2ff');
        }
      }
    }
  }

  function triggerEventHorizon() {
    const weapon = getWeapon(player.weaponId);
    const radius = Math.max(128, player.orbitRadius * 2.25);
    const baseDamage = weapon.base?.damage || 24;
    const weaponScaling = Math.max(.6, player.damage / Math.max(1, baseDamage));
    const collapseDamage = player.orbitDamage * .95 * weaponScaling;

    addRing(player.x, player.y, radius * .34, '#d2a8ff', 4.2, .58);
    addRing(player.x, player.y, radius * .68, '#c7dcff', 2.1, .72);
    addShake(4.5);

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > radius + enemy.r) continue;

      const pull = Math.min(44, 18 + (1 - distance / radius) * 32);
      enemy.x += dx / distance * pull;
      enemy.y += dy / distance * pull;
      damageEnemy(enemy, collapseDamage, '#c9b9ff', false);
    }

    player.eventHorizonTimer = 6.4;
    showToast('视界合唱 · 空间坍缩', 760);
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
    if (player.phaseGuardTimer > 0) {
      player.phaseGuardTimer = 0;
      player.invuln = 0.28;
      addRing(player.x, player.y, 54, '#c7dcff', 3.2, 0.34);
      showToast('月步护幕抵消伤害', 650);
      return true;
    }
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
    if (player.hp <= 0) {
      player.hp = 0;
      beginPlayerDeath(state, player, addRing, addShake);
    }
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
    const quality = vfxProfile();
    const particleCap = Math.max(160, Math.round(BUDGET.particles * quality.particleScale));
    const ringCap = Math.max(24, Math.round(BUDGET.rings * quality.ringScale));
    const afterimageCap = Math.max(6, Math.round(BUDGET.afterimages * quality.afterimageScale));
    if (state.projectiles.length > BUDGET.projectiles) state.projectiles.splice(0, state.projectiles.length - BUDGET.projectiles);
    if (state.enemyProjectiles.length > BUDGET.enemyProjectiles) state.enemyProjectiles.splice(0, state.enemyProjectiles.length - BUDGET.enemyProjectiles);
    if (state.particles.length > particleCap) state.particles.splice(0, state.particles.length - particleCap);
    if (state.rings.length > ringCap) state.rings.splice(0, state.rings.length - ringCap);
    if (state.texts.length > BUDGET.texts) state.texts.splice(0, state.texts.length - BUDGET.texts);
    if (state.afterimages.length > afterimageCap) state.afterimages.splice(0, state.afterimages.length - afterimageCap);
    if (state.hazards.length > BUDGET.hazards) state.hazards.splice(0, state.hazards.length - BUDGET.hazards);
  }

  function update(dt) {
    if (state.mode === 'dying') {
      updatePlayerDeath(state, dt, gameOver);
      return;
    }
    if (state.mode !== 'playing') return;

    state.time += dt;
    state.wave = Math.floor(state.time / 25) + 1;
    state.flash = Math.max(0, state.flash - dt * 3);
    state.shake *= Math.pow(.05, dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.phaseGuardTimer = Math.max(0, player.phaseGuardTimer - dt);
    player.phaseGuardCooldown = Math.max(0, player.phaseGuardCooldown - dt);

    const stageIndex = currentBiomeIndex();
    if (stageIndex !== state.lastStageIndex) {
      state.lastStageIndex = stageIndex;
      banner(BIOMES[stageIndex].name);
      showToast(`进入：${BIOMES[stageIndex].name}`, 1200);
    }

    if (player.regen > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

    updatePlayerMovement({
      state,
      player,
      keys,
      touch,
      dt,
      width: W,
      height: H,
    });

    updateSectorOneObjectives({
      state,
      player,
      dt,
      width: W,
      height: H,
      addXp,
      addRing,
      addShake,
      showToast,
      banner,
      spawnHazard: spawnRiftHazard,
    });
    if (state.mode === 'upgrade') return;

    // Ambient pressure keeps the field alive; major difficulty comes from authored encounter packs.
    const ambientRate = Math.max(.56, 1.28 - state.time / 520);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const ambientKind = state.time > 50 && chance(.18) ? 'swift' : 'drone';
      queueEnemy(ambientKind);
      state.spawnTimer = ambientRate * rand(.82, 1.18);
    }

    state.directorTimer -= dt;
    if (state.directorTimer <= 0) directEncounter(state, player, queueEnemy, W, H);

    state.eliteTimer -= dt;
    if (state.eliteTimer <= 0) {
      queueEnemy(state.time > 75 && chance(.34) ? 'caster' : null, true, false);
      state.eliteTimer = Math.max(22, 34 - state.time / 75);
    }

    if (state.time >= state.nextBossAt) {
      queueEnemy('observatory', true, true);
      state.nextBossAt += 58;
      state.directorTimer = Math.max(state.directorTimer, 4.5);
    }

    if (state.time > 34) {
      state.hazardTimer -= dt;
      if (state.hazardTimer <= 0) {
        const bossActive = state.enemies.some(e => e.boss) || state.spawnSignals.some(signal => signal.boss);
        const hazardCount = !bossActive && state.time > 110 && chance(.3) ? 2 : 1;
        for (let i = 0; i < hazardCount; i++) scheduleHazard(state, player, W, H, () => showToast('空间裂隙：预警结束前离开区域', 1450));
        state.hazardTimer = rand(bossActive ? 10.5 : 8.2, bossActive ? 14.5 : 12.2);
      }
    }

    simulateHazards(state, player, dt, takePlayerHit, addRing);
    if (state.mode === 'dying' || state.mode === 'gameover') return;
    updateBossBeams(state, player, dt, takePlayerHit, addRing);
    if (state.mode === 'dying' || state.mode === 'gameover') return;

    const equippedWeapon = getWeapon(player.weaponId);
    if (equippedWeapon.behavior === 'projectile-auto') {
      player.fireTimer -= dt;
      const target = nearestEnemy();
      if (target && player.fireTimer <= 0) {
        fireAt(target);
        player.fireTimer = 1 / player.fireRate;
      }
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

    if (hasResonance(player, 'event-horizon-choir') && player.orbitCount > 0) {
      player.eventHorizonTimer -= dt;
      if (player.eventHorizonTimer <= 0) triggerEventHorizon();
    }

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

    updatePlayerProjectiles(state, dt, W, H, damageEnemy);
    updateEnemyProjectiles(state, player, dt, takePlayerHit, addRing);
    if (state.mode === 'dying' || state.mode === 'gameover') return;

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
      } else if (e.type === 'observatory') {
        updateObservatory({
          state,
          player,
          enemy: e,
          dt,
          spawnHazard: spawnRiftHazard,
          width: W,
          height: H,
          addRing,
          addShake,
          banner,
          showToast,
        });
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
        if (state.mode === 'dying' || state.mode === 'gameover') return;
      }
    }

    applyEnemySeparation(dt);

    state.enemies = state.enemies.filter(e => !e.dead);

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

  function draw() {
    ctx.save();
    const sx = state.shake > .25 ? rand(-state.shake, state.shake) : 0;
    const sy = state.shake > .25 ? rand(-state.shake, state.shake) : 0;
    const driftX = Math.sin(state.time * .13) * FEEL.ambientDriftX + Math.sin(state.time * .037 + 1.7) * .8;
    const driftY = Math.cos(state.time * .11) * FEEL.ambientDriftY + Math.sin(state.time * .043) * .55;
    ctx.translate(sx + driftX, sy + driftY);

    renderBackground(ctx, W, H, state, player, biome(), vfxProfile());
    drawSectorObjective(ctx, state);
    drawWorldEvent(ctx, state);
    renderHazards(ctx, state);
    drawObservatoryBeams(ctx, state, W, H);
    renderSpawnSignals(ctx, state, W, H);

    for (const r of state.rings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / r.max);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    for (const g of state.gems) renderGem(ctx, g, state.time);

    renderProjectiles(ctx, state);

    renderAfterimages(ctx, state, biome());
    for (const e of state.enemies) renderEnemy(ctx, e, state, player);
    if (state.mode === 'dying') renderPlayerDeath(ctx, state, player, biome());
    else renderPlayer(ctx, state, player, biome(), getDroneSlots());

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

    renderTouchStick(ctx, touch);
    renderBanners(ctx, state, W);
    ctx.restore();

    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,70,90,${state.flash * .11})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function updateConstellationUI() {
    if (!ui.constellationStrip) return;
    ui.constellationStrip.innerHTML = Object.values(AFFINITIES).map(affinity => {
      const count = player.affinities[affinity.id] || 0;
      const active = count > 0 ? ' active' : '';
      const filled = Math.min(3, count);
      return `<span class="constellation-node affinity-${affinity.id}${active}" title="${affinity.label}">
        <i></i><b>${affinity.code.slice(0, 1)}</b><em>${count}</em><small style="--fill:${filled / 3}"></small>
      </span>`;
    }).join('');
  }

  function updateBuildTags() {
    const tags = [
      `${player.weaponName || '武器'}`,
      `ATK ${Math.round(player.damage)}`,
      `射速 ${player.fireRate.toFixed(1)}`,
      `弹丸 ${player.projectileCount}`,
    ];
    if (player.orbitCount) tags.push(`灵刃 ${player.orbitCount}`);
    if (player.novaLevel) tags.push(`新星 ${player.novaLevel}`);
    if (player.droneLevel) tags.push(`无人机 ${player.droneLevel}`);
    if (player.shield) tags.push(`护盾 ${player.shield}`);
    if (player.phaseGuardTimer > 0) tags.push('月步护幕');
    const resonanceCount = getActiveResonances(player).length;
    if (resonanceCount) tags.push(`共鸣 ${resonanceCount}`);
    if (player.anomalies.length) tags.push(`异常 ${player.anomalies.length}`);
    ui.buildTags.innerHTML = tags.map(t => `<span>${t}</span>`).join('');
  }

  function updateHud() {
    if (state.mode === 'menu') return;
    ui.levelText.textContent = player.level;
    ui.hpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    ui.xpFill.style.width = `${(player.xp / player.xpNeed) * 100}%`;
    ui.timerText.textContent = formatTime(state.time);
    ui.waveText.textContent = `WAVE ${state.wave}`;
    if (ui.missionText) ui.missionText.textContent = state.sectorBossDefeated ? '观测者已摧毁 · 扇区清空中' : sectorMissionText(state);
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
        '\nWEAPON ' + (player.weaponName || '-') +
        '\nMISSION ' + sectorMissionText(state) +
        '\nVFX ' + vfxProfile().label +
        '\nHAZARD ' + state.hazards.length + '/' + BUDGET.hazards +
        '\nBUDGET E ' + state.enemies.length + '/' + BUDGET.enemies +
        '\nDIRECTOR ' + state.directorEncounter + ' [' + state.directorBudget.toFixed(1) + ']';
    }
    updateBuildTags();
    updateConstellationUI();
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
    if ((ev.code === 'Space' || ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') && !ev.repeat) tryDash({ state, player, keys, touch, accent: biome().accent2, addRing, addShake, hasResonance });
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
  if (ui.vfxBtn) ui.vfxBtn.addEventListener('click', cycleVfxQuality);
  ui.pauseBtn.addEventListener('click', () => {
    if (state.mode === 'playing') togglePause(true);
    else if (state.mode === 'paused') togglePause(false);
  });
  ui.resumeBtn.addEventListener('click', () => togglePause(false));
  if (ui.dashBtn) ui.dashBtn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); tryDash({ state, player, keys, touch, accent: biome().accent2, addRing, addShake, hasResonance }); });

  makeAtmosphere();
  refreshVfxButton();
  renderBest();
  renderWeaponChoices();
  updateBuildTags();
  updateConstellationUI();
  draw();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
})();
