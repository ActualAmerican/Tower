// js/player.js

// Load your 40×40 sprite
var playerSprite = new Image();
playerSprite.src = "assets/sprites/player.png";
playerSprite.onerror = function() {
  console.warn("⚠️ Failed to load player sprite; using fallback rectangle.");
};

// Player state – width/height fixed at 40 so spawn & collision line up
var player = {
  x: 0,
  y: 0,
  width: 40,
  height: 40,
  baseSpeed: 100,    // px per second
  isCrouching: false,
  isSprinting: false,
  noiseLevel: 0      // updated each frame
};

// Input tracking
var keys = {};
window.addEventListener("keydown", function(e) {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", function(e) {
  keys[e.key.toLowerCase()] = false;
});

/**
 * Moves the player and sets noiseLevel.
 * @param {number} dt  seconds elapsed
 * @returns {boolean}  whether to emit a noise event
 */
function updatePlayer(dt) {
  player.isCrouching = !!keys["control"];
  player.isSprinting = !!keys["shift"];

  var dx = 0, dy = 0;
  if (keys["w"] || keys["arrowup"])    dy = -1;
  if (keys["s"] || keys["arrowdown"])  dy =  1;
  if (keys["a"] || keys["arrowleft"])  dx = -1;
  if (keys["d"] || keys["arrowright"]) dx =  1;

  var moved = false;
  if (dx !== 0 || dy !== 0) {
    // normalize direction
    var len = Math.hypot(dx, dy);
    dx /= len; dy /= len;

    // apply speed mods
    var speed = player.baseSpeed;
    if (player.isCrouching) speed *= 0.5;
    if (player.isSprinting) speed *= 1.5;

    // move
    player.x += dx * speed * dt;
    player.y += dy * speed * dt;
    moved = true;

    // noise levels
    player.noiseLevel = player.isCrouching ? 0 : (player.isSprinting ? 3 : 1);
  } else {
    player.noiseLevel = 0;
  }

  return moved && player.noiseLevel > 0;
}

/**
 * Draws the player: sprite if ready, else a cyan fallback.
 * @param {CanvasRenderingContext2D} ctx
 */
function renderPlayer(ctx) {
  if (playerSprite.complete && playerSprite.naturalWidth > 0) {
    ctx.drawImage(
      playerSprite,
      player.x, player.y,
      player.width, player.height
    );
  } else {
    ctx.fillStyle = "#0ff";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
}

// Expose to game.js
window.player        = player;
window.updatePlayer = updatePlayer;
window.renderPlayer = renderPlayer;
