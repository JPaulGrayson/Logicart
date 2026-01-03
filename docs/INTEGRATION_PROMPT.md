# LogiGo Integration Prompt

Copy and paste this single prompt into any Replit Agent to add LogiGo visualization.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head> (replace PROJECT_NAME with this app's actual name):
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Store algorithms as source code strings:

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

3. When user wants to visualize code, call:
if (window.LogiGo) {
  LogiGo.openWithCode(algorithms.bubbleSort, 'BubbleSort');
}

This creates a fresh session and opens LogiGo Studio in a new tab with the flowchart.
```

---

## What Happens

1. **User clicks "View Flowchart"** - Your app calls `LogiGo.openWithCode(code, name)`
2. **Fresh session created** - LogiGo creates a unique session with the code
3. **Studio opens** - After a brief delay, LogiGo Studio opens with the flowchart in a new tab

---

## API Reference

### LogiGo.openWithCode(code, name)
Creates a session and opens LogiGo Studio with the flowchart:
```javascript
// Opens LogiGo Studio in a new tab
if (window.LogiGo) {
  LogiGo.openWithCode(algorithmCode, 'AlgorithmName');
}
```

### LogiGo.registerCode(code, name)
Register code without opening Studio (updates the badge):
```javascript
if (window.LogiGo) {
  LogiGo.registerCode(algorithmCode, 'AlgorithmName');
}
```

### LogiGo.openStudio()
Open the current session in LogiGo Studio:
```javascript
if (window.LogiGo) {
  LogiGo.openStudio();
}
```

---

## Key Points

1. **Source code as strings** - Algorithms must be stored as readable template literals, not bundled code
2. **Unique sessions** - Each call creates a fresh session to avoid stale data
3. **Opens in new tab** - LogiGo requires a full browser tab (not iframes)

---

## Troubleshooting

**Flowchart shows old/wrong code:**
- Use `openWithCode()` which creates fresh sessions automatically

**Flowchart empty:**
- Ensure the code is a readable JavaScript string, not minified/bundled
- Check browser console for `[LogiGo]` messages

**Badge not appearing:**
- Make sure remote.js script is in `<head>` before other scripts
