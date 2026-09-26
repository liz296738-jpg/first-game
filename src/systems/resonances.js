import { RESONANCES } from '../data/resonances.js';

export function hasResonance(player, resonanceId) {
  return Boolean(player.resonances?.[resonanceId]);
}

export function syncResonances(player) {
  const unlocked = [];

  for (const resonance of RESONANCES) {
    if (hasResonance(player, resonance.id)) continue;

    const affinityReady = Object.entries(resonance.requirements).every(
      ([affinity, count]) => (player.affinities?.[affinity] || 0) >= count,
    );
    const weaponReady = (resonance.weaponTags || []).every(
      tag => player.weaponTags?.includes(tag),
    );

    if (affinityReady && weaponReady) {
      player.resonances[resonance.id] = true;
      unlocked.push(resonance);
    }
  }

  return unlocked;
}

export function getActiveResonances(player) {
  return RESONANCES.filter(resonance => hasResonance(player, resonance.id));
}
