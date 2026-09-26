export const AFFINITIES = Object.freeze({
  solar: { id: 'solar', label: '日耀', code: 'SOLAR' },
  lunar: { id: 'lunar', label: '月相', code: 'LUNAR' },
  void: { id: 'void', label: '虚空', code: 'VOID' },
  aether: { id: 'aether', label: '以太', code: 'AETHER' },
  machine: { id: 'machine', label: '机械', code: 'MACHINE' },
});

const BASE_UPGRADES = Object.freeze([
  {
    id: 'damage',
    icon: 'DMG',
    rarity: 'common',
    affinity: 'solar',
    name: '过载弹头',
    desc: '伤害提高 22%。',
    effects: [{ op: 'mul', stat: 'damage', value: 1.22 }],
  },
  {
    id: 'rate',
    icon: 'RPM',
    rarity: 'common',
    affinity: 'machine',
    name: '超频扳机',
    desc: '射速提高 18%。',
    effects: [{ op: 'mul', stat: 'fireRate', value: 1.18 }],
  },
  {
    id: 'speed',
    icon: 'SPD',
    rarity: 'common',
    affinity: 'aether',
    name: '相位步伐',
    desc: '移动速度提高 12%。',
    effects: [{ op: 'mul', stat: 'speed', value: 1.12 }],
  },
  {
    id: 'hp',
    icon: 'HP',
    rarity: 'common',
    affinity: 'lunar',
    name: '生物装甲',
    desc: '最大生命 +24，并立即回复 24。',
    effects: [
      { op: 'add', stat: 'maxHp', value: 24 },
      { op: 'heal', value: 24 },
    ],
  },
  {
    id: 'bullet',
    icon: 'VEL',
    rarity: 'common',
    affinity: 'solar',
    name: '磁轨加速',
    desc: '弹速提高 20%，伤害再提高 5%。',
    effects: [
      { op: 'mul', stat: 'bulletSpeed', value: 1.20 },
      { op: 'mul', stat: 'damage', value: 1.05 },
    ],
  },
  {
    id: 'multi',
    icon: '+1',
    rarity: 'uncommon',
    affinity: 'machine',
    name: '分裂火控',
    desc: '额外发射 1 枚投射物。',
    effects: [{ op: 'capAdd', stat: 'projectileCount', value: 1, cap: 7 }],
  },
  {
    id: 'pierce',
    icon: 'PEN',
    rarity: 'common',
    affinity: 'void',
    name: '穿甲协议',
    desc: '子弹额外穿透 1 个敌人。',
    effects: [{ op: 'add', stat: 'pierce', value: 1 }],
  },
  {
    id: 'crit',
    icon: 'CRT',
    rarity: 'common',
    affinity: 'solar',
    name: '弱点标记',
    desc: '暴击率 +10%。',
    effects: [{ op: 'capAdd', stat: 'crit', value: 0.10, cap: 0.65 }],
  },
  {
    id: 'magnet',
    icon: 'MAG',
    rarity: 'common',
    affinity: 'aether',
    name: '引力核心',
    desc: '经验吸附范围 +55。',
    effects: [{ op: 'add', stat: 'magnet', value: 55 }],
  },
  {
    id: 'regen',
    icon: 'REC',
    rarity: 'uncommon',
    affinity: 'lunar',
    name: '自修复纳米群',
    desc: '每秒回复 0.8 生命。',
    effects: [{ op: 'add', stat: 'regen', value: 0.8 }],
  },
  {
    id: 'lifesteal',
    icon: 'VMP',
    rarity: 'rare',
    affinity: 'void',
    name: '嗜能回流',
    desc: '击杀时恢复少量生命。',
    effects: [{ op: 'add', stat: 'lifesteal', value: 0.6 }],
  },
]);

const SPECIAL = Object.freeze({
  orbitUnlock: {
    id: 'orbit-unlock',
    icon: 'ORB',
    rarity: 'rare',
    affinity: 'lunar',
    name: '轨道灵刃',
    desc: '获得 2 枚环绕灵刃，持续切割近身目标。',
    effects: [
      { op: 'set', stat: 'orbitCount', value: 2 },
      { op: 'set', stat: 'orbitDamage', value: 22 },
    ],
  },
  orbitBoost: {
    id: 'orbit-boost',
    icon: 'ORB',
    rarity: 'uncommon',
    affinity: 'lunar',
    name: '灵刃共振',
    desc: '增加 1 枚灵刃，并提高灵刃伤害。',
    effects: [
      { op: 'capAdd', stat: 'orbitCount', value: 1, cap: 6 },
      { op: 'mul', stat: 'orbitDamage', value: 1.24 },
      { op: 'add', stat: 'orbitRadius', value: 5 },
    ],
  },
  novaUnlock: {
    id: 'nova-unlock',
    icon: 'NOVA',
    rarity: 'rare',
    affinity: 'solar',
    name: '脉冲新星',
    desc: '周期性释放环形冲击波。',
    effects: [
      { op: 'set', stat: 'novaLevel', value: 1 },
      { op: 'set', stat: 'novaTimer', value: 4 },
    ],
  },
  novaBoost: {
    id: 'nova-boost',
    icon: 'NOVA',
    rarity: 'uncommon',
    affinity: 'solar',
    name: '新星扩幅',
    desc: '脉冲新星伤害和范围提高，并缩短冷却。',
    effects: [
      { op: 'capAdd', stat: 'novaLevel', value: 1, cap: 5 },
      { op: 'floorAdd', stat: 'novaTimer', value: -1.3, floor: 0 },
    ],
  },
  droneUnlock: {
    id: 'drone-unlock',
    icon: 'DRN',
    rarity: 'rare',
    affinity: 'machine',
    name: '拂晓无人机',
    desc: '获得 1 台无人机辅助射击。',
    effects: [{ op: 'set', stat: 'droneLevel', value: 1 }],
  },
  droneBoost: {
    id: 'drone-boost',
    icon: 'DRN',
    rarity: 'uncommon',
    affinity: 'machine',
    name: '无人机列阵',
    desc: '提高无人机数量与火力。',
    effects: [{ op: 'capAdd', stat: 'droneLevel', value: 1, cap: 3 }],
  },
  shield: {
    id: 'shield',
    icon: 'AEG',
    rarity: 'rare',
    affinity: 'lunar',
    name: '虚空护幕',
    desc: '获得 1 层护盾，可抵消一次受击。',
    effects: [{ op: 'capAdd', stat: 'shield', value: 1, cap: 3 }],
  },
});

export function buildUpgradePool(player) {
  const pool = [...BASE_UPGRADES];

  pool.push(player.orbitCount === 0 ? SPECIAL.orbitUnlock : SPECIAL.orbitBoost);
  pool.push(player.novaLevel === 0 ? SPECIAL.novaUnlock : SPECIAL.novaBoost);
  pool.push(player.droneLevel === 0 ? SPECIAL.droneUnlock : SPECIAL.droneBoost);
  if (player.shield < 3) pool.push(SPECIAL.shield);

  return pool;
}
