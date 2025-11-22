// Example: Fibonacci with conditional logic
// Great for visualizing recursive calls and branching

function fibonacci(n) {
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  let a = fibonacci(n - 1);
  let b = fibonacci(n - 2);
  return a + b;
}

// Test it
console.log(fibonacci(6)); // 8
