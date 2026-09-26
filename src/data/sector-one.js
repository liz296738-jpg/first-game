export const SECTOR_ONE_OBJECTIVE = Object.freeze({
  id: 'mirror-relay',
  name: '镜面中继站',
  code: 'MIRROR RELAY',
  startTime: 20,
  radius: 104,
  requiredHold: 8.5,
  decayRate: 0.34,
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
  startTime: 41,
  duration: 12,
  pickupRadius: 24,
  reward: Object.freeze({
    cores: 1,
    xp: 34,
    heal: 18,
  }),
});
