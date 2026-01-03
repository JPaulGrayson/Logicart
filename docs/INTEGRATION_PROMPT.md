# LogiGo Integration Prompt

Copy and paste this single prompt into any Replit Agent to add LogiGo visualization.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head> (replace PROJECT_NAME with this app's actual name):
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Register source code with LogiGo using LogiGo.registerCode(sourceCodeString):
- The source code must be the ACTUAL JavaScript source text as a string
- For algorithm visualizers: register the algorithm's source code string when selected
- For code editors: register the editor's content whenever it changes
- For apps with core logic: register the function source as a template literal

Example for an algorithm visualizer:
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

// When user selects an algorithm:
if (window.LogiGo) LogiGo.registerCode(algorithms[selected]);

A "View in LogiGo" badge will appear. Clicking it opens an interactive flowchart of the registered code.
```

---

## What Happens

1. **Badge appears** - A "View in LogiGo" badge shows in the bottom-right corner
2. **Click to visualize** - Opens LogiGo Studio with your flowchart
3. **Real-time updates** - When registerCode() is called again, the flowchart updates

---

## Common Mistakes

**Wrong: Registering bundled/minified code**
```javascript
// DON'T do this - it captures React/framework code
LogiGo.registerCode(document.body.innerHTML);
```

**Right: Register the actual source code string**
```javascript
// DO this - register the algorithm's source text
LogiGo.registerCode(algorithmSourceCode);
```

---

## API Reference

### LogiGo.registerCode(sourceCode)
Send source code for flowchart visualization:
```javascript
if (window.LogiGo) {
  LogiGo.registerCode(`
    function myFunction(x) {
      if (x > 10) return x * 2;
      return x;
    }
  `);
}
```

### checkpoint(id, variables)
Optional: Track execution for live debugging:
```javascript
function processOrder(order) {
  checkpoint('order-received', { orderId: order.id });
  // ... processing logic
  checkpoint('order-complete', { total: order.total });
}
```

### LogiGo.openStudio()
Manually open LogiGo Studio:
```javascript
LogiGo.openStudio();
```

---

## Troubleshooting

**Badge not appearing:**
- Make sure the script is in `<head>` before other scripts
- Check browser console for `[LogiGo]` messages

**Flowchart empty or shows wrong code:**
- Ensure registerCode() receives the actual source code as a string
- The code should be human-readable JavaScript, not minified/bundled code
- Check that the code contains valid JavaScript function declarations
