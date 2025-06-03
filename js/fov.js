/**
 * Raycast to check LOS: sample along the line in TILE_SIZE/2 increments.
 */
function hasLineOfSight(enemy, tx, ty) {
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  const step = window.TILE_SIZE / 2;
  const steps = Math.ceil(dist / step);

  for (let i = 1; i <= steps; i++) {
    const px = cx + (dx * i) / steps;
    const py = cy + (dy * i) / steps;
    if (getTile(px, py) === 1) return false;
  }
  return true;
}

/**
 * Checks FOV + LOS + tile type:
 * - Safe zone (3): never detected
 * - Shadow    (2): blocks fresh detection but not ongoing chase
 */
function isInFOV(enemy, tx, ty) {
  const tile = getTile(tx, ty);
  if (tile === 3) return false;        // safe zone
  if (tile === 2) return false;        // shadow blocks fresh detection

  // cone check
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > enemy.fovLength) return false;

  const angleTo = Math.atan2(dy, dx);
  let delta = angleTo - enemy.facingAngle;
  delta = ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (Math.abs(delta) > enemy.fovAngle / 2) return false;

  // wall occlusion
  return hasLineOfSight(enemy, tx, ty);
}

window.isInFOV = isInFOV;
window.hasLineOfSight = hasLineOfSight;
