export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function getDistance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}
