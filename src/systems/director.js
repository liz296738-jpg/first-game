import { ENEMY_THREAT } from '../data/enemies.js';
import { ENCOUNTER_TEMPLATES } from '../data/encounters.js';
import { clamp, rand, chance } from '../core/math.js';

function edgeSpawnPoint(width, height, edge, lane = 0.5, margin = 42) {
  const t = clamp(lane, 0.06, 0.94);
  if (edge === 0) return { x: width * t, y: -margin, edge };
  if (edge === 1) return { x: width + margin, y: height * t, edge };
  if (edge === 2) return { x: width * (1 - t), y: height + margin, edge };
  return { x: -margin, y: height * (1 - t), edge };
}

function encounterThreat(kind, elite = false) {
  return (ENEMY_THREAT[kind] || 1) * (elite ? 3.15 : 1);
}

function currentEncounterBudget(state, player) {
  const timeGrowth = state.time / 17;
  const levelGrowth = Math.max(0, player.level - 1) * 0.16;
  return clamp(5 + timeGrowth + levelGrowth, 5, 18);
}

function weightedEncounterChoice(candidates) {
  let total = candidates.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of candidates) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return candidates[candidates.length - 1];
}

function scheduleEncounter(state, template, budget, queueEnemy, width, height) {
  const baseEdge = Math.floor(Math.random() * 4);
  const opposite = (baseEdge + 2) % 4;
  const sideA = (baseEdge + 1) % 4;
  const sideB = (baseEdge + 3) % 4;
  let spent = 0;
  let sequence = 0;

  const add = (kind, edge, lane, elite = false, delay = null) => {
    const cost = encounterThreat(kind, elite);
    if (spent + cost > budget + 0.2) return false;
    const queued = queueEnemy(
      kind,
      elite,
      false,
      edgeSpawnPoint(width, height, edge, lane),
      delay ?? sequence * 0.07,
    );
    if (!queued) return false;
    spent += cost;
    sequence += 1;
    return true;
  };

  if (template.id === 'drift-line') {
    [0.2, 0.36, 0.52, 0.68, 0.84].forEach((lane, i) => {
      add(i === 2 && state.time > 28 ? 'swift' : 'drone', baseEdge, lane);
    });
  } else if (template.id === 'needle-pincer') {
    [0.28, 0.5, 0.72].forEach(lane => add('swift', baseEdge, lane));
    [0.3, 0.5, 0.7].forEach(lane => add('swift', opposite, lane, false, 0.1 + sequence * 0.06));
  } else if (template.id === 'bulwark-screen') {
    add('brute', baseEdge, 0.36);
    add('brute', baseEdge, 0.64);
    [0.18, 0.5, 0.82].forEach(lane => add('drone', baseEdge, lane, false, 0.12 + sequence * 0.06));
  } else if (template.id === 'crossfire') {
    add('caster', baseEdge, 0.5);
    add('caster', opposite, 0.5, false, 0.16);
    [0.28, 0.72].forEach(lane => add('drone', sideA, lane, false, 0.2 + sequence * 0.05));
    [0.32, 0.68].forEach(lane => add('drone', sideB, lane, false, 0.22 + sequence * 0.05));
  } else if (template.id === 'spearhead') {
    add('brute', baseEdge, 0.5);
    add('swift', baseEdge, 0.28, false, 0.08);
    add('swift', baseEdge, 0.72, false, 0.12);
    [0.14, 0.38, 0.62, 0.86].forEach(lane => add('drone', baseEdge, lane, false, 0.16 + sequence * 0.05));
  } else if (template.id === 'closing-net') {
    [0, 1, 2, 3].forEach((edge, i) => {
      add(i % 2 ? 'swift' : 'drone', edge, 0.38, false, i * 0.08);
      add('drone', edge, 0.66, false, 0.16 + i * 0.08);
    });
  } else if (template.id === 'elite-anchor') {
    const eliteKind = state.time > 135 && chance(0.42) ? 'caster' : 'brute';
    add(eliteKind, baseEdge, 0.5, true, 0);
    [0.22, 0.38, 0.62, 0.78].forEach((lane, i) => {
      add(i % 2 ? 'swift' : 'drone', baseEdge, lane, false, 0.16 + i * 0.07);
    });
  }

  let filler = 0;
  while (spent + ENEMY_THREAT.drone <= budget && filler < 8) {
    const edge = Math.floor(Math.random() * 4);
    if (!add(
      state.time > 62 && chance(0.26) ? 'swift' : 'drone',
      edge,
      rand(0.16, 0.84),
      false,
      0.28 + filler * 0.055,
    )) break;
    filler += 1;
  }

  state.directorBudget = Math.round(budget * 10) / 10;
  state.directorEncounter = template.name;
  state.lastEncounterId = template.id;
  state.encounterCount += 1;
}

export function runEncounterDirector(state, player, queueEnemy, width, height) {
  const bossActive = state.enemies.some(enemy => enemy.boss)
    || state.spawnSignals.some(signal => signal.boss);

  if (bossActive) {
    state.directorEncounter = 'BOSS';
    state.directorTimer = 3.2;
    return;
  }

  const budget = currentEncounterBudget(state, player);
  let candidates = ENCOUNTER_TEMPLATES.filter(
    item => item.minTime <= state.time && item.cost <= budget + 0.35,
  );
  const alternates = candidates.filter(item => item.id !== state.lastEncounterId);
  if (alternates.length) candidates = alternates;
  if (!candidates.length) candidates = [ENCOUNTER_TEMPLATES[0]];

  const template = weightedEncounterChoice(candidates);
  scheduleEncounter(state, template, budget, queueEnemy, width, height);

  const pace = clamp(8.4 - state.time / 105, 5.6, 8.4);
  state.directorTimer = rand(pace * 0.84, pace * 1.18);
}
