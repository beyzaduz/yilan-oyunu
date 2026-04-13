const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const gameOverMessage = document.getElementById("gameOverMessage");
const restartButton = document.getElementById("restartButton");
const controlButtons = document.querySelectorAll(".control-button");
const eatSound = new Audio("eat.mp3");
const gameOverSound = new Audio("gameover.mp3");
const bgMusic = new Audio("bg-music.mp3");

const tileSize = 20;
const gridSize = canvas.width / tileSize;
const initialSpeed = 120;
const speedStep = 8;
const minimumSpeed = 55;
const foodsPerLevel = 5;
const highScoreKey = "snakeHighScore";
const initialSnake = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
];
const snake = [...initialSnake];

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let score = 0;
let highScore = Number(localStorage.getItem(highScoreKey)) || 0;
let foodsEaten = 0;
let currentSpeed = initialSpeed;
let isGameOver = false;
let gameInterval = null;
let isAudioUnlocked = false;

eatSound.volume = 0.45;
gameOverSound.volume = 0.55;
bgMusic.volume = 0.18;
bgMusic.loop = true;

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function startBackgroundMusic() {
  bgMusic.play().catch(() => {});
}

function unlockAudio() {
  if (isAudioUnlocked) {
    return;
  }
  isAudioUnlocked = true;
  startBackgroundMusic();
}

function drawBoard() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;
    const size = tileSize - 1;

    if (index === 0) {
      ctx.fillStyle = "#0a8f3f";
    } else {
      ctx.fillStyle = "#00ff66";
    }
    ctx.fillRect(x, y, size, size);
  });

  drawSnakeEyes();
}

function drawSnakeEyes() {
  const head = snake[0];
  const headX = head.x * tileSize;
  const headY = head.y * tileSize;

  ctx.fillStyle = "#f5f5f5";

  if (direction.x === 1) {
    ctx.fillRect(headX + 12, headY + 5, 3, 3);
    ctx.fillRect(headX + 12, headY + 12, 3, 3);
  } else if (direction.x === -1) {
    ctx.fillRect(headX + 4, headY + 5, 3, 3);
    ctx.fillRect(headX + 4, headY + 12, 3, 3);
  } else if (direction.y === -1) {
    ctx.fillRect(headX + 5, headY + 4, 3, 3);
    ctx.fillRect(headX + 12, headY + 4, 3, 3);
  } else {
    ctx.fillRect(headX + 5, headY + 12, 3, 3);
    ctx.fillRect(headX + 12, headY + 12, 3, 3);
  }
}

function drawFood() {
  if (!food) {
    return;
  }

  const centerX = food.x * tileSize + tileSize / 2;
  const centerY = food.y * tileSize + tileSize / 2;
  const isGolden = food.type === "gold";

  ctx.shadowColor = isGolden
    ? "rgba(255, 215, 70, 0.85)"
    : "rgba(255, 60, 60, 0.75)";
  ctx.shadowBlur = 10;

  ctx.fillStyle = isGolden ? "#ffd447" : "#ff2d2d";
  ctx.beginPath();
  ctx.arc(centerX, centerY + 1, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = isGolden ? "#cc9b1a" : "#a61616";
  ctx.beginPath();
  ctx.arc(centerX + 2.5, centerY - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6b3d1d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 7);
  ctx.lineTo(centerX + 1, centerY - 11);
  ctx.stroke();

  ctx.fillStyle = "#5bc94f";
  ctx.beginPath();
  ctx.ellipse(centerX + 4.5, centerY - 9.5, 3.2, 1.8, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(150, 255, 190, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i += 1) {
    const pos = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function render() {
  drawBoard();
  drawGrid();
  drawFood();
  drawSnake();
}

function updateScore() {
  scoreElement.textContent = String(score);
}

function updateHighScore() {
  highScoreElement.textContent = String(highScore);
}

function persistHighScore() {
  localStorage.setItem(highScoreKey, String(highScore));
}

function refreshGameSpeed() {
  if (!gameInterval) {
    return;
  }
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, currentSpeed);
}

function increaseDifficultyIfNeeded() {
  if (foodsEaten > 0 && foodsEaten % foodsPerLevel === 0) {
    currentSpeed = Math.max(minimumSpeed, currentSpeed - speedStep);
    refreshGameSpeed();
  }
}

function showGameOver() {
  gameOverMessage.classList.remove("hidden");
  restartButton.classList.remove("hidden");
}

function hideGameOver() {
  gameOverMessage.classList.add("hidden");
  restartButton.classList.add("hidden");
}

function isSnakeOnCell(cell) {
  return snake.some((segment) => segment.x === cell.x && segment.y === cell.y);
}

function spawnFood() {
  let randomCell = null;
  const foodType = Math.random() < 0.1 ? "gold" : "normal";

  do {
    randomCell = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (isSnakeOnCell(randomCell));

  food = {
    ...randomCell,
    type: foodType,
  };
}

function isOutOfBounds(cell) {
  return cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize;
}

function isSelfCollision(headCell) {
  return snake.some((segment, index) => {
    if (index === 0) {
      return false;
    }
    return segment.x === headCell.x && segment.y === headCell.y;
  });
}

function endGame() {
  isGameOver = true;
  playSound(gameOverSound);
  bgMusic.pause();

  if (score > highScore) {
    highScore = score;
    updateHighScore();
    persistHighScore();
  }

  showGameOver();
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
}

function moveSnake() {
  direction = nextDirection;

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  if (isOutOfBounds(newHead)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (isSelfCollision(newHead)) {
    endGame();
    return;
  }

  const hasEatenFood = food && newHead.x === food.x && newHead.y === food.y;
  if (hasEatenFood) {
    playSound(eatSound);
    const gainedPoints = food.type === "gold" ? 50 : 10;
    score += gainedPoints;
    foodsEaten += 1;
    updateScore();
    if (score > highScore) {
      highScore = score;
      updateHighScore();
      persistHighScore();
    }
    increaseDifficultyIfNeeded();
    spawnFood();
  } else {
    snake.pop();
  }
}

function setDirection(key) {
  if (key === "ArrowUp" && nextDirection.y !== 1) {
    nextDirection = { x: 0, y: -1 };
  } else if (key === "ArrowDown" && nextDirection.y !== -1) {
    nextDirection = { x: 0, y: 1 };
  } else if (key === "ArrowLeft" && nextDirection.x !== 1) {
    nextDirection = { x: -1, y: 0 };
  } else if (key === "ArrowRight" && nextDirection.x !== -1) {
    nextDirection = { x: 1, y: 0 };
  }
}

function handleDirectionInput(key) {
  unlockAudio();
  if (isGameOver) {
    return;
  }
  setDirection(key);
}

function gameLoop() {
  if (isGameOver) {
    return;
  }
  moveSnake();
  render();
}

function resetSnake() {
  snake.length = 0;
  initialSnake.forEach((segment) => {
    snake.push({ x: segment.x, y: segment.y });
  });
}

function resetGame() {
  resetSnake();
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  foodsEaten = 0;
  currentSpeed = initialSpeed;
  isGameOver = false;
  updateScore();
  updateHighScore();
  hideGameOver();
  spawnFood();
  render();

  if (gameInterval) {
    clearInterval(gameInterval);
  }
  gameInterval = setInterval(gameLoop, currentSpeed);

  if (isAudioUnlocked) {
    startBackgroundMusic();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
  handleDirectionInput(event.key);
});

restartButton.addEventListener("click", resetGame);
document.addEventListener("click", unlockAudio);
controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleDirectionInput(button.dataset.direction);
  });
});

resetGame();
