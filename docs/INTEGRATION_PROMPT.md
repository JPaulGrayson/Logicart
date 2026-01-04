# LogiGo Integration Prompt

Copy and paste this prompt into any Replit Agent to add LogiGo visualization to your app.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Find where the app stores/displays source code and call LogiGo.openWithCode() when the user wants to visualize it:

// FOR ALGORITHM VISUALIZERS (stored code strings):
LogiGo.openWithCode(algorithms[selectedAlgorithm], selectedAlgorithm);

// FOR CODE EDITORS (user-typed code):
LogiGo.openWithCode(editor.getValue(), 'UserCode');

// FOR APPS WITH EXISTING FUNCTIONS:
LogiGo.openWithCode(myFunction.toString(), 'MyFunction');

3. TEST THE INTEGRATION:
- Open the app in the browser
- Select or enter some code
- Click the flowchart/visualization button
- Verify LogiGo Studio opens in a new tab with a flowchart

4. IF SOMETHING FAILS:
- Check browser console for [LogiGo] error messages
- Verify the code being passed is a readable string (not bundled/minified)
- Fix any issues before returning to the user

5. Report what was done and whether the integration is working. If there are remaining issues you couldn't resolve, explain them clearly so the user can help troubleshoot.

NOTE: Every AI-generated app is unique. Adapt the integration to match this app's structure.
```

---

## Important Notes for Users

**Before adding LogiGo:** Make sure your app is working correctly first. If the app has bugs, fix them before adding the integration.

**AI variability:** Every AI-generated app is different. The Replit Agent will adapt the integration to your app's specific structure. If something doesn't work as expected, describe the issue to the agent and it will help debug.

---

## What Happens

1. **Script loads** - LogiGo connects to your app
2. **User clicks visualize** - Your app calls LogiGo.openWithCode() with the source code
3. **Studio opens** - LogiGo Studio opens in a new tab with an interactive flowchart

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

## Troubleshooting

**LogiGo Studio doesn't open:**
- Check browser console for `[LogiGo]` messages
- Make sure the script tag is in `<head>` before other scripts

**Flowchart is empty or wrong:**
- Verify the code passed is readable JavaScript (not minified/bundled)
- Code should be a string containing function declarations

**Badge not appearing:**
- The badge appears after registerCode() or openWithCode() is called
- Check that the script loaded successfully
