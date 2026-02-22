const STORAGE_KEY = 'sunset-game-highscores';
const PLAYERS_KEY = 'sunset-game-players';
const VERSION = '1.4';  /* עדכן בכל שחרור גרסה */

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('playButton');
    const startScreen = document.getElementById('startScreen');
    const countdownScreen = document.getElementById('countdownScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const countdownNumber = document.getElementById('countdownNumber');
    const clickCountEl = document.getElementById('clickCount');
    const finalClickCountEl = document.getElementById('finalClickCount');
    const playerSelect = document.getElementById('playerSelect');
    const playerNameError = document.getElementById('playerNameError');
    const highScoresList = document.getElementById('highScoresList');

    const CANDIES = ['🍬', '🍭', '🍫', '🍪', '🍩', '🧁', '🍰', '🎂', '🍦', '🥧', '🍡', '🍫'];
    const bgMusic = document.getElementById('bgMusic');
    let clickCount = 0;
    let countdownActive = false;
    let countdownInterval = null;
    let candiesAnimationId = null;
    let candies = [];

    function getHighScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function getKnownPlayers() {
        try {
            const data = localStorage.getItem(PLAYERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveHighScores(scores) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        renderHighScores();
    }

    function addKnownPlayer(name) {
        const nameTrimmed = name.trim();
        if (!nameTrimmed) return;
        const players = getKnownPlayers();
        if (!players.includes(nameTrimmed)) {
            players.push(nameTrimmed);
            localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
            updatePlayerSelect();
        }
    }

    const ADD_NEW_VALUE = '__add_new__';

    function updatePlayerSelect() {
        const players = getKnownPlayers();
        const current = playerSelect.value;
        playerSelect.innerHTML =
            '<option value="">בחר שחקן</option>' +
            players.map(p => `<option value="${p.replace(/"/g, '&quot;')}">${p.replace(/</g, '&lt;')}</option>`).join('') +
            `<option value="${ADD_NEW_VALUE}">➕ הוסף שם חדש</option>`;
        if (current && current !== ADD_NEW_VALUE && players.includes(current)) {
            playerSelect.value = current;
        } else if (players.length > 0 && !current) {
            playerSelect.value = players[0];
        }
    }

    function deletePlayer(playerName) {
        const scores = getHighScores().filter(e => e.name !== playerName);
        saveHighScores(scores);
        const players = getKnownPlayers().filter(p => p !== playerName);
        localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
        updatePlayerSelect();
    }

    function renderHighScores() {
        const scores = getHighScores();
        const byPlayer = {};
        scores.forEach(entry => {
            const current = byPlayer[entry.name];
            if (!current || entry.score > current) {
                byPlayer[entry.name] = entry.score;
            }
        });
        const unique = Object.entries(byPlayer)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        highScoresList.innerHTML = unique.map(entry =>
            `<li><span class="score-entry">${entry.name}: ${entry.score}</span><button class="score-delete" data-name="${entry.name.replace(/"/g, '&quot;')}" aria-label="מחק">×</button></li>`
        ).join('');
        highScoresList.querySelectorAll('.score-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`למחוק את ${btn.dataset.name} מהשיאים?`)) {
                    deletePlayer(btn.dataset.name);
                }
            });
        });
    }

    function showScreen(screen) {
        startScreen.classList.add('hidden');
        countdownScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        screen.classList.remove('hidden');
        const inGame = screen === countdownScreen || screen === resultsScreen;
        document.body.classList.toggle('in-game', inGame);
        playerSelect.tabIndex = inGame ? -1 : 0;
        if (screen === startScreen) {
            try { bgMusic.currentTime = 0; bgMusic.play().catch(() => {}); } catch (_) {}
        } else {
            bgMusic.pause();
        }
    }

    function startCandies() {
        const container = document.getElementById('candiesContainer');
        container.innerHTML = '';
        candies = [];
        const count = 15;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'candy';
            el.textContent = CANDIES[Math.floor(Math.random() * CANDIES.length)];
            const size = 24 + Math.random() * 24;
            el.style.fontSize = size + 'px';
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            candies.push({
                el,
                x,
                y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
            });
            el.style.transform = `translate(${x}px, ${y}px)`;
            container.appendChild(el);
        }

        function animate() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            candies.forEach(c => {
                c.x += c.vx * 0.016;
                c.y += c.vy * 0.016;
                if (c.x < 0 || c.x > w) c.vx *= -1;
                if (c.y < 0 || c.y > h) c.vy *= -1;
                c.x = Math.max(0, Math.min(w, c.x));
                c.y = Math.max(0, Math.min(h, c.y));
                c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
            });
            candiesAnimationId = requestAnimationFrame(animate);
        }
        animate();
    }

    function stopCandies() {
        if (candiesAnimationId) {
            cancelAnimationFrame(candiesAnimationId);
            candiesAnimationId = null;
        }
        document.getElementById('candiesContainer').innerHTML = '';
        candies = [];
    }

    function startCountdown() {
        playerSelect.blur();
        document.activeElement?.blur?.();
        showScreen(countdownScreen);
        clickCount = 0;
        clickCountEl.textContent = '0';
        countdownActive = true;
        startCandies();

        let tenths = 50;
        countdownNumber.textContent = (tenths / 10).toFixed(1);

        countdownInterval = setInterval(() => {
            tenths--;
            countdownNumber.textContent = (tenths / 10).toFixed(1);

            if (tenths <= 0) {
                clearInterval(countdownInterval);
                countdownActive = false;
                stopCandies();
                showResults();
            }
        }, 100);
    }

    function showResults() {
        finalClickCountEl.textContent = clickCount;
        showScreen(resultsScreen);

        const playerName = (playerSelect.value && playerSelect.value !== ADD_NEW_VALUE ? playerSelect.value : 'שחקן').trim() || 'שחקן';
        addKnownPlayer(playerName);
        const scores = getHighScores();
        const existingIndex = scores.findIndex(e => e.name === playerName);
        if (existingIndex >= 0) {
            scores[existingIndex].score = Math.max(scores[existingIndex].score, clickCount);
        } else {
            scores.push({ name: playerName, score: clickCount });
        }
        const byPlayer = {};
        scores.forEach(entry => {
            const current = byPlayer[entry.name];
            if (!current || entry.score > current) {
                byPlayer[entry.name] = entry.score;
            }
        });
        const unique = Object.entries(byPlayer)
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);
        saveHighScores(unique);

        setTimeout(returnToStart, 5000);
    }

    function returnToStart() {
        showScreen(startScreen);
    }

    const activePointers = new Set();

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        document.getElementById('ripplesContainer').appendChild(ripple);
        setTimeout(() => ripple.remove(), 850);
    }

    function handleGameTap(e) {
        if (e.target === playerSelect || playerSelect.contains(e.target)) return;
        if (countdownActive) {
            if (activePointers.size === 0) {
                clickCount++;
                clickCountEl.textContent = clickCount;
            }
            createRipple(e.clientX, e.clientY);
        }
        activePointers.add(e.pointerId);
    }

    function handlePointerUp(e) {
        activePointers.delete(e.pointerId);
    }

    document.addEventListener('pointerdown', handleGameTap);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    function tryStartGame() {
        const name = (playerSelect.value && playerSelect.value !== ADD_NEW_VALUE ? playerSelect.value : '').trim();
        if (!name) {
            playerNameError.classList.remove('hidden');
            playerSelect.classList.add('error');
            return false;
        }
        playerNameError.classList.add('hidden');
        playerSelect.classList.remove('error');
        startScreen.classList.add('hidden');
        startCountdown();
        return true;
    }

    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space') return;
        if (countdownActive) {
            e.preventDefault();
            clickCount++;
            clickCountEl.textContent = clickCount;
        } else if (document.activeElement !== playerSelect) {
            e.preventDefault();
            if (!startScreen.classList.contains('hidden')) {
                startBgMusic();
                tryStartGame();
            }
        }
    });

    function startBgMusic() {
        try { bgMusic.play().catch(() => {}); } catch (_) {}
    }

    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startBgMusic();
        tryStartGame();
    });

    document.addEventListener('pointerdown', () => startBgMusic(), { once: true });

    playerSelect.addEventListener('change', () => {
        if (playerSelect.value === ADD_NEW_VALUE) {
            const newName = prompt('הכנס שם חדש:');
            if (newName && newName.trim()) {
                addKnownPlayer(newName.trim());
                playerSelect.value = newName.trim();
                playerNameError.classList.add('hidden');
                playerSelect.classList.remove('error');
            } else {
                playerSelect.value = getKnownPlayers()[0] || '';
            }
        } else if (playerSelect.value) {
            playerNameError.classList.add('hidden');
            playerSelect.classList.remove('error');
        }
    });

    updatePlayerSelect();
    renderHighScores();
    document.getElementById('versionEl').textContent = 'v' + VERSION;
});
