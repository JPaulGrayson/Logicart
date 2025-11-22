// Example: Find maximum in array
// Shows conditional branching and variable tracking

function findMax(arr) {
  if (arr.length === 0) {
    return null;
  }
  
  let max = arr[0];
  let i = 1;
  
  if (i < arr.length) {
    let current = arr[i];
    if (current > max) {
      max = current;
    }
    i = i + 1;
  }
  
  return max;
}

// Test it
console.log(findMax([3, 7, 2, 9, 1])); // 9
