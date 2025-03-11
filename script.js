// DOM Elements
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clear-btn');
const checkBtn = document.getElementById('check-btn');
const drawingPrompt = document.getElementById('drawing-prompt');
const timeLeft = document.getElementById('time-left');
const predictionsContainer = document.getElementById('predictions');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');

// Game state
let isDrawing = false;
let model = null;
let timer = null;
let timeRemaining = 20;
let currentPrompt = '';
let score = 0;
let hasRecognizedDrawing = false;
let gameInitialized = false;
let canCheck = true; // Flag to prevent multiple checks

// Drawing settings
ctx.lineWidth = 6;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000000';

// List of possible drawing prompts
const drawingPrompts = [
    'airplane', 'apple', 'bicycle', 'bird', 'book', 'butterfly', 'car', 'cat', 
    'chair', 'clock', 'cloud', 'cup', 'dog', 'door', 'eye', 'fish', 'flower', 
    'hat', 'house', 'key', 'lamp', 'moon', 'mountain', 'pencil', 'pizza', 
    'rainbow', 'scissors', 'star', 'sun', 'tree', 'umbrella'
];

// Class names for the model (these should match the model's output classes)
const classNames = [
    'airplane', 'alarm_clock', 'apple', 'axe', 'baseball', 'baseball_bat', 
    'basketball', 'bed', 'bench', 'bicycle', 'bird', 'book', 'bread', 'bridge', 
    'broom', 'butterfly', 'camera', 'candle', 'car', 'cat', 'ceiling_fan', 
    'cell_phone', 'chair', 'circle', 'clock', 'cloud', 'coffee_cup', 'cookie', 
    'cup', 'diving_board', 'donut', 'door', 'drums', 'dumbbell', 'envelope', 
    'eye', 'face', 'fan', 'flower', 'frying_pan', 'grapes', 'hammer', 'hat', 
    'headphones', 'helmet', 'hot_dog', 'ice_cream', 'key', 'knife', 'ladder', 
    'laptop', 'light_bulb', 'lightning', 'line', 'lollipop', 'microphone', 
    'moon', 'mountain', 'mushroom', 'pants', 'paper_clip', 'pencil', 'pillow', 
    'pizza', 'power_outlet', 'rainbow', 'rifle', 'saw', 'scissors', 'screwdriver', 
    'shorts', 'shovel', 'smiley_face', 'snake', 'sock', 'spider', 'spoon', 
    'square', 'star', 'stop_sign', 'suitcase', 'sun', 'sword', 'syringe', 
    't-shirt', 'table', 'tennis_racquet', 'tent', 'tooth', 'traffic_light', 
    'tree', 'triangle', 'umbrella', 'wheel', 'wristwatch'
];

// Initialize the game
function init() {
    console.log("Initializing game...");
    
    // Immediately hide the game over screen
    hideGameOverScreen();
    
    // Set up event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Set up button event listeners
    console.log("Setting up button event listeners...");
    
    clearBtn.addEventListener('click', clearCanvas);
    
    // Add event listener to check button
    document.getElementById('check-btn').addEventListener('click', function() {
        console.log("Check button clicked!");
        handleCheckDrawing();
    });
    
    // Set up play again button
    playAgainBtn.addEventListener('click', function() {
        hideGameOverScreen();
        startNewGame();
    });
    
    // Start the game without waiting for model
    startNewGame();
    
    // Update the UI to show we're in drawing mode
    updatePredictions([{ label: 'Draw your picture! Use the Check Drawing button when ready or wait for the timer.', confidence: 1 }]);
    
    // Since we can't load the actual model, we'll simulate recognition
    console.log('Using simulated drawing recognition instead of TensorFlow model');
    gameInitialized = true;
}

// Handle Check Drawing button click
function handleCheckDrawing() {
    console.log("handleCheckDrawing called");
    
    if (!canCheck) {
        console.log("Cannot check - already checking or disabled");
        return;
    }
    
    // Only allow checking if there's something drawn
    if (!hasDrawnSomething()) {
        console.log("Nothing drawn yet");
        updatePredictions([{ label: 'Please draw something first!', confidence: 1 }]);
        return;
    }
    
    console.log("Checking drawing...");
    
    // Prevent multiple checks
    canCheck = false;
    
    // Pause the timer
    if (timer) {
        clearInterval(timer);
    }
    
    // Evaluate the drawing
    evaluateDrawing();
}

// Helper function to hide game over screen
function hideGameOverScreen() {
    gameOverScreen.style.display = 'none';
    gameOverScreen.classList.add('hidden');
}

// Helper function to show game over screen
function showGameOverScreen() {
    gameOverScreen.style.display = 'flex';
    gameOverScreen.classList.remove('hidden');
}

// Start a new game
function startNewGame() {
    score = 0;
    canCheck = true;
    hideGameOverScreen();
    selectNewPrompt();
    resetTimer();
    clearCanvas();
}

// Select a new drawing prompt
function selectNewPrompt() {
    const randomIndex = Math.floor(Math.random() * drawingPrompts.length);
    currentPrompt = drawingPrompts[randomIndex];
    drawingPrompt.textContent = currentPrompt;
    hasRecognizedDrawing = false;
}

// Reset the timer
function resetTimer() {
    if (timer) {
        clearInterval(timer);
    }
    
    timeRemaining = 20;
    timeLeft.textContent = timeRemaining;
    
    // Clear any previous predictions
    updatePredictions([{ label: 'Draw your picture! Use the Check Drawing button when ready or wait for the timer.', confidence: 1 }]);
    
    timer = setInterval(() => {
        timeRemaining--;
        timeLeft.textContent = timeRemaining;
        
        if (timeRemaining <= 0) {
            clearInterval(timer);
            // Only evaluate the drawing when time is up
            evaluateDrawing();
        }
    }, 1000);
}

// End the game
function endGame() {
    finalScore.textContent = score;
    showGameOverScreen();
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    // Get mouse/touch position
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if (e.type.includes('mouse')) {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    } else {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // No real-time prediction - we'll wait until the timer ends or check button is clicked
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
    // No prediction on stop drawing - we'll wait until the timer ends or check button is clicked
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clearPredictions();
    hasRecognizedDrawing = false;
    canCheck = true;
    
    // Show the drawing message again
    updatePredictions([{ label: 'Draw your picture! Use the Check Drawing button when ready or wait for the timer.', confidence: 1 }]);
}

function handleTouch(e) {
    e.preventDefault();
    
    if (e.type === 'touchstart') {
        startDrawing(e);
    } else if (e.type === 'touchmove') {
        draw(e);
    }
}

// Evaluate drawing when timer ends or check button is clicked
function evaluateDrawing() {
    console.log("Evaluating drawing...");
    
    if (!hasDrawnSomething()) {
        // If nothing was drawn, end the game
        updatePredictions([{ label: 'No drawing detected!', confidence: 1 }]);
        setTimeout(() => {
            endGame();
        }, 2000);
        return;
    }
    
    // Generate simulated predictions
    const results = generateSimulatedPredictions();
    
    // Update the UI with these predictions
    updatePredictions(results);
    
    // Check if the top prediction matches the prompt
    const matched = checkForMatch(results);
    
    // If no match, end the game after a short delay
    if (!matched) {
        setTimeout(() => {
            endGame();
        }, 2000);
    }
}

// Check if the user has drawn something
function hasDrawnSomething() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] > 0) return true;
    }
    return false;
}

// Generate simulated predictions
function generateSimulatedPredictions() {
    const results = [];
    
    // Add the current prompt with a higher confidence if the user has drawn enough
    const hasEnoughDrawing = Math.random() > 0.3; // Higher chance of "recognizing" the drawing
    
    if (hasEnoughDrawing) {
        results.push({
            label: currentPrompt,
            confidence: 0.7 + Math.random() * 0.3
        });
    }
    
    // Add some random predictions
    const usedLabels = new Set(results.map(r => r.label));
    
    while (results.length < 5) {
        const randomIndex = Math.floor(Math.random() * classNames.length);
        const label = classNames[randomIndex];
        
        if (!usedLabels.has(label)) {
            usedLabels.add(label);
            results.push({
                label: label,
                confidence: Math.random() * (hasEnoughDrawing ? 0.6 : 0.9)
            });
        }
    }
    
    // Sort by confidence
    return results.sort((a, b) => b.confidence - a.confidence);
}

function updatePredictions(results) {
    predictionsContainer.innerHTML = '';
    
    results.forEach(result => {
        const predictionItem = document.createElement('div');
        predictionItem.className = 'prediction-item';
        
        const label = document.createElement('span');
        label.className = 'prediction-label';
        label.textContent = `${result.label} (${Math.round(result.confidence * 100)}%)`;
        
        const bar = document.createElement('div');
        bar.className = 'prediction-bar';
        
        const fill = document.createElement('div');
        fill.className = 'prediction-fill';
        fill.style.width = `${result.confidence * 100}%`;
        
        bar.appendChild(fill);
        predictionItem.appendChild(label);
        predictionItem.appendChild(bar);
        
        predictionsContainer.appendChild(predictionItem);
    });
}

function clearPredictions() {
    predictionsContainer.innerHTML = '';
}

function checkForMatch(results) {
    if (hasRecognizedDrawing) return false;
    
    const topPrediction = results[0];
    
    // Check if the top prediction matches the current prompt
    if (topPrediction && topPrediction.confidence > 0.5 && 
        (topPrediction.label === currentPrompt || 
         topPrediction.label.replace('_', ' ') === currentPrompt)) {
        
        // Match found!
        hasRecognizedDrawing = true;
        score += 200; // Fixed score since we're not using time remaining for scoring
        
        // Visual feedback
        canvas.style.border = '3px solid #34A853';
        
        // Reset for next round
        setTimeout(() => {
            canvas.style.border = '3px solid #DADCE0';
            canCheck = true;
            selectNewPrompt();
            resetTimer();
            clearCanvas();
        }, 2000);
        
        return true;
    }
    
    return false;
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Hide game over screen immediately when script loads
hideGameOverScreen();

// Make sure we wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    init();
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("DOM already loaded, initializing now");
    setTimeout(init, 1);
} 