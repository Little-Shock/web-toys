// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const emojiContainer = document.getElementById('emoji-container');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const pauseBtn = document.getElementById('pause-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// Game Variables
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌',
    '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓',
    '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
    '😷', '🤒', '🤕', '🦊', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'
];

// Game Configuration
const difficulties = {
    easy: {
        totalEmojis: 100,
        timeLimit: 60,
        pointsPerFind: 1,
        jitterRange: 2 // 抖动范围（像素）
    },
    medium: {
        totalEmojis: 144,
        timeLimit: 45,
        pointsPerFind: 2,
        jitterRange: 3 // 抖动范围（像素）
    },
    hard: {
        totalEmojis: 196,
        timeLimit: 30,
        pointsPerFind: 3,
        jitterRange: 4 // 抖动范围（像素）
    }
};

// Game State
let gameState = {
    difficulty: 'easy',
    staticEmojiIndex: null,
    score: 0,
    timeLeft: 60,
    gameInterval: null,
    isPaused: false,
    consecutiveCorrect: 0
};

// Initialize the game
function init() {
    // Set default difficulty
    setActiveDifficulty('easy');

    // Event listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    homeBtn.addEventListener('click', goToHome);
    pauseBtn.addEventListener('click', togglePause);

    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveDifficulty(btn.dataset.difficulty);
        });
    });

    // Check if device supports vibration
    gameState.hasVibration = 'vibrate' in navigator;
}

// Set active difficulty
function setActiveDifficulty(difficulty) {
    gameState.difficulty = difficulty;

    difficultyBtns.forEach(btn => {
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    levelElement.textContent = `难度: ${getDifficultyName(difficulty)}`;
}

// Get difficulty name in Chinese
function getDifficultyName(difficulty) {
    const names = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    return names[difficulty] || '简单';
}

// Show screen (start, game, game-over)
function showScreen(screenId) {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    document.getElementById(screenId).style.display = 'flex';
}

// Start the game
function startGame() {
    // Reset game state
    const config = difficulties[gameState.difficulty];
    gameState.score = 0;
    gameState.timeLeft = config.timeLimit;
    gameState.isPaused = false;
    gameState.consecutiveCorrect = 0;

    // Update UI
    scoreElement.textContent = `得分: ${gameState.score}`;
    timerElement.textContent = `剩余时间: ${gameState.timeLeft}秒`;
    messageElement.textContent = '';

    // Show game screen
    showScreen('game-screen');

    // Create emojis
    createEmojis();

    // Start timer
    gameState.gameInterval = setInterval(updateTimer, 1000);
}

// Restart the game
function restartGame() {
    startGame();
}

// Go to home screen
function goToHome() {
    showScreen('start-screen');
    if (gameState.gameInterval) {
        clearInterval(gameState.gameInterval);
    }
}

// Toggle pause
function togglePause() {
    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused) {
        pauseBtn.textContent = '继续';
        clearInterval(gameState.gameInterval);
        messageElement.textContent = '游戏已暂停';
        emojiContainer.style.opacity = '0.5';
    } else {
        pauseBtn.textContent = '暂停';
        gameState.gameInterval = setInterval(updateTimer, 1000);
        messageElement.textContent = '';
        emojiContainer.style.opacity = '1';
    }
}

// Create emojis
function createEmojis() {
    const config = difficulties[gameState.difficulty];
    emojiContainer.innerHTML = ''; // Clear container

    // Determine grid columns based on screen size and difficulty
    const screenWidth = window.innerWidth;
    let columns;

    if (screenWidth <= 480) {
        columns = gameState.difficulty === 'easy' ? 8 : (gameState.difficulty === 'medium' ? 10 : 12);
    } else if (screenWidth <= 768) {
        columns = gameState.difficulty === 'easy' ? 10 : (gameState.difficulty === 'medium' ? 12 : 14);
    } else {
        columns = gameState.difficulty === 'easy' ? 10 : (gameState.difficulty === 'medium' ? 12 : 14);
    }

    // Set grid columns
    emojiContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    // Choose static emoji index
    gameState.staticEmojiIndex = Math.floor(Math.random() * config.totalEmojis);

    // Create emoji elements
    for (let i = 0; i < config.totalEmojis; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'emoji';

        const emojiContent = document.createElement('div');
        emojiContent.className = 'emoji-content';
        emojiContent.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        emoji.appendChild(emojiContent);
        emoji.addEventListener('click', () => checkEmoji(i));
        emojiContainer.appendChild(emoji);

        // Apply jitter animation for moving emojis
        if (i !== gameState.staticEmojiIndex) {
            const jitterRange = config.jitterRange;

            // Set 9 random jitter positions for the animation keyframes
            for (let j = 1; j <= 9; j++) {
                const jx = (Math.random() * 2 - 1) * jitterRange;
                const jy = (Math.random() * 2 - 1) * jitterRange;
                emoji.style.setProperty(`--jx${j}`, `${jx}px`);
                emoji.style.setProperty(`--jy${j}`, `${jy}px`);
            }

            emoji.classList.add('moving');
        } else {
            // 明确标记静止的emoji
            emoji.classList.add('static');
            // 可以添加一个小小的视觉提示，但不要太明显
            emoji.style.boxShadow = '0 0 2px rgba(0,0,0,0.2)';
        }
    }
}

// Check if the clicked emoji is the static one
function checkEmoji(index) {
    // Ignore clicks when paused
    if (gameState.isPaused) return;

    const config = difficulties[gameState.difficulty];
    const emojis = document.querySelectorAll('.emoji');

    if (index === gameState.staticEmojiIndex) {
        // Correct emoji found
        gameState.score += config.pointsPerFind;
        gameState.consecutiveCorrect++;

        // Bonus points for consecutive correct finds
        if (gameState.consecutiveCorrect > 1) {
            const bonus = Math.min(gameState.consecutiveCorrect - 1, 5);
            gameState.score += bonus;
            messageElement.textContent = `连续找对 ${gameState.consecutiveCorrect} 次! +${bonus} 分奖励!`;
        } else {
            messageElement.textContent = '恭喜你找到了不动的Emoji！';
        }

        // Update score
        scoreElement.textContent = `得分: ${gameState.score}`;

        // Visual feedback
        emojis[index].classList.add('correct');

        // Vibration feedback if available
        if (gameState.hasVibration) {
            navigator.vibrate(100);
        }

        // Create new emojis after a delay
        setTimeout(() => {
            createEmojis();
        }, 1000);
    } else {
        // Wrong emoji
        gameState.consecutiveCorrect = 0;
        messageElement.textContent = '这个不是静止的Emoji，请继续寻找。';

        // Visual feedback
        emojis[index].classList.add('wrong');

        // Vibration feedback if available
        if (gameState.hasVibration) {
            navigator.vibrate([50, 50, 50]);
        }

        // Remove wrong class after animation completes
        setTimeout(() => {
            emojis[index].classList.remove('wrong');
        }, 500);
    }
}

// Update timer
function updateTimer() {
    gameState.timeLeft -= 1;
    timerElement.textContent = `剩余时间: ${gameState.timeLeft}秒`;

    // Flash timer when time is running out
    if (gameState.timeLeft <= 10) {
        timerElement.style.color = gameState.timeLeft % 2 === 0 ? 'red' : '';
    }

    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// End game
function endGame() {
    clearInterval(gameState.gameInterval);
    finalScoreElement.textContent = `最终得分: ${gameState.score}`;
    showScreen('game-over-screen');
}

// Detect screen orientation changes
window.addEventListener('resize', () => {
    if (!gameState.isPaused && gameScreen.style.display !== 'none') {
        createEmojis();
    }
});

// Prevent scrolling on mobile
document.addEventListener('touchmove', function(e) {
    if (e.target.closest('#emoji-container')) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize the game
init();