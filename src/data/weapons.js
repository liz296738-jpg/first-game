export const STARTER_WEAPON_ID = 'astral-needle';

export const WEAPONS = Object.freeze({
  'astral-needle': Object.freeze({
    id: 'astral-needle',
    name: '星针',
    code: 'ASTRAL NEEDLE',
    status: 'playable',
    description: '高速自动锁敌的精密星辉投射器，擅长暴击、穿透、分裂与复写。',
    affinityHints: ['solar', 'machine', 'void'],
    base: Object.freeze({
      damage: 24,
      fireRate: 2.7,
      bulletSpeed: 700,
      projectileCount: 1,
      spread: 0.16,
      pierce: 0,
      crit: 0.08,
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
    status: 'design',
    description: '以环绕构件和周期脉冲塑造近身安全区；等待独立原型验证。',
    affinityHints: ['lunar', 'aether'],
  }),

  'singularity-seed': Object.freeze({
    id: 'singularity-seed',
    name: '奇点种子',
    code: 'SINGULARITY SEED',
    status: 'design',
    description: '缓慢投射引力核心，强调牵引、坍缩与区域控制；等待独立原型验证。',
    affinityHints: ['void', 'lunar'],
  }),
});

export function getWeapon(weaponId = STARTER_WEAPON_ID) {
  return WEAPONS[weaponId] || WEAPONS[STARTER_WEAPON_ID];
}
