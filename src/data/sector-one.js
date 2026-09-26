import { SECTOR_ONE_TUNING } from '../config/sector-one-balance.js';

export const SECTOR_ONE_OBJECTIVE = Object.freeze({
  id: 'mirror-relay',
  name: '镜面中继站',
  code: 'MIRROR RELAY',
  startTime: SECTOR_ONE_TUNING.objective.startTime,
  radius: SECTOR_ONE_TUNING.objective.radius,
  requiredHold: SECTOR_ONE_TUNING.objective.requiredHold,
  decayRate: SECTOR_ONE_TUNING.objective.decayRate,
  reward: Object.freeze({
    cores: 2,
    xp: 28,
    heal: 14,
  }),
});

export const SECTOR_ONE_EVENT = Object.freeze({
  id: 'falling-star',
  name: '坠星回收',
  code: 'FALLING STAR',
  startTime: SECTOR_ONE_TUNING.event.earliestTime,
  duration: SECTOR_ONE_TUNING.event.duration,
  pickupRadius: SECTOR_ONE_TUNING.event.pickupRadius,
  reward: Object.freeze({
    cores: 1,
    xp: 34,
    heal: 18,
  }),
});
