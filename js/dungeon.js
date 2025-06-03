// Size of each tile in pixels
const TILE_SIZE = 32;

// Tile type constants
// 0 = floor (lit), 1 = wall, 2 = shadow, 3 = safe zone
let dungeonMap = [];

/**
 * Generates a dungeon:
 * - Border walls
 * - 10% interior walls
 * - 5% safe zones (completely safe)
 * - 10% shadows (block vision)
 * - Rest = lit floor
 */
function generateDungeon(cols, rows) {
  dungeonMap = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        row.push(1);
      } else {
        const r = Math.random();
        if (r < 0.10) row.push(1);
        else if (r < 0.15) row.push(3);
        else if (r < 0.25) row.push(2);
        else row.push(0);
      }
    }
    dungeonMap.push(row);
  }
}

/**
 * Returns the tile type at the given pixel coords.
 */
function getTile(px, py) {
  const col = Math.floor(px / TILE_SIZE);
  const row = Math.floor(py / TILE_SIZE);
  if (
    row < 0 ||
    row >= dungeonMap.length ||
    col < 0 ||
    col >= dungeonMap[0].length
  ) {
    return 1;
  }
  return dungeonMap[row][col];
}

/**
 * Walls = tile 1.
 */
function isWall(px, py) {
  return getTile(px, py) === 1;
}

/**
 * Draw the dungeon:
 * Walls = #444
 * Floor = #222
 * Shadows = #111
 * Safe zones = #093
 */
function renderDungeon(ctx) {
  for (let y = 0; y < dungeonMap.length; y++) {
    for (let x = 0; x < dungeonMap[0].length; x++) {
      switch (dungeonMap[y][x]) {
        case 1: ctx.fillStyle = "#444"; break;
        case 2: ctx.fillStyle = "#111"; break;
        case 3: ctx.fillStyle = "#093"; break;
        default: ctx.fillStyle = "#222";
      }
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

window.TILE_SIZE = TILE_SIZE;
window.generateDungeon = generateDungeon;
window.getTile         = getTile;
window.isWall          = isWall;
window.renderDungeon   = renderDungeon;

// Generate initial map
generateDungeon(800 / TILE_SIZE, 600 / TILE_SIZE);
