# LogiGo Integration Prompt

Copy and paste this into any Replit Agent to add LogiGo visualization.

---

## Zero-Code Prompt (Just Paste This)

```
Add LogiGo code visualization to this project.

Add this script tag to the HTML <head>:
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyApp"></script>

That's it! A "View in LogiGo" badge will appear. When clicked, it automatically captures the page's code and opens a flowchart visualization.
```

---

## What Happens

1. **Badge appears** - A "View in LogiGo" badge shows in the bottom-right corner
2. **Click to visualize** - Clicking automatically:
   - Discovers all scripts on the page
   - Captures and registers the source code
   - Wraps global functions for auto-checkpoints
   - Opens LogiGo Studio with your flowchart ready
3. **No code changes needed** - Works with existing code, no `checkpoint()` calls required

---

## Query Parameters

- `project=MyApp` - Name shown in LogiGo Studio (optional)
- `autoOpen=false` - Don't auto-open after first checkpoint (default: true)

---

## For Vite/React Apps

The zero-code script works best with traditional scripts. For Vite/React apps with bundled modules, add to `index.html`:

```html
<script src="https://logigo-studio-jpaulgrayson.replit.app/remote.js?project=MyReactApp"></script>
```

Then in the browser console, run:
```javascript
LogiGo.enableModuleInstrumentation()
```

Reload the page - your modules will be instrumented for visualization.

---

## Advanced: Manual Checkpoints

For more control, you can also add explicit checkpoints:

```javascript
function processOrder(order) {
  checkpoint('order-received', { orderId: order.id });
  
  if (order.total > 100) {
    checkpoint('applying-discount', { discount: 0.1 });
    order.total *= 0.9;
  }
  
  checkpoint('order-complete', { finalTotal: order.total });
  return order;
}
```

Each `checkpoint(id, variables)` creates a node in the flowchart that lights up as your code runs.

---

## Troubleshooting

**Badge not appearing:**
- Make sure the script is in `<head>` and loads before other scripts
- Check browser console for `[LogiGo]` messages

**Flowchart empty:**
- Click the badge to trigger auto-capture
- For bundled apps, try `LogiGo.enableModuleInstrumentation()` + reload

**Cross-origin errors:**
- The script works best on same-origin or CORS-enabled pages
- For localhost development, this shouldn't be an issue
