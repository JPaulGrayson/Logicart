# LogicArt Integration Prompt

Copy and paste this prompt into any AI agent (Replit Agent, Cursor, Claude, etc.) to add LogicArt visualization to your app.

---

## The Prompt

```
Add LogicArt code visualization to this project. This lets users see flowcharts of any component's logic.

STEP 1: Add script tag to client/index.html <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

STEP 2: Add a backend API to read source files. In your server routes file, add:

app.get('/api/source/*', (req, res) => {
  const filePath = req.params[0];
  const fullPath = path.join(process.cwd(), 'client', filePath);
  
  if (!fullPath.startsWith(path.join(process.cwd(), 'client'))) {
    return res.status(403).send('Forbidden');
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('File not found');
  }
  
  res.type('text/plain').send(fs.readFileSync(fullPath, 'utf-8'));
});

Make sure to import: import fs from 'fs'; import path from 'path';

STEP 3: Scan my project. List all .tsx/.ts/.jsx/.js files in:
- client/src/pages/
- client/src/components/
- client/src/features/
Show me the file list before proceeding.

STEP 4: Create a FlowchartButton component. Here's the complete code:

import { useState } from 'react';

const COMPONENTS = [
  // REPLACE with actual files from step 3:
  { name: 'Home Page', path: 'src/pages/Home.tsx' },
  { name: 'Dashboard', path: 'src/pages/Dashboard.tsx' },
];

export function FlowchartButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  async function visualize(component) {
    setIsOpen(false);
    try {
      const response = await fetch('/api/source/' + component.path);
      if (!response.ok) throw new Error('Failed to load file');
      const code = await response.text();
      
      const api = window.LogiGo || window.LogicArt;
      if (api?.visualize) {
        api.visualize(code, component.name);
      } else {
        alert('LogicArt not loaded. Check script tag in index.html');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)}>
        View Flowchart
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: 200,
        }}>
          {COMPONENTS.map((c, i) => (
            <div
              key={i}
              onClick={() => visualize(c)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: i < COMPONENTS.length - 1 ? '1px solid #eee' : 'none',
              }}
              onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

STEP 5: Add <FlowchartButton /> to an EXISTING header/navbar component.
- Find Header.tsx, Navbar.tsx, or similar shared navigation component
- Import and add the button there
- Do NOT create a floating button with position:fixed (gets hidden behind backgrounds)

STEP 6: Test it:
1. Run the app (npm run dev)
2. Click "View Flowchart" button
3. Select a component from the dropdown
4. LogicArt should open in a new tab showing the flowchart

If flowchart shows sample code instead of your component:
- Check browser Network tab - is /api/source/... returning 200?
- Check browser console for errors
- Verify the file path in COMPONENTS matches actual file location
```

---

## How It Works

1. **Backend API** reads source files directly from disk (avoids bundling issues)
2. **Component picker** lets users choose which file to visualize
3. **LogicArt API** (`visualize()`) sends code and opens the flowchart

---

## Troubleshooting

**API returns 404:**
- Check file path matches actual location (client/src/... vs src/...)
- Try: `curl http://localhost:5000/api/source/src/pages/Home.tsx`

**Flowchart shows sample code:**
- API might be returning error HTML instead of code
- Check Network tab for actual response content

**LogicArt not loaded error:**
- Verify script tag is in `<head>` section
- Check browser console for script loading errors

---

## API Reference

### LogicArt.visualize(code, name)
Sends code and opens LogicArt with the flowchart:
```javascript
window.LogicArt.visualize(algorithmCode, 'MyComponent');
```

### LogicArt.openWithCode(code, name)  
Alternative method (same behavior):
```javascript
window.LogicArt.openWithCode(algorithmCode, 'MyComponent');
```
