export const STARTER_WEAPON_ID = 'astral-needle';

export const WEAPONS = Object.freeze({
  'astral-needle': Object.freeze({
    id: 'astral-needle',
    name: '星针',
    code: 'ASTRAL NEEDLE',
    status: 'playable',
    behavior: 'projectile-auto',
    tags: ['projectile', 'precision', 'ranged'],
    description: '高速自动锁敌的精密星辉投射器。节奏直接，擅长暴击、穿透、分裂与复写。',
    affinityHints: ['solar', 'machine', 'void'],
    base: Object.freeze({
      damage: 24,
      fireRate: 2.7,
      bulletSpeed: 700,
      projectileCount: 1,
      spread: 0.16,
      pierce: 0,
      crit: 0.08,
      orbitCount: 0,
      orbitDamage: 18,
      orbitRadius: 54,
      orbitSpeed: 2.4,
    }),
    projectile: Object.freeze({
      color: '#c7f8ff',
      size: 4,
      lifetime: 1.8,
    }),
  }),

  'halo-array': Object.freeze({
    id: 'halo-array',
    name: '环冕阵列',
    code: 'HALO ARRAY',
    status: 'playable',
    behavior: 'orbit-primary',
    tags: ['orbit', 'melee', 'control'],
    description: '三枚月辉构件围绕机体持续切割。没有常规主射击，必须主动穿过敌群与危险边缘。',
    affinityHints: ['lunar', 'aether', 'void'],
    base: Object.freeze({
      damage: 21,
      fireRate: 1,
      bulletSpeed: 620,
      projectileCount: 1,
      spread: 0.16,
      pierce: 0,
      crit: 0.04,
      orbitCount: 3,
      orbitDamage: 25,
      orbitRadius: 66,
      orbitSpeed: 2.65,
    }),
    orbit: Object.freeze({
      bladeSize: 11,
      hitRate: 7.2,
    }),
  }),

  'singularity-seed': Object.freeze({
    id: 'singularity-seed',
    name: '奇点种子',
    code: 'SINGULARITY SEED',
    status: 'design',
    behavior: 'singularity-seed',
    tags: ['projectile', 'control', 'zone'],
    description: '缓慢投射引力核心，强调牵引、坍缩与区域控制；等待独立原型验证。',
    affinityHints: ['void', 'lunar'],
  }),
});

export function getWeapon(weaponId = STARTER_WEAPON_ID) {
  return WEAPONS[weaponId] || WEAPONS[STARTER_WEAPON_ID];
}

export function getPlayableWeapons() {
  return Object.values(WEAPONS).filter(weapon => weapon.status === 'playable');
}
