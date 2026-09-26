export const ENEMY_CONFIGS = Object.freeze({
  drone: { r: 14, hp: 42, speed: 76, damage: 11, color: '#ff6f91', xp: 7 },
  swift: { r: 10, hp: 27, speed: 132, damage: 9, color: '#ffb45f', xp: 8 },
  brute: { r: 22, hp: 118, speed: 54, damage: 20, color: '#d45fff', xp: 16 },
  caster: { r: 13, hp: 58, speed: 68, damage: 12, color: '#7de2ff', xp: 12 },
  moth: { r: 12, hp: 48, speed: 92, damage: 14, color: '#f3b6ff', xp: 11 },
  seeder: { r: 16, hp: 74, speed: 61, damage: 13, color: '#9f8cff', xp: 14 },
  boss: { r: 34, hp: 660, speed: 50, damage: 24, color: '#f6f8ff', xp: 60 },
  observatory: { r: 46, hp: 1280, speed: 42, damage: 27, color: '#f5e7ff', xp: 110 },
});

export const ENEMY_THREAT = Object.freeze({
  drone: 1,
  swift: 1.35,
  caster: 2.4,
  moth: 1.9,
  seeder: 2.8,
  brute: 3.2,
  boss: 12,
  observatory: 18,
});
