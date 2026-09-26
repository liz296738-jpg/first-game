import { clamp, alphaColor } from '../core/math.js';

export function drawGem(ctx, gem, time) {
  ctx.save();
  ctx.translate(gem.x, gem.y);
  ctx.rotate(time * 2.2 + gem.x);
  ctx.fillStyle = '#5ee9ff';
  ctx.shadowColor = '#5ee9ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, -gem.r);
  ctx.lineTo(gem.r * 0.72, 0);
  ctx.lineTo(0, gem.r);
  ctx.lineTo(-gem.r * 0.72, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHazards(ctx, state) {
  for (const hazard of state.hazards) {
    const warming = hazard.warmup > 0;
    const progress = warming
      ? 1 - hazard.warmup / hazard.maxWarmup
      : 1 - hazard.duration / hazard.maxDuration;
    const pulse = 0.82 + Math.sin(state.time * 7 + hazard.phase) * 0.18;

    ctx.save();
    ctx.translate(hazard.x, hazard.y);

    if (warming) {
      ctx.globalAlpha = 0.28 + progress * 0.38;
      ctx.strokeStyle = '#ff789b';
      ctx.shadowColor = '#ff789b';
      ctx.shadowBlur = 13;
      ctx.lineWidth = 1.5 + progress;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, hazard.r * (0.9 + progress * 0.1), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.arc(0, 0, hazard.r * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    } else {
      const fade = Math.min(1, hazard.duration * 2.2);
      const grad = ctx.createRadialGradient(0, 0, hazard.r * 0.12, 0, 0, hazard.r);
      grad.addColorStop(0, 'rgba(255,105,150,.08)');
      grad.addColorStop(0.68, 'rgba(255,82,130,.11)');
      grad.addColorStop(1, 'rgba(255,65,105,0)');
      ctx.globalAlpha = fade * pulse;
      ctx.fillStyle = grad;
      ctx.fillRect(-hazard.r, -hazard.r, hazard.r * 2, hazard.r * 2);
      ctx.strokeStyle = 'rgba(255,121,155,.78)';
      ctx.shadowColor = '#ff5f91';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, hazard.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(state.time * 0.35 + hazard.phase);
      ctx.globalAlpha *= 0.48;
      for (let i = 0; i < 3; i++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(hazard.r * 0.18, 0, hazard.r * 0.62, -0.55, 0.72);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export function drawSpawnSignals(ctx, state, width, height) {
  for (const signal of state.spawnSignals) {
    if (signal.delay > 0) continue;
    const x = clamp(signal.x, 22, width - 22);
    const y = clamp(signal.y, 22, height - 22);
    const progress = 1 - signal.life / signal.max;
    const pulse = 0.72 + Math.sin(progress * Math.PI * 7) * 0.18;
    const color = signal.boss ? '#ffd98f' : signal.elite ? '#6cecff' : '#ff789b';

    ctx.save();
    ctx.globalAlpha = (0.28 + progress * 0.58) * pulse;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = signal.boss ? 22 : 13;
    ctx.lineWidth = signal.boss ? 2.2 : 1.4;
    const radius = (signal.boss ? 34 : signal.elite ? 25 : 17) * (1.45 - progress * 0.45);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.65;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.58, 0, Math.PI * 2);
    ctx.stroke();
    const inward = Math.atan2(height / 2 - y, width / 2 - x);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(inward) * (signal.boss ? 72 : 42),
      y + Math.sin(inward) * (signal.boss ? 72 : 42),
    );
    ctx.stroke();
    ctx.restore();
  }
}

export function drawAfterimages(ctx, state, colors) {
  for (const afterimage of state.afterimages) {
    const life = Math.max(0, afterimage.life / afterimage.max);
    ctx.save();
    ctx.globalAlpha = life * 0.25;
    ctx.translate(afterimage.x, afterimage.y);
    ctx.rotate(afterimage.angle);
    ctx.fillStyle = colors.accent2;
    ctx.shadowColor = colors.accent2;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(2, 8);
    ctx.lineTo(-8, 17);
    ctx.lineTo(-13, 7);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-13, -7);
    ctx.lineTo(-8, -17);
    ctx.lineTo(2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawAttackTelegraph(ctx, enemy) {
  if (!(enemy.attackCharge > 0) || !(enemy.attackChargeMax > 0)) return;
  const progress = 1 - enemy.attackCharge / enemy.attackChargeMax;
  const color = enemy.boss ? '#ffd98f' : '#7be9ff';
  const length = enemy.boss ? 330 : 180;

  ctx.save();
  ctx.globalAlpha = 0.22 + progress * 0.5;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 1.1 + progress * 1.8;
  ctx.setLineDash([9, 8]);
  ctx.beginPath();
  ctx.moveTo(
    enemy.x + Math.cos(enemy.attackAngle) * (enemy.r + 8),
    enemy.y + Math.sin(enemy.attackAngle) * (enemy.r + 8),
  );
  ctx.lineTo(
    enemy.x + Math.cos(enemy.attackAngle) * length,
    enemy.y + Math.sin(enemy.attackAngle) * length,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(
    enemy.x,
    enemy.y,
    enemy.r + 8 + progress * 8,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progress,
  );
  ctx.stroke();
  ctx.restore();
}

export function drawEnemy(ctx, enemy, state, player) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const scale = 1 + Math.sin(state.time * 4 + enemy.phase) * 0.035;
  ctx.scale(scale, scale);
  const aim = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  ctx.rotate(enemy.boss || enemy.elite ? 0 : aim);
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = enemy.boss ? 32 : enemy.elite ? 25 : (enemy.hit > 0 ? 18 : 10);
  ctx.fillStyle = enemy.hit > 0 ? '#ffffff' : enemy.color;
  ctx.strokeStyle = enemy.hit > 0 ? '#ffffff' : enemy.color;

  if (enemy.boss) {
    ctx.rotate(state.time * 0.18);
    ctx.globalAlpha = 0.17;
    ctx.lineWidth = 1.1;
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r * (0.82 + ring * 0.28), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2;
      const rr = i % 2 ? enemy.r * 0.54 : enemy.r;
      if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#130e18';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffe3a5';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-state.time * 0.43);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2;
      ctx.fillStyle = '#fff0bf';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * enemy.r * 0.67, Math.sin(a) * enemy.r * 0.67, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (enemy.elite) {
    ctx.rotate(state.time * 0.27);
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 1.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const rr = i % 2 ? enemy.r * 0.58 : enemy.r;
      if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#08131c';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.type === 'swift') {
    ctx.beginPath();
    ctx.moveTo(enemy.r * 1.3, 0);
    ctx.lineTo(-enemy.r * 0.82, enemy.r * 0.72);
    ctx.lineTo(-enemy.r * 0.42, 0);
    ctx.lineTo(-enemy.r * 0.82, -enemy.r * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#140d0b';
    ctx.beginPath();
    ctx.moveTo(enemy.r * 0.38, 0);
    ctx.lineTo(-enemy.r * 0.45, enemy.r * 0.25);
    ctx.lineTo(-enemy.r * 0.45, -enemy.r * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === 'brute') {
    ctx.lineWidth = enemy.r * 0.3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      if (i) ctx.lineTo(Math.cos(a) * enemy.r * 0.75, Math.sin(a) * enemy.r * 0.75);
      else ctx.moveTo(Math.cos(a) * enemy.r * 0.75, Math.sin(a) * enemy.r * 0.75);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#100a18';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enemy.hit > 0 ? '#fff' : '#d69aff';
    ctx.beginPath();
    ctx.arc(enemy.r * 0.05, 0, enemy.r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.type === 'caster') {
    ctx.rotate(-aim + state.time * 0.35);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.8, 0.3, Math.PI * 1.45);
    ctx.stroke();
    ctx.rotate(Math.PI);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 1.05, 0.2, 1.35);
    ctx.stroke();
    ctx.fillStyle = enemy.hit > 0 ? '#fff' : enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07121a';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const rr = i % 2 ? enemy.r * 0.7 : enemy.r;
      if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#120a12';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.39, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,225,235,.7)';
    ctx.fillRect(enemy.r * 0.08, -1, enemy.r * 0.34, 2);
  }

  ctx.restore();
  drawAttackTelegraph(ctx, enemy);

  if (enemy.elite || enemy.hp < enemy.maxHp || enemy.boss) {
    const width = enemy.r * (enemy.boss ? 3.1 : 2.35);
    ctx.fillStyle = 'rgba(1,3,10,.58)';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.r - 16, width, 3);
    const health = ctx.createLinearGradient(enemy.x - width / 2, 0, enemy.x + width / 2, 0);
    health.addColorStop(0, enemy.boss ? '#ffd27c' : enemy.elite ? '#64eaff' : '#ff6f91');
    health.addColorStop(1, enemy.boss ? '#fff2bd' : enemy.elite ? '#9d85ff' : '#ffab8c');
    ctx.fillStyle = health;
    ctx.fillRect(
      enemy.x - width / 2,
      enemy.y - enemy.r - 16,
      width * Math.max(0, enemy.hp / enemy.maxHp),
      3,
    );
  }
}

export function drawPlayer(ctx, state, player, colors, droneSlots) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  if (player.invuln > 0 && Math.floor(player.invuln * 18) % 2 === 0) ctx.globalAlpha = 0.4;

  if (player.thrust > 0.04) {
    const flame = 10 + player.thrust * 19 + Math.sin(state.time * 28) * 2 * player.thrust;
    const gradient = ctx.createLinearGradient(-13, 0, -18 - flame, 0);
    gradient.addColorStop(0, 'rgba(235,254,255,.95)');
    gradient.addColorStop(0.3, alphaColor(colors.hazeB, 0.85));
    gradient.addColorStop(1, alphaColor(colors.hazeA, 0));
    ctx.fillStyle = gradient;
    ctx.shadowColor = colors.accent2;
    ctx.shadowBlur = 17;
    ctx.beginPath();
    ctx.moveTo(-13, -5);
    ctx.lineTo(-18 - flame, 0);
    ctx.lineTo(-13, 5);
    ctx.closePath();
    ctx.fill();
  }

  const phaseGuardActive = player.phaseGuardTimer > 0;
  const guarded = player.shield > 0 || phaseGuardActive;
  ctx.shadowColor = phaseGuardActive ? '#c7dcff' : player.shield > 0 ? '#dcfbff' : colors.accent;
  ctx.shadowBlur = guarded ? 36 : 26;
  const hull = ctx.createLinearGradient(-18, -14, 24, 12);
  hull.addColorStop(0, colors.accent);
  hull.addColorStop(0.52, '#b4adff');
  hull.addColorStop(1, colors.accent2);
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(2, 8);
  ctx.lineTo(-8, 17);
  ctx.lineTo(-13, 7);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-13, -7);
  ctx.lineTo(-8, -17);
  ctx.lineTo(2, -8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#070b17';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-4, 7);
  ctx.lineTo(-11, 0);
  ctx.lineTo(-4, -7);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = '#dfffff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#efffff';
  ctx.beginPath();
  ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(230,250,255,.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(-9, -13);
  ctx.moveTo(8, 5);
  ctx.lineTo(-9, 13);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(state.time * 0.43);
  ctx.strokeStyle = alphaColor(colors.hazeB, 0.35);
  ctx.lineWidth = 1.1;
  ctx.shadowColor = colors.accent2;
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.arc(0, 0, player.r + 12, 0.18, 1.9);
  ctx.stroke();
  ctx.rotate(Math.PI);
  ctx.strokeStyle = alphaColor(colors.hazeA, 0.28);
  ctx.beginPath();
  ctx.arc(0, 0, player.r + 15, 0.25, 1.45);
  ctx.stroke();
  if (player.shield > 0 || phaseGuardActive) {
    ctx.rotate(-state.time * 0.7);
    ctx.strokeStyle = phaseGuardActive ? 'rgba(199,220,255,.86)' : 'rgba(220,251,255,.72)';
    ctx.lineWidth = phaseGuardActive ? 2.1 : 1.5;
    ctx.shadowColor = phaseGuardActive ? '#b8c8ff' : '#dffcff';
    ctx.shadowBlur = phaseGuardActive ? 20 : 14;
    ctx.beginPath();
    ctx.arc(0, 0, player.r + (phaseGuardActive ? 23 : 20), 0.18, Math.PI * 1.62);
    ctx.stroke();
  }
  ctx.restore();

  if (player.orbitCount > 0) {
    for (let i = 0; i < player.orbitCount; i++) {
      const a = state.time * player.orbitSpeed + i * (Math.PI * 2 / player.orbitCount);
      const ox = player.x + Math.cos(a) * player.orbitRadius;
      const oy = player.y + Math.sin(a) * player.orbitRadius;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a * 2);
      ctx.shadowColor = '#cabdff';
      ctx.shadowBlur = 13;
      const orbital = ctx.createLinearGradient(-8, -8, 8, 8);
      orbital.addColorStop(0, '#efe9ff');
      orbital.addColorStop(1, '#8f7cff');
      ctx.fillStyle = orbital;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  if (player.droneLevel > 0) {
    for (const drone of droneSlots) {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(-state.time * 0.9);
      ctx.shadowColor = '#8dffcf';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#a7ffdc';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-7, 0);
      ctx.lineTo(0, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#073027';
      ctx.beginPath();
      ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawTouchStick(ctx, touch) {
  if (!touch.active) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(touch.sx, touch.sy, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const dx = touch.x - touch.sx;
  const dy = touch.y - touch.sy;
  const mag = Math.hypot(dx, dy) || 1;
  const radius = Math.min(30, mag);
  ctx.beginPath();
  ctx.arc(touch.sx + dx / mag * radius, touch.sy + dy / mag * radius, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBanners(ctx, state, width) {
  if (!state.banners.length) return;
  const banner = state.banners[0];
  const t = 1 - banner.life / banner.max;
  const alpha = Math.min(1, banner.life * 1.3, t * 3);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 34px system-ui';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(banner.text, width / 2, 88 + t * 4);
  ctx.font = '700 12px system-ui';
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.fillText('STAGE SHIFT', width / 2, 58 + t * 4);
  ctx.restore();
}
