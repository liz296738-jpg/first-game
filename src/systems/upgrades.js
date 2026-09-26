import { UPGRADE_DEFINITIONS } from '../data/upgrades.js';

function requirementValue(player, requirement) {
  if (requirement.source === 'affinity') {
    return player.affinities?.[requirement.key] || 0;
  }
  if (requirement.source === 'weaponTag') {
    return player.weaponTags?.includes(requirement.key) ?? false;
  }

  return player[requirement.key];
}

export function meetsUpgradeRequirements(player, upgrade) {
  return (upgrade.requirements || []).every(requirement => {
    const value = requirementValue(player, requirement);

    if (requirement.min !== undefined && value < requirement.min) return false;
    if (requirement.max !== undefined && value > requirement.max) return false;
    if (requirement.equals !== undefined && value !== requirement.equals) return false;
    if (requirement.truthy === true && !value) return false;
    if (requirement.truthy === false && value) return false;

    return true;
  });
}

export function buildUpgradePool(player) {
  return UPGRADE_DEFINITIONS.filter(upgrade => meetsUpgradeRequirements(player, upgrade));
}

export function applyUpgradeEffects(player, upgrade) {
  for (const effect of upgrade.effects || []) {
    if (effect.op === 'mul') {
      player[effect.stat] *= effect.value;
    } else if (effect.op === 'add') {
      player[effect.stat] += effect.value;
    } else if (effect.op === 'set') {
      player[effect.stat] = effect.value;
    } else if (effect.op === 'capAdd') {
      player[effect.stat] = Math.min(effect.cap, player[effect.stat] + effect.value);
    } else if (effect.op === 'floorAdd') {
      player[effect.stat] = Math.max(effect.floor, player[effect.stat] + effect.value);
    } else if (effect.op === 'heal') {
      player.hp = Math.min(player.maxHp, player.hp + effect.value);
    } else if (effect.op === 'clampHp') {
      player.hp = Math.min(player.hp, player.maxHp);
    } else {
      throw new Error(`Unknown upgrade effect operation: ${effect.op}`);
    }
  }

  if (upgrade.affinity) {
    player.affinities[upgrade.affinity] = (player.affinities[upgrade.affinity] || 0) + 1;
  }

  if (upgrade.kind === 'anomaly' && !player.anomalies.includes(upgrade.id)) {
    player.anomalies.push(upgrade.id);
  }
}
