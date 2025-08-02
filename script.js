// Global variables
let currentGameType = '';
let selectedPlayers = [];
let gameScores = [];
let playerTotals = [];
let pointDistribution = []; // Track who made which points in 3-2-5 game

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    showHome();
});

// Navigation functions
function showHome() {
    hideAllScreens();
    document.getElementById('homeScreen').classList.add('active');
    resetGame();
}

function showPlayerSelection(gameType) {
    currentGameType = gameType;
    hideAllScreens();
    document.getElementById('playerSelectionScreen').classList.add('active');
    
    // Update UI based on game type
    const title = document.getElementById('selectionTitle');
    const instructions = document.getElementById('selectionInstructions');
    const startBtn = document.getElementById('startGameBtn');
    
    if (gameType === '325') {
        title.textContent = '3 2 5 - Select Players';
        instructions.textContent = 'Select exactly 3 players for 3-2-5 game:';
        startBtn.textContent = 'Start Game (0/3)';
    } else {
        title.textContent = 'Plus Minus - Select Players';
        instructions.textContent = 'Select 3 or 4 players for Plus Minus game:';
        startBtn.textContent = 'Start Game (0/3-4)';
    }
    
    // Reset checkboxes
    const checkboxes = document.querySelectorAll('.player-checkbox input');
    checkboxes.forEach(cb => cb.checked = false);
    selectedPlayers = [];
    updateStartButton();
}

function showGame() {
    hideAllScreens();
    document.getElementById('gameScreen').classList.add('active');
    
    // Update game title
    const gameTitle = document.getElementById('gameTitle');
    gameTitle.textContent = currentGameType === '325' ? '3 2 5 Game' : 'Plus Minus Game';
    
    // Setup game
    setupGameTable();
    setupInputSection();
    updateGameRules();
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
}

// Player selection functions
function updatePlayerSelection() {
    const checkboxes = document.querySelectorAll('.player-checkbox input:checked');
    selectedPlayers = Array.from(checkboxes).map(cb => cb.value);
    updateStartButton();
}

function updateStartButton() {
    const startBtn = document.getElementById('startGameBtn');
    const maxPlayers = currentGameType === '325' ? 3 : 4;
    const minPlayers = currentGameType === '325' ? 3 : 3;
    
    if (currentGameType === '325') {
        startBtn.textContent = `Start Game (${selectedPlayers.length}/3)`;
        startBtn.disabled = selectedPlayers.length !== 3;
    } else {
        startBtn.textContent = `Start Game (${selectedPlayers.length}/3-4)`;
        startBtn.disabled = selectedPlayers.length < 3;
    }
    
    // Disable checkboxes if max players reached
    const checkboxes = document.querySelectorAll('.player-checkbox input');
    checkboxes.forEach(cb => {
        if (!cb.checked && selectedPlayers.length >= maxPlayers) {
            cb.disabled = true;
            cb.parentElement.style.opacity = '0.5';
        } else {
            cb.disabled = false;
            cb.parentElement.style.opacity = '1';
        }
    });
}

function startGame() {
    if (selectedPlayers.length >= 3) {
        resetGame();
        showGame();
    }
}

// Game setup functions
function resetGame() {
    gameScores = [];
    playerTotals = selectedPlayers.map(() => 0);
    pointDistribution = [];
}

function setupGameTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableFooter = document.getElementById('tableFooter');
    
    // Create header
    tableHeader.innerHTML = selectedPlayers.map(player => 
        `<div>${player.charAt(0)}</div>`
    ).join('');
    
    // Create footer (totals)
    updateTotals();
    
    // Clear table body
    document.getElementById('tableBody').innerHTML = '';
}

function setupInputSection() {
    const inputRow = document.getElementById('inputRow');
    inputRow.innerHTML = selectedPlayers.map((player, index) => 
        `<input type="number" class="score-input" id="input${index}" placeholder="${getInputPlaceholder()}" oninput="handleInputChange(${index})">`
    ).join('');
    
    // Setup rules section
    setupRulesSection();
}

function getInputPlaceholder() {
    return currentGameType === '325' ? '±3,2,5' : '≥2';
}

function setupRulesSection() {
    const gameRules = document.getElementById('gameRules');
    
    const rulesContent = currentGameType === '325' ? `
        <strong>3-2-5 Rules:</strong><br>
        • Only scores allowed: 3, 2, 5, -3, -2, -5<br>
        • If you fail to make your target, you get negative of that target<br>
        • All three scores (3, 2, 5) must be distributed each round
    ` : `
        <strong>Plus Minus Rules:</strong><br>
        • Minimum individual score: 2 (or negative for failed attempts)<br>
        • Maximum individual score: 13<br>
        • Total of all scores must be 10 or more
    `;
    
    gameRules.innerHTML = `
        <div class="rules-section">
            <button class="rules-toggle" onclick="toggleRules()">
                <span>Game Rules</span>
                <span class="arrow">▼</span>
            </button>
            <div class="game-rules" id="rulesContent">
                ${rulesContent}
            </div>
        </div>
    `;
}

function toggleRules() {
    const rulesToggle = document.querySelector('.rules-toggle');
    const rulesContent = document.getElementById('rulesContent');
    
    rulesToggle.classList.toggle('active');
    rulesContent.classList.toggle('active');
}

function updateGameRules() {
    // This function is now handled by setupRulesSection
}

// Game logic functions
function addRound() {
    const inputs = selectedPlayers.map((_, index) => 
        document.getElementById(`input${index}`)
    );
    
    const scores = inputs.map(input => {
        const value = input.value.trim();
        return value === '' ? null : parseInt(value);
    });
    
    // Validate input
    const validation = validateScores(scores);
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    // Add scores to game
    gameScores.push(scores);
    
    // Handle point distribution for 3-2-5 game
    if (currentGameType === '325') {
        handlePointDistribution(scores);
    }
    
    // Update totals
    scores.forEach((score, index) => {
        playerTotals[index] += score;
    });
    
    // Update display
    addScoreRow(scores);
    updateTotals();
    
    // Clear inputs
    inputs.forEach(input => input.value = '');
    
    // Remove any error messages
    removeError();
}

function validateScores(scores) {
    // Check if all fields are filled
    if (scores.some(score => score === null)) {
        return { valid: false, message: 'Please fill all score fields' };
    }
    
    if (currentGameType === '325') {
        return validate325Scores(scores);
    } else {
        return validatePlusMinusScores(scores);
    }
}

function validate325Scores(scores) {
    const validScores = [3, 2, 5, -3, -2, -5];
    
    // Check if all scores are valid
    for (let score of scores) {
        if (!validScores.includes(score)) {
            return { valid: false, message: 'Only scores 3, 2, 5, -3, -2, -5 are allowed' };
        }
    }
    
    // Check for duplicates
    const duplicates = scores.filter((score, index) => scores.indexOf(score) !== index);
    if (duplicates.length > 0) {
        return { 
            valid: false, 
            message: `Duplicate scores not allowed: ${duplicates.join(', ')}` 
        };
    }
    
    // Check if we have exactly one of each value (considering absolute values)
    const absoluteScores = scores.map(score => Math.abs(score)).sort();
    const expectedScores = [2, 3, 5];
    
    if (JSON.stringify(absoluteScores) !== JSON.stringify(expectedScores)) {
        return { 
            valid: false, 
            message: 'Must use exactly one each of 3, 2, and 5 (positive or negative).' 
        };
    }
    
    return { valid: true };
}

function validatePlusMinusScores(scores) {
    // Check minimum score (2 or negative) and maximum score (13)
    for (let score of scores) {
        if (score >= 0 && score < 2) {
            return { valid: false, message: 'Minimum score is 2 (or negative for failed attempts)' };
        }
        if (score > 13) {
            return { valid: false, message: 'Maximum score is 13' };
        }
    }
    
    // Check total is 10 or more
    const total = scores.reduce((sum, score) => sum + score, 0);
    if (total < 10) {
        return { valid: false, message: 'Total of all scores must be 10 or more' };
    }
    
    return { valid: true };
}

function handlePointDistribution(scores) {
    // Check for negative scores (failed targets)
    const hasNegativeScores = scores.some(score => score < 0);
    
    if (hasNegativeScores) {
        // Ask who made the points for failed players
        const roundDistribution = {};
        
        scores.forEach((score, playerIndex) => {
            if (score < 0) {
                // This player failed, ask who made their points
                const targetValue = Math.abs(score);
                roundDistribution[playerIndex] = {
                    target: targetValue,
                    failed: true,
                    madeBy: [] // Will be filled by user input
                };
            } else {
                roundDistribution[playerIndex] = {
                    target: score,
                    failed: false,
                    madeBy: [playerIndex] // Made their own points
                };
            }
        });
        
        pointDistribution.push(roundDistribution);
        
        // Show point distribution modal for failed players
        showPointDistributionModal(scores);
    } else {
        // No failures, everyone made their own points
        const roundDistribution = {};
        scores.forEach((score, playerIndex) => {
            roundDistribution[playerIndex] = {
                target: score,
                failed: false,
                madeBy: [playerIndex]
            };
        });
        pointDistribution.push(roundDistribution);
    }
}

function addScoreRow(scores) {
    const tableBody = document.getElementById('tableBody');
    const row = document.createElement('div');
    row.className = 'score-row';
    const roundIndex = gameScores.length - 1; // Current round index
    
    row.innerHTML = scores.map((score, playerIndex) => {
        let cellContent = `${score}`;
        let distributionText = '';
        
        // Add distribution info for 3-2-5 game
        if (currentGameType === '325' && pointDistribution[roundIndex]) {
            const distribution = pointDistribution[roundIndex][playerIndex];
            if (distribution && distribution.failed && distribution.distribution) {
                const distributionParts = [];
                Object.entries(distribution.distribution).forEach(([pIndex, amount]) => {
                    if (amount > 0 && parseInt(pIndex) !== playerIndex) {
                        const playerName = selectedPlayers[parseInt(pIndex)];
                        distributionParts.push(`${playerName}: ${amount}`);
                    }
                });
                if (distributionParts.length > 0) {
                    distributionText = `<div class="distribution-text">${distributionParts.join(', ')}</div>`;
                }
            }
        }
        
        return `<div class="score-cell ${score < 0 ? 'negative' : 'positive'}" 
                     onclick="toggleScore(${roundIndex}, ${playerIndex})" 
                     title="Click to toggle failed/success">
                    ${cellContent}
                    ${distributionText}
                </div>`;
    }).join('');
    
    tableBody.appendChild(row);
    
    // Scroll to bottom
    tableBody.scrollTop = tableBody.scrollHeight;
}

function updateTotals() {
    const tableFooter = document.getElementById('tableFooter');
    
    // Add total divider before the totals
    const tableBody = document.getElementById('tableBody');
    
    // Remove existing total divider if any
    const existingDivider = document.querySelector('.total-divider');
    if (existingDivider) existingDivider.remove();
    
    // Add total divider
    if (gameScores.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'total-divider';
        tableBody.appendChild(divider);
    }
    
    // Update footer with totals
    tableFooter.innerHTML = playerTotals.map(total => 
        `<div class="${total < 0 ? 'negative' : ''}"><strong>${total}</strong></div>`
    ).join('');
}

// Winner functions
function showWinner() {
    const maxScore = Math.max(...playerTotals);
    const winners = [];
    
    playerTotals.forEach((total, index) => {
        if (total === maxScore) {
            winners.push(selectedPlayers[index]);
        }
    });
    
    const winnerText = document.getElementById('winnerText');
    if (winners.length === 1) {
        winnerText.textContent = `Winner: ${winners[0]} with ${maxScore} points!`;
    } else {
        winnerText.textContent = `Tie between: ${winners.join(', ')} with ${maxScore} points!`;
    }
    
    document.getElementById('winnerModal').classList.add('active');
}

function showPointDistributionModal(scores) {
    const failedPlayers = [];
    scores.forEach((score, index) => {
        if (score < 0) {
            failedPlayers.push({
                index: index,
                name: selectedPlayers[index],
                target: Math.abs(score)
            });
        }
    });
    
    if (failedPlayers.length === 0) return;
    
    // Create modal content
    let modalContent = '<h3>Point Distribution</h3>';
    modalContent += '<p>Who made the points for failed players?</p>';
    
    failedPlayers.forEach(player => {
        modalContent += `
            <div class="distribution-question">
                <strong>${player.name}</strong> failed to make <strong>${player.target}</strong> points.
                <br>Who made these points?
                <div class="player-checkboxes">
        `;
        
        selectedPlayers.forEach((otherPlayer, otherIndex) => {
            if (otherIndex !== player.index) {
                modalContent += `
                    <label>
                        <input type="checkbox" name="made-${player.index}" value="${otherIndex}">
                        ${otherPlayer}
                    </label>
                `;
            }
        });
        
        modalContent += '</div></div>';
    });
    
    modalContent += '<button onclick="savePointDistribution()" class="primary">Save Distribution</button>';
    
    // Show modal (you'll need to create this modal in HTML)
    showCustomModal(modalContent);
}

function savePointDistribution() {
    const roundIndex = pointDistribution.length - 1;
    const distribution = pointDistribution[roundIndex];
    
    // Update distribution based on user input
    Object.keys(distribution).forEach(playerIndex => {
        const playerData = distribution[playerIndex];
        if (playerData.failed) {
            const checkboxes = document.querySelectorAll(`input[name="made-${playerIndex}"]:checked`);
            playerData.madeBy = Array.from(checkboxes).map(cb => parseInt(cb.value));
        }
    });
    
    // Close modal and refresh display
    closeCustomModal();
    recalculateTotals();
    updateScoreDisplay();
}

function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

function goHome() {
    closeWinnerModal();
    showHome();
}

// Custom modal functions
function showCustomModal(content) {
    // Use the existing winner modal structure
    const modal = document.getElementById('winnerModal');
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = content;
    modal.classList.add('active');
}

function closeCustomModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

function showSinglePlayerDistributionModal(roundIndex, playerIndex, targetValue) {
    const playerName = selectedPlayers[playerIndex];
    
    // Create modal content for single player
    let modalContent = '<h3>Point Distribution</h3>';
    modalContent += `<p><strong>${playerName}</strong> aimed for <strong>${targetValue}</strong> points.</p>`;
    modalContent += '<p>How much did each player make?</p>';
    
    modalContent += `
        <div class="distribution-question">
            <div class="point-inputs">

    `;
    
    selectedPlayers.forEach((otherPlayer, otherIndex) => {
        if (otherIndex !== playerIndex) {
            modalContent += `
                <div class="player-input">
                    <label>${otherPlayer}:</label>
                    <input type="number" id="player-${otherIndex}" min="0" max="${targetValue}" placeholder="0" value="0">
                </div>
            `;
        }
    });
    
    modalContent += `
            </div>
            <div class="total-check">
                <span>Others made: <span id="current-total">0</span> / ${targetValue}</span>
            </div>
        </div>
        <button onclick="saveSinglePlayerDistribution(${roundIndex}, ${playerIndex}, ${targetValue})" class="primary">Save Distribution</button>
        <button onclick="cancelDistribution(${roundIndex}, ${playerIndex})" style="margin-left: 10px;">Cancel</button>
    `;
    
    // Show modal
    showCustomModal(modalContent);
    
    // Add event listeners to update total
    setTimeout(() => {
        const inputs = document.querySelectorAll('.point-inputs input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', updateDistributionTotal);
        });
    }, 100);
}

function updateDistributionTotal() {
    const inputs = document.querySelectorAll('.point-inputs input[type="number"]');
    let total = 0;
    inputs.forEach(input => {
        const value = parseInt(input.value) || 0;
        total += value;
    });
    document.getElementById('current-total').textContent = total;
}

function saveSinglePlayerDistribution(roundIndex, playerIndex, targetValue) {
    // Get how much each other player made
    const distribution = {};
    let othersTotal = 0;
    
    selectedPlayers.forEach((_, otherIndex) => {
        if (otherIndex !== playerIndex) {
            const made = parseInt(document.getElementById(`player-${otherIndex}`).value) || 0;
            if (made > 0) {
                distribution[otherIndex] = made;
                othersTotal += made;
            }
        }
    });
    
    // Calculate how much the failed player made themselves
    const selfMade = targetValue - othersTotal;
    if (selfMade < 0) {
        alert(`Others made too much! Total can't exceed ${targetValue}. Others made: ${othersTotal}`);
        return;
    }
    
    // Add self-made to distribution for internal tracking
    if (selfMade > 0) {
        distribution[playerIndex] = selfMade;
    }
    
    // Update point distribution
    if (!pointDistribution[roundIndex]) {
        pointDistribution[roundIndex] = {};
    }
    
    pointDistribution[roundIndex][playerIndex] = {
        target: targetValue,
        failed: true,
        selfMade: selfMade,
        distribution: distribution
    };
    
    // Close modal and update display
    closeCustomModal();
    recalculateTotals();
    updateScoreDisplay();
}

function cancelDistribution(roundIndex, playerIndex) {
    // Revert the score back to positive
    gameScores[roundIndex][playerIndex] = -gameScores[roundIndex][playerIndex];
    
    // Close modal and update display
    closeCustomModal();
    recalculateTotals();
    updateScoreDisplay();
}

// Error handling
function showError(message) {
    removeError();
    
    const inputSection = document.querySelector('.input-section');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    inputSection.insertBefore(errorDiv, inputSection.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(removeError, 3000);
}

function removeError() {
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Keyboard support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeScreen = document.querySelector('.screen.active');
        
        if (activeScreen.id === 'gameScreen') {
            addRound();
        } else if (activeScreen.id === 'playerSelectionScreen') {
            const startBtn = document.getElementById('startGameBtn');
            if (!startBtn.disabled) {
                startGame();
            }
        }
    }
});

// Score toggle function
function toggleScore(roundIndex, playerIndex) {
    // Get the current score
    const currentScore = gameScores[roundIndex][playerIndex];
    
    // Toggle between positive and negative
    const newScore = -currentScore;
    
    // Update the score in the game data
    gameScores[roundIndex][playerIndex] = newScore;
    
    if (currentGameType === '325') {
        // Handle 3-2-5 game with point distribution
        
        // Initialize point distribution for this round if it doesn't exist
        if (!pointDistribution[roundIndex]) {
            pointDistribution[roundIndex] = {};
            // Initialize all players for this round
            gameScores[roundIndex].forEach((score, pIndex) => {
                pointDistribution[roundIndex][pIndex] = {
                    target: Math.abs(score),
                    failed: score < 0,
                    madeBy: score < 0 ? [] : [pIndex]
                };
            });
        }
        
        // Handle point distribution update
        if (newScore < 0) {
            // Score became negative - ask who made the points
            showSinglePlayerDistributionModal(roundIndex, playerIndex, Math.abs(newScore));
        } else {
            // Score became positive - player made their own points
            pointDistribution[roundIndex][playerIndex] = {
                target: newScore,
                failed: false,
                madeBy: [playerIndex]
            };
            
            // Recalculate totals and update display
            recalculateTotals();
            updateScoreDisplay();
        }
    } else {
        // Handle Plus Minus game - simple toggle without point distribution
        
        // Recalculate totals and update display
        recalculateTotals();
        updateScoreDisplay();
    }
}

function recalculateTotals() {
    // Reset totals
    playerTotals = selectedPlayers.map(() => 0);
    
    // Recalculate from all rounds
    gameScores.forEach(roundScores => {
        roundScores.forEach((score, playerIndex) => {
            playerTotals[playerIndex] += score;
        });
    });
}

function updateScoreDisplay() {
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing rows (except divider)
    const rows = tableBody.querySelectorAll('.score-row');
    rows.forEach(row => row.remove());
    
    // Re-add all score rows
    gameScores.forEach((roundScores, roundIndex) => {
        const row = document.createElement('div');
        row.className = 'score-row';
        
        row.innerHTML = roundScores.map((score, playerIndex) => {
            let cellContent = `${score}`;
            let distributionText = '';
            
            // Add distribution info for 3-2-5 game
            if (currentGameType === '325' && pointDistribution[roundIndex]) {
                const distribution = pointDistribution[roundIndex][playerIndex];
                if (distribution && distribution.failed && distribution.distribution) {
                    const distributionParts = [];
                    Object.entries(distribution.distribution).forEach(([pIndex, amount]) => {
                        if (amount > 0 && parseInt(pIndex) !== playerIndex) {
                            const playerName = selectedPlayers[parseInt(pIndex)];
                            distributionParts.push(`${playerName}: ${amount}`);
                        }
                    });
                    if (distributionParts.length > 0) {
                        distributionText = `<div class="distribution-text">${distributionParts.join(', ')}</div>`;
                    }
                }
            }
            
            return `<div class="score-cell ${score < 0 ? 'negative' : 'positive'}" 
                         onclick="toggleScore(${roundIndex}, ${playerIndex})" 
                         title="Click to toggle failed/success">
                        ${cellContent}
                        ${distributionText}
                    </div>`;
        }).join('');
        
        tableBody.appendChild(row);
    });
    
    // Update totals
    updateTotals();
    
    // Scroll to bottom
    tableBody.scrollTop = tableBody.scrollHeight;
}

// Auto-completion and validation for games
function handleInputChange(changedIndex) {
    if (currentGameType === '325') {
        handle325InputChange(changedIndex);
    } else if (currentGameType === 'plusminus') {
        handlePlusMinusInputChange(changedIndex);
    }
}

// Auto-completion and validation for 3-2-5 game
function handle325InputChange(changedIndex) {
    
    const inputs = selectedPlayers.map((_, index) => 
        document.getElementById(`input${index}`)
    );
    
    const changedInput = inputs[changedIndex];
    const inputValue = parseInt(changedInput.value);
    
    // Validate the input
    if (!validate325Input(inputValue, changedIndex, inputs)) {
        return;
    }
    
    // Get current values
    const values = inputs.map(input => {
        const val = input.value.trim();
        return val === '' ? null : parseInt(val);
    });
    
    // Count filled inputs
    const filledInputs = values.filter(val => val !== null);
    
    // If exactly 2 inputs are filled, auto-complete the third
    if (filledInputs.length === 2) {
        const usedScores = values.filter(val => val !== null);
        
        // Find the empty input
        const emptyIndex = values.findIndex(val => val === null);
        if (emptyIndex !== -1) {
            // Calculate remaining score
            const remainingScore = getRemainingScore(usedScores);
            if (remainingScore !== null) {
                inputs[emptyIndex].value = remainingScore;
                // Add visual feedback
                inputs[emptyIndex].classList.add('auto-completed');
                setTimeout(() => {
                    inputs[emptyIndex].classList.remove('auto-completed');
                }, 1500);
            }
        }
    }
}

// Validate 3-2-5 input
function validate325Input(inputValue, changedIndex, inputs) {
    const validScores = [3, 2, 5, -3, -2, -5];
    const changedInput = inputs[changedIndex];
    
    // Check if the value is valid
    if (isNaN(inputValue) || !validScores.includes(inputValue)) {
        // Invalid input - clear it and show error
        changedInput.value = '';
        changedInput.classList.add('invalid-input');
        changedInput.placeholder = 'Only 3,2,5,-3,-2,-5';
        
        setTimeout(() => {
            changedInput.classList.remove('invalid-input');
            changedInput.placeholder = getInputPlaceholder();
        }, 2000);
        
        return false;
    }
    
    // Check for duplicates
    const otherValues = inputs
        .map((input, index) => index !== changedIndex ? parseInt(input.value) : null)
        .filter(val => !isNaN(val));
    
    if (otherValues.includes(inputValue)) {
        // Duplicate found - clear it and show error
        changedInput.value = '';
        changedInput.classList.add('invalid-input');
        changedInput.placeholder = 'Already used!';
        
        setTimeout(() => {
            changedInput.classList.remove('invalid-input');
            changedInput.placeholder = getInputPlaceholder();
        }, 2000);
        
        return false;
    }
    
    // Valid input
    changedInput.classList.remove('invalid-input');
    return true;
}

// Validation for Plus Minus input
function handlePlusMinusInputChange(changedIndex) {
    const inputs = selectedPlayers.map((_, index) => 
        document.getElementById(`input${index}`)
    );
    
    const changedInput = inputs[changedIndex];
    const inputValue = parseInt(changedInput.value);
    
    // Validate the input
    if (!validatePlusMinusInput(inputValue, changedIndex, inputs)) {
        return;
    }
    
    // Valid input
    changedInput.classList.remove('invalid-input');
}

// Validate Plus Minus input
function validatePlusMinusInput(inputValue, changedIndex, inputs) {
    const changedInput = inputs[changedIndex];
    
    // Check if the value is a valid number
    if (isNaN(inputValue)) {
        return true; // Allow empty or invalid for now, will be caught later
    }
    
    // Check minimum and maximum limits
    if (inputValue >= 0 && inputValue < 2) {
        // Invalid input - clear it and show error
        changedInput.value = '';
        changedInput.classList.add('invalid-input');
        changedInput.placeholder = 'Min: 2 (or negative)';
        
        setTimeout(() => {
            changedInput.classList.remove('invalid-input');
            changedInput.placeholder = getInputPlaceholder();
        }, 2000);
        
        return false;
    }
    
    if (inputValue > 13) {
        // Invalid input - clear it and show error
        changedInput.value = '';
        changedInput.classList.add('invalid-input');
        changedInput.placeholder = 'Max: 13';
        
        setTimeout(() => {
            changedInput.classList.remove('invalid-input');
            changedInput.placeholder = getInputPlaceholder();
        }, 2000);
        
        return false;
    }
    
    // Valid input
    changedInput.classList.remove('invalid-input');
    return true;
}

function getRemainingScore(usedScores) {
    // For 3-2-5 game, we need to distribute 3, 2, 5 (or their negatives)
    const positiveScores = [3, 2, 5];
    const negativeScores = [-3, -2, -5];
    
    // Check if we're dealing with positive or negative scores
    const hasPositive = usedScores.some(score => score > 0);
    const hasNegative = usedScores.some(score => score < 0);
    
    if (hasPositive && hasNegative) {
        // Mixed positive/negative - can't auto-complete reliably
        return null;
    }
    
    if (hasNegative) {
        // All negative scores
        const usedAbsValues = usedScores.map(score => Math.abs(score));
        const remainingAbs = positiveScores.find(score => !usedAbsValues.includes(score));
        return remainingAbs ? -remainingAbs : null;
    } else {
        // All positive scores
        const remaining = positiveScores.find(score => !usedScores.includes(score));
        return remaining || null;
    }
}

// Disable text selection and copying
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('selectstart', function(e) {
    if (e.target.tagName !== 'INPUT') {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

// Disable keyboard shortcuts for copy/cut/select all
document.addEventListener('keydown', function(e) {
    // Disable Ctrl+A (Select All)
    if (e.ctrlKey && e.key === 'a') {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            return false;
        }
    }
    
    // Disable Ctrl+C (Copy)
    if (e.ctrlKey && e.key === 'c') {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            return false;
        }
    }
    
    // Disable Ctrl+X (Cut)
    if (e.ctrlKey && e.key === 'x') {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            return false;
        }
    }
    
    // Disable Ctrl+V (Paste) - optional
    if (e.ctrlKey && e.key === 'v') {
        if (e.target.tagName !== 'INPUT') {
            e.preventDefault();
            return false;
        }
    }
    
    // Disable F12 (Developer Tools)
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+Shift+I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
});

// Touch/click outside modal to close
document.getElementById('winnerModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeWinnerModal();
    }
});
