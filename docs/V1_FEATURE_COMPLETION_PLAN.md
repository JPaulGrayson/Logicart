# LogiGo V1 Feature Completion Plan

**Date:** December 26, 2025  
**Goal:** Add all low-hanging fruit features before V1 launch  
**Excluded:** Multi-App Interaction Mapping (saved for V2)

---

## Features to Add

1. ✅ Replit Agent Programmatic API
2. ✅ Model Arena File Selection
3. ✅ Hierarchical Navigation Enhancements
4. ✅ Layout Presets
5. ✅ Undo/Redo History
6. ✅ Enhanced Sharing

---

## Feature 1: Replit Agent Programmatic API

**Effort:** 2-3 days  
**Value:** High (enables AI workflows)

### Implementation Plan

#### Phase 1: Read-Only API (Day 1)
Create REST endpoints for code analysis:

**New file:** `server/agent-api.ts`
```typescript
// GET /api/agent/analyze
// POST body: { code: string, language?: string }
// Returns: GroundingContext (already implemented!)

import { parseCodeToFlow } from '@logigo/bridge';
import { generateGroundingContext } from '@logigo/core';

export async function analyzeCode(code: string) {
  const flowData = parseCodeToFlow(code);
  const groundingContext = generateGroundingContext(
    flowData.nodes, 
    flowData.edges
  );
  
  return {
    summary: groundingContext.summary,
    flow: groundingContext.flow,
    nodes: flowData.nodes.length,
    edges: flowData.edges.length,
    complexity: groundingContext.summary.complexityScore
  };
}
```

**Add to:** `server/routes.ts`
```typescript
app.post('/api/agent/analyze', async (req, res) => {
  const { code } = req.body;
  const analysis = await analyzeCode(code);
  res.json(analysis);
});
```

#### Phase 2: CLI Tool (Day 2)
**New package:** `packages/logigo-cli/`

```bash
npm install -g @logigo/cli

# Usage
logigo analyze src/auth.js
logigo analyze src/auth.js --output json > analysis.json
logigo analyze src/auth.js --format summary
```

**Implementation:**
```typescript
// packages/logigo-cli/src/index.ts
import { Command } from 'commander';
import fs from 'fs';
import { analyzeCode } from './api-client';

const program = new Command();

program
  .command('analyze <file>')
  .option('-o, --output <format>', 'Output format (json|summary)', 'summary')
  .action(async (file, options) => {
    const code = fs.readFileSync(file, 'utf-8');
    const analysis = await analyzeCode(code);
    
    if (options.output === 'json') {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log(`Complexity: ${analysis.complexity}`);
      console.log(`Nodes: ${analysis.nodes}`);
      console.log(`Entry Point: ${analysis.summary.entryPoint}`);
    }
  });

program.parse();
```

#### Phase 3: Documentation (Day 3)
**New file:** `docs/AGENT_API.md`

Include:
- API endpoint reference
- CLI usage examples
- Replit Agent prompt templates
- Example workflows

---

## Feature 2: Model Arena File Selection

**Effort:** 1-2 days  
**Value:** Medium (improves Arena UX)

### Implementation Plan

#### Phase 1: File Tree Component (Day 1)
**New file:** `client/src/components/arena/FileTree.tsx`

```typescript
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export function FileTree({ onFileSelect }: { onFileSelect: (path: string) => void }) {
  const [files, setFiles] = useState<FileNode[]>([]);
  
  // Fetch file tree from server
  useEffect(() => {
    fetch('/api/files/tree').then(r => r.json()).then(setFiles);
  }, []);
  
  return (
    <div className="file-tree">
      {files.map(node => (
        <FileNode 
          key={node.path} 
          node={node} 
          onSelect={onFileSelect} 
        />
      ))}
    </div>
  );
}
```

#### Phase 2: Integration with Arena (Day 1)
**Update:** `client/src/pages/ModelArena.tsx`

```typescript
const [selectedFile, setSelectedFile] = useState<string | null>(null);

// When file is selected, load its content
const handleFileSelect = async (path: string) => {
  const response = await fetch(`/api/files/read?path=${path}`);
  const { content } = await response.json();
  setPrompt(content); // Pre-fill prompt with file content
  setSelectedFile(path);
};

// Add file tree to UI
<div className="flex gap-4">
  <FileTree onFileSelect={handleFileSelect} />
  <Textarea value={prompt} onChange={...} />
</div>
```

#### Phase 3: AI Code Discovery (Day 2)
Add search functionality:

```typescript
// Search for code by description
const handleAISearch = async (query: string) => {
  // "Find the authentication logic"
  const response = await fetch('/api/agent/search', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  const { files } = await response.json();
  // Show matching files in tree
};
```

---

## Feature 3: Hierarchical Navigation Enhancements

**Effort:** 1 day  
**Value:** Low (polish)

### Implementation Plan

#### Breadcrumb Navigation
**Update:** `client/src/components/ide/Flowchart.tsx`

```typescript
const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Global']);

// When user clicks container, add to breadcrumbs
const handleContainerClick = (containerName: string) => {
  setBreadcrumbs([...breadcrumbs, containerName]);
  // Zoom to container
};

// Render breadcrumbs
<div className="breadcrumbs">
  {breadcrumbs.map((crumb, i) => (
    <span key={i} onClick={() => setBreadcrumbs(breadcrumbs.slice(0, i + 1))}>
      {crumb} {i < breadcrumbs.length - 1 && ' > '}
    </span>
  ))}
</div>
```

#### Zoom Presets
**Update:** `client/src/components/ide/Flowchart.tsx`

```typescript
const zoomPresets = [
  { name: 'Mile-High', zoom: 0.3 },
  { name: '1000ft', zoom: 0.7 },
  { name: '100ft', zoom: 1.2 }
];

<div className="zoom-presets">
  {zoomPresets.map(preset => (
    <Button 
      key={preset.name}
      onClick={() => reactFlowInstance.setZoom(preset.zoom)}
    >
      {preset.name}
    </Button>
  ))}
</div>
```

---

## Feature 4: Layout Presets

**Effort:** 0.5 days  
**Value:** Low (polish)

### Implementation Plan

**Update:** `client/src/pages/Workbench.tsx`

```typescript
const layoutPresets = {
  '50-50': { code: 50, flowchart: 50 },
  '30-70': { code: 30, flowchart: 70 },
  '70-30': { code: 70, flowchart: 30 },
  'code-only': { code: 100, flowchart: 0 },
  'flowchart-only': { code: 0, flowchart: 100 }
};

const applyLayout = (preset: keyof typeof layoutPresets) => {
  const { code, flowchart } = layoutPresets[preset];
  // Update ResizablePanel sizes
  setCodePanelSize(code);
  setFlowchartPanelSize(flowchart);
  
  // Save to localStorage
  localStorage.setItem('logigo-layout', preset);
};

// Add preset buttons to toolbar
<div className="layout-presets">
  <Button onClick={() => applyLayout('50-50')}>50/50</Button>
  <Button onClick={() => applyLayout('30-70')}>30/70</Button>
  <Button onClick={() => applyLayout('70-30')}>70/30</Button>
</div>
```

---

## Feature 5: Undo/Redo History

**Effort:** 1 day  
**Value:** Medium (improves confidence)

### Implementation Plan

#### Phase 1: History Stack
**New file:** `client/src/lib/historyManager.ts`

```typescript
interface HistoryEntry {
  code: string;
  timestamp: number;
  label?: string;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxSize = 50;
  
  push(code: string, label?: string) {
    // Remove any entries after current index
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new entry
    this.history.push({ code, timestamp: Date.now(), label });
    this.currentIndex++;
    
    // Trim if too large
    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }
    
    // Persist to localStorage
    this.save();
  }
  
  undo(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex].code;
    }
    return null;
  }
  
  redo(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex].code;
    }
    return null;
  }
  
  save() {
    localStorage.setItem('logigo-history', JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex
    }));
  }
  
  load() {
    const saved = localStorage.getItem('logigo-history');
    if (saved) {
      const { history, currentIndex } = JSON.parse(saved);
      this.history = history;
      this.currentIndex = currentIndex;
    }
  }
}
```

#### Phase 2: Integration
**Update:** `client/src/pages/Workbench.tsx`

```typescript
const historyManager = useRef(new HistoryManager());

// Load history on mount
useEffect(() => {
  historyManager.current.load();
}, []);

// Push to history when code changes
const handleCodeChange = (newCode: string) => {
  historyManager.current.push(newCode);
  adapter.writeFile(newCode);
};

// Undo/Redo handlers
const handleUndo = () => {
  const code = historyManager.current.undo();
  if (code) adapter.writeFile(code);
};

const handleRedo = () => {
  const code = historyManager.current.redo();
  if (code) adapter.writeFile(code);
};

// Add keyboard shortcuts (already in useKeyboardShortcuts)
// Cmd+Z for undo, Cmd+Shift+Z for redo
```

#### Phase 3: UI Buttons
Add undo/redo buttons to toolbar:

```typescript
<div className="history-controls">
  <Button 
    onClick={handleUndo} 
    disabled={!canUndo}
    title="Undo (Cmd+Z)"
  >
    <Undo className="w-4 h-4" />
  </Button>
  <Button 
    onClick={handleRedo} 
    disabled={!canRedo}
    title="Redo (Cmd+Shift+Z)"
  >
    <Redo className="w-4 h-4" />
  </Button>
</div>
```

---

## Feature 6: Enhanced Sharing

**Effort:** 1-2 days  
**Value:** Medium (improves sharing UX)

### Implementation Plan

#### Phase 1: Server-Side Storage (Day 1)
**New table:** `shares` in PostgreSQL

```sql
CREATE TABLE shares (
  id VARCHAR(8) PRIMARY KEY,  -- Short ID (e.g., "a3b9c2f1")
  code TEXT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  views INTEGER DEFAULT 0
);
```

**New endpoint:** `POST /api/share`
```typescript
app.post('/api/share', async (req, res) => {
  const { code, title, description } = req.body;
  
  // Generate short ID
  const id = generateShortId(); // 8 chars
  
  // Store in database
  await db.query(
    'INSERT INTO shares (id, code, title, description) VALUES ($1, $2, $3, $4)',
    [id, code, title, description]
  );
  
  res.json({ 
    url: `https://logigo.replit.app/s/${id}`,
    id 
  });
});
```

**New endpoint:** `GET /s/:id`
```typescript
app.get('/s/:id', async (req, res) => {
  const { id } = req.params;
  
  // Fetch from database
  const result = await db.query(
    'SELECT code, title, description FROM shares WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).send('Share not found');
  }
  
  // Increment view count
  await db.query('UPDATE shares SET views = views + 1 WHERE id = $1', [id]);
  
  // Redirect to workbench with code
  const { code, title } = result.rows[0];
  const encoded = encodeURIComponent(btoa(code));
  res.redirect(`/?code=${encoded}&title=${encodeURIComponent(title)}`);
});
```

#### Phase 2: Share Dialog (Day 1)
**New component:** `client/src/components/ide/ShareDialog.tsx`

```typescript
export function ShareDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleShare = async () => {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, title, description })
    });
    
    const { url } = await response.json();
    setShareUrl(url);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Share Flowchart</DialogTitle>
      <DialogContent>
        <Input 
          placeholder="Title (optional)" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />
        <Textarea 
          placeholder="Description (optional)" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
        />
        
        {!shareUrl ? (
          <Button onClick={handleShare}>Create Share Link</Button>
        ) : (
          <div className="share-result">
            <Input value={shareUrl} readOnly />
            <Button onClick={handleCopy}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

#### Phase 3: Open Graph Meta Tags (Day 2)
**Update:** `server/index.ts`

```typescript
app.get('/s/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    'SELECT code, title, description FROM shares WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).send('Share not found');
  }
  
  const { title, description } = result.rows[0];
  
  // Render HTML with Open Graph tags
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${title || 'LogiGo Flowchart'}" />
        <meta property="og:description" content="${description || 'Interactive code flowchart'}" />
        <meta property="og:image" content="https://logigo.replit.app/og-image.png" />
        <meta property="og:url" content="https://logigo.replit.app/s/${id}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta http-equiv="refresh" content="0; url=/?code=..." />
      </head>
      <body>Redirecting...</body>
    </html>
  `);
});
```

---

## Implementation Timeline

### Week 1 (Dec 27 - Jan 2)
**Days 1-3:** Replit Agent API
- Day 1: REST API endpoints
- Day 2: CLI tool
- Day 3: Documentation

**Days 4-5:** Model Arena File Selection
- Day 4: File tree component + integration
- Day 5: AI code discovery

### Week 2 (Jan 3 - Jan 9)
**Day 1:** Hierarchical Navigation
- Breadcrumbs + zoom presets

**Day 2:** Layout Presets
- Quick layout buttons + localStorage

**Days 3-4:** Undo/Redo History
- Day 3: History manager + integration
- Day 4: UI buttons + testing

**Days 5-6:** Enhanced Sharing
- Day 5: Server-side storage + short URLs
- Day 6: Share dialog + Open Graph

### Week 3 (Jan 10 - Jan 12)
**Days 1-3:** Testing & Polish
- Integration testing
- Bug fixes
- Documentation updates

---

## Total Effort Estimate

| Feature | Effort | Priority |
|---------|--------|----------|
| Replit Agent API | 3 days | High |
| Model Arena File Selection | 2 days | Medium |
| Hierarchical Navigation | 1 day | Low |
| Layout Presets | 0.5 days | Low |
| Undo/Redo History | 1 day | Medium |
| Enhanced Sharing | 2 days | Medium |
| **Testing & Polish** | 3 days | High |
| **TOTAL** | **12.5 days** | |

**Timeline:** 2.5 weeks (mid-January launch)

---

## Success Criteria

Each feature must meet these criteria before shipping:

1. ✅ **Replit Agent API**
   - CLI tool works: `logigo analyze file.js`
   - API returns valid GroundingContext
   - Documentation with examples

2. ✅ **Model Arena File Selection**
   - File tree renders correctly
   - Click file → loads into prompt
   - Search finds relevant files

3. ✅ **Hierarchical Navigation**
   - Breadcrumbs update on container click
   - Zoom presets work (Mile-High, 1000ft, 100ft)

4. ✅ **Layout Presets**
   - 5 presets work (50/50, 30/70, 70/30, code-only, flowchart-only)
   - Preference persists across sessions

5. ✅ **Undo/Redo History**
   - Cmd+Z undoes, Cmd+Shift+Z redoes
   - History persists across sessions
   - UI buttons reflect state

6. ✅ **Enhanced Sharing**
   - Short URLs work (e.g., `/s/a3b9c2f1`)
   - Title/description display in previews
   - Open Graph tags render correctly

---

## Risk Mitigation

### Risk 1: Scope Creep
**Mitigation:** Stick to the plan. No new features during implementation.

### Risk 2: Integration Issues
**Mitigation:** Test each feature independently before integrating.

### Risk 3: Performance Degradation
**Mitigation:** Profile after each feature. Optimize if needed.

### Risk 4: Database Migration
**Mitigation:** Test PostgreSQL schema changes on staging first.

---

## Launch Checklist

Before V1 launch, verify:

- [ ] All 6 features implemented and tested
- [ ] Documentation updated (Help Dialog, GETTING_STARTED.md)
- [ ] Installation guides tested (Antigravity, Cursor, Windsurf, VS Code)
- [ ] All 12+ example templates work
- [ ] Export (PNG/PDF) works
- [ ] Remote Mode works
- [ ] Model Arena works
- [ ] VS Code extension works
- [ ] No critical bugs
- [ ] Performance is acceptable

---

**Plan created by Antigravity - December 26, 2025**

*Estimated launch: Mid-January 2026 (2.5 weeks)*
