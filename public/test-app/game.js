// Number Guessing Game - Plain JavaScript with LogiGo Integration
// This file has readable source code for flowchart visualization

let secretNumber = 0;
let attempts = 0;
let gameOver = false;

// Initialize a new game
function initializeGame() {
  checkpoint('initializeGame-start', {});
  
  secretNumber = generateRandomNumber(1, 100);
  attempts = 0;
  gameOver = false;
  
  checkpoint('game-configured', { secretNumber, attempts, gameOver });
  
  updateAttemptsDisplay();
  clearFeedback();
  
  checkpoint('initializeGame-end', { secretNumber });
  console.log('Game initialized! Secret number:', secretNumber);
}

// Generate a random number between min and max (inclusive)
function generateRandomNumber(min, max) {
  checkpoint('generateRandomNumber-start', { min, max });
  
  const range = max - min + 1;
  const randomValue = Math.floor(Math.random() * range);
  const result = min + randomValue;
  
  checkpoint('generateRandomNumber-end', { result });
  return result;
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
  checkpoint('showFeedback', { message, type });
  
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = 'feedback ' + type;
    feedback.style.display = 'block';
  }
}

// Check if the guess is correct
function checkGuess(guess) {
  checkpoint('checkGuess-start', { guess, secretNumber });
  
  let result;
  if (guess < secretNumber) {
    result = 'low';
  } else if (guess > secretNumber) {
    result = 'high';
  } else {
    result = 'correct';
  }
  
  checkpoint('checkGuess-end', { guess, result });
  return result;
}

// Handle the user's guess
function handleGuess() {
  checkpoint('handleGuess-start', { gameOver });
  
  if (gameOver) {
    checkpoint('game-reset', {});
    initializeGame();
    return;
  }

  const input = document.getElementById('guess-input');
  const guessValue = parseInt(input.value, 10);
  
  checkpoint('input-parsed', { guessValue, isValid: !isNaN(guessValue) });

  // Validate input
  if (isNaN(guessValue) || guessValue < 1 || guessValue > 100) {
    checkpoint('invalid-input', { guessValue });
    showFeedback('Please enter a valid number between 1 and 100', 'high');
    return;
  }

  attempts++;
  updateAttemptsDisplay();
  
  checkpoint('attempt-made', { attempts, guessValue });

  const result = checkGuess(guessValue);

  if (result === 'correct') {
    checkpoint('correct-guess', { attempts });
    handleCorrectGuess();
  } else if (result === 'high') {
    checkpoint('guess-too-high', { guessValue, secretNumber });
    showFeedback('Too high! Try a lower number.', 'high');
  } else {
    checkpoint('guess-too-low', { guessValue, secretNumber });
    showFeedback('Too low! Try a higher number.', 'low');
  }

  input.value = '';
  input.focus();
  
  checkpoint('handleGuess-end', { result, attempts });
}

// Handle when the user guesses correctly
function handleCorrectGuess() {
  checkpoint('handleCorrectGuess-start', { attempts });
  
  gameOver = true;
  const message = 'Congratulations! You got it in ' + attempts + ' attempts!';
  showFeedback(message, 'correct');
  
  const button = document.getElementById('guess-btn');
  if (button) {
    button.textContent = 'Play Again';
  }
  
  checkpoint('handleCorrectGuess-end', { message, gameOver });
}

// Start the game when the page loads
window.onload = function() {
  checkpoint('app-loaded', {});
  
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
  
  checkpoint('app-ready', { secretNumber });
};
