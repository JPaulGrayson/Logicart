# LogiGo Remote Mode - Vibe Coder's Guide

Connect LogiGo to any external app **without writing code yourself**. Just two simple steps!

## Step 1: Add the Script Tag

Add this single line to your app's `index.html` file, inside the `<head>` section:

```html
<script src="YOUR_LOGIGO_URL/remote.js?project=MyApp"></script>
```

Replace `YOUR_LOGIGO_URL` with your LogiGo app's URL (you can find this in the browser address bar when viewing LogiGo).

**Example:**
```html
<head>
  <meta charset="UTF-8" />
  <!-- other head content -->
  <script src="https://your-logigo-app.replit.dev/remote.js?project=MyApp"></script>
</head>
```

When your app loads, you'll see a small notification in the bottom-right corner with a link to view your flowchart.

---

## Step 2: Ask Your AI Agent to Add Checkpoints

Copy this prompt and paste it into your app's AI agent (like Replit Agent):

```
Add LogiGo checkpoint() calls to my code to track execution. The checkpoint() function is already available globally (no import needed).

Guidelines:
- Add checkpoint('step-name', { key: value }) calls at key points in the code
- Track loop iterations: checkpoint('loop-iteration', { i, total })
- Track function starts: checkpoint('function-start', { args })  
- Track results: checkpoint('result', { data })
- Track errors: checkpoint('error', { message })

Example:
for (let i = 0; i < items.length; i++) {
  checkpoint('processing-item', { i, total: items.length, item: items[i] });
  // ... existing code ...
}

Add checkpoints to the main processing logic, loops, and any async operations. Keep checkpoint names descriptive but short.
```

Your AI agent will automatically add the checkpoint calls to your code!

---

## Step 3: View Your Flowchart

1. Run your app
2. Click the notification link, OR
3. Go to LogiGo → Remote Mode to see your session
4. Watch the checkpoints appear in real-time as your code runs!

---

## That's It!

No need to:
- Find specific files manually
- Understand code structure
- Write any code yourself

Just copy, paste, and let your AI agent do the work!

---

## Troubleshooting

**Notification doesn't appear?**
- Make sure the script tag is in the `<head>` section
- Check your browser console for any errors
- Make sure LogiGo is running

**Checkpoints not showing?**
- Make sure your AI agent actually added `checkpoint()` calls to your code
- Run the part of your app that has the checkpoints
- Check that you're viewing the correct session in LogiGo

**Need help?**
Click the help button (?) in LogiGo's header for more documentation.
