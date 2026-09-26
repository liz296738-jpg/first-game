import { alphaColor } from '../core/math.js';

function drawBackdropLayer(ctx, W, H, state, player, colors) {
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

function drawProps(ctx, W, H, state, player, colors) {
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

export function drawBackground(ctx, W, H, state, player, colors) {
  drawBackdropLayer(ctx, W, H, state, player, colors);
  drawProps(ctx, W, H, state, player, colors);

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
