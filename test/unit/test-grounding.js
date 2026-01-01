// Test file for LogiGo grounding layer
function processData(items) {
    let total = 0;
    let validCount = 0;

    // Process each item
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Validate item
        if (item.value > 0) {
            total += item.value;
            validCount++;
        } else if (item.value < 0) {
            console.log('Negative value skipped:', item.value);
        } else {
            // Zero value - special handling
            console.log('Zero value at index:', i);
        }
    }

    // Calculate average
    if (validCount > 0) {
        const average = total / validCount;
        return { total, average, validCount };
    } else {
        return { total: 0, average: 0, validCount: 0 };
    }
}

// Another function with while loop
function findElement(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}
