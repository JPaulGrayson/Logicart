# LogiGo Integration Prompt

This is the prompt users copy and paste into Replit Agent to integrate LogiGo into their app.

---

## Quick Start Prompt (Simplest)

Copy this and give it to Replit Agent:

```
Add LogiGo visualization to this project so I can see a flowchart of my code execution.

1. Add this script tag to the HTML head (before any other scripts):
   <script src="https://logigo-studio.replit.app/remote.js?project=MyApp&autoOpen=true"></script>

2. In my JavaScript code, add checkpoint() calls at important points:
   checkpoint('step-name', { variableName: value });

Example:
function addTodo(text) {
  checkpoint('addTodo-start', { text });
  const todo = { id: Date.now(), text, completed: false };
  checkpoint('todo-created', { todo });
  todos.push(todo);
  checkpoint('addTodo-end', { count: todos.length });
  return todo;
}

The flowchart will show each checkpoint as a step, highlighting in real-time as my code runs.
```

---

## What Happens Automatically

When remote.js loads:
1. Creates a session with LogiGo Studio (no setup needed)
2. Provides a global `checkpoint(id, variables)` function
3. Auto-opens LogiGo Studio in a new tab on first checkpoint (if autoOpen=true)
4. Handles reconnection and session renewal automatically

---

## API Reference

### checkpoint(id, variables, options)
Send a checkpoint to LogiGo:
```javascript
checkpoint('processing-data', { items: 5, status: 'active' });
```

### window.LogiGo.checkpoint(id, variables)
Same as above (alias):
```javascript
window.LogiGo.checkpoint('step-1', { value: 42 });
```

### window.LogiGo.registerCode(sourceCode)
Send readable source code for flowchart generation:
```javascript
window.LogiGo.registerCode(`
function myFunction(x) {
  if (x > 10) {
    return x * 2;
  }
  return x;
}
`);
```

### window.LogiGo.openStudio()
Manually open the LogiGo Studio:
```javascript
window.LogiGo.openStudio();
```

### Query Parameters
- `project=MyApp` - Name shown in LogiGo Studio
- `autoOpen=true` - Auto-open Studio on first checkpoint (default: true)
- `autoOpen=false` - Don't auto-open (user clicks "View in LogiGo" manually)

---

## Full Integration Prompt (With Code Registration)

For developers who want the full flowchart with their source code:

```
Add LogiGo visualization with full flowchart support.

1. Add this to the HTML head (before other scripts):
   <script src="https://logigo-studio.replit.app/remote.js?project=MyApp"></script>

2. After my main JavaScript loads, register the code for visualization:
   <script>
     // Fetch and register the main source code
     fetch('/main.js')
       .then(r => r.text())
       .then(code => window.LogiGo.registerCode(code));
   </script>

3. Add checkpoint() calls at important execution points in my code.

This gives LogiGo the source code to parse into a proper flowchart, with nodes highlighting as checkpoints fire.
```

---

## Vite/React Integration Prompt

For React or Vite-based apps:

```
Add LogiGo to this Vite project.

1. Add remote.js to index.html (in the <head>):
   <script src="https://logigo-studio.replit.app/remote.js?project=MyReactApp"></script>

2. In my React components, import and use checkpoint:
   // At the top of App.tsx or any component:
   declare global {
     function checkpoint(id: string, vars?: Record<string, any>): void;
   }

   // Inside functions/effects:
   function handleSubmit(data: FormData) {
     checkpoint('form-submitted', { data });
     // ... rest of logic
   }

3. Optionally, register readable source by fetching a dev build or bundling source separately.

Note: Production builds are minified and won't produce readable flowcharts. Use development builds for visualization.
```

---

## Testing the Integration

After Agent applies the integration:

1. Run your app
2. Interact with it (trigger the code paths with checkpoints)
3. LogiGo Studio should auto-open (or click "View in LogiGo" badge)
4. See your checkpoints appear in the flowchart in real-time

---

## Troubleshooting

**Flowchart shows generic nodes instead of my code:**
- Call `window.LogiGo.registerCode(sourceCode)` with your readable source
- Production builds are minified - use development builds

**Checkpoints not appearing:**
- Make sure remote.js loads before your app scripts
- Check browser console for "[LogiGo]" messages

**Studio not opening automatically:**
- Add `autoOpen=true` to the script URL
- Or call `window.LogiGo.openStudio()` manually

---

## Architecture Notes

- remote.js creates a unique session ID and connects to LogiGo's server
- Checkpoints are sent via HTTP POST to `/api/remote/checkpoint`
- LogiGo Studio receives them via Server-Sent Events (SSE)
- No WebSocket or special build configuration required
