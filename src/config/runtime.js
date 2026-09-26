export const BUDGET = Object.freeze({
  enemies: 180,
  spawnSignals: 48,
  projectiles: 620,
  enemyProjectiles: 340,
  particles: 680,
  rings: 96,
  texts: 120,
  afterimages: 24,
  hazards: 24,
});

export const FEEL = Object.freeze({
  shakeMax: 12.5,
  ambientDriftX: 2.4,
  ambientDriftY: 1.6,
  impactRingChance: 0.24,
});

export const VFX_PROFILES = Object.freeze({
  reduced: Object.freeze({
    id: 'reduced',
    label: '精简',
    backgroundScale: 0.58,
    particleScale: 0.48,
    ringScale: 0.55,
    afterimageScale: 0.42,
    shakeScale: 0.38,
  }),
  standard: Object.freeze({
    id: 'standard',
    label: '标准',
    backgroundScale: 0.82,
    particleScale: 0.78,
    ringScale: 0.82,
    afterimageScale: 0.75,
    shakeScale: 0.72,
  }),
  cinematic: Object.freeze({
    id: 'cinematic',
    label: '电影',
    backgroundScale: 1,
    particleScale: 1,
    ringScale: 1,
    afterimageScale: 1,
    shakeScale: 1,
  }),
});

export const VFX_PROFILE_ORDER = Object.freeze(['reduced', 'standard', 'cinematic']);
