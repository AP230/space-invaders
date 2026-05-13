const gameBoard = document.getElementById('gameBoard');
const player = document.getElementById('player');
const enemiesGrid = document.getElementById('enemiesGrid');
const shieldsGrid = document.getElementById('shieldsGrid');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const waveDisplay = document.getElementById('wave');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');
const ufoElement = document.getElementById('ufo');

const state = {
    score: 0,
    lives: 3,
    wave: 1,
    gameRunning: false,
    gamePaused: false,
    playerX: 0,
    playerSpeed: 0.28,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    blocks: [],
    enemyDirection: 1,
    enemyMoveDelay: 700,
    lastEnemyMove: 0,
    lastEnemyShoot: 0,
    nextUfoSpawn: 0,
    ufo: null,
    lastFrame: 0
};

const keys = {
    left: false,
    right: false
};

function initGame() {
    setupEventListeners();
    showOverlay('SPACE INVADERS', 'Destroy the alien fleet before they reach your base.', 'PLAY');
    resetPlayer();
    updateScore(0);
    updateLives(0);
    waveDisplay.textContent = state.wave;
}

function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    overlayBtn.addEventListener('click', () => {
        hideOverlay();
        startGame();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            keys.left = true;
        }
        if (event.key === 'ArrowRight') {
            keys.right = true;
        }
        if (event.key === ' ' && !event.repeat) {
            event.preventDefault();
            if (state.gameRunning && !state.gamePaused) {
                shoot();
            }
        }
        if (event.key.toLowerCase() === 'p') {
            togglePause();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowLeft') {
            keys.left = false;
        }
        if (event.key === 'ArrowRight') {
            keys.right = false;
        }
    });
}

function showOverlay(title, text, buttonText = 'PLAY') {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = buttonText;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

function resetPlayer() {
    state.playerX = Math.round((gameBoard.offsetWidth / 2) - 17);
    player.style.left = `${state.playerX}px`;
}

function startGame() {
    if (state.gameRunning) {
        resetGame();
        return;
    }

    hideOverlay();
    state.gameRunning = true;
    state.gamePaused = false;
    startBtn.textContent = 'RESTART';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'PAUSE';

    resetGameState();
    createEnemies();
    createShields();
    resetPlayer();
    scheduleNextUfo();
    state.lastFrame = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGameState() {
    state.score = 0;
    state.lives = 3;
    state.wave = 1;
    state.enemies = [];
    state.bullets = [];
    state.enemyBullets = [];
    state.blocks = [];
    state.ufo = null;
    state.enemyDirection = 1;
    state.lastEnemyMove = 0;
    state.lastEnemyShoot = 0;
    state.nextUfoSpawn = Date.now() + 9000;

    scoreDisplay.textContent = state.score;
    livesDisplay.textContent = state.lives;
    waveDisplay.textContent = state.wave;
    document.querySelectorAll('.bullet, .enemy-bullet, .explosion').forEach((el) => el.remove());
    document.querySelectorAll('.enemy, .shield-segment').forEach((el) => el.remove());
}

function resetGame() {
    state.gameRunning = false;
    state.gamePaused = false;
    state.score = 0;
    state.lives = 3;
    state.wave = 1;
    state.enemies = [];
    state.bullets = [];
    state.enemyBullets = [];
    state.blocks = [];
    state.ufo = null;
    state.enemyDirection = 1;
    state.lastEnemyMove = 0;
    state.lastEnemyShoot = 0;
    state.nextUfoSpawn = Date.now() + 9000;

    document.querySelectorAll('.bullet, .enemy-bullet, .explosion').forEach((el) => el.remove());
    document.querySelectorAll('.enemy, .shield-segment').forEach((el) => el.remove());
    createEnemies();
    createShields();
    resetPlayer();

    updateScore(0);
    updateLives(0);
    waveDisplay.textContent = state.wave;
    startBtn.textContent = 'START GAME';
    pauseBtn.textContent = 'PAUSE';
    pauseBtn.disabled = true;
    showOverlay('GAME RESET', 'Press PLAY to start the next attack.');
}

function togglePause() {
    if (!state.gameRunning) return;
    state.gamePaused = !state.gamePaused;
    pauseBtn.textContent = state.gamePaused ? 'RESUME' : 'PAUSE';
    if (!state.gamePaused) {
        state.lastFrame = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function createEnemies() {
    enemiesGrid.innerHTML = '';
    state.enemies = [];
    state.enemyDirection = 1;

    const rows = 5;
    const cols = 9;
    const enemyWidth = 34;
    const enemyHeight = 28;
    const gapX = 16;
    const gapY = 52;
    const boardWidth = gameBoard.offsetWidth;
    const totalWidth = cols * enemyWidth + (cols - 1) * gapX;
    const offsetX = Math.max(18, (boardWidth - totalWidth) / 2);
    const offsetY = 48;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const enemy = document.createElement('div');
            enemy.className = `enemy type${Math.min(2, Math.floor(row / 2))}`;
            enemiesGrid.appendChild(enemy);

            const enemyObj = {
                x: offsetX + col * (enemyWidth + gapX),
                y: offsetY + row * gapY,
                width: enemyWidth,
                height: enemyHeight,
                element: enemy,
                alive: true,
                points: row < 2 ? 30 : row < 4 ? 20 : 10
            };

            enemy.style.left = `${enemyObj.x}px`;
            enemy.style.top = `${enemyObj.y}px`;
            state.enemies.push(enemyObj);
        }
    }

    waveDisplay.textContent = state.wave;
}

function createShields() {
    shieldsGrid.innerHTML = '';
    state.blocks = [];

    const shieldCount = 4;
    const segmentWidth = 18;
    const segmentHeight = 14;
    const gapX = 20;
    const gapY = 18;
    const baseX = (gameBoard.offsetWidth - shieldCount * 120 + 8) / 2;
    const baseY = gameBoard.offsetHeight - 170;

    for (let shieldIndex = 0; shieldIndex < shieldCount; shieldIndex++) {
        const shieldX = baseX + shieldIndex * 120;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 6; col++) {
                const segment = document.createElement('div');
                segment.className = 'shield-segment';
                shieldsGrid.appendChild(segment);
                const segmentObj = {
                    x: shieldX + col * gapX,
                    y: baseY + row * gapY,
                    width: segmentWidth,
                    height: segmentHeight,
                    durability: 2,
                    element: segment
                };
                segment.style.left = `${segmentObj.x}px`;
                segment.style.top = `${segmentObj.y}px`;
                state.blocks.push(segmentObj);
            }
        }
    }
}

function movePlayer(distance) {
    const boardWidth = gameBoard.offsetWidth;
    state.playerX += distance;
    if (state.playerX < 0) state.playerX = 0;
    if (state.playerX + 34 > boardWidth) state.playerX = boardWidth - 34;
    player.style.left = `${state.playerX}px`;
}

function nextWave() {
    state.wave += 1;
    updateScore(100);
    createEnemies();
    createShields();
    resetPlayer();
    scheduleNextUfo();
}

function shoot() {
    if (!state.gameRunning) return;
    if (state.bullets.length > 0) return;

    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    gameBoard.appendChild(bullet);

    const bulletObj = {
        x: state.playerX + 15,
        y: gameBoard.offsetHeight - 70,
        width: 4,
        height: 16,
        speed: 0.65,
        element: bullet
    };

    bullet.style.left = `${bulletObj.x}px`;
    bullet.style.top = `${bulletObj.y}px`;
    state.bullets.push(bulletObj);
    playShootSound();
}

function updateBullets() {
    if (!state.gameRunning || state.gamePaused) return;

    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        bullet.y -= bullet.speed * 16;
        bullet.element.style.top = `${bullet.y}px`;

        if (bullet.y < -20) {
            bullet.element.remove();
            state.bullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = 0; j < state.blocks.length; j++) {
            const block = state.blocks[j];
            if (checkRectCollision(bullet, block)) {
                damageBlock(block);
                bullet.element.remove();
                state.bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        for (const enemy of state.enemies) {
            if (!enemy.alive) continue;
            if (checkRectCollision(bullet, enemy)) {
                enemy.alive = false;
                enemy.element.style.opacity = '0';
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                updateScore(enemy.points);
                bullet.element.remove();
                state.bullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        if (state.ufo && !state.ufo.element.classList.contains('hidden')) {
            if (checkRectCollision(bullet, state.ufo)) {
                updateScore(state.ufo.value);
                createExplosion(state.ufo.x + state.ufo.width / 2, state.ufo.y + state.ufo.height / 2);
                state.ufo.element.classList.add('hidden');
                state.ufo = null;
                bullet.element.remove();
                state.bullets.splice(i, 1);
            }
        }
    }
}

function updateEnemyBullets() {
    if (!state.gameRunning || state.gamePaused) return;

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = state.enemyBullets[i];
        bullet.y += bullet.speed * 16;
        bullet.element.style.top = `${bullet.y}px`;

        if (bullet.y > gameBoard.offsetHeight + 20) {
            bullet.element.remove();
            state.enemyBullets.splice(i, 1);
            continue;
        }

        let hit = false;
        for (let j = 0; j < state.blocks.length; j++) {
            const block = state.blocks[j];
            if (checkRectCollision(bullet, block)) {
                damageBlock(block);
                bullet.element.remove();
                state.enemyBullets.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (hit) continue;

        const playerRect = {
            x: state.playerX,
            y: gameBoard.offsetHeight - 70,
            width: 34,
            height: 28
        };
        if (checkRectCollision(bullet, playerRect)) {
            createExplosion(state.playerX + 17, playerRect.y + 10);
            bullet.element.remove();
            state.enemyBullets.splice(i, 1);
            updateLives(-1);
        }
    }
}

function moveEnemies() {
    if (!state.gameRunning || state.gamePaused) return;

    const living = state.enemies.filter((enemy) => enemy.alive);
    if (living.length === 0) {
        nextWave();
        return;
    }

    state.enemyMoveDelay = Math.max(140, 700 - living.length * 10 - (state.wave - 1) * 30);
    let shouldReverse = false;
    const boardWidth = gameBoard.offsetWidth;

    living.forEach((enemy) => {
        enemy.x += state.enemyDirection * 10;
        if (enemy.x + enemy.width >= boardWidth - 12 || enemy.x <= 12) {
            shouldReverse = true;
        }
    });

    if (shouldReverse) {
        state.enemyDirection *= -1;
        living.forEach((enemy) => {
            enemy.y += 20;
            if (enemy.y + enemy.height >= gameBoard.offsetHeight - 130) {
                endGame();
            }
        });
    }

    living.forEach((enemy) => {
        enemy.element.style.left = `${enemy.x}px`;
        enemy.element.style.top = `${enemy.y}px`;
    });
}

function enemyShoot() {
    if (!state.gameRunning || state.gamePaused) return;

    const columns = {};
    state.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        const column = Math.round(enemy.x / 44);
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
        x: shooter.x + 14,
        y: shooter.y + 26,
        width: 6,
        height: 16,
        speed: 0.45,
        element: bullet
    };
    bullet.style.left = `${bulletObj.x}px`;
    bullet.style.top = `${bulletObj.y}px`;
    state.enemyBullets.push(bulletObj);
    playEnemyShootSound();
}

function scheduleNextUfo() {
    state.nextUfoSpawn = Date.now() + 14000 + Math.random() * 11000;
}

function updateUfo() {
    if (!state.ufo && Date.now() > state.nextUfoSpawn) {
        spawnUfo();
    }

    if (!state.ufo || state.gamePaused || !state.gameRunning) return;

    state.ufo.x += state.ufo.speed;
    state.ufo.element.style.left = `${state.ufo.x}px`;

    if (state.ufo.x > gameBoard.offsetWidth + 100) {
        state.ufo.element.classList.add('hidden');
        state.ufo = null;
        scheduleNextUfo();
    }
}

function spawnUfo() {
    ufoElement.classList.remove('hidden');
    ufoElement.style.top = '18px';
    ufoElement.style.left = '-80px';

    state.ufo = {
        element: ufoElement,
        x: -80,
        y: 18,
        width: 58,
        height: 24,
        speed: 2.3 + state.wave * 0.1,
        value: 50 + Math.floor(Math.random() * 4) * 50
    };
}

function checkRectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + (a.width || 4) > b.x &&
        a.y < b.y + b.height &&
        a.y + (a.height || 16) > b.y
    );
}

function updateScore(points) {
    state.score += points;
    scoreDisplay.textContent = state.score;
}

function updateLives(change) {
    state.lives += change;
    livesDisplay.textContent = state.lives;
    if (state.lives <= 0) {
        endGame();
    }
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    explosion.style.width = '20px';
    explosion.style.height = '20px';
    explosion.style.borderRadius = '50%';
    explosion.style.background = 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,165,0,0.5) 40%, transparent 80%)';
    explosion.style.pointerEvents = 'none';
    gameBoard.appendChild(explosion);
    playExplosionSound();
    setTimeout(() => explosion.remove(), 360);
}

function damageBlock(block) {
    block.durability -= 1;
    if (block.durability <= 0) {
        block.element.remove();
        state.blocks = state.blocks.filter((b) => b !== block);
        return;
    }
    block.element.style.opacity = `${0.4 + block.durability * 0.25}`;
}

function playSound(frequency, duration, type = 'square', volume = 0.08) {
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
    playSound(760, 45, 'triangle', 0.08);
}

function playEnemyShootSound() {
    playSound(360, 70, 'square', 0.08);
}

function playExplosionSound() {
    playSound(180, 110, 'sawtooth', 0.1);
}

function gameLoop(timestamp) {
    if (!state.gameRunning) return;
    if (state.gamePaused) {
        state.lastFrame = timestamp;
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = timestamp - state.lastFrame;
    state.lastFrame = timestamp;

    if (keys.left) movePlayer(-state.playerSpeed * delta);
    if (keys.right) movePlayer(state.playerSpeed * delta);

    if (timestamp - state.lastEnemyMove > state.enemyMoveDelay) {
        moveEnemies();
        state.lastEnemyMove = timestamp;
    }

    updateBullets();
    updateEnemyBullets();
    updateUfo();

    const alive = state.enemies.filter((enemy) => enemy.alive).length;
    const shootDelay = Math.max(450, 1300 - alive * 10 - (state.wave - 1) * 30);
    if (timestamp - state.lastEnemyShoot > shootDelay) {
        enemyShoot();
        state.lastEnemyShoot = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

function endGame() {
    if (!state.gameRunning) return;
    state.gameRunning = false;
    state.gamePaused = false;
    createExplosion(state.playerX + 17, gameBoard.offsetHeight - 50);
    setTimeout(() => {
        showOverlay('GAME OVER', `Final Score: ${state.score}\nWaves: ${state.wave}`, 'PLAY AGAIN');
        startBtn.textContent = 'START GAME';
        pauseBtn.disabled = true;
    }, 420);
}

document.addEventListener('DOMContentLoaded', initGame);
