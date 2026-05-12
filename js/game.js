// Game Variables
const gameBoard = document.getElementById('gameBoard');
const player = document.getElementById('player');
const enemiesGrid = document.getElementById('enemiesGrid');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const characterButtons = document.querySelectorAll('.char-btn');

const themes = {
    neon: {
        '--bg-color': '#000000',
        '--main-color': '#ff10f0',
        '--accent-color': '#ff1eff',
        '--player-start': '#ff10f0',
        '--player-end': '#ff1eff',
        '--panel-color': 'rgba(255, 16, 240, 0.12)',
        '--board-start': '#070507',
        '--board-end': '#160517',
        '--enemy-bg': 'rgba(255, 16, 240, 0.9)',
        '--block-bg': 'rgba(255, 16, 240, 0.22)',
        '--block-border': '#ff10f0',
        '--bullet-color': '#ff10f0',
        '--enemy-bullet-color': '#ff10f0'
    },
    frost: {
        '--bg-color': '#041526',
        '--main-color': '#6cf0ff',
        '--accent-color': '#b8f7ff',
        '--player-start': '#6cf0ff',
        '--player-end': '#b8f7ff',
        '--panel-color': 'rgba(108, 240, 255, 0.12)',
        '--board-start': '#02101e',
        '--board-end': '#0b2339',
        '--enemy-bg': 'rgba(108, 240, 255, 0.85)',
        '--block-bg': 'rgba(108, 240, 255, 0.22)',
        '--block-border': '#6cf0ff',
        '--bullet-color': '#6cf0ff',
        '--enemy-bullet-color': '#6cf0ff'
    },
    cosmic: {
        '--bg-color': '#120011',
        '--main-color': '#ff72d9',
        '--accent-color': '#ffb9f0',
        '--player-start': '#ff72d9',
        '--player-end': '#ffb9f0',
        '--panel-color': 'rgba(255, 114, 217, 0.12)',
        '--board-start': '#110016',
        '--board-end': '#24002f',
        '--enemy-bg': 'rgba(255, 114, 217, 0.9)',
        '--block-bg': 'rgba(255, 114, 217, 0.22)',
        '--block-border': '#ff72d9',
        '--bullet-color': '#ff72d9',
        '--enemy-bullet-color': '#ff72d9'
    }
};

let gameState = {
    score: 0,
    lives: 3,
    gameRunning: false,
    gamePaused: false,
    playerX: 0,
    playerSpeed: 8,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    blocks: [],
    enemyDirection: 1,
    enemySpeed: 1,
    wave: 1,
    currentTheme: 'neon'
};

let gameLoops = {
    loop: null,
    enemyShoot: null
};

function initGame() {
    applyTheme('neon');
    createEnemies();
    createBlocks();
    setupEventListeners();
    resetGameBoard();
    pauseBtn.disabled = true;
}

function applyTheme(themeKey) {
    const theme = themes[themeKey];
    if (!theme) return;
    gameState.currentTheme = themeKey;
    Object.keys(theme).forEach((prop) => {
        document.documentElement.style.setProperty(prop, theme[prop]);
    });
    characterButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.char === themeKey);
    });
}

function createEnemies() {
    enemiesGrid.innerHTML = '';
    gameState.enemies = [];
    gameState.enemyDirection = 1;
    gameState.enemySpeed = 0.8 + gameState.wave * 0.25;

    const rows = 4;
    const cols = 6;
    const xSpacing = 70;
    const ySpacing = 60;
    const boardWidth = gameBoard.offsetWidth;
    const offsetX = (boardWidth - ((cols - 1) * xSpacing + 50)) / 2;
    const offsetY = 30;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const enemy = document.createElement('div');
            enemy.className = 'enemy';
            enemiesGrid.appendChild(enemy);

            const enemyObj = {
                x: offsetX + col * xSpacing,
                y: offsetY + row * ySpacing,
                width: 50,
                height: 40,
                element: enemy,
                alive: true
            };

            enemy.style.left = `${enemyObj.x}px`;
            enemy.style.top = `${enemyObj.y}px`;
            gameState.enemies.push(enemyObj);
        }
    }
}

function createBlocks() {
    document.querySelectorAll('.block, .big-block').forEach((el) => el.remove());
    gameState.blocks = [];

    const boardWidth = gameBoard.offsetWidth;
    const centerX = boardWidth / 2;
    const baseY = gameBoard.offsetHeight - 130;
    const positions = [boardWidth * 0.26, boardWidth * 0.61];

    positions.forEach((startX) => {
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const block = document.createElement('div');
                block.className = 'block';
                gameBoard.appendChild(block);
                const blockObj = {
                    x: Math.round(startX + col * 42),
                    y: Math.round(baseY + row * 26),
                    width: 32,
                    height: 22,
                    durability: 3,
                    element: block
                };
                block.style.left = `${blockObj.x}px`;
                block.style.top = `${blockObj.y}px`;
                gameState.blocks.push(blockObj);
            }
        }
    });

    const bigBlock = document.createElement('div');
    bigBlock.className = 'big-block';
    gameBoard.appendChild(bigBlock);
    const bigBlockObj = {
        x: Math.round(centerX - 90),
        y: Math.round(gameBoard.offsetHeight - 80),
        width: 180,
        height: 26,
        durability: 6,
        element: bigBlock
    };
    bigBlock.style.left = `${bigBlockObj.x}px`;
    bigBlock.style.top = `${bigBlockObj.y}px`;
    gameState.blocks.push(bigBlockObj);
}

function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);

    characterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.char);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (!gameState.gameRunning || gameState.gamePaused) return;

        if (e.key === 'ArrowLeft') {
            movePlayer(-gameState.playerSpeed);
        } else if (e.key === 'ArrowRight') {
            movePlayer(gameState.playerSpeed);
        } else if (e.key === ' ') {
            e.preventDefault();
            shoot();
        }
    });
}

function resetGameBoard() {
    gameState.playerX = Math.round((gameBoard.offsetWidth / 2) - 20);
    player.style.left = `${gameState.playerX}px`;
}

function movePlayer(direction) {
    const boardWidth = gameBoard.offsetWidth;
    gameState.playerX += direction;
    if (gameState.playerX < 0) gameState.playerX = 0;
    if (gameState.playerX + 40 > boardWidth) gameState.playerX = boardWidth - 40;
    player.style.left = `${gameState.playerX}px`;
}

function shoot() {
    if (!gameState.gameRunning) return;

    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    gameBoard.appendChild(bullet);

    const bulletObj = {
        x: gameState.playerX + 18.5,
        y: gameBoard.offsetHeight - 70,
        width: 4,
        height: 16,
        speed: 12,
        element: bullet
    };

    bullet.style.left = `${bulletObj.x}px`;
    bullet.style.top = `${bulletObj.y}px`;
    bullet.style.width = `${bulletObj.width}px`;
    bullet.style.height = `${bulletObj.height}px`;
    playShootSound();
    gameState.bullets.push(bulletObj);
}

function updateBullets() {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.y -= bullet.speed;
        bullet.element.style.top = `${bullet.y}px`;

        if (bullet.y < -20) {
            bullet.element.remove();
            gameState.bullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = 0; j < gameState.blocks.length; j++) {
            const block = gameState.blocks[j];
            if (checkRectCollision(bullet, block)) {
                damageBlock(block);
                bullet.element.remove();
                gameState.bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        for (const enemy of gameState.enemies) {
            if (!enemy.alive) continue;
            if (checkRectCollision(bullet, enemy)) {
                enemy.alive = false;
                enemy.element.style.opacity = '0';
                createExplosion(enemy.x + 25, enemy.y + 20);
                updateScore(10);
                bullet.element.remove();
                gameState.bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
    }
}

function updateEnemyBullets() {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = gameState.enemyBullets[i];
        bullet.y += bullet.speed;
        bullet.element.style.top = `${bullet.y}px`;

        if (bullet.y > gameBoard.offsetHeight + 20) {
            bullet.element.remove();
            gameState.enemyBullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = 0; j < gameState.blocks.length; j++) {
            const block = gameState.blocks[j];
            if (checkRectCollision(bullet, block)) {
                damageBlock(block);
                bullet.element.remove();
                gameState.enemyBullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        const playerRect = {
            x: gameState.playerX,
            y: gameBoard.offsetHeight - 70,
            width: 40,
            height: 50
        };
        if (checkRectCollision(bullet, playerRect)) {
            createExplosion(gameState.playerX + 20, playerRect.y + 20);
            bullet.element.remove();
            gameState.enemyBullets.splice(i, 1);
            updateLives(-1);
        }
    }
}

function moveEnemies() {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    const living = gameState.enemies.filter((enemy) => enemy.alive);
    if (living.length === 0) {
        nextWave();
        return;
    }

    let shouldReverse = false;
    const boardWidth = gameBoard.offsetWidth;
    living.forEach((enemy) => {
        enemy.x += gameState.enemySpeed * gameState.enemyDirection;
        if (enemy.x + enemy.width >= boardWidth || enemy.x <= 0) {
            shouldReverse = true;
        }
    });

    if (shouldReverse) {
        gameState.enemyDirection *= -1;
        living.forEach((enemy) => {
            enemy.y += 25;
        });
    }

    living.forEach((enemy) => {
        enemy.element.style.left = `${enemy.x}px`;
        enemy.element.style.top = `${enemy.y}px`;
        if (enemy.y + enemy.height >= gameBoard.offsetHeight - 110) {
            endGame();
        }
    });
}

function enemyShoot() {
    if (!gameState.gameRunning || gameState.gamePaused) return;

    const columns = {};
    gameState.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const column = Math.round(enemy.x / 70);
        if (!columns[column] || enemy.y > columns[column].y) {
            columns[column] = enemy;
        }
    });

    const shooters = Object.values(columns);
    if (shooters.length === 0) return;
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];

    const bullet = document.createElement('div');
    bullet.className = 'enemy-bullet';
    gameBoard.appendChild(bullet);

    const bulletObj = {
        x: shooter.x + 18,
        y: shooter.y + 42,
        width: 14,
        height: 10,
        speed: 6,
        element: bullet
    };
    bullet.style.left = `${bulletObj.x}px`;
    bullet.style.top = `${bulletObj.y}px`;
    bullet.style.width = `${bulletObj.width}px`;
    bullet.style.height = `${bulletObj.height}px`;
    playEnemyShootSound();
    gameState.enemyBullets.push(bulletObj);
}

function checkRectCollision(a, b) {
    const aWidth = a.width || 3;
    const aHeight = a.height || 15;
    return (
        a.x < b.x + b.width &&
        a.x + aWidth > b.x &&
        a.y < b.y + b.height &&
        a.y + aHeight > b.y
    );
}

function playSound(frequency, duration, type = 'sine', volume = 0.12) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
    oscillator.onended = () => ctx.close();
}

function playShootSound() {
    playSound(880, 80, 'triangle', 0.08);
}

function playEnemyShootSound() {
    playSound(360, 90, 'square', 0.08);
}

function playExplosionSound() {
    playSound(180, 120, 'sawtooth', 0.12);
}

function damageBlock(block) {
    block.durability -= 1;
    if (block.durability <= 0) {
        block.element.remove();
        gameState.blocks = gameState.blocks.filter((b) => b !== block);
        return;
    }
    const opacity = 0.2 + block.durability * 0.12;
    block.element.style.opacity = opacity.toString();
    block.element.style.filter = `brightness(${0.8 + block.durability * 0.05})`;
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    gameBoard.appendChild(explosion);
    playExplosionSound();
    setTimeout(() => explosion.remove(), 450);
}

function nextWave() {
    gameState.wave += 1;
    updateScore(100);
    createEnemies();
    createBlocks();
    resetGameBoard();
}

function updateScore(points) {
    gameState.score += points;
    scoreDisplay.textContent = gameState.score;
}

function updateLives(change) {
    gameState.lives += change;
    livesDisplay.textContent = gameState.lives;
    if (gameState.lives <= 0) {
        endGame();
    }
}

function startGame() {
    if (gameState.gameRunning) {
        resetGame();
        return;
    }

    gameState.gameRunning = true;
    gameState.gamePaused = false;
    startBtn.textContent = 'RESTART';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'PAUSE';
    createEnemies();
    createBlocks();
    resetGameBoard();

    clearInterval(gameLoops.loop);
    clearInterval(gameLoops.enemyShoot);
    gameLoops.loop = setInterval(() => {
        moveEnemies();
        updateBullets();
        updateEnemyBullets();
    }, 25);
    gameLoops.enemyShoot = setInterval(enemyShoot, 750);
}

function togglePause() {
    if (!gameState.gameRunning) return;
    gameState.gamePaused = !gameState.gamePaused;
    pauseBtn.textContent = gameState.gamePaused ? 'RESUME' : 'PAUSE';
}

function resetGame() {
    gameState.gameRunning = false;
    gameState.gamePaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.wave = 1;
    gameState.bullets = [];
    gameState.enemyBullets = [];
    gameState.blocks = [];

    clearInterval(gameLoops.loop);
    clearInterval(gameLoops.enemyShoot);

    document.querySelectorAll('.bullet, .enemy-bullet, .explosion').forEach((el) => el.remove());
    createEnemies();
    createBlocks();
    resetGameBoard();

    scoreDisplay.textContent = gameState.score;
    livesDisplay.textContent = gameState.lives;
    startBtn.textContent = 'START GAME';
    pauseBtn.disabled = true;
}

function endGame() {
    if (!gameState.gameRunning) return;
    gameState.gameRunning = false;
    gameState.gamePaused = false;
    clearInterval(gameLoops.loop);
    clearInterval(gameLoops.enemyShoot);
    createExplosion(gameState.playerX + 20, gameBoard.offsetHeight - 50);
    setTimeout(() => {
        alert(`Game Over! Final Score: ${gameState.score}    Waves: ${gameState.wave}`);
        resetGame();
    }, 400);
}

document.addEventListener('DOMContentLoaded', initGame);
