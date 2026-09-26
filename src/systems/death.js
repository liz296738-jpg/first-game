export function beginPlayerDeath(state, player, addRing, addShake) {
  if (state.mode === 'dying' || state.mode === 'gameover') return false;

  state.mode = 'dying';
  state.deathDuration = 1.18;
  state.deathTimer = state.deathDuration;
  state.flash = Math.max(state.flash, 0.9);
  state.deathFragments = [];

  const fragmentCount = 30;
  for (let i = 0; i < fragmentCount; i++) {
    const angle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.32;
    const radius = 2 + Math.random() * 18;
    const speed = 58 + Math.random() * 190;

    state.deathFragments.push({
      x: player.x + Math.cos(angle) * radius,
      y: player.y + Math.sin(angle) * radius * 0.72,
      vx: Math.cos(angle) * speed + player.vx * 0.16,
      vy: Math.sin(angle) * speed + player.vy * 0.16,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 8,
      size: 2.5 + Math.random() * 7.5,
      life: state.deathDuration * (0.62 + Math.random() * 0.38),
      max: state.deathDuration,
      warm: Math.random() < 0.24,
    });
  }

  addRing(player.x, player.y, 42, '#d9f7ff', 4.5, 0.72);
  addRing(player.x, player.y, 72, '#8d7cff', 2.2, 0.88);
  addShake(12.5);
  return true;
}

export function updatePlayerDeath(state, dt, finish) {
  if (state.mode !== 'dying') return;

  state.deathTimer = Math.max(0, state.deathTimer - dt);
  state.flash = Math.max(0, state.flash - dt * 1.5);
  state.shake *= Math.pow(0.08, dt);

  for (const fragment of state.deathFragments) {
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.vx *= Math.pow(0.38, dt);
    fragment.vy *= Math.pow(0.38, dt);
    fragment.vy += 18 * dt;
    fragment.rotation += fragment.spin * dt;
    fragment.life = Math.max(0, fragment.life - dt);
  }

  state.deathFragments = state.deathFragments.filter(fragment => fragment.life > 0);

  if (state.deathTimer <= 0) finish();
}
