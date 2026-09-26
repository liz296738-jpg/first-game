export function drawObservatoryBeams(ctx, state, width, height) {
  const length = Math.hypot(width, height) * 1.35;

  for (const beam of state.bossBeams || []) {
    const charging = beam.charge > 0;
    const progress = charging ? 1 - beam.charge / beam.maxCharge : 1;
    const activeProgress = beam.active > 0 ? beam.active / beam.maxActive : 0;
    const dx = Math.cos(beam.angle);
    const dy = Math.sin(beam.angle);

    ctx.save();

    if (charging) {
      ctx.globalAlpha = 0.18 + progress * 0.52;
      ctx.strokeStyle = beam.phase === 2 ? '#ffd693' : '#8ff4ff';
      ctx.shadowColor = beam.phase === 2 ? '#ffd693' : '#8ff4ff';
      ctx.shadowBlur = 10 + progress * 16;
      ctx.lineWidth = 1.2 + progress * 1.8;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(beam.x - dx * length, beam.y - dy * length);
      ctx.lineTo(beam.x + dx * length, beam.y + dy * length);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = beam.width * 2;
      ctx.beginPath();
      ctx.moveTo(beam.x - dx * length, beam.y - dy * length);
      ctx.lineTo(beam.x + dx * length, beam.y + dy * length);
      ctx.stroke();
    } else if (beam.active > 0) {
      ctx.globalAlpha = 0.92 * Math.min(1, activeProgress * 2.5);
      ctx.strokeStyle = '#fff3d0';
      ctx.shadowColor = '#ffb071';
      ctx.shadowBlur = 30;
      ctx.lineWidth = beam.width * 1.28;
      ctx.beginPath();
      ctx.moveTo(beam.x - dx * length, beam.y - dy * length);
      ctx.lineTo(beam.x + dx * length, beam.y + dy * length);
      ctx.stroke();

      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = '#ff7d94';
      ctx.shadowColor = '#ff5e82';
      ctx.shadowBlur = 22;
      ctx.lineWidth = beam.width * 0.34;
      ctx.beginPath();
      ctx.moveTo(beam.x - dx * length, beam.y - dy * length);
      ctx.lineTo(beam.x + dx * length, beam.y + dy * length);
      ctx.stroke();
    }

    ctx.restore();
  }
}
