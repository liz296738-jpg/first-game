import { SECTOR_ONE_TUNING } from '../config/sector-one-balance.js';
import { clamp } from '../core/math.js';

function distanceToBeam(px, py, bx, by, angle) {
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  return Math.abs((px - bx) * nx + (py - by) * ny);
}

function spawnBeam(state, enemy, angle, phase) {
  const scan = phase === 2
    ? SECTOR_ONE_TUNING.boss.scan.phaseTwo
    : SECTOR_ONE_TUNING.boss.scan.phaseOne;
  if (state.telemetry) state.telemetry.bossScansFired += 1;
  state.bossBeams.push({
    bossId: enemy.spawnId,
    x: enemy.x,
    y: enemy.y,
    angle,
    charge: scan.charge,
    maxCharge: scan.charge,
    active: 0,
    maxActive: scan.active,
    width: scan.width,
    damage: enemy.damage * SECTOR_ONE_TUNING.boss.scan.damageMultiplier,
    hit: false,
    phase,
  });
}

export function initializeObservatory(enemy) {
  enemy.bossName = 'The Observatory';
  enemy.bossTitle = '观测者';
  enemy.bossPhase = 1;
  enemy.phaseTransitioned = false;
  enemy.scanTimer = SECTOR_ONE_TUNING.boss.initialScanDelay;
  enemy.riftTimer = SECTOR_ONE_TUNING.boss.initialRiftDelay;
  enemy.orbitDirection = Math.random() < 0.5 ? -1 : 1;
}

export function updateObservatory({
  state,
  player,
  enemy,
  dt,
  spawnHazard,
  width,
  height,
  addRing,
  addShake,
  banner,
  showToast,
}) {
  if (enemy.dead) return;

  const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);

  if (!enemy.phaseTransitioned && hpRatio <= SECTOR_ONE_TUNING.boss.phaseTwoHpRatio) {
    enemy.phaseTransitioned = true;
    enemy.bossPhase = 2;
    enemy.speed *= SECTOR_ONE_TUNING.boss.phaseTwoSpeedMultiplier;
    enemy.scanTimer = SECTOR_ONE_TUNING.boss.phaseTransitionScanDelay;
    enemy.riftTimer = SECTOR_ONE_TUNING.boss.phaseTransitionRiftDelay;
    addRing(enemy.x, enemy.y, 118, '#ffd693', 6, 0.82);
    addRing(enemy.x, enemy.y, 178, '#c7dcff', 2.6, 0.96);
    addShake(10);
    banner('观测者 · 外环崩解');
    showToast('二阶段：交叉扫描已启用', 1600);
  }

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  const desired = enemy.bossPhase === 2
    ? SECTOR_ONE_TUNING.boss.phaseTwoDistance
    : SECTOR_ONE_TUNING.boss.phaseOneDistance;
  const radial = distance < desired ? -0.56 : 0.42;
  const tangent = enemy.orbitDirection * (enemy.bossPhase === 2 ? 0.82 : 0.62);

  enemy.x += (nx * radial - ny * tangent) * enemy.speed * dt;
  enemy.y += (ny * radial + nx * tangent) * enemy.speed * dt;

  enemy.scanTimer -= dt;
  if (enemy.scanTimer <= 0) {
    const aim = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    spawnBeam(state, enemy, aim, enemy.bossPhase);
    if (enemy.bossPhase === 2) spawnBeam(state, enemy, aim + Math.PI / 2, enemy.bossPhase);
    enemy.scanTimer = enemy.bossPhase === 2
      ? SECTOR_ONE_TUNING.boss.scan.phaseTwo.cooldown
      : SECTOR_ONE_TUNING.boss.scan.phaseOne.cooldown;
  }

  enemy.riftTimer -= dt;
  if (enemy.riftTimer <= 0) {
    const rift = enemy.bossPhase === 2
      ? SECTOR_ONE_TUNING.boss.rift.phaseTwo
      : SECTOR_ONE_TUNING.boss.rift.phaseOne;
    const count = rift.count;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 80 + Math.random() * 125;
      spawnHazard(
        state,
        width,
        height,
        player.x + Math.cos(a) * d,
        player.y + Math.sin(a) * d,
        {
          radius: rift.radius,
          warmup: rift.warmup,
          duration: SECTOR_ONE_TUNING.boss.rift.duration,
          damage: enemy.damage * SECTOR_ONE_TUNING.boss.rift.damageMultiplier,
          source: 'observatory-rift',
        },
      );
    }
    enemy.riftTimer = rift.cooldown;
  }
}

export function updateBossBeams(state, player, dt, takePlayerHit, addRing) {
  for (let i = state.bossBeams.length - 1; i >= 0; i--) {
    const beam = state.bossBeams[i];
    const source = state.enemies.find(enemy => enemy.spawnId === beam.bossId && !enemy.dead);
    if (source) {
      beam.x = source.x;
      beam.y = source.y;
    }

    if (beam.charge > 0) {
      beam.charge -= dt;
      if (beam.charge <= 0) beam.active = beam.maxActive;
      continue;
    }

    beam.active -= dt;

    if (!beam.hit && beam.active > 0) {
      const distance = distanceToBeam(player.x, player.y, beam.x, beam.y, beam.angle);
      if (distance <= beam.width + player.r * 0.28) {
        const hit = takePlayerHit(beam.damage, 'observatory-scan');
        if (hit) {
          beam.hit = true;
          if (state.telemetry) state.telemetry.bossScanHits += 1;
          addRing(player.x, player.y, 38, '#ff8f9f', 3, 0.24);
        }
      }
    }

    if (beam.active <= 0) state.bossBeams.splice(i, 1);
    if (state.mode === 'dying' || state.mode === 'gameover') return;
  }
}
