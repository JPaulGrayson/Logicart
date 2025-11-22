// Example: Recursive factorial function
// Try opening this file and launching Cartographer to see the control flow

function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  let sub = factorial(n - 1);
  return n * sub;
}

// Test it
console.log(factorial(5)); // 120
