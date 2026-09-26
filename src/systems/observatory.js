import { clamp } from '../core/math.js';

function distanceToBeam(px, py, bx, by, angle) {
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  return Math.abs((px - bx) * nx + (py - by) * ny);
}

function spawnBeam(state, enemy, angle, phase) {
  state.bossBeams.push({
    bossId: enemy.spawnId,
    x: enemy.x,
    y: enemy.y,
    angle,
    charge: phase === 2 ? 0.82 : 1.02,
    maxCharge: phase === 2 ? 0.82 : 1.02,
    active: 0,
    maxActive: phase === 2 ? 0.34 : 0.29,
    width: phase === 2 ? 28 : 24,
    damage: enemy.damage * 0.88,
    hit: false,
    phase,
  });
}

export function initializeObservatory(enemy) {
  enemy.bossName = 'The Observatory';
  enemy.bossTitle = '观测者';
  enemy.bossPhase = 1;
  enemy.phaseTransitioned = false;
  enemy.scanTimer = 2.9;
  enemy.riftTimer = 5.6;
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

  if (!enemy.phaseTransitioned && hpRatio <= 0.55) {
    enemy.phaseTransitioned = true;
    enemy.bossPhase = 2;
    enemy.speed *= 1.18;
    enemy.scanTimer = 1.4;
    enemy.riftTimer = 2.6;
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
  const desired = enemy.bossPhase === 2 ? 238 : 278;
  const radial = distance < desired ? -0.56 : 0.42;
  const tangent = enemy.orbitDirection * (enemy.bossPhase === 2 ? 0.82 : 0.62);

  enemy.x += (nx * radial - ny * tangent) * enemy.speed * dt;
  enemy.y += (ny * radial + nx * tangent) * enemy.speed * dt;

  enemy.scanTimer -= dt;
  if (enemy.scanTimer <= 0) {
    const aim = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    spawnBeam(state, enemy, aim, enemy.bossPhase);
    if (enemy.bossPhase === 2) spawnBeam(state, enemy, aim + Math.PI / 2, enemy.bossPhase);
    enemy.scanTimer = enemy.bossPhase === 2 ? 3.8 : 5.1;
  }

  enemy.riftTimer -= dt;
  if (enemy.riftTimer <= 0) {
    const count = enemy.bossPhase === 2 ? 2 : 1;
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
          radius: enemy.bossPhase === 2 ? 56 : 48,
          warmup: enemy.bossPhase === 2 ? 0.72 : 0.92,
          duration: 2.2,
          damage: enemy.damage * 0.68,
        },
      );
    }
    enemy.riftTimer = enemy.bossPhase === 2 ? 4.4 : 6.4;
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
        const hit = takePlayerHit(beam.damage);
        if (hit) {
          beam.hit = true;
          addRing(player.x, player.y, 38, '#ff8f9f', 3, 0.24);
        }
      }
    }

    if (beam.active <= 0) state.bossBeams.splice(i, 1);
    if (state.mode === 'dying' || state.mode === 'gameover') return;
  }
}
