# LogiGo Integration Prompt

Copy and paste this single prompt into any Replit Agent to add LogiGo visualization.

---

## The Prompt

```
Add LogiGo code visualization to this project.

1. Add this script tag to the HTML <head> (replace PROJECT_NAME with this app's actual name):
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=PROJECT_NAME"></script>

2. Register the app's main logic with LogiGo so it can generate a flowchart:
- If this app displays code to users, call LogiGo.registerCode(codeString) whenever that code changes
- If this app has core functions/algorithms, call LogiGo.registerCode() with that source code
- Use: if (window.LogiGo) LogiGo.registerCode(code);

A "View in LogiGo" badge will appear. Clicking it opens an interactive flowchart of the registered code.
```

---

## What Happens

1. **Badge appears** - A "View in LogiGo" badge shows in the bottom-right corner
2. **Click to visualize** - Opens LogiGo Studio with your flowchart
3. **Real-time updates** - When registerCode() is called again, the flowchart updates

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

**Flowchart empty or wrong:**
- Ensure registerCode() is being called with the correct source code
- Check that the code contains valid JavaScript functions
