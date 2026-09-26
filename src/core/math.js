export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function distSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function chance(v) {
  return Math.random() < v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function alphaColor(color, alpha) {
  return color.replace(
    /rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,
    (_, r, g, b) => `rgba(${r.trim()}, ${g.trim()}, ${b.trim()}, ${alpha})`,
  );
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
