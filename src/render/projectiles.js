export function drawProjectiles(ctx, state) {
  for (const projectile of state.projectiles) {
    ctx.save();
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const nx = projectile.vx / speed;
    const ny = projectile.vy / speed;
    const trail = projectile.crit ? 27 : 19;
    const gradient = ctx.createLinearGradient(
      projectile.x - nx * trail,
      projectile.y - ny * trail,
      projectile.x,
      projectile.y,
    );
    gradient.addColorStop(0, 'rgba(100,230,255,0)');
    gradient.addColorStop(1, projectile.crit ? '#ffe89d' : projectile.color);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = projectile.crit ? 3.2 : 2.2;
    ctx.shadowColor = projectile.crit ? '#ffd36c' : projectile.color;
    ctx.shadowBlur = projectile.crit ? 18 : 12;
    ctx.beginPath();
    ctx.moveTo(projectile.x - nx * trail, projectile.y - ny * trail);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();

    ctx.fillStyle = projectile.crit ? '#fff6cf' : '#f2feff';
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.crit ? 3.4 : 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const projectile of state.enemyProjectiles) {
    ctx.save();
    const speed = Math.hypot(projectile.vx, projectile.vy) || 1;
    const nx = projectile.vx / speed;
    const ny = projectile.vy / speed;
    const trail = projectile.fromBoss ? 25 : 16;

    ctx.strokeStyle = projectile.color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = projectile.fromBoss ? 3 : 2;
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = projectile.fromBoss ? 17 : 11;
    ctx.beginPath();
    ctx.moveTo(projectile.x - nx * trail, projectile.y - ny * trail);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
