# Cartographer VS Code Extension - Deployment Guide

This guide walks through deploying Cartographer to multiple platforms: VS Code Marketplace, Open VSX Registry (for Google Antigravity), and manual distribution.

## Prerequisites

1. **Node.js 18+** installed
2. **Publisher accounts**:
   - VS Code Marketplace: [Azure DevOps organization](https://marketplace.visualstudio.com/manage)
   - Open VSX: [Eclipse Foundation account](https://open-vsx.org/)

## Setup

### 1. Install Dependencies

```bash
cd vscode-extension
npm install
```

### 2. Install Publishing Tools

```bash
# VS Code Extension Manager
npm install -g @vscode/vsce

# Open VSX CLI
npm install -g ovsx
```

## Building the Extension

### Build for Production

```bash
npm run build
```

This creates:
- `dist/extension.js` - Main extension bundle
- `dist/webview/webview.js` - Webview React app
- `dist/webview/webview.css` - Webview styles

### Package as .vsix

```bash
npm run package
```

Creates `cartographer-1.0.0.vsix` for manual distribution.

## Publishing

### To VS Code Marketplace

1. **Create Publisher** (first time only):
```bash
vsce create-publisher <your-publisher-name>
```

2. **Get Personal Access Token**:
   - Go to https://dev.azure.com/
   - User Settings → Personal Access Tokens
   - Create token with **Marketplace (Manage)** scope
   - Save token securely

3. **Login**:
```bash
vsce login <your-publisher-name>
# Enter your Personal Access Token
```

4. **Update package.json**:
```json
{
  "publisher": "your-publisher-name"
}
```

5. **Publish**:
```bash
npm run publish:marketplace
```

Or manually:
```bash
vsce publish
```

### To Open VSX Registry (Google Antigravity)

1. **Get Access Token**:
   - Sign in to https://open-vsx.org/
   - Settings → Access Tokens
   - Generate new token
   - Save token securely

2. **Publish**:
```bash
npm run publish:openvsx -- -p <your-access-token>
```

Or manually:
```bash
ovsx publish -p <your-access-token>
```

### Cross-Platform Publishing (Both Registries)

```bash
# Build and package
npm run build
npm run package

# Publish to VS Code Marketplace
vsce publish

# Publish to Open VSX
ovsx publish cartographer-1.0.0.vsix -p <openvsx-token>
```

## Platform Support

| Platform | Registry | Notes |
|----------|----------|-------|
| **VS Code** | VS Code Marketplace | Original platform |
| **Google Antigravity** | Open VSX | VS Code fork, uses Open VSX |
| **Cursor** | VS Code Marketplace | VS Code fork, shares marketplace |
| **Windsurf** | VS Code Marketplace / Open VSX | VS Code fork, supports both |

## Manual Distribution

Share the `.vsix` file directly:

1. Build: `npm run package`
2. Share `cartographer-1.0.0.vsix`
3. Users install via:
   - VS Code: `Extensions: Install from VSIX...`
   - Antigravity: Same command
   - Command line: `code --install-extension cartographer-1.0.0.vsix`

## Testing Before Publishing

### Local Testing in VS Code

1. Open the extension project in VS Code
2. Press F5 to launch Extension Development Host
3. Test all commands:
   - `Cartographer: Visualize Current File`
   - Click flowchart icon in editor toolbar
   - Test file watching
   - Test node clicking

### Test .vsix Package

```bash
npm run package
code --install-extension cartographer-1.0.0.vsix
```

## Versioning

Update version in `package.json`:

```json
{
  "version": "1.0.1"
}
```

Then publish:
```bash
npm run package
vsce publish
ovsx publish cartographer-1.0.1.vsix -p <token>
```

## CI/CD Automation (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd vscode-extension
          npm install
      
      - name: Build
        run: |
          cd vscode-extension
          npm run build
      
      - name: Publish to VS Code Marketplace
        run: |
          cd vscode-extension
          npx vsce publish -p ${{ secrets.VSCE_TOKEN }}
      
      - name: Publish to Open VSX
        run: |
          cd vscode-extension
          npx ovsx publish -p ${{ secrets.OPENVSX_TOKEN }}
```

Add secrets in GitHub repo settings:
- `VSCE_TOKEN` - Azure DevOps Personal Access Token
- `OPENVSX_TOKEN` - Open VSX Access Token

## Troubleshooting

### "Publisher not found"

Update `publisher` field in `package.json` to match your registered publisher name.

### "Extension activation failed"

Check that all dependencies are bundled correctly in `build.js`.

### "Cannot find module 'vscode'"

`vscode` is marked as external in build config - correct behavior.

### Webview not loading

Verify Content Security Policy in `extension.ts` allows loading from `webview` directory.

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Open VSX Registry](https://open-vsx.org/)
- [Google Antigravity Docs](https://antigravity.google/)

## Support

For issues:
- VS Code Marketplace: Publisher dashboard
- Open VSX: Community forums
- GitHub: Create issue in repository
