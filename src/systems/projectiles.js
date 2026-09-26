export function updatePlayerProjectiles(
  state,
  dt,
  width,
  height,
  damageEnemy,
) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    if (
      projectile.x < -50 || projectile.x > width + 50
      || projectile.y < -50 || projectile.y > height + 50
    ) {
      projectile.life = 0;
    }
  }

  for (let pi = state.projectiles.length - 1; pi >= 0; pi--) {
    const projectile = state.projectiles[pi];

    if (projectile.life <= 0) {
      state.projectiles.splice(pi, 1);
      continue;
    }

    let remove = false;

    for (let ei = 0; ei < state.enemies.length; ei++) {
      const enemy = state.enemies[ei];
      if (enemy.dead || projectile.hitIds.has(ei)) continue;

      const radius = projectile.r + enemy.r;
      const dx = projectile.x - enemy.x;
      const dy = projectile.y - enemy.y;

      if (dx * dx + dy * dy <= radius * radius) {
        projectile.hitIds.add(ei);
        damageEnemy(enemy, projectile.damage, projectile.color, projectile.crit);

        if (projectile.pierce > 0) projectile.pierce -= 1;
        else remove = true;
        break;
      }
    }

    if (remove) state.projectiles.splice(pi, 1);
  }
}

export function updateEnemyProjectiles(
  state,
  player,
  dt,
  takePlayerHit,
  addRing,
) {
  for (const projectile of state.enemyProjectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;

    const radius = player.r + projectile.r;
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;

    if (dx * dx + dy * dy <= radius * radius) {
      takePlayerHit(projectile.damage, projectile.source || 'enemy-projectile');
      projectile.life = 0;
      addRing(projectile.x, projectile.y, 34, projectile.color, 3, 0.24);
      if (state.mode === 'dying' || state.mode === 'gameover') return;
    }
  }

  state.enemyProjectiles = state.enemyProjectiles.filter(projectile => projectile.life > 0);
}
