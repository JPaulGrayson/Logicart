# LogiGo Integration Prompt

Copy and paste this prompt into any Replit Agent to add LogiGo visualization to your app.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. IMPORTANT FOR REACT/VITE APPS: Hide the auto-discovery badge to prevent framework noise:
Add this CSS to hide LogiGo's automatic badge (it captures bundled framework code, not your algorithms):
#logigo-badge { display: none !important; }

3. Create a visualization handler with API fallback:
const handleVisualize = (code, name) => {
  if (!window.LogiGo) {
    console.error('[LogiGo] Not loaded yet');
    return;
  }
  
  // Try openWithCode first, fallback to registerCode + openStudio
  if (window.LogiGo.openWithCode) {
    window.LogiGo.openWithCode(code, name);
  } else {
    window.LogiGo.registerCode(code, name);
    window.LogiGo.openStudio();
  }
};

4. Call handleVisualize with CLEAN algorithm code (not framework code):

// FOR ALGORITHM VISUALIZERS (stored code strings):
handleVisualize(algorithms[selectedAlgorithm], selectedAlgorithm);

// FOR CODE EDITORS (user-typed code):
handleVisualize(editor.getValue(), 'UserCode');

// FOR APPS WITH EXISTING FUNCTIONS:
handleVisualize(myFunction.toString(), 'FunctionName');

5. Connect the handler to a "View Flowchart" or "Visualize" button in your UI.

6. TEST THE INTEGRATION:
- Open the app in the browser
- Select or enter some code
- Click the visualization button
- Verify LogiGo Studio opens in a new tab with a CLEAN flowchart showing only algorithm logic

7. IF THE FLOWCHART SHOWS FRAMEWORK CODE (thousands of nodes):
- Make sure you added the CSS to hide #logigo-badge
- Verify you're passing the raw algorithm string, not bundled code
- The app should PUSH clean code to LogiGo, not let LogiGo auto-discover

8. Report what was done and whether the integration is working.

NOTE: Every AI-generated app is unique. The key principle is "clean-in, clean-out" - push only the algorithm code you want visualized.
```

---

## Key Concepts

### Push vs Auto-Discovery
LogiGo has two modes:
- **Auto-Discovery**: Scans all scripts on the page (captures framework noise in React/Vite)
- **Push Mode**: Your app sends specific clean code via `openWithCode()` (recommended)

For bundled apps (React, Vue, Vite), always use **Push Mode** and hide the auto-discovery badge.

### The Fallback Pattern
The LogiGo API loads asynchronously. Use this resilient pattern:
```javascript
if (window.LogiGo?.openWithCode) {
  window.LogiGo.openWithCode(code, name);
} else if (window.LogiGo) {
  window.LogiGo.registerCode(code, name);
  window.LogiGo.openStudio();
}
```

---

## API Reference

### LogiGo.openWithCode(code, name)
Creates a session and opens LogiGo Studio with the flowchart:
```javascript
window.LogiGo.openWithCode(algorithmCode, 'BubbleSort');
```

### LogiGo.registerCode(code, name)
Register code without opening Studio (for deferred visualization):
```javascript
window.LogiGo.registerCode(algorithmCode, 'BubbleSort');
```

### LogiGo.openStudio()
Open the current session in LogiGo Studio:
```javascript
window.LogiGo.openStudio();
```

---

## Troubleshooting

**Flowchart shows thousands of nodes / framework code:**
- Add CSS: `#logigo-badge { display: none !important; }`
- Ensure you're passing raw algorithm strings, not bundled code
- Use Push Mode, not Auto-Discovery

**LogiGo Studio doesn't open:**
- Check browser console for `[LogiGo]` messages
- Verify script tag is in `<head>` before other scripts
- Use the fallback pattern (registerCode + openStudio)

**Flowchart is empty:**
- Verify the code is readable JavaScript (not minified)
- Code should contain function declarations

---

## Integration Checklist

- [ ] Script tag added to HTML `<head>`
- [ ] CSS added to hide `#logigo-badge` (for React/Vite apps)
- [ ] Handler function created with API fallback
- [ ] "Visualize" button connected to handler
- [ ] Tested: clicking button opens LogiGo with clean flowchart
