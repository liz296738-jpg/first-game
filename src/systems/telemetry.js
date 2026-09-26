const STORAGE_KEY = 'void-descent-playtest-v1';
const MAX_RUNS = 40;

export function createRunTelemetry(weaponId = null) {
  return {
    schema: 1,
    startedAt: Date.now(),
    weaponId,
    damageTaken: 0,
    damageEvents: 0,
    blockedHits: 0,
    damageBySource: {},
    dashCount: 0,
    upgradesChosen: 0,
    anomaliesChosen: 0,
    resonancesUnlocked: 0,
    objectiveStart: null,
    objectiveComplete: null,
    eventStart: null,
    eventResolved: null,
    eventResult: null,
    bossSpawn: null,
    bossPhaseTwo: null,
    bossKill: null,
    bossScansFired: 0,
    bossScanHits: 0,
    minFps: 999,
    fpsUnder45Seconds: 0,
    deathSource: null,
  };
}

export function recordDamage(telemetry, amount, source = 'unknown', blocked = false) {
  if (!telemetry) return;
  if (blocked) {
    telemetry.blockedHits += 1;
    return;
  }

  telemetry.damageTaken += Math.max(0, amount);
  telemetry.damageEvents += 1;
  telemetry.damageBySource[source] = (telemetry.damageBySource[source] || 0) + Math.max(0, amount);
  telemetry.deathSource = source;
}

export function recordFrameHealth(telemetry, fps, dt) {
  if (!telemetry || !Number.isFinite(fps)) return;
  telemetry.minFps = Math.min(telemetry.minFps, fps);
  if (fps < 45) telemetry.fpsUnder45Seconds += dt;
}

export function syncRunMilestones(state) {
  const telemetry = state.telemetry;
  if (!telemetry) return;

  if (state.sectorObjectiveStarted && telemetry.objectiveStart === null) telemetry.objectiveStart = state.time;
  if (state.sectorObjectiveComplete && telemetry.objectiveComplete === null) telemetry.objectiveComplete = state.time;
  if (state.sectorEventStarted && telemetry.eventStart === null) telemetry.eventStart = state.time;

  if (state.worldEvent && telemetry.eventResolved === null) {
    if (state.worldEvent.complete) {
      telemetry.eventResolved = state.time;
      telemetry.eventResult = 'success';
    } else if (state.worldEvent.failed) {
      telemetry.eventResolved = state.time;
      telemetry.eventResult = 'failed';
    }
  }

  const boss = state.enemies.find(enemy => enemy.type === 'observatory' && !enemy.dead);
  if (boss && telemetry.bossSpawn === null) telemetry.bossSpawn = state.time;
  if (boss?.bossPhase === 2 && telemetry.bossPhaseTwo === null) telemetry.bossPhaseTwo = state.time;
  if (state.sectorBossDefeated && telemetry.bossKill === null) telemetry.bossKill = state.time;
}

export function finalizeRunTelemetry(state, player, resonances = []) {
  const telemetry = state.telemetry || createRunTelemetry(player.weaponId);
  return {
    schema: 1,
    timestamp: Date.now(),
    weaponId: player.weaponId,
    weaponName: player.weaponName,
    duration: state.time,
    kills: state.kills,
    level: player.level,
    cores: state.cores,
    damageTaken: Math.round(telemetry.damageTaken * 10) / 10,
    damageEvents: telemetry.damageEvents,
    blockedHits: telemetry.blockedHits,
    damageBySource: telemetry.damageBySource,
    dashCount: telemetry.dashCount,
    upgradesChosen: telemetry.upgradesChosen,
    anomaliesChosen: telemetry.anomaliesChosen,
    resonancesUnlocked: telemetry.resonancesUnlocked,
    objectiveStart: telemetry.objectiveStart,
    objectiveComplete: telemetry.objectiveComplete,
    objectiveDuration: telemetry.objectiveStart !== null && telemetry.objectiveComplete !== null
      ? telemetry.objectiveComplete - telemetry.objectiveStart
      : null,
    eventStart: telemetry.eventStart,
    eventResolved: telemetry.eventResolved,
    eventResult: telemetry.eventResult,
    bossSpawn: telemetry.bossSpawn,
    bossPhaseTwo: telemetry.bossPhaseTwo,
    bossKill: telemetry.bossKill,
    bossDuration: telemetry.bossSpawn !== null && telemetry.bossKill !== null
      ? telemetry.bossKill - telemetry.bossSpawn
      : null,
    bossScansFired: telemetry.bossScansFired,
    bossScanHits: telemetry.bossScanHits,
    minFps: telemetry.minFps === 999 ? null : Math.round(telemetry.minFps),
    fpsUnder45Seconds: Math.round(telemetry.fpsUnder45Seconds * 10) / 10,
    deathSource: telemetry.deathSource,
    anomalyIds: [...player.anomalies],
    resonanceIds: resonances.map(item => item.id),
    sectorBossDefeated: state.sectorBossDefeated,
  };
}

export function savePlaytestRun(run) {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    history = [];
  }

  history.unshift(run);
  history = history.slice(0, MAX_RUNS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function loadPlaytestRuns() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function average(values) {
  const valid = values.filter(value => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function summarizeWeaponRuns(history, weaponId) {
  const runs = history.filter(run => run.weaponId === weaponId);
  if (!runs.length) return null;

  const bossRuns = runs.filter(run => run.bossSpawn !== null);
  const scanAttempts = bossRuns.reduce((sum, run) => sum + (run.bossScansFired || 0), 0);
  const scanHits = bossRuns.reduce((sum, run) => sum + (run.bossScanHits || 0), 0);

  return {
    runs: runs.length,
    avgDuration: average(runs.map(run => run.duration)),
    objectiveCompletionRate: runs.filter(run => run.objectiveComplete !== null).length / runs.length,
    bossReachRate: bossRuns.length / runs.length,
    bossKillRate: runs.filter(run => run.sectorBossDefeated).length / runs.length,
    avgBossDuration: average(runs.map(run => run.bossDuration)),
    scanHitRate: scanAttempts > 0 ? scanHits / scanAttempts : null,
    avgDamageTaken: average(runs.map(run => run.damageTaken)),
  };
}
