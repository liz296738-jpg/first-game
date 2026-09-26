import { clamp } from '../core/math.js';

export function drawSectorObjective(ctx, state) {
  const objective = state.objective;
  if (!objective || objective.complete) return;

  const progress = clamp(objective.progress / objective.required, 0, 1);
  const pulse = 0.84 + Math.sin(state.time * 3.2) * 0.08;

  ctx.save();
  ctx.translate(objective.x, objective.y);

  const field = ctx.createRadialGradient(0, 0, objective.r * 0.1, 0, 0, objective.r);
  field.addColorStop(0, 'rgba(95,232,255,.09)');
  field.addColorStop(0.72, 'rgba(120,117,255,.045)');
  field.addColorStop(1, 'rgba(95,232,255,0)');
  ctx.fillStyle = field;
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.arc(0, 0, objective.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = '#77ecff';
  ctx.shadowColor = '#77ecff';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, objective.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.rotate(state.time * 0.28);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI * 2 / 3);
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = '#8e82ff';
    ctx.beginPath();
    ctx.arc(0, 0, objective.r * (0.34 + i * 0.08), -0.6, 0.68);
    ctx.stroke();
  }

  ctx.rotate(-state.time * 0.28);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#efffff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = '#dffcff';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(0, 0, objective.r * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  ctx.globalAlpha = 0.76;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cfefff';
  ctx.font = '800 10px ui-monospace, monospace';
  ctx.fillText(`${Math.round(progress * 100)}%`, 0, objective.r + 19);
  ctx.restore();
}

export function drawWorldEvent(ctx, state) {
  const event = state.worldEvent;
  if (!event || event.complete || event.failed) return;

  const progress = clamp(event.timer / event.maxTimer, 0, 1);
  const pulse = 0.8 + Math.sin(state.time * 7 + event.phase) * 0.2;

  ctx.save();
  ctx.translate(event.x, event.y);
  ctx.rotate(state.time * 0.8);

  ctx.globalAlpha = 0.5 + pulse * 0.22;
  ctx.strokeStyle = '#ffd693';
  ctx.shadowColor = '#ffd693';
  ctx.shadowBlur = 22;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const rr = i % 2 ? event.r * 0.72 : event.r * 1.3;
    if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.rotate(-state.time * 1.45);
  ctx.fillStyle = '#fff4cb';
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(0, -event.r * 0.62);
  ctx.lineTo(event.r * 0.5, 0);
  ctx.lineTo(0, event.r * 0.62);
  ctx.lineTo(-event.r * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = 'rgba(255,214,147,.75)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, event.r * 1.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  ctx.restore();
}
