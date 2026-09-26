export const SECTOR_ONE_TUNING = Object.freeze({
  objective: Object.freeze({
    startTime: 20,
    radius: 104,
    requiredHold: 8.5,
    decayRate: 0.34,
  }),

  event: Object.freeze({
    earliestTime: 41,
    duration: 12,
    pickupRadius: 24,
  }),

  boss: Object.freeze({
    earliestTime: 65,
    phaseTwoHpRatio: 0.55,
    phaseOneDistance: 278,
    phaseTwoDistance: 238,
    phaseTwoSpeedMultiplier: 1.18,
    phaseTransitionScanDelay: 1.4,
    phaseTransitionRiftDelay: 2.6,

    scan: Object.freeze({
      phaseOne: Object.freeze({
        charge: 1.02,
        active: 0.29,
        width: 24,
        cooldown: 5.1,
      }),
      phaseTwo: Object.freeze({
        charge: 0.82,
        active: 0.34,
        width: 28,
        cooldown: 3.8,
      }),
      damageMultiplier: 0.88,
    }),

    rift: Object.freeze({
      phaseOne: Object.freeze({
        count: 1,
        radius: 48,
        warmup: 0.92,
        cooldown: 6.4,
      }),
      phaseTwo: Object.freeze({
        count: 2,
        radius: 56,
        warmup: 0.72,
        cooldown: 4.4,
      }),
      duration: 2.2,
      damageMultiplier: 0.68,
    }),
  }),
});
