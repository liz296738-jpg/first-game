export function equipWeapon(player, weapon) {
  if (!weapon?.base) throw new Error('Cannot equip a weapon without playable base stats.');

  player.weaponId = weapon.id;
  player.weaponName = weapon.name;
  player.weaponBehavior = weapon.behavior;
  player.weaponTags = [...(weapon.tags || [])];

  for (const [stat, value] of Object.entries(weapon.base)) {
    player[stat] = value;
  }
}

export function weaponHasTag(player, tag) {
  return player.weaponTags?.includes(tag) ?? false;
}
