function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function requireContext(
  value: CanvasRenderingContext2D | null
): CanvasRenderingContext2D {
  if (value === null) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  return value;
}

const canvas = requireElement<HTMLCanvasElement>("#game");
const scoreEl = requireElement<HTMLElement>("#score");
const timeEl = requireElement<HTMLElement>("#time");
const bestEl = requireElement<HTMLElement>("#best");
const restartButton = requireElement<HTMLButtonElement>("#restart");
const messageEl = requireElement<HTMLElement>("#message");
const ctx = requireContext(canvas.getContext("2d"));

type Vec = {
  x: number;
  y: number;
};

type Orb = Vec & {
  radius: number;
  color: string;
  value: number;
  bonusTime: number;
};

const width = canvas.width;
const height = canvas.height;
const player = {
  x: width / 2,
  y: height / 2,
  size: 18,
  speed: 260
};

const keys = new Set<string>();
const pickupRadius = 14;
const gameLength = 30;
const bestScoreKey = "square-dash-best";

let score = 0;
let timeLeft = gameLength;
let running = false;
let gameOver = false;
let lastTime = 0;
let orbTimer = 0;
let bestScore = Number(localStorage.getItem(bestScoreKey) ?? 0);

const goodOrb: Orb = {
  x: 120,
  y: 120,
  radius: 10,
  color: "#f4d35e",
  value: 10,
  bonusTime: 1.5
};

const badOrb: Orb = {
  x: 600,
  y: 320,
  radius: 12,
  color: "#ee6352",
  value: -8,
  bonusTime: -2
};

bestEl.textContent = String(bestScore);

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function placeOrb(orb: Orb): void {
  orb.x = randomBetween(orb.radius + 20, width - orb.radius - 20);
  orb.y = randomBetween(orb.radius + 20, height - orb.radius - 20);
}

function resetGame(): void {
  player.x = width / 2;
  player.y = height / 2;
  score = 0;
  timeLeft = gameLength;
  running = false;
  gameOver = false;
  lastTime = 0;
  orbTimer = 0;
  placeOrb(goodOrb);
  placeOrb(badOrb);
  scoreEl.textContent = "0";
  timeEl.textContent = String(gameLength);
  messageEl.textContent = "Press any movement key to begin";
  messageEl.classList.remove("hidden");
}

function beginGame(): void {
  if (gameOver) {
    resetGame();
  }

  if (!running) {
    running = true;
    messageEl.classList.add("hidden");
  }
}

function clampPlayer(): void {
  player.x = Math.max(player.size, Math.min(width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(height - player.size, player.y));
}

function movePlayer(delta: number): void {
  let dx = 0;
  let dy = 0;

  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;

  if (dx === 0 && dy === 0) return;

  beginGame();

  const length = Math.hypot(dx, dy) || 1;
  player.x += (dx / length) * player.speed * delta;
  player.y += (dy / length) * player.speed * delta;
  clampPlayer();
}

function collides(orb: Orb): boolean {
  const distance = Math.hypot(player.x - orb.x, player.y - orb.y);
  return distance < player.size + orb.radius + pickupRadius * 0.25;
}

function applyOrb(orb: Orb): void {
  score = Math.max(0, score + orb.value);
  timeLeft = Math.max(0, timeLeft + orb.bonusTime);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(bestScoreKey, String(bestScore));
    bestEl.textContent = String(bestScore);
  }

  scoreEl.textContent = String(score);
  timeEl.textContent = timeLeft.toFixed(1);
  placeOrb(orb);
}

function drawBackground(): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#112a46");
  gradient.addColorStop(1, "#04121f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawOrb(orb: Orb): void {
  ctx.beginPath();
  ctx.fillStyle = orb.color;
  ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(): void {
  ctx.fillStyle = "#6fffe9";
  ctx.fillRect(
    player.x - player.size,
    player.y - player.size,
    player.size * 2,
    player.size * 2
  );
}

function endGame(): void {
  running = false;
  gameOver = true;
  messageEl.textContent = `Time's up! Final score: ${score}. Press restart or move to play again.`;
  messageEl.classList.remove("hidden");
}

function update(delta: number): void {
  movePlayer(delta);

  if (!running) return;

  timeLeft -= delta;
  orbTimer += delta;

  if (orbTimer > 4) {
    placeOrb(goodOrb);
    placeOrb(badOrb);
    orbTimer = 0;
  }

  if (collides(goodOrb)) applyOrb(goodOrb);
  if (collides(badOrb)) applyOrb(badOrb);

  if (timeLeft <= 0) {
    timeLeft = 0;
    timeEl.textContent = "0.0";
    endGame();
    return;
  }

  timeEl.textContent = timeLeft.toFixed(1);
}

function draw(): void {
  drawBackground();
  drawOrb(goodOrb);
  drawOrb(badOrb);
  drawPlayer();
}

function loop(timestamp: number): void {
  const delta = lastTime === 0 ? 0 : (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(delta);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartButton.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
