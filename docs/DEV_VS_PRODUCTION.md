# Development vs Production Mode

LogicArt runs in two different environments: **development** (in Replit) and **production** (at logic.art). Most features work identically in both environments, but there are a few key differences to understand.

---

## Production URL

**Production:** https://logic.art

When integrating LogicArt with external apps, always use the production URL in your script tags:

```html
<script src="https://logic.art/remote.js?project=MyApp"></script>
```

---

## Feature Availability

| Feature | Development | Production |
|---------|-------------|------------|
| Static Mode (paste code) | ✅ | ✅ |
| Flowchart visualization | ✅ | ✅ |
| Time Travel debugging | ✅ | ✅ |
| Ghost Diff | ✅ | ✅ |
| Model Arena | ✅ | ✅ |
| Remote Mode | ✅ | ✅ |
| Debug with AI | ✅ | ✅ |
| Guided Tours | ✅ | ✅ |
| **File Sync** | ✅ | ❌ |

**File Sync** is the only feature that requires the development environment. It enables bidirectional file synchronization with Replit Agent and requires direct file system access only available in the development workspace.

---

## Debug with AI URLs

When you use the "Debug with AI" feature, the generated script URL automatically uses the correct domain based on where you're running LogicArt:

- **In development:** URL points to your dev server (e.g., `your-repl.replit.dev`)
- **On logic.art:** URL points to `https://logic.art`

This ensures checkpoints always connect to the correct server.

---

## Remote Mode Integration

For integrating external apps with LogicArt, always use the production URL:

```html
<!-- Recommended: Always use production URL -->
<script src="https://logic.art/remote.js?project=MyApp&autoOpen=false"></script>
```

The remote.js script handles:
- Session creation
- Checkpoint transmission
- Code registration
- Studio auto-open

---

## When to Use Each Environment

### Use Development When:
- Building and testing new features
- Using File Sync with Replit Agent
- Debugging LogicArt itself

### Use Production When:
- Integrating LogicArt into external apps
- Sharing flowchart URLs with others
- Embedding visualizations in production apps
- Using the Model Arena or Remote Mode features

---

## Testing Tips

1. **Always test with production** for external integrations - use `https://logic.art`
2. **Script URLs are dynamic** - Debug with AI uses `window.location.origin` to generate the correct URL
3. **Checkpoint data flows to the server** - Ensure your external app can reach the LogicArt server you're using

---

## Common Issues

### "My checkpoints aren't showing up"

Make sure your script URL matches where you have LogicArt open:
- If viewing at `logic.art`, use `https://logic.art/remote.js`
- If viewing in dev mode, use your dev URL

### "File Sync isn't working"

File Sync only works in the Replit development environment. It requires direct file system access not available in production deployments.
