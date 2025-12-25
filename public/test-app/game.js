// Number Guessing Game - Plain JavaScript
// This file has readable source code for flowchart visualization

let secretNumber = 0;
let attempts = 0;
let gameOver = false;

// Initialize a new game
function initializeGame() {
  secretNumber = generateRandomNumber(1, 100);
  attempts = 0;
  gameOver = false;
  updateAttemptsDisplay();
  clearFeedback();
  console.log('Game initialized! Secret number:', secretNumber);
}

// Generate a random number between min and max (inclusive)
function generateRandomNumber(min, max) {
  const range = max - min + 1;
  const randomValue = Math.floor(Math.random() * range);
  return min + randomValue;
}

// Update the attempts counter display
function updateAttemptsDisplay() {
  const attemptsElement = document.getElementById('attempts');
  if (attemptsElement) {
    attemptsElement.textContent = attempts;
  }
}

// Clear the feedback message
function clearFeedback() {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.style.display = 'none';
    feedback.textContent = '';
    feedback.className = 'feedback';
  }
}

// Show feedback to the user
function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = 'feedback ' + type;
    feedback.style.display = 'block';
  }
}

// Check if the guess is correct
function checkGuess(guess) {
  if (guess < secretNumber) {
    return 'low';
  } else if (guess > secretNumber) {
    return 'high';
  } else {
    return 'correct';
  }
}

// Handle the user's guess
function handleGuess() {
  if (gameOver) {
    initializeGame();
    return;
  }

  const input = document.getElementById('guess-input');
  const guessValue = parseInt(input.value, 10);

  // Validate input
  if (isNaN(guessValue) || guessValue < 1 || guessValue > 100) {
    showFeedback('Please enter a valid number between 1 and 100', 'high');
    return;
  }

  attempts++;
  updateAttemptsDisplay();

  const result = checkGuess(guessValue);

  if (result === 'correct') {
    handleCorrectGuess();
  } else if (result === 'high') {
    showFeedback('Too high! Try a lower number.', 'high');
  } else {
    showFeedback('Too low! Try a higher number.', 'low');
  }

  input.value = '';
  input.focus();
}

// Handle when the user guesses correctly
function handleCorrectGuess() {
  gameOver = true;
  const message = 'Congratulations! You got it in ' + attempts + ' attempts!';
  showFeedback(message, 'correct');
  
  const button = document.getElementById('guess-btn');
  if (button) {
    button.textContent = 'Play Again';
  }
}

// Start the game when the page loads
window.onload = function() {
  initializeGame();
  
  // Allow Enter key to submit guess
  const input = document.getElementById('guess-input');
  if (input) {
    input.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        handleGuess();
      }
    });
  }
};
