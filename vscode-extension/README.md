# LogiGo - Code Flow Visualizer

Transform JavaScript code into interactive flowcharts with step-by-step execution.

## Features

- **Automatic Flowchart Generation**: Visualize JavaScript/TypeScript code as control flow diagrams
- **Interactive Nodes**: Click on nodes to jump to source code locations
- **Dagre Layout**: Automatic hierarchical graph arrangement
- **Real-time Updates**: Auto-refresh when files change
- **Multi-Platform**: Works on VS Code, Google Antigravity, Cursor, and Windsurf

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "LogiGo"
4. Click Install

### From Open VSX (Google Antigravity)
1. Open Antigravity
2. Go to Extensions
3. Search for "LogiGo"
4. Click Install

### Manual Installation (.vsix)
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Run command: `Extensions: Install from VSIX...`
4. Select the downloaded file

## Usage

1. Open a JavaScript or TypeScript file
2. Click the flowchart icon in the editor toolbar, or
3. Run command: `LogiGo: Visualize Current File`
4. The flowchart appears in a side panel
5. Click nodes to navigate to source code

## Configuration

```json
{
  "logigo.autoRefresh": true,
  "logigo.layout": "dagre"
}
```

## Supported Platforms

- ✅ Visual Studio Code
- ✅ Google Antigravity
- ✅ Cursor
- ✅ Windsurf
- ✅ Any VS Code fork

## Development

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Watch mode
npm run watch

# Package for distribution
npm run package
```

## Publishing

### To VS Code Marketplace
```bash
npm run publish:marketplace
```

### To Open VSX (for Antigravity)
```bash
npm run publish:openvsx
```

## License

MIT
