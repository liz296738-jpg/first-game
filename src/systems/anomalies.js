import { meetsUpgradeRequirements } from './upgrades.js';
import { availableAnomalies } from '../data/anomalies.js';

export function shouldOfferAnomaly(player) {
  return player.level >= 4 && player.level % 4 === 0;
}

export function injectAnomalyOffer(player, choices) {
  if (!shouldOfferAnomaly(player)) return choices;

  const available = availableAnomalies(player).filter(anomaly => meetsUpgradeRequirements(player, anomaly));
  if (!available.length) return choices;

  const anomaly = available[Math.floor(Math.random() * available.length)];
  const next = choices.slice(0, 3);
  if (next.length < 3) next.push(anomaly);
  else next[2] = anomaly;
  return next;
}
