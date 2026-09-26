export const RESONANCES = Object.freeze([
  {
    id: 'corona-repeater',
    name: '日冕复写',
    code: 'CORONA REPEATER',
    requirements: { solar: 3, machine: 2 },
    weaponTags: ['projectile'],
    description: '每第 5 次主武器齐射触发一次日冕复写，追加一组偏转弹幕。',
  },
  {
    id: 'moonstep-mantle',
    name: '月步护幕',
    code: 'MOONSTEP MANTLE',
    requirements: { lunar: 3, aether: 2 },
    description: '相位冲刺可周期性生成短暂的一次性相位护幕。',
  },
  {
    id: 'event-horizon-choir',
    name: '视界合唱',
    code: 'EVENT HORIZON CHOIR',
    requirements: { void: 3, lunar: 2 },
    weaponTags: ['orbit'],
    description: '环冕周期性坍缩局部空间，牵引附近敌人并造成一次同步切割。',
  },
  {
    id: 'blackstar-rupture',
    name: '黑星破裂',
    code: 'BLACKSTAR RUPTURE',
    requirements: { void: 3, solar: 2 },
    weaponTags: ['projectile'],
    description: '暴击完成击杀时引爆目标，将部分主武器伤害扩散到附近敌人。',
  },
]);
