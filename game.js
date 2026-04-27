const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const keys = new Set();

const state = {
  player: null,
  bullets: [],
  enemies: [],
  stars: [],
  score: 0,
  lives: 5,
  gameOver: false,
  spawnTimer: 0,
  spawnEvery: 900,
  lastTick: performance.now(),
  shotCooldown: 0,
};

function reset() {
  state.player = {
    x: canvas.width / 2,
    y: canvas.height - 40,
    w: 46,
    h: 22,
    speed: 0.38,
  };
  state.bullets = [];
  state.enemies = [];
  state.score = 0;
  state.lives = 5;
  state.gameOver = false;
  state.spawnTimer = 0;
  state.spawnEvery = 900;
  state.shotCooldown = 0;
  state.lastTick = performance.now();
  state.stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.2,
    v: Math.random() * 0.06 + 0.03,
  }));
  paintHUD();
}

function paintHUD() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
}

function spawnEnemy() {
  const speedScale = 1 + Math.min(0.9, state.score / 300);
  state.enemies.push({
    x: Math.random() * (canvas.width - 44) + 22,
    y: -30,
    r: Math.random() * 14 + 14,
    vy: (Math.random() * 0.06 + 0.08) * speedScale,
    vx: (Math.random() - 0.5) * 0.03,
    hp: Math.random() < 0.12 ? 2 : 1,
  });
}

function fire() {
  if (state.shotCooldown > 0 || state.gameOver) return;
  state.bullets.push({
    x: state.player.x,
    y: state.player.y - 12,
    vy: -0.58,
    r: 4,
  });
  state.shotCooldown = 170;
}

function update(dt) {
  const player = state.player;

  if (keys.has('ArrowLeft') || keys.has('a')) {
    player.x -= player.speed * dt;
  }
  if (keys.has('ArrowRight') || keys.has('d')) {
    player.x += player.speed * dt;
  }
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));

  if (keys.has(' ') || keys.has('Space')) {
    fire();
  }

  state.shotCooldown = Math.max(0, state.shotCooldown - dt);
  state.spawnTimer += dt;
  if (state.spawnTimer >= state.spawnEvery) {
    state.spawnTimer = 0;
    spawnEnemy();
    state.spawnEvery = Math.max(340, state.spawnEvery - 5);
  }

  for (const star of state.stars) {
    star.y += star.v * dt;
    if (star.y > canvas.height) {
      star.y = -2;
      star.x = Math.random() * canvas.width;
    }
  }

  for (const bullet of state.bullets) {
    bullet.y += bullet.vy * dt;
  }
  state.bullets = state.bullets.filter((b) => b.y > -10);

  for (const enemy of state.enemies) {
    enemy.y += enemy.vy * dt;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.r || enemy.x > canvas.width - enemy.r) enemy.vx *= -1;
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];

    for (let j = state.bullets.length - 1; j >= 0; j -= 1) {
      const b = state.bullets[j];
      const dx = enemy.x - b.x;
      const dy = enemy.y - b.y;
      if (Math.hypot(dx, dy) < enemy.r + b.r) {
        state.bullets.splice(j, 1);
        enemy.hp -= 1;
        if (enemy.hp <= 0) {
          state.enemies.splice(i, 1);
          state.score += 10;
          paintHUD();
        }
        break;
      }
    }
  }

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    if (enemy.y - enemy.r > canvas.height - 30) {
      state.enemies.splice(i, 1);
      state.lives -= 1;
      paintHUD();
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    }
  }
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#76a6ff';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(16, 10);
  ctx.lineTo(-16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d5e5ff';
  ctx.fillRect(-4, -20, 8, 10);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const star of state.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#1e3b70';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);

  drawPlayer();

  for (const bullet of state.bullets) {
    ctx.fillStyle = '#ffd35f';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of state.enemies) {
    ctx.fillStyle = enemy.hp === 2 ? '#ff7e69' : '#f55353';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(enemy.x - enemy.r * 0.4, enemy.y - 2, enemy.r * 0.8, 4);
  }

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(5, 6, 14, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px system-ui';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '24px system-ui';
    ctx.fillText(`Final score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 34);
  }
}

function loop(now) {
  const dt = Math.min(34, now - state.lastTick);
  state.lastTick = now;

  if (!state.gameOver) {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
  if (event.key === ' ') event.preventDefault();
});

document.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

restartBtn.addEventListener('click', reset);

reset();
requestAnimationFrame(loop);
