// ===== Game Configuration =====
const DIFFICULTY_SETTINGS = {
    easy: {
        ballSpeed: 4,
        aiSpeed: 3,
        aiReactionDelay: 150,
        winScore: 5
    },
    medium: {
        ballSpeed: 6,
        aiSpeed: 5,
        aiReactionDelay: 80,
        winScore: 7
    },
    hard: {
        ballSpeed: 8,
        aiSpeed: 7,
        aiReactionDelay: 30,
        winScore: 10
    }
};

// ===== Game State =====
const game = {
    state: 'menu', // menu, playing, paused, gameover
    difficulty: 'easy',
    customBallSpeed: null, // null = auto (based on difficulty)
    playerScore: 0,
    aiScore: 0,
    lastAiUpdate: 0,
    animationId: null
};

// ===== Canvas & Context =====
let canvas, ctx;
let canvasWidth, canvasHeight;

// ===== Game Objects =====
const paddle = {
    width: 100,
    height: 14,
    radius: 7
};

const player = {
    x: 0,
    y: 0
};

const ai = {
    x: 0,
    y: 0,
    targetX: 0
};

const ball = {
    x: 0,
    y: 0,
    radius: 10,
    dx: 0,
    dy: 0,
    speed: 0
};

// ===== DOM Elements =====
const elements = {
    menuScreen: null,
    gameScreen: null,
    pauseScreen: null,
    gameoverScreen: null,
    startBtn: null,
    pauseBtn: null,
    resumeBtn: null,
    quitBtn: null,
    playagainBtn: null,
    menuBtn: null,
    diffBtns: null,
    ballSpeedSlider: null,
    speedValueEl: null,
    resetSpeedBtn: null,
    playerScoreEl: null,
    aiScoreEl: null,
    resultText: null,
    finalPlayer: null,
    finalAi: null
};

// ===== Initialize =====
function init() {
    // Get DOM elements
    elements.menuScreen = document.getElementById('menu-screen');
    elements.gameScreen = document.getElementById('game-screen');
    elements.pauseScreen = document.getElementById('pause-screen');
    elements.gameoverScreen = document.getElementById('gameover-screen');
    elements.startBtn = document.getElementById('start-btn');
    elements.pauseBtn = document.getElementById('pause-btn');
    elements.resumeBtn = document.getElementById('resume-btn');
    elements.quitBtn = document.getElementById('quit-btn');
    elements.playagainBtn = document.getElementById('playagain-btn');
    elements.menuBtn = document.getElementById('menu-btn');
    elements.diffBtns = document.querySelectorAll('.diff-btn');
    elements.ballSpeedSlider = document.getElementById('ball-speed');
    elements.speedValueEl = document.getElementById('speed-value');
    elements.resetSpeedBtn = document.getElementById('reset-speed');
    elements.playerScoreEl = document.getElementById('player-score');
    elements.aiScoreEl = document.getElementById('ai-score');
    elements.resultText = document.getElementById('result-text');
    elements.finalPlayer = document.getElementById('final-player');
    elements.finalAi = document.getElementById('final-ai');

    // Get canvas
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');

    // Setup event listeners
    setupEventListeners();

    // Handle resize
    window.addEventListener('resize', handleResize);
}

function setupEventListeners() {
    // Difficulty buttons
    elements.diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.difficulty = btn.dataset.difficulty;
            // Update speed display if in auto mode
            if (game.customBallSpeed === null) {
                updateSpeedDisplay();
            }
        });
    });

    // Ball speed slider
    elements.ballSpeedSlider.addEventListener('input', handleSpeedChange);

    // Reset speed button
    elements.resetSpeedBtn.addEventListener('click', resetSpeed);

    // Initialize speed display
    updateSpeedDisplay();

    // Start button
    elements.startBtn.addEventListener('click', startGame);

    // Pause button
    elements.pauseBtn.addEventListener('click', pauseGame);

    // Resume button
    elements.resumeBtn.addEventListener('click', resumeGame);

    // Quit button
    elements.quitBtn.addEventListener('click', goToMenu);

    // Play again button
    elements.playagainBtn.addEventListener('click', startGame);

    // Menu button
    elements.menuBtn.addEventListener('click', goToMenu);

    // Touch controls
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Mouse controls (for desktop testing)
    canvas.addEventListener('mousemove', handleMouseMove);
}

// ===== Screen Management =====
function showScreen(screenName) {
    // Hide all screens
    elements.menuScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');
    elements.pauseScreen.classList.remove('active');
    elements.gameoverScreen.classList.remove('active');

    // Show requested screen
    switch (screenName) {
        case 'menu':
            elements.menuScreen.classList.add('active');
            break;
        case 'game':
            elements.gameScreen.classList.add('active');
            break;
        case 'pause':
            elements.gameScreen.classList.add('active');
            elements.pauseScreen.classList.add('active');
            break;
        case 'gameover':
            elements.gameScreen.classList.add('active');
            elements.gameoverScreen.classList.add('active');
            break;
    }
}

// ===== Game State Functions =====
function startGame() {
    game.state = 'playing';
    game.playerScore = 0;
    game.aiScore = 0;

    // Setup canvas
    handleResize();

    // Initialize game objects
    resetBall();
    resetPaddles();

    // Update UI
    updateScoreDisplay();
    showScreen('game');

    // Start game loop
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
    gameLoop();
}

function pauseGame() {
    if (game.state === 'playing') {
        game.state = 'paused';
        showScreen('pause');
        cancelAnimationFrame(game.animationId);
    }
}

function resumeGame() {
    if (game.state === 'paused') {
        game.state = 'playing';
        showScreen('game');
        gameLoop();
    }
}

function goToMenu() {
    game.state = 'menu';
    showScreen('menu');
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
}

function gameOver(playerWon) {
    game.state = 'gameover';

    // Update result text
    if (playerWon) {
        elements.resultText.textContent = '🎉 Kamu Menang!';
    } else {
        elements.resultText.textContent = '😢 Kamu Kalah!';
    }

    // Update final scores
    elements.finalPlayer.textContent = game.playerScore;
    elements.finalAi.textContent = game.aiScore;

    showScreen('gameover');
    cancelAnimationFrame(game.animationId);
}

// ===== Canvas & Resize =====
function handleResize() {
    const container = elements.gameScreen;
    const header = container.querySelector('.game-header');
    const hint = container.querySelector('.touch-hint');

    const headerHeight = header ? header.offsetHeight : 0;
    const hintHeight = hint ? hint.offsetHeight : 0;

    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight - headerHeight - hintHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Adjust paddle size based on canvas width
    paddle.width = Math.max(80, Math.min(120, canvasWidth * 0.25));

    // Reset positions if playing
    if (game.state === 'playing' || game.state === 'paused') {
        player.y = canvasHeight - 30;
        ai.y = 20;

        // Keep paddles in bounds
        player.x = Math.max(paddle.width / 2, Math.min(canvasWidth - paddle.width / 2, player.x || canvasWidth / 2));
        ai.x = Math.max(paddle.width / 2, Math.min(canvasWidth - paddle.width / 2, ai.x || canvasWidth / 2));
    }
}

// ===== Game Objects Reset =====
function resetBall() {
    const settings = DIFFICULTY_SETTINGS[game.difficulty];

    ball.x = canvasWidth / 2;
    ball.y = canvasHeight / 2;

    // Use custom speed if set, otherwise use difficulty default
    ball.speed = game.customBallSpeed !== null ? game.customBallSpeed : settings.ballSpeed;

    // Random direction
    const angle = (Math.random() * 0.5 + 0.25) * Math.PI; // 45-135 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;

    ball.dx = Math.cos(angle) * ball.speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = Math.sin(angle) * ball.speed * direction;
}

function resetPaddles() {
    player.x = canvasWidth / 2;
    player.y = canvasHeight - 30;

    ai.x = canvasWidth / 2;
    ai.y = 20;
    ai.targetX = canvasWidth / 2;
}

// ===== Touch Controls =====
let touchStartX = 0;
let playerStartX = 0;

function handleTouchStart(e) {
    e.preventDefault();
    if (game.state !== 'playing') return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    playerStartX = player.x;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (game.state !== 'playing') return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;

    player.x = playerStartX + deltaX;

    // Keep paddle in bounds
    player.x = Math.max(paddle.width / 2, Math.min(canvasWidth - paddle.width / 2, player.x));
}

function handleMouseMove(e) {
    if (game.state !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;

    // Keep paddle in bounds
    player.x = Math.max(paddle.width / 2, Math.min(canvasWidth - paddle.width / 2, player.x));
}

// ===== AI Logic =====
function updateAI() {
    const settings = DIFFICULTY_SETTINGS[game.difficulty];
    const now = Date.now();

    // Update target position with delay
    if (now - game.lastAiUpdate > settings.aiReactionDelay) {
        // Predict where ball will be
        if (ball.dy < 0) { // Ball moving towards AI
            ai.targetX = ball.x + (ball.dx * (ai.y - ball.y) / Math.abs(ball.dy));
        } else {
            ai.targetX = canvasWidth / 2; // Return to center
        }
        game.lastAiUpdate = now;
    }

    // Move towards target
    const diff = ai.targetX - ai.x;
    const moveSpeed = settings.aiSpeed;

    if (Math.abs(diff) > moveSpeed) {
        ai.x += diff > 0 ? moveSpeed : -moveSpeed;
    } else {
        ai.x = ai.targetX;
    }

    // Keep paddle in bounds
    ai.x = Math.max(paddle.width / 2, Math.min(canvasWidth - paddle.width / 2, ai.x));
}

// ===== Ball Physics =====
function updateBall() {
    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (left/right)
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvasWidth) {
        ball.dx *= -1;
        ball.x = Math.max(ball.radius, Math.min(canvasWidth - ball.radius, ball.x));
    }

    // Paddle collision - Player
    if (ball.dy > 0 &&
        ball.y + ball.radius >= player.y - paddle.height / 2 &&
        ball.y - ball.radius <= player.y + paddle.height / 2 &&
        ball.x >= player.x - paddle.width / 2 &&
        ball.x <= player.x + paddle.width / 2) {

        // Calculate bounce angle based on where ball hit paddle
        const hitPos = (ball.x - player.x) / (paddle.width / 2);
        const angle = hitPos * (Math.PI / 4); // Max 45 degree angle

        ball.dy = -Math.abs(ball.dy);
        ball.dx = Math.sin(angle) * ball.speed * 1.5;
        ball.y = player.y - paddle.height / 2 - ball.radius;

        // Slightly increase speed
        const baseSpeed = game.customBallSpeed !== null ? game.customBallSpeed : DIFFICULTY_SETTINGS[game.difficulty].ballSpeed;
        ball.speed = Math.min(ball.speed * 1.02, baseSpeed * 1.5);
    }

    // Paddle collision - AI
    if (ball.dy < 0 &&
        ball.y - ball.radius <= ai.y + paddle.height / 2 &&
        ball.y + ball.radius >= ai.y - paddle.height / 2 &&
        ball.x >= ai.x - paddle.width / 2 &&
        ball.x <= ai.x + paddle.width / 2) {

        const hitPos = (ball.x - ai.x) / (paddle.width / 2);
        const angle = hitPos * (Math.PI / 4);

        ball.dy = Math.abs(ball.dy);
        ball.dx = Math.sin(angle) * ball.speed * 1.5;
        ball.y = ai.y + paddle.height / 2 + ball.radius;
    }

    // Score - Ball passed player
    if (ball.y > canvasHeight + ball.radius) {
        game.aiScore++;
        updateScoreDisplay();
        checkWin();
        if (game.state === 'playing') {
            resetBall();
        }
    }

    // Score - Ball passed AI
    if (ball.y < -ball.radius) {
        game.playerScore++;
        updateScoreDisplay();
        checkWin();
        if (game.state === 'playing') {
            resetBall();
        }
    }
}

function checkWin() {
    const settings = DIFFICULTY_SETTINGS[game.difficulty];

    if (game.playerScore >= settings.winScore) {
        gameOver(true);
    } else if (game.aiScore >= settings.winScore) {
        gameOver(false);
    }
}

function updateScoreDisplay() {
    elements.playerScoreEl.textContent = game.playerScore;
    elements.aiScoreEl.textContent = game.aiScore;
}

// ===== Rendering =====
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 2);
    ctx.lineTo(canvasWidth, canvasHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw AI paddle
    drawPaddle(ai.x, ai.y, '#ff00aa');

    // Draw player paddle
    drawPaddle(player.x, player.y, '#00d4ff');

    // Draw ball
    drawBall();
}

function drawPaddle(x, y, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Draw rounded paddle
    ctx.beginPath();
    ctx.roundRect(
        x - paddle.width / 2,
        y - paddle.height / 2,
        paddle.width,
        paddle.height,
        paddle.radius
    );
    ctx.fill();

    ctx.shadowBlur = 0;
}

function drawBall() {
    // Glow effect
    const gradient = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius * 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ball core
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ===== Game Loop =====
function gameLoop() {
    if (game.state !== 'playing') return;

    updateAI();
    updateBall();
    draw();

    game.animationId = requestAnimationFrame(gameLoop);
}

// ===== Speed Control =====
function handleSpeedChange(e) {
    const value = parseInt(e.target.value);
    game.customBallSpeed = value;
    updateSpeedDisplay();
}

function resetSpeed() {
    game.customBallSpeed = null;
    updateSpeedDisplay();
}

function updateSpeedDisplay() {
    if (game.customBallSpeed !== null) {
        elements.speedValueEl.textContent = game.customBallSpeed;
        elements.ballSpeedSlider.value = game.customBallSpeed;
        elements.resetSpeedBtn.style.display = 'inline-block';
    } else {
        const autoSpeed = DIFFICULTY_SETTINGS[game.difficulty].ballSpeed;
        elements.speedValueEl.textContent = `Auto (${autoSpeed})`;
        elements.ballSpeedSlider.value = autoSpeed;
        elements.resetSpeedBtn.style.display = 'none';
    }
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
