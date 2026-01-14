# LogicArt Integration Prompt

Copy and paste this prompt into any AI agent (Replit Agent, Cursor, Claude, Turai, etc.) to add LogicArt visualization to your app.

---

## The Prompt

```
Add LogicArt code visualization to this project. This lets users see flowcharts of any component's logic AND view the full project architecture.

STEP 1: Add script tag to client/index.html (or your main HTML file) <head>:
<script src="https://logic.art/remote.js?mode=push&hideBadge=true"></script>

STEP 2: Add a backend API to read source files. In your server routes file, add:

app.get('/api/source', (req, res) => {
  const filePath = req.query.file;
  if (!filePath) {
    return res.status(400).send('Missing file parameter');
  }
  
  const fullPath = path.resolve(process.cwd(), filePath);
  const projectRoot = process.cwd();
  
  if (!fullPath.startsWith(projectRoot)) {
    return res.status(403).send('Forbidden');
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('File not found: ' + filePath);
  }
  
  res.type('text/plain').send(fs.readFileSync(fullPath, 'utf-8'));
});

Make sure to import: import fs from 'fs'; import path from 'path';

STEP 3: Scan this project for ALL component files. Search these directories:
- src/pages/, client/src/pages/
- src/components/, client/src/components/
- src/features/, client/src/features/
- src/lib/, client/src/lib/
- Any other directories containing .tsx/.ts/.jsx/.js files

IMPORTANT: List EVERY file you find. The architecture view needs ALL files to show the complete dependency graph. Do not skip any files.

STEP 4: Create a FlowchartButton component with BOTH individual component views AND full architecture view.

IMPORTANT: Replace the COMPONENTS array with ALL files from step 3. Every file must be included for the architecture view to work correctly.

import { useState } from 'react';

const COMPONENTS = [
  // REPLACE THIS WITH ALL FILES FROM STEP 3
  // Example format - use actual paths from your project:
  { name: 'App', path: 'client/src/App.tsx' },
  { name: 'Home Page', path: 'client/src/pages/Home.tsx' },
  { name: 'Dashboard', path: 'client/src/pages/Dashboard.tsx' },
  { name: 'Header', path: 'client/src/components/Header.tsx' },
  // ... ADD EVERY FILE FOUND IN STEP 3
];

// Get all file paths for architecture view
const ALL_FILES = COMPONENTS.map(c => c.path);

export function FlowchartButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  // View a single component's flowchart
  async function visualize(component) {
    setIsOpen(false);
    try {
      const response = await fetch('/api/source?file=' + encodeURIComponent(component.path));
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
  
  // View full project architecture (component dependency graph)
  function viewArchitecture() {
    setIsOpen(false);
    const api = window.LogiGo || window.LogicArt;
    if (api?.openArchitecture) {
      api.openArchitecture(
        window.location.origin + '/api/source',
        ALL_FILES
      );
    } else {
      alert('LogicArt not loaded. Check script tag in index.html');
    }
  }
  
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)}>
        Flowchart
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
          minWidth: 220,
        }}>
          {/* View Full Architecture - top option */}
          <div
            onClick={viewArchitecture}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              borderBottom: '2px solid #ddd',
              fontWeight: 'bold',
              background: '#f8f9fa',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
          >
            🏗️ View Full Architecture
          </div>
          
          {/* Divider label */}
          <div style={{ 
            padding: '6px 12px', 
            fontSize: '11px', 
            color: '#666',
            background: '#fafafa',
            borderBottom: '1px solid #eee'
          }}>
            Or select single component:
          </div>
          
          {/* Individual components */}
          {COMPONENTS.map((c, i) => (
            <div
              key={i}
              onClick={() => visualize(c)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: i < COMPONENTS.length - 1 ? '1px solid #eee' : 'none',
                background: 'white',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
2. Click "Flowchart" button
3. Click "View Full Architecture" to see component dependency graph
4. Or click a component name to see its individual flowchart
5. LogicArt opens in a new tab

If flowchart shows sample code instead of your component:
- Check browser Network tab - is /api/source/... returning 200?
- Check browser console for errors
- Verify the file path in COMPONENTS matches actual file location
```

---

## How It Works

1. **Backend API** reads source files directly from disk (avoids bundling issues)
2. **Component picker** lets users choose which file to visualize
3. **Architecture view** shows component dependency graph with click-to-drill-down
4. **LogicArt API** handles visualization in the hosted LogicArt app

---

## Features

### Individual Component Flowchart
Shows the control flow (if/else, loops, function calls) of a single component.

### Full Architecture View
Shows how all components connect to each other:
- Click any component node to drill down into its flowchart
- Color-coded by component type (arrow function, regular function, class)
- Automatic layout using dagre algorithm

---

## Troubleshooting

**API returns 404:**
- Check file path matches actual location (client/src/... vs src/...)
- Try: `curl "http://localhost:5000/api/source?file=client/src/pages/Home.tsx"`
- Paths should be relative to project root

**Flowchart shows sample code:**
- API might be returning error HTML instead of code
- Check Network tab for actual response content

**LogicArt not loaded error:**
- Verify script tag is in `<head>` section
- Check browser console for script loading errors

**Architecture view shows fewer components than expected:**
- Verify ALL_FILES array contains ALL file paths from step 3
- Test each file: `curl "http://localhost:5000/api/source?file=path/to/file.tsx"`
- Check that /api/source endpoint can read all files
- Ensure paths are relative to project root (e.g., client/src/... or src/...)

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

### LogicArt.openArchitecture(sourceUrl, files)
Opens the full architecture view showing component dependencies (requires /api/source endpoint):
```javascript
// sourceUrl is your app's source API base URL
// files is an array of file paths to scan
window.LogicArt.openArchitecture(
  window.location.origin + '/api/source',
  ['src/pages/Home.tsx', 'src/components/Header.tsx', 'src/components/Footer.tsx']
);
```

### LogicArt.openArchitectureWithCode(filesData)
Opens architecture view with file contents directly (no /api/source endpoint needed):
```javascript
// filesData is an object mapping file paths to their contents
window.LogicArt.openArchitectureWithCode({
  'src/App.tsx': 'import React from "react";\nexport function App() {...}',
  'src/pages/Home.tsx': 'import { Header } from "../components/Header";\n...',
  'src/components/Header.tsx': 'export function Header() {...}'
});
```
This is the preferred method when the host app already has access to file contents.

### URL Parameters (Alternative)
Open LogicArt directly via URL:

**Single component flowchart:**
```
https://logic.art/?code=<urlEncodedCode>&autorun=true
```

**Architecture view:**
```
https://logic.art/?mode=architecture&sourceUrl=<encodedUrl>&files=<jsonArray>
```

Example:
```
https://logic.art/?mode=architecture&sourceUrl=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fsource&files=%5B%22src%2Fpages%2FHome.tsx%22%5D
```
