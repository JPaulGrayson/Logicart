# LogiGo Integration Prompts

Copy and paste these prompts into Replit Agent to add LogiGo visualization.

---

## Prompt A: New Apps (Building from Scratch)

Use this when creating a new app that doesn't exist yet:

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyApp"></script>

2. After defining your main functions, register them with LogiGo:

// Example for a Todo app:
const todoFunctions = `
function addTodo(text) {
  const todo = { id: Date.now(), text, completed: false };
  todos.push(todo);
  renderTodos();
  return todo;
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) todo.completed = !todo.completed;
  renderTodos();
}
`;

LogiGo.registerCode(todoFunctions);

A "View in LogiGo" badge will appear. Clicking it opens a flowchart of your code logic.
```

---

## Prompt B: Existing Apps with Displayed Code

Use this for apps that already display source code in their UI (like algorithm visualizers, code editors, tutorial apps):

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyApp"></script>

2. When displaying algorithm or function code to the user, also register it with LogiGo:

// Wherever you set the displayed code:
function displayAlgorithm(algorithmCode) {
  codePanel.textContent = algorithmCode;
  
  // Send to LogiGo for flowchart visualization
  if (window.LogiGo) {
    LogiGo.registerCode(algorithmCode);
  }
}

A "View in LogiGo" badge will appear. When clicked, it opens a flowchart of the currently displayed code.
```

---

## Prompt C: Simple Traditional Apps (Zero-Code)

Use this for simple HTML/JS apps with traditional script tags (not Vite/React/bundled):

```
Add LogiGo code visualization to this project.

Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyApp"></script>

That's it! A "View in LogiGo" badge will appear. When clicked, it automatically captures the page's code and opens a flowchart visualization.
```

---

## Which Prompt to Use?

| App Type | Prompt | Why |
|----------|--------|-----|
| **New app you're building** | Prompt A | Agent writes code AND registers it together |
| **Algorithm visualizer, code editor, tutorial** | Prompt B | App already has source code available |
| **Simple HTML/JS with `<script>` tags** | Prompt C | Auto-discovery works well |
| **Vite/React/bundled app** | Prompt A or B | Bundled code can't be auto-discovered |

**Note:** Replace `project=MyApp` in the URL with your actual project name (e.g., `project=AlgoViz`, `project=TodoApp`).

---

## What Happens

1. **Badge appears** - A "View in LogiGo" badge shows in the bottom-right corner
2. **Click to visualize** - Opens LogiGo Studio with your flowchart
3. **Real-time updates** - Code changes update the flowchart automatically

---

## API Reference

### LogiGo.registerCode(sourceCode)
Send source code for flowchart visualization:
```javascript
LogiGo.registerCode(`
function myFunction(x) {
  if (x > 10) return x * 2;
  return x;
}
`);
```

### checkpoint(id, variables)
Track execution for live debugging:
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

**Flowchart shows wrong/minimal code:**
- Use Prompt A or B to explicitly register your code
- Bundled apps (Vite/React) need manual registration

**Badge not appearing:**
- Make sure the script is in `<head>` before other scripts
- Check browser console for `[LogiGo]` messages

**Cross-origin errors:**
- The script works best on same-origin pages
- For localhost development, this shouldn't be an issue
