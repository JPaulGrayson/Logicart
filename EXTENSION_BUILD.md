# Building Cartographer as a Replit Extension

This document explains how to build Cartographer for deployment as a Replit Extension.

## Build Process

### Extension Build

Build the static extension bundle:

```bash
npx vite build --config vite.extension.config.ts
```

This will create a production build in `dist/extension/` with the following structure:
```
dist/extension/
├── extension.html         # Extension entry HTML (renamed from main.html)
├── assets/                # Bundled JS, CSS, and assets
├── extension.json         # Extension manifest (automatically copied from public/)
└── ...                    # Other static assets
```

The `extension.json` manifest is automatically copied to the output directory during the build process.

### Standalone Build (Full App)

Build the full standalone application with server:

```bash
npm run build
```

This creates `dist/public/` and `dist/index.js` for production deployment.

## Extension Structure

### Entry Points

- **Standalone**: `client/src/main.tsx` → Uses `StandaloneAdapter` with in-app code editor
- **Extension**: `client/src/extension.tsx` → Uses `ReplitAdapter` with Replit's native editor

### Manifest

The extension manifest is located at `public/extension.json` and includes:

- **Name & Description**: Extension metadata
- **Tools**: Defines the "cartographer" tool with handler pointing to `index.html`
- **Scopes**: Required permissions (`read`, `write-exec`)
- **Tags**: Discovery tags for the extension marketplace

### Adapter Pattern

Cartographer uses a pluggable adapter architecture:

1. **IDEAdapter Interface**: Defines file operations, editor integration, and lifecycle methods
2. **StandaloneAdapter**: In-memory code state for standalone usage
3. **ReplitAdapter**: Integrates with Replit Extension APIs:
   - `session.getActiveFile()` - Get currently active file
   - `session.onActiveFileChange()` - Watch for file switches
   - `fs.readFile()` - Read file content
   - `fs.writeFile()` - Save code changes
   - `fs.watchFile()` - Watch for external file changes

## Deployment

### To Replit Extension Marketplace

1. Build the extension: `npx vite build --config vite.extension.config.ts`
2. Copy `public/extension.json` to `dist/extension/extension.json`
3. Package `dist/extension/` directory
4. Submit to Replit Extension Marketplace

### To Standalone Server

1. Build: `npm run build`
2. Deploy: `npm start`
3. Server runs on port 5000 (or PORT environment variable)

## Testing

### Test Standalone Mode

```bash
npm run dev
```

Opens at http://localhost:5000 with in-app code editor

### Test Extension Mode (Replit Extension Devtools)

1. **Build the extension:**
   ```bash
   npx vite build --config vite.extension.config.ts
   ```
   This creates a production bundle in `dist/extension/`

2. **Open Extension Devtools:**
   - Click the "Devtools" button in the top-right corner of your Replit workspace
   - This opens the Extension Devtools panel

3. **Load the extension locally:**
   - In Extension Devtools, click "Load Locally"
   - Set the output directory to `dist/extension`
   - The extension will load from your built files

4. **Preview the tool:**
   - Open a JavaScript file in your Replit editor (e.g., `example.js`)
   - In Extension Devtools, click "Preview" next to the Cartographer tool
   - A new tab will open showing Cartographer visualizing your code

5. **Test features:**
   - Edit code in Replit's editor → Flowchart updates automatically
   - Double-click flowchart nodes → Updates source code in Replit
   - Use step-by-step execution controls
   - Verify minimap shows fixed overview while main canvas zooms

## Architecture Notes

- Extension mode hides the code editor panel (uses `adapter.hasIntegratedEditor()`)
- File changes in Replit's editor automatically update the flowchart
- Bi-directional editing: Changes to flowchart nodes update the source file
- Real-time sync between Replit editor and Cartographer visualization
