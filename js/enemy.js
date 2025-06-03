// js/enemy.js

/**
 * Simple grid-based pathfinder (BFS) over lit floor tiles (type 0).
 * Returns an array of {r,c} from start to end (inclusive), or [] if no path.
 */
function findPath(sR, sC, eR, eC) {
  const cols = Math.floor(canvas.width  / TILE_SIZE);
  const rows = Math.floor(canvas.height / TILE_SIZE);

  // Visited map & parent links
  const visited = Array(rows).fill(0).map(() => Array(cols).fill(false));
  const parent  = {};

  const queue = [{ r: sR, c: sC }];
  visited[sR][sC] = true;
  parent[sR + "," + sC] = null;

  let found = false;
  while (queue.length) {
    const node = queue.shift();
    if (node.r === eR && node.c === eC) { found = true; break; }
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => {
      const nr = node.r + dr, nc = node.c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        const tx = nc * TILE_SIZE + TILE_SIZE/2;
        const ty = nr * TILE_SIZE + TILE_SIZE/2;
        if (getTile(tx, ty) === 0) {
          visited[nr][nc] = true;
          parent[nr + "," + nc] = node.r + "," + node.c;
          queue.push({ r: nr, c: nc });
        }
      }
    });
  }

  if (!found) return [];
  // Reconstruct path
  const path = [];
  let cur = eR + "," + eC;
  while (cur) {
    const [rr, cc] = cur.split(",").map(Number);
    path.unshift({ r: rr, c: cc });
    cur = parent[cur];
  }
  return path;
}

function Enemy(x, y) {
  this.x = x;
  this.y = y;
  this.width  = 16;
  this.height = 16;

  // Speeds (px/s)
  this.speedPatrol      = 40;
  this.speedInvestigate = 25;
  this.speedChase       = 75;

  // Turn rates (rad/s)
  this.turnPatrol      = Math.PI / 8;
  this.turnInvestigate = Math.PI / 6;
  this.turnChase       = Math.PI / 3;
  this.turnSearch      = Math.PI / 2;

  // Vision
  this.fovAngle    = Math.PI / 3;
  this.fovLength   = 120;
  this.facingAngle = Math.random() * 2 * Math.PI;

  // FSM & timers
  this.state             = "patrol";       // patrol, investigate, chase, search
  this.hearRadius        = 80;
  this.detectionTimer    = 0;
  this.detectionThreshold = 0.3;

  this.searchStage      = null;            // "move" or "spin"
  this.searchTimer      = 0;
  this.searchSpinTime   = 1.0;

  // Patrol path state
  this.patrolPath  = [];
  this.patrolIndex = 0;
}

Enemy.prototype.update = function(dt, player, noiseEvent) {
  const cx = this.x + this.width/2;
  const cy = this.y + this.height/2;
  const px = player.x + player.width/2;
  const py = player.y + player.height/2;

  // 1) Detection (sample center + corners)
  const samples = [
    { x: px,                                 y: py },
    { x: player.x,                           y: player.y },
    { x: player.x + player.width - 1,        y: player.y },
    { x: player.x,                           y: player.y + player.height - 1 },
    { x: player.x + player.width - 1,        y: player.y + player.height - 1 }
  ];
  let inSight = false;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const tile = getTile(s.x, s.y);
    if (tile === 3) { inSight = false; break; }
    if (this.state === "chase") {
      if (hasLineOfSight(this, s.x, s.y)) { inSight = true; break; }
    } else {
      if (isInFOV(this, s.x, s.y))      { inSight = true; break; }
    }
  }
  // Smooth ramp
  this.detectionTimer += inSight ? dt : -dt;
  if (this.detectionTimer < 0) this.detectionTimer = 0;
  if (this.detectionTimer > this.detectionThreshold)
    this.detectionTimer = this.detectionThreshold;

  // Transition to chase
  if (this.detectionTimer >= this.detectionThreshold) {
    if (this.state !== "chase") {
      this.state        = "chase";
      this.searchStage  = null;
      this.patrolPath   = [];
    }
    this.targetX = px;
    this.targetY = py;
  }

  // 2) Noise → investigate
  if (this.state === "patrol" && noiseEvent) {
    const dx = noiseEvent.x - cx, dy = noiseEvent.y - cy;
    if (Math.hypot(dx, dy) < this.hearRadius) {
      this.state       = "investigate";
      this.targetX     = noiseEvent.x;
      this.targetY     = noiseEvent.y;
      this.detectionTimer = 0;
      this.patrolPath  = [];
    }
  }

  // 3) Lost sight → search
  if (this.state === "chase" && this.detectionTimer === 0) {
    this.state        = "search";
    this.searchStage  = "move";
    this.searchTimer  = 0;
    this.patrolPath   = [];
  }

  // 4) Done investigating → search spin
  if (this.state === "investigate") {
    const dx = this.targetX - cx, dy = this.targetY - cy;
    if (Math.hypot(dx, dy) < 4) {
      this.state       = "search";
      this.searchStage = "spin";
      this.searchTimer = 0;
    }
  }

  // 5) Behavior & movement
  let moveX = 0, moveY = 0;

  switch (this.state) {
    case "patrol":
      // If no path, pick a random lit-floor dest and pathfind
      if (this.patrolPath.length === 0) {
        const cols = Math.floor(canvas.width  / TILE_SIZE);
        const rows = Math.floor(canvas.height / TILE_SIZE);
        const startR = Math.floor(this.y / TILE_SIZE);
        const startC = Math.floor(this.x / TILE_SIZE);

        let destR, destC, tile;
        do {
          destR = Math.floor(Math.random() * rows);
          destC = Math.floor(Math.random() * cols);
          const tx = destC * TILE_SIZE + TILE_SIZE/2;
          const ty = destR * TILE_SIZE + TILE_SIZE/2;
          tile = getTile(tx, ty);
        } while (tile !== 0);

        this.patrolPath  = findPath(startR, startC, destR, destC);
        this.patrolIndex = 0;
      }
      // Follow path if available
      if (this.patrolIndex < this.patrolPath.length) {
        const node = this.patrolPath[this.patrolIndex];
        const targetX = node.c * TILE_SIZE + (TILE_SIZE - this.width)/2;
        const targetY = node.r * TILE_SIZE + (TILE_SIZE - this.height)/2;
        rotateTowards(this, targetX + this.width/2, targetY + this.height/2, this.turnPatrol, dt);
        const angleTo = Math.atan2((targetY + this.height/2) - cy, (targetX + this.width/2) - cx);
        if (angleDiff(this.facingAngle, angleTo) < 0.2) {
          const dist = Math.hypot((targetX + this.width/2) - cx, (targetY + this.height/2) - cy);
          const step = Math.min(dist, this.speedPatrol * dt);
          moveX = Math.cos(this.facingAngle) * step;
          moveY = Math.sin(this.facingAngle) * step;
          if (dist < 2) this.patrolIndex++;
        }
      }
      break;

    case "investigate":
      rotateTowards(this, this.targetX, this.targetY, this.turnInvestigate, dt);
      doMovement(this, cx, cy, this.speedInvestigate, dt);
      break;

    case "chase":
      rotateTowards(this, this.targetX, this.targetY, this.turnChase, dt);
      doMovement(this, cx, cy, this.speedChase, dt);
      break;

    case "search":
      if (this.searchStage === "move") {
        rotateTowards(this, this.targetX, this.targetY, this.turnChase, dt);
        doMovement(this, cx, cy, this.speedChase, dt);
        if (Math.hypot(this.targetX - cx, this.targetY - cy) < 4) {
          this.searchStage = "spin";
          this.searchTimer = 0;
        }
      } else {
        this.searchTimer += dt;
        rotateInPlace(this, this.turnSearch, dt);
        if (this.searchTimer >= this.searchSpinTime) {
          this.state           = "patrol";
          this.detectionTimer  = 0;
          this.patrolPath      = [];
        }
      }
      break;
  }

  this.x += moveX;
  this.y += moveY;
};

// Helper: move if roughly facing
function doMovement(self, cx, cy, speed, dt) {
  const angleTo = Math.atan2(self.targetY - cy, self.targetX - cx);
  if (angleDiff(self.facingAngle, angleTo) < 0.3) {
    self.x += Math.cos(self.facingAngle) * speed * dt;
    self.y += Math.sin(self.facingAngle) * speed * dt;
  }
}

function rotateTowards(self, tx, ty, rate, dt) {
  const cx = self.x + self.width/2;
  const cy = self.y + self.height/2;
  const desired = Math.atan2(ty - cy, tx - cx);
  let delta = ((desired - self.facingAngle + Math.PI) % (2*Math.PI)) - Math.PI;
  const maxRot = rate * dt;
  if (Math.abs(delta) < maxRot) self.facingAngle = desired;
  else self.facingAngle += Math.sign(delta) * maxRot;
}

function rotateInPlace(self, rate, dt) {
  self.facingAngle = (self.facingAngle + rate * dt) % (2 * Math.PI);
}

function angleDiff(a, b) {
  let d = ((b - a + Math.PI) % (2*Math.PI)) - Math.PI;
  return Math.abs(d);
}

Enemy.prototype.render = function(ctx) {
  // Body
  ctx.fillStyle = "#f33";
  ctx.fillRect(this.x, this.y, this.width, this.height);
  // Vision cone
  const cx2 = this.x + this.width/2;
  const cy2 = this.y + this.height/2;
  ctx.fillStyle = "rgba(255,0,0,0.2)";
  ctx.beginPath();
  ctx.moveTo(cx2, cy2);
  ctx.arc(
    cx2, cy2,
    this.fovLength,
    this.facingAngle - this.fovAngle/2,
    this.facingAngle + this.fovAngle/2
  );
  ctx.closePath();
  ctx.fill();
};

// Expose globally
window.Enemy = Enemy;
