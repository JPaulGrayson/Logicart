# LogiGo Integration Prompt

Copy and paste this single prompt into any Replit Agent to add LogiGo visualization.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head> (replace PROJECT_NAME with this app's actual name):
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Call LogiGo.openWithCode(codeString, name) when user wants to visualize code:

// FOR ALGORITHM VISUALIZERS (stored code strings):
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
// When user selects algorithm:
LogiGo.openWithCode(algorithms.bubbleSort, 'BubbleSort');

// FOR CODE EDITORS (user-typed code):
// Get the current editor content and visualize it
const editorContent = editor.getValue(); // or textarea.value, etc.
LogiGo.openWithCode(editorContent, 'UserCode');

// FOR APPS WITH EXISTING FUNCTIONS:
// Convert function to string
LogiGo.openWithCode(myFunction.toString(), 'MyFunction');

This creates a fresh session and opens LogiGo Studio in a new tab with the flowchart.
```

---

## Use Case Examples

### 1. Algorithm Visualizers
Store algorithms as template literal strings:
```javascript
const algorithms = {
  quickSort: `function quickSort(arr) { ... }`,
  mergeSort: `function mergeSort(arr) { ... }`
};

// Visualize when selected
LogiGo.openWithCode(algorithms[selectedAlgorithm], selectedAlgorithm);
```

### 2. Code Editors
Capture the editor's current content:
```javascript
// For Monaco Editor
const code = monacoEditor.getValue();
LogiGo.openWithCode(code, 'UserCode');

// For CodeMirror
const code = codeMirrorInstance.getValue();
LogiGo.openWithCode(code, 'UserCode');

// For simple textarea
const code = document.getElementById('code-textarea').value;
LogiGo.openWithCode(code, 'UserCode');
```

### 3. Apps with Core Functions
Convert existing functions to strings:
```javascript
// Visualize an existing function
function calculateTax(income, rate) {
  if (income < 10000) return 0;
  return income * rate;
}

LogiGo.openWithCode(calculateTax.toString(), 'CalculateTax');
```

---

## API Reference

### LogiGo.openWithCode(code, name)
Creates a session and opens LogiGo Studio with the flowchart:
```javascript
if (window.LogiGo) {
  LogiGo.openWithCode(codeString, 'SessionName');
}
```

### LogiGo.registerCode(code, name)
Register code without opening Studio (updates badge for later):
```javascript
if (window.LogiGo) {
  LogiGo.registerCode(codeString, 'SessionName');
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

1. **Source code as strings** - Pass readable JavaScript source, not bundled/minified code
2. **Unique sessions** - Each call creates a fresh session automatically
3. **Opens in new tab** - LogiGo requires a full browser tab (not iframes)

---

## Troubleshooting

**Flowchart shows wrong code:**
- Use `openWithCode()` which creates fresh sessions automatically
- Make sure you're passing the actual source code string

**Flowchart empty:**
- Ensure the code is readable JavaScript, not minified/bundled
- Check browser console for `[LogiGo]` messages

**Badge not appearing:**
- Make sure remote.js script is in `<head>` before other scripts
