document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const instructionsElem = document.getElementById('instructions');
    const statusElem = document.getElementById('status');
    const backToHomeButton = document.getElementById('back-to-home');
    const levelSelectionContainer = document.getElementById('level-selection-container');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeHowToPlayButton = document.getElementById('close-how-to-play');
    const showHowToPlayButton = document.getElementById('show-how-to-play');


    // Default values, will be overridden by levels
    let GRID_SIZE = 5; // Will be set by level
    // let startColor = 'hsl(120, 70%, 50%)'; // Set by level
    // let endColor = 'hsl(120, 70%, 80%)';   // Set by level
    let startTileCoords = { r: 0, c: 0 }; // Default, can be overridden by level
    let endTileCoords = { r: GRID_SIZE - 1, c: GRID_SIZE - 1 }; // Default, can be overridden by level

    let grid = []; // Stores the tile DOM elements
    let currentPath = []; // Stores {r, c, tile, color} of the current path
    let firstClick = true;
    let currentLevel = null; // To store the current level object
    let gameWon = false; // Flag to disable interactions after win

    // --- LEVEL DEFINITIONS ---
    const levels = [
        {
            levelName: "Level 1: Shades of Green",
            gridSize: 5,
            harmonyRule: 'shades',
            startColor: 'hsl(120, 70%, 50%)', // Green
            endColor: 'hsl(120, 70%, 80%)',   // Lighter Green
            description: "Find a path by stepping on shades of the same color (same Hue & Saturation, different Lightness)."
        },
        {
            levelName: "Level 2: Analogous Blues",
            gridSize: 6,
            harmonyRule: 'analogous',
            startColor: 'hsl(200, 60%, 50%)', // Blue
            endColor: 'hsl(230, 60%, 50%)',   // Indigo
            description: "Find a path using analogous colors (Hue difference within +/- 35 degrees, similar Saturation & Lightness)."
        },
        {
            levelName: "Level 3: Complementary Challenge",
            gridSize: 7,
            harmonyRule: 'complementary',
            startColor: 'hsl(60, 70%, 50%)',  // Yellow
            endColor: 'hsl(240, 70%, 50%)', // Purple
            description: "Find a path using complementary colors (Hue difference around 180 degrees, similar Saturation & Lightness)."
        }
    ];

    // --- COLOR PARSING AND HARMONY ---
    function parseHSL(hslString) {
        if (!hslString) return null;
        const regex = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/;
        const matches = hslString.match(regex);
        if (matches) {
            return {
                h: parseInt(matches[1]),
                s: parseInt(matches[2]),
                l: parseInt(matches[3]),
            };
        }
        return null;
    }

    function areShades(hslColor1, hslColor2) {
        const color1 = parseHSL(hslColor1);
        const color2 = parseHSL(hslColor2);

        if (!color1 || !color2) return false;

        // For shades, Hue and Saturation should be the same.
        return color1.h === color2.h && color1.s === color2.s && color1.l !== color2.l;
    }

    function areAnalogous(hslColor1, hslColor2, tolerance = 35, satLightTolerance = 15) {
        const color1 = parseHSL(hslColor1);
        const color2 = parseHSL(hslColor2);
        if (!color1 || !color2) return false;

        const hueDiff = Math.abs(color1.h - color2.h);
        const hueDistance = Math.min(hueDiff, 360 - hueDiff); // Accounts for hue circle wrap around

        const satDiff = Math.abs(color1.s - color2.s);
        const lightDiff = Math.abs(color1.l - color2.l);

        return hueDistance <= tolerance && hueDistance !== 0 && // hueDistance !== 0 to avoid matching same color if not intended
               satDiff <= satLightTolerance &&
               lightDiff <= satLightTolerance;
    }

    function areComplementary(hslColor1, hslColor2, hueTolerance = 30, satLightTolerance = 20) {
        const color1 = parseHSL(hslColor1);
        const color2 = parseHSL(hslColor2);
        if (!color1 || !color2) return false;

        const hueDiff = Math.abs(color1.h - color2.h);
        const idealCompDiff = 180;
        const hueDistance = Math.min(Math.abs(hueDiff - idealCompDiff), 360 - Math.abs(hueDiff - idealCompDiff));

        const satDiff = Math.abs(color1.s - color2.s);
        const lightDiff = Math.abs(color1.l - color2.l);

        return hueDistance <= hueTolerance &&
               satDiff <= satLightTolerance &&
               lightDiff <= satLightTolerance;
    }


    // --- GRID GENERATION ---
    function createGrid() {
        if (!currentLevel) {
            statusElem.textContent = "Please select a level to start.";
            gridContainer.innerHTML = ''; // Clear grid if no level selected
            return;
        }
        gameWon = false;
        gridContainer.classList.remove('grid-win-animation'); // Remove win animation class

        // Level transition - fade out
        gridContainer.style.opacity = '0';

        setTimeout(() => {
            gridContainer.innerHTML = ''; // Clear previous grid
            GRID_SIZE = currentLevel.gridSize;
            // startColor = currentLevel.startColor; // Not needed as global, use currentLevel.startColor
            // endColor = currentLevel.endColor;     // Not needed as global, use currentLevel.endColor
            startTileCoords = currentLevel.startTileCoords || { r: 0, c: 0 };
            endTileCoords = currentLevel.endTileCoords || { r: GRID_SIZE - 1, c: GRID_SIZE - 1 };

            const tileSize = getComputedStyle(document.documentElement).getPropertyValue('--tile-size');
            gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${tileSize})`;
            gridContainer.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${tileSize})`;
            grid = []; // Reset grid array
            statusElem.textContent = ""; // Clear previous status
            resetPath();

            for (let r = 0; r < GRID_SIZE; r++) {
                const rowArray = [];
                for (let c = 0; c < GRID_SIZE; c++) {
                    const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.dataset.r = r;
                tile.dataset.c = c;

                let tileColor;
                if (r === startTileCoords.r && c === startTileCoords.c) {
                    tileColor = currentLevel.startColor;
                    tile.classList.add('start-tile');
                } else if (r === endTileCoords.r && c === endTileCoords.c) {
                    tileColor = currentLevel.endColor;
                    tile.classList.add('end-tile');
                } else {
                    // Simplified random color generation for now.
                    // TODO: Implement more intelligent color generation to ensure solvable paths.
                    const baseColor = parseHSL(currentLevel.startColor);
                    let randomH, randomS, randomL;

                    if (currentLevel.harmonyRule === 'shades') {
                        randomH = baseColor.h;
                        randomS = baseColor.s;
                        randomL = Math.floor(Math.random() * 70) + 15; // Wider range of lightness
                    } else if (currentLevel.harmonyRule === 'analogous') {
                        randomH = (baseColor.h + (Math.random() * 70 - 35) + 360) % 360; // +/- 35 hue
                        randomS = Math.max(0, Math.min(100, baseColor.s + (Math.random() * 30 - 15))); // +/- 15 sat
                        randomL = Math.max(0, Math.min(100, baseColor.l + (Math.random() * 30 - 15))); // +/- 15 light
                    } else if (currentLevel.harmonyRule === 'complementary') {
                        // More likely to generate complementary or near-complementary
                        if (Math.random() < 0.3) { // 30% chance of being near complementary
                            randomH = (baseColor.h + 180 + (Math.random() * 60 - 30) + 360) % 360; // +/- 30 around complementary
                            randomS = Math.max(0, Math.min(100, baseColor.s + (Math.random() * 40 - 20))); // +/- 20 sat
                            randomL = Math.max(0, Math.min(100, baseColor.l + (Math.random() * 40 - 20))); // +/- 20 light
                        } else { // general random
                            randomH = Math.floor(Math.random() * 360);
                            randomS = Math.floor(Math.random() * 70) + 30;
                            randomL = Math.floor(Math.random() * 70) + 15;
                        }
                    } else { // Default random
                        randomH = Math.floor(Math.random() * 360);
                        randomS = Math.floor(Math.random() * 70) + 30; // Avoid too washed out/too vibrant
                        randomL = Math.floor(Math.random() * 70) + 15; // Avoid too dark/too light
                    }
                    tileColor = `hsl(${randomH}, ${randomS}%, ${randomL}%)`;
                }
                tile.style.backgroundColor = tileColor;
                    tile.dataset.color = tileColor;
                    // tile.textContent = `(${r},${c})`; // For debugging tile coords

                    tile.addEventListener('click', handleTileClick);
                    tile.addEventListener('mouseover', handleTileMouseOver);
                    tile.addEventListener('mouseout', handleTileMouseOut);

                    gridContainer.appendChild(tile);
                    rowArray.push(tile);
                }
                grid.push(rowArray);
            }
            instructionsElem.textContent = currentLevel.description;
            gridContainer.style.opacity = '1'; // Fade in
        }, 200); // Delay matches CSS transition for fade
    }

    function isValidNextStep(lastPathTileColor, nextTileColor, rule) {
        if (rule === 'shades') return areShades(lastPathTileColor, nextTileColor);
        if (rule === 'analogous') return areAnalogous(lastPathTileColor, nextTileColor);
        if (rule === 'complementary') return areComplementary(lastPathTileColor, nextTileColor);
        return false;
    }

    function handleTileMouseOver(event) {
        if (gameWon || firstClick || !currentLevel) return;
        if (currentPath.length === 0) return;

        const tile = event.target;
        const r = parseInt(tile.dataset.r);
        const c = parseInt(tile.dataset.c);
        const color = tile.dataset.color;

        const lastPathTile = currentPath[currentPath.length - 1];
        const isAdjacent = (Math.abs(r - lastPathTile.r) === 1 && c === lastPathTile.c) ||
                           (Math.abs(c - lastPathTile.c) === 1 && r === lastPathTile.r);

        if (isAdjacent && !currentPath.some(p => p.r === r && p.c === c)) {
            if (isValidNextStep(lastPathTile.color, color, currentLevel.harmonyRule)) {
                tile.classList.add('valid-next-hover');
            }
        }
    }

    function handleTileMouseOut(event) {
        event.target.classList.remove('valid-next-hover');
    }


    // --- PLAYER INTERACTION ---
    function handleTileClick(event) {
        if (gameWon || !currentLevel) return;

        const clickedTile = event.target;
        const r = parseInt(clickedTile.dataset.r);
        const c = parseInt(clickedTile.dataset.c);
        const clickedColor = clickedTile.dataset.color;

        // Visual feedback for click
        clickedTile.classList.add('clicked-feedback');
        setTimeout(() => clickedTile.classList.remove('clicked-feedback'), 300);


        if (firstClick) {
            if (r === startTileCoords.r && c === startTileCoords.c) {
                if (clickedColor !== currentLevel.startColor) {
                    statusElem.textContent = `Please click the tile with the exact start color: ${currentLevel.startColor}.`;
                    triggerInvalidMoveAnimation(clickedTile);
                    return;
                }
                currentPath = [{ r, c, tile: clickedTile, color: clickedColor }];
                clickedTile.classList.add('selected-tile', 'path-tile');
                firstClick = false;
                statusElem.textContent = "Path started. Select an adjacent tile.";
            } else {
                statusElem.textContent = "Please start by clicking the designated start tile.";
                triggerInvalidMoveAnimation(clickedTile);
            }
        } else {
            const lastPathTile = currentPath[currentPath.length - 1];
            const lastTileElem = lastPathTile.tile;

            const isAdjacent = (Math.abs(r - lastPathTile.r) === 1 && c === lastPathTile.c) ||
                               (Math.abs(c - lastPathTile.c) === 1 && r === lastPathTile.r);

            if (isAdjacent) {
                if (isValidNextStep(lastPathTile.color, clickedColor, currentLevel.harmonyRule)) {
                    if (currentPath.some(p => p.r === r && p.c === c)) {
                        statusElem.textContent = "Tile already in path. Choose another.";
                        triggerInvalidMoveAnimation(clickedTile);
                        return;
                    }
                    currentPath.push({ r, c, tile: clickedTile, color: clickedColor });
                    clickedTile.classList.add('selected-tile', 'path-tile');
                    if (lastTileElem) lastTileElem.classList.remove('selected-tile');

                    if (r === endTileCoords.r && c === endTileCoords.c) {
                        if (clickedColor === currentLevel.endColor) {
                            gameWon = true;
                            statusElem.textContent = "You Win! Path complete!";
                            gridContainer.classList.add('grid-win-animation');
                            currentPath.forEach(p => p.tile.classList.add('final-path')); // could add specific style for final path
                            // Disable further clicks effectively by gameWon flag
                        } else {
                            statusElem.textContent = `Reached end tile position, but not the correct end color (${currentLevel.endColor}). Path reset.`;
                            triggerInvalidMoveAnimation(clickedTile, true); // Pass true to reset path
                        }
                    } else {
                        statusElem.textContent = `Step added. Continue using ${currentLevel.harmonyRule}.`;
                    }
                } else {
                    statusElem.textContent = `Not a valid ${currentLevel.harmonyRule} step. Path reset.`;
                    triggerInvalidMoveAnimation(clickedTile, true);
                }
            } else {
                statusElem.textContent = "Not an adjacent tile. Path reset.";
                triggerInvalidMoveAnimation(clickedTile, true);
            }
        }
    }

    function triggerInvalidMoveAnimation(tile, shouldResetPath = false) {
        tile.classList.add('invalid-move-shake');
        setTimeout(() => tile.classList.remove('invalid-move-shake'), 400);
        if (shouldResetPath) {
            resetPath();
        }
    }

    function resetPath() {
        currentPath.forEach(p => {
            if (p.tile) {
                p.tile.classList.remove('selected-tile', 'path-tile', 'final-path');
            }
        });
        currentPath = [];
        firstClick = true;
        // statusElem.textContent is usually set by the caller of resetPath or subsequent action
    }

    // --- LEVEL LOADING AND INITIALIZATION ---
    function loadLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= levels.length) {
            console.error("Invalid level index:", levelIndex);
            return;
        }
        currentLevel = levels[levelIndex];
        GRID_SIZE = currentLevel.gridSize; // Ensure GRID_SIZE is updated for other functions if they use it
        
        // Hide modal if it's open when a level is selected
        if (howToPlayModal) howToPlayModal.style.display = 'none';

        createGrid(); // This will now use currentLevel properties
        instructionsElem.textContent = currentLevel.description;
        statusElem.textContent = "Level loaded. Click the start tile to begin.";
    }

    function populateLevelSelection() {
        if (!levelSelectionContainer) return;
        levelSelectionContainer.innerHTML = ''; // Clear previous buttons
        levels.forEach((level, index) => {
            const button = document.createElement('button');
            button.textContent = level.levelName;
            button.addEventListener('click', () => loadLevel(index));
            levelSelectionContainer.appendChild(button);
        });
    }

    function setupModal() {
        if (!howToPlayModal || !closeHowToPlayButton || !showHowToPlayButton) return;

        showHowToPlayButton.addEventListener('click', () => {
            howToPlayModal.style.display = 'flex';
        });
        closeHowToPlayButton.addEventListener('click', () => {
            howToPlayModal.style.display = 'none';
        });
        // Show modal by default if no level is selected (i.e., on first load)
        if (!currentLevel) {
            howToPlayModal.style.display = 'flex';
        }
    }

    function initGame() {
        populateLevelSelection();
        setupModal(); // Setup modal listeners and show if needed

        if (!currentLevel) {
            instructionsElem.textContent = "Welcome! Select a level or read 'How to Play'.";
            gridContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Select a level to start the game.</p>';
        }


        if (backToHomeButton) {
            backToHomeButton.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Navigation to main page (placeholder). Game state will be reset.");
                currentLevel = null;
                gameWon = false;
                gridContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Select a level to start the game.</p>';
                gridContainer.classList.remove('grid-win-animation');
                instructionsElem.textContent = "Select a level to begin.";
                statusElem.textContent = "";
                resetPath();
                howToPlayModal.style.display = 'flex'; // Show instructions again
            });
        }
        // Adjust grid size dynamically on window resize
        window.addEventListener('resize', () => {
            if (currentLevel) { // Only redraw if a level is active
                // Debounce or throttle this if performance becomes an issue
                createGrid(); 
            }
        });
    }

    initGame();
});
