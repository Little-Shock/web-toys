const emojiContainer = document.getElementById('emoji-container');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];
const totalEmojis = 200;
const columns = 20; // 设置列数，行数将自动计算
let staticEmojiIndex;
let score = 0;
let timeLeft = 60; // 1分钟
let gameInterval;

function createEmojis() {
    emojiContainer.innerHTML = ''; // 清空容器
    staticEmojiIndex = Math.floor(Math.random() * totalEmojis);
    for (let i = 0; i < totalEmojis; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'emoji';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.addEventListener('click', () => checkEmoji(i));
        emojiContainer.appendChild(emoji);
    }
}

function animateEmojis() {
    const emojiElements = document.querySelectorAll('.emoji');
    emojiElements.forEach((emoji, index) => {
        if (index !== staticEmojiIndex) {
            const speed = Math.random() * 1 + 0.2; // 减小速度范围
            const angle = Math.random() * 360;
            emoji.style.transform = `translate(${Math.cos(angle) * speed}px, ${Math.sin(angle) * speed}px)`;
        }
    });
    requestAnimationFrame(animateEmojis);
}

function checkEmoji(index) {
    if (index === staticEmojiIndex) {
        score += 1;
        scoreElement.textContent = `得分: ${score}`;
        messageElement.textContent = '恭喜你找到了不动的Emoji！';
        setTimeout(() => {
            messageElement.textContent = '';
            createEmojis();
        }, 1000);
    } else {
        messageElement.textContent = '这个不是静止的Emoji，请继续寻找。';
    }
}

function updateTimer() {
    timeLeft -= 1;
    timerElement.textContent = `剩余时间: ${timeLeft}秒`;
    if (timeLeft <= 0) {
        endGame();
    }
}

function startGame() {
    score = 0;
    timeLeft = 60;
    scoreElement.textContent = `得分: ${score}`;
    timerElement.textContent = `剩余时间: ${timeLeft}秒`;
    createEmojis();
    animateEmojis();
    gameInterval = setInterval(updateTimer, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    messageElement.textContent = `游戏结束！你的最终得分是: ${score}`;
    emojiContainer.innerHTML = '';
    setTimeout(() => {
        if (confirm('是否要重新开始游戏？')) {
            startGame();
        }
    }, 2000);
}

startGame();