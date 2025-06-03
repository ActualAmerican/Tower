// js/game.js

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// Disable smoothing for crisp pixels
ctx.imageSmoothingEnabled = false;

// Tile & world dimensions
const MAP_COLS = Math.floor(canvas.width  / TILE_SIZE);
const MAP_ROWS = Math.floor(canvas.height / TILE_SIZE);
const WORLD_W  = MAP_COLS * TILE_SIZE;
const WORLD_H  = MAP_ROWS * TILE_SIZE;

// Simple game state
const game = { lastTime: 0 };

// Camera zoom & position
const camera = {
  zoom: 2,
  x: 0,
  y: 0
};

// Enemies array
const enemies = [];

// Initialize the world & entities
initGame();
requestAnimationFrame(gameLoop);

function initGame() {
  // 1) Build dungeon
  generateDungeon(MAP_COLS, MAP_ROWS);

  // 2) Place player
  const p = getRandomSpawn(false);
  player.x = p.x;
  player.y = p.y;

  // 3) Spawn guards
  enemies.length = 0;
  for (let i = 0; i < 3; i++) {
    const e = getRandomSpawn(true);
    enemies.push(new Enemy(e.x, e.y));
  }
}

// Utility: pick a random spawn tile (avoid walls, optionally shadows/safe)
function getRandomSpawn(avoidSafe) {
  while (true) {
    const col = Math.floor(Math.random() * MAP_COLS);
    const row = Math.floor(Math.random() * MAP_ROWS);
    const cx  = col * TILE_SIZE + TILE_SIZE/2;
    const cy  = row * TILE_SIZE + TILE_SIZE/2;
    const tile = getTile(cx, cy);
    if (tile === 1) continue;            // no walls
    if (avoidSafe && (tile === 2 || tile === 3)) continue;
    return {
      x: col * TILE_SIZE + (TILE_SIZE - player.width)/2,
      y: row * TILE_SIZE + (TILE_SIZE - player.height)/2
    };
  }
}

function gameLoop(timestamp) {
  // Compute delta-time
  const dt = (timestamp - game.lastTime) / 1000;
  game.lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // — Player movement & noise —
  const prevPX = player.x, prevPY = player.y;
  const moved   = updatePlayer(dt);
  const noiseEvent = moved
    ? { x: player.x + player.width/2, y: player.y + player.height/2 }
    : null;

  // — Player vs wall collisions —
  if (
    isWall(player.x, player.y) ||
    isWall(player.x + player.width - 1, player.y) ||
    isWall(player.x, player.y + player.height - 1) ||
    isWall(player.x + player.width - 1, player.y + player.height - 1)
  ) {
    player.x = prevPX;
    player.y = prevPY;
  }

  // — Enemy updates & collision handling —
  enemies.forEach(e => {
    const prevEX = e.x, prevEY = e.y, prevF = e.facingAngle;
    e.update(dt, player, noiseEvent);

    // If guard collides with wall (1) or safe (3), revert & steer
    const corners = [
      { x: e.x,                    y: e.y },
      { x: e.x + e.width - 1,      y: e.y },
      { x: e.x,                    y: e.y + e.height - 1 },
      { x: e.x + e.width - 1,      y: e.y + e.height - 1 }
    ];
    if (corners.some(c => [1,3].includes(getTile(c.x, c.y)))) {
      e.x = prevEX;
      e.y = prevEY;
      if (e.state === "patrol") {
        // gentle re-heading on patrol
        e.facingAngle = prevF + (Math.random()*Math.PI*2/3 - Math.PI/3);
      }
      if (e.state === "search" && e.searchStage === "move") {
        e.searchStage = "spin";
        e.searchTimer = 0;
      }
    }
  });

  // — Update camera to follow player, clamped to world bounds —
  camera.x = player.x + player.width/2 - (canvas.width/(2*camera.zoom));
  camera.y = player.y + player.height/2 - (canvas.height/(2*camera.zoom));
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W - canvas.width/camera.zoom));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - canvas.height/camera.zoom));
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw world at camera zoom/offset
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  renderDungeon(ctx);
  enemies.forEach(e => e.render(ctx));
  renderPlayer(ctx);

  ctx.restore();

  // Draw mini-map overlay
  drawMiniMap();
}

function drawMiniMap() {
  const miniW = 200;
  const miniH = miniW * (MAP_ROWS/MAP_COLS);
  const mX = canvas.width - miniW - 10;
  const mY = 10;

  // Background panel
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(mX, mY, miniW, miniH);

  const cellW = miniW / MAP_COLS;
  const cellH = miniH / MAP_ROWS;

  // Draw walls
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (getTile(c*TILE_SIZE+1, r*TILE_SIZE+1) === 1) {
        ctx.fillStyle = "#444";
        ctx.fillRect(mX + c*cellW, mY + r*cellH, cellW, cellH);
      }
    }
  }

  // Player dot
  const pCol = Math.floor((player.x + player.width/2) / TILE_SIZE);
  const pRow = Math.floor((player.y + player.height/2) / TILE_SIZE);
  ctx.fillStyle = "#0ff";
  ctx.fillRect(mX + pCol*cellW, mY + pRow*cellH, cellW, cellH);

  // Enemy dots
  ctx.fillStyle = "#f33";
  enemies.forEach(e => {
    const eCol = Math.floor((e.x + e.width/2) / TILE_SIZE);
    const eRow = Math.floor((e.y + e.height/2) / TILE_SIZE);
    ctx.fillRect(mX + eCol*cellW, mY + eRow*cellH, cellW, cellH);
  });

  // Border
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(mX, mY, miniW, miniH);
}
