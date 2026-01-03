# LogiGo Integration Prompt

Copy and paste this single prompt into any Replit Agent to add LogiGo visualization.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head> (replace PROJECT_NAME with this app's actual name):
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Create a function to open LogiGo with algorithm code:

async function openInLogiGo(algorithmCode, algorithmName) {
  try {
    const response = await fetch('https://logigo-studio-jpaulgrayson.replit.app/api/remote/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: `${algorithmName}-${Date.now()}`,  // Unique name prevents stale state
        code: algorithmCode
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Wait for session to initialize before opening
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.open(data.studioUrl, '_blank');
    }
  } catch (error) {
    console.error('LogiGo error:', error);
  }
}

3. Store algorithms as source code strings and call openInLogiGo when user wants to visualize:

const algorithms = {
  bubbleSort: `function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
    return arr;
  }`
};

// When user clicks "View Flowchart" button:
openInLogiGo(algorithms.bubbleSort, 'BubbleSort');

A "View in LogiGo" badge will also appear from remote.js. Both methods work - the API approach is more reliable for on-demand visualization.
```

---

## Key Points

1. **Unique session names** - Append timestamp to avoid stale flowchart data
2. **1.5 second delay** - Let session fully initialize before opening URL
3. **Opens in new tab** - LogiGo requires a full browser tab (not iframes) due to security policies
4. **Source code as strings** - Algorithms must be stored as readable string literals, not bundled code

---

## What Happens

1. **User clicks visualize** - Your app calls the LogiGo API with the algorithm code
2. **Session created** - LogiGo creates a unique session with the code
3. **Studio opens** - After a brief delay, LogiGo Studio opens with the flowchart

---

## API Reference

### POST /api/remote/session
Create a visualization session:
```javascript
const response = await fetch('https://logigo-studio-jpaulgrayson.replit.app/api/remote/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    name: 'MySession-' + Date.now(),
    code: 'function example() { return 42; }'
  })
});
const { studioUrl } = await response.json();
```

### LogiGo.registerCode(sourceCode)
Alternative: Register code via the remote.js script:
```javascript
if (window.LogiGo) {
  LogiGo.registerCode(algorithmSourceCode);
}
```

---

## Troubleshooting

**Flowchart shows old/wrong code:**
- Use unique session names with timestamps
- Make sure the delay is at least 1.5 seconds before opening

**Flowchart empty:**
- Ensure the code is a readable JavaScript string, not minified/bundled
- Check browser console for errors

**Badge not appearing:**
- Make sure remote.js script is in `<head>` before other scripts
