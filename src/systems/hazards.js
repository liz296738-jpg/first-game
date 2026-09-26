import { BUDGET } from '../config/runtime.js';
import { clamp, rand } from '../core/math.js';

export function spawnRiftHazard(
  state,
  width,
  height,
  x,
  y,
  {
    radius = 52,
    warmup = 1.08,
    duration = 2.35,
    damage = 15,
  } = {},
  onFirstHazard = null,
) {
  if (state.hazards.length >= BUDGET.hazards) return false;

  const safeRadius = clamp(radius, 34, 82);
  state.hazards.push({
    x: clamp(x, safeRadius + 18, width - safeRadius - 18),
    y: clamp(y, safeRadius + 18, height - safeRadius - 18),
    r: safeRadius,
    warmup,
    maxWarmup: warmup,
    duration,
    maxDuration: duration,
    damage,
    hitTimer: 0,
    phase: rand(0, Math.PI * 2),
  });

  if (!state.hazardTutorialShown) {
    state.hazardTutorialShown = true;
    if (onFirstHazard) onFirstHazard();
  }

  return true;
}

export function scheduleAmbientHazard(
  state,
  player,
  width,
  height,
  onFirstHazard = null,
) {
  const angle = rand(0, Math.PI * 2);
  const distance = rand(70, 210);
  const x = player.x + Math.cos(angle) * distance;
  const y = player.y + Math.sin(angle) * distance;
  const scale = clamp(1 + state.time / 420, 1, 1.28);

  return spawnRiftHazard(
    state,
    width,
    height,
    x,
    y,
    {
      radius: 46 * scale,
      warmup: Math.max(0.82, 1.12 - state.time / 700),
      duration: 2.15,
      damage: 13 + state.time / 90,
    },
    onFirstHazard,
  );
}

export function updateHazards(
  state,
  player,
  dt,
  takePlayerHit,
  addRing,
) {
  for (let i = state.hazards.length - 1; i >= 0; i--) {
    const hazard = state.hazards[i];

    if (hazard.warmup > 0) {
      hazard.warmup -= dt;
      continue;
    }

    hazard.duration -= dt;
    hazard.hitTimer = Math.max(0, hazard.hitTimer - dt);

    const dx = player.x - hazard.x;
    const dy = player.y - hazard.y;
    const radius = hazard.r + player.r * 0.3;

    if (dx * dx + dy * dy <= radius * radius && hazard.hitTimer <= 0) {
      const hit = takePlayerHit(hazard.damage);
      if (hit) {
        hazard.hitTimer = 0.78;
        addRing(player.x, player.y, 30, '#ff789b', 2.2, 0.2);
      }
    }

    if (hazard.duration <= 0) state.hazards.splice(i, 1);
    if (state.mode === 'dying' || state.mode === 'gameover') return;
  }
}
