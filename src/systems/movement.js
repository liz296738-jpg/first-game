import { clamp, lerp, rand, chance } from '../core/math.js';

export function readMovementInput(keys, touch) {
  let dx = 0;
  let dy = 0;

  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

  if (touch.active) {
    const tx = touch.x - touch.sx;
    const ty = touch.y - touch.sy;
    const magnitude = Math.hypot(tx, ty);
    if (magnitude > 6) {
      dx += tx / Math.max(42, magnitude);
      dy += ty / Math.max(42, magnitude);
    }
  }

  const magnitude = Math.hypot(dx, dy);
  if (magnitude > 0) {
    dx /= magnitude;
    dy /= magnitude;
  }

  return { dx, dy };
}

export function requestDash({
  state,
  player,
  keys,
  touch,
  accent,
  addRing,
  addShake,
  hasResonance,
}) {
  if (state.mode !== 'playing' || player.dashCooldown > 0 || player.dashTimer > 0) return false;

  const input = readMovementInput(keys, touch);
  const moving = Math.hypot(input.dx, input.dy) > 0.05;
  const dx = moving ? input.dx : Math.cos(player.angle);
  const dy = moving ? input.dy : Math.sin(player.angle);

  player.dashDirX = dx;
  player.dashDirY = dy;
  player.dashTimer = player.dashDuration;
  player.dashCooldown = player.dashCooldownMax;
  player.dashAfterimageTimer = 0;
  player.invuln = Math.max(player.invuln, player.dashDuration + 0.05);
  player.angle = Math.atan2(dy, dx);

  if (hasResonance(player, 'moonstep-mantle') && player.phaseGuardCooldown <= 0) {
    player.phaseGuardTimer = 1.35;
    player.phaseGuardCooldown = 7.5;
    addRing(player.x, player.y, 44, '#c7dcff', 2.4, 0.32);
  }

  addRing(player.x, player.y, 30, accent, 2.4, 0.25);
  addShake(3.2);
  return true;
}

export function updatePlayerMovement({
  state,
  player,
  keys,
  touch,
  dt,
  width,
  height,
}) {
  const input = readMovementInput(keys, touch);
  const moving = Math.hypot(input.dx, input.dy) > 0.05;

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);

  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.dashAfterimageTimer -= dt;
    player.vx = player.dashDirX * player.dashSpeed;
    player.vy = player.dashDirY * player.dashSpeed;
    player.thrust += (1.25 - player.thrust) * Math.min(1, dt * 20);

    if (player.dashAfterimageTimer <= 0) {
      state.afterimages.push({
        x: player.x,
        y: player.y,
        angle: player.angle,
        life: 0.22,
        max: 0.22,
      });
      player.dashAfterimageTimer = 0.035;
    }
  } else {
    const targetVX = input.dx * player.speed;
    const targetVY = input.dy * player.speed;
    const responsiveness = moving ? 12.5 : 18;
    const blend = 1 - Math.exp(-responsiveness * dt);

    player.vx = lerp(player.vx, targetVX, blend);
    player.vy = lerp(player.vy, targetVY, blend);

    const velocityMagnitude = Math.hypot(player.vx, player.vy);
    if (velocityMagnitude > 8) {
      const desired = Math.atan2(player.vy, player.vx);
      const delta = ((desired - player.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      player.angle += delta * Math.min(1, dt * 9.5);
    }

    player.thrust += ((moving ? 1 : 0) - player.thrust) * Math.min(1, dt * 9);
  }

  player.x = clamp(player.x + player.vx * dt, player.r + 8, width - player.r - 8);
  player.y = clamp(player.y + player.vy * dt, player.r + 8, height - player.r - 8);

  if ((moving || player.dashTimer > 0) && chance(dt * (player.dashTimer > 0 ? 70 : 32))) {
    const back = player.angle + Math.PI;
    const side = rand(-7, 7);
    const fast = player.dashTimer > 0;

    state.particles.push({
      x: player.x + Math.cos(back) * 18 + Math.cos(back + Math.PI / 2) * side,
      y: player.y + Math.sin(back) * 18 + Math.sin(back + Math.PI / 2) * side,
      vx: Math.cos(back) * rand(fast ? 100 : 55, fast ? 220 : 130) + rand(-14, 14),
      vy: Math.sin(back) * rand(fast ? 100 : 55, fast ? 220 : 130) + rand(-14, 14),
      life: rand(0.22, 0.45),
      max: 0.45,
      size: rand(1.2, fast ? 4.2 : 3.2),
      color: chance(0.33) ? '#917cff' : '#65eaff',
      glow: fast ? 17 : 10,
    });
  }
}
