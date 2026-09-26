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
    } else {
      throw new Error(`Unknown upgrade effect operation: ${effect.op}`);
    }
  }

  if (upgrade.affinity) {
    player.affinities[upgrade.affinity] = (player.affinities[upgrade.affinity] || 0) + 1;
  }
}
