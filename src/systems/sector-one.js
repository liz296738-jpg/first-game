import { SECTOR_ONE_OBJECTIVE, SECTOR_ONE_EVENT } from '../data/sector-one.js';
import { clamp, rand } from '../core/math.js';

function pointAwayFromPlayer(player, width, height, margin = 110) {
  let best = null;
  for (let i = 0; i < 8; i++) {
    const candidate = {
      x: rand(margin, width - margin),
      y: rand(margin, height - margin),
    };
    const d2 = (candidate.x - player.x) ** 2 + (candidate.y - player.y) ** 2;
    if (!best || d2 > best.d2) best = { ...candidate, d2 };
  }
  return best;
}

export function updateSectorOneObjectives({
  state,
  player,
  dt,
  width,
  height,
  addXp,
  addRing,
  addShake,
  showToast,
  banner,
  spawnHazard,
}) {
  if (!state.sectorObjectiveStarted && state.time >= SECTOR_ONE_OBJECTIVE.startTime) {
    const pos = pointAwayFromPlayer(player, width, height);
    state.sectorObjectiveStarted = true;
    state.objective = {
      id: SECTOR_ONE_OBJECTIVE.id,
      x: pos.x,
      y: pos.y,
      r: SECTOR_ONE_OBJECTIVE.radius,
      progress: 0,
      required: SECTOR_ONE_OBJECTIVE.requiredHold,
      complete: false,
    };
    banner(SECTOR_ONE_OBJECTIVE.name);
    showToast('进入中继场，维持同步直到稳定完成', 1700);
  }

  const objective = state.objective;
  if (objective && !objective.complete) {
    const dx = player.x - objective.x;
    const dy = player.y - objective.y;
    const inside = dx * dx + dy * dy <= objective.r * objective.r;

    if (inside) objective.progress += dt;
    else objective.progress = Math.max(0, objective.progress - dt * SECTOR_ONE_OBJECTIVE.decayRate);

    if (objective.progress >= objective.required) {
      objective.progress = objective.required;
      objective.complete = true;
      state.sectorObjectiveComplete = true;
      state.cores += SECTOR_ONE_OBJECTIVE.reward.cores;
      player.hp = Math.min(player.maxHp, player.hp + SECTOR_ONE_OBJECTIVE.reward.heal);
      addXp(SECTOR_ONE_OBJECTIVE.reward.xp);
      addRing(objective.x, objective.y, objective.r * 0.8, '#8ff4ff', 5, 0.72);
      addShake(5.2);
      banner('镜面中继已稳定');
      showToast('奖励：晶核 +2 · 经验回收 · 机体修复', 1800);
    }
  }

  if (!state.sectorEventStarted && state.time >= SECTOR_ONE_EVENT.startTime) {
    const pos = pointAwayFromPlayer(player, width, height, 92);
    state.sectorEventStarted = true;
    state.worldEvent = {
      id: SECTOR_ONE_EVENT.id,
      x: pos.x,
      y: pos.y,
      r: SECTOR_ONE_EVENT.pickupRadius,
      timer: SECTOR_ONE_EVENT.duration,
      maxTimer: SECTOR_ONE_EVENT.duration,
      complete: false,
      failed: false,
      phase: rand(0, Math.PI * 2),
    };
    banner(SECTOR_ONE_EVENT.name);
    showToast('异常天体坠落：在信号衰减前完成回收', 1750);
  }

  const event = state.worldEvent;
  if (event && !event.complete && !event.failed) {
    event.timer -= dt;
    const dx = player.x - event.x;
    const dy = player.y - event.y;
    const rr = player.r + event.r + 8;

    if (dx * dx + dy * dy <= rr * rr) {
      event.complete = true;
      state.sectorEventComplete = true;
      state.cores += SECTOR_ONE_EVENT.reward.cores;
      player.hp = Math.min(player.maxHp, player.hp + SECTOR_ONE_EVENT.reward.heal);
      addXp(SECTOR_ONE_EVENT.reward.xp);
      addRing(event.x, event.y, 78, '#ffd693', 4, 0.58);
      addShake(3.8);
      showToast('坠星回收成功 · 获得晶核与修复', 1550);
    } else if (event.timer <= 0) {
      event.failed = true;
      showToast('坠星失稳：裂隙正在形成', 1450);
      spawnHazard(
        state,
        width,
        height,
        event.x,
        event.y,
        { radius: 72, warmup: 0.7, duration: 3.1, damage: 18 },
      );
    }
  }
}

export function sectorMissionText(state) {
  if (state.objective && !state.objective.complete) {
    const pct = Math.round(clamp(state.objective.progress / state.objective.required, 0, 1) * 100);
    return `稳定镜面中继 · ${pct}%`;
  }
  if (state.worldEvent && !state.worldEvent.complete && !state.worldEvent.failed) {
    return `回收坠星 · ${Math.max(0, state.worldEvent.timer).toFixed(1)}s`;
  }
  if (!state.sectorObjectiveStarted) return '搜索镜面中继信号';
  if (!state.sectorEventStarted) return '扇区稳定 · 等待异常信号';
  return state.sectorObjectiveComplete ? '中继稳定 · 继续存活' : '镜面中继未完成';
}
