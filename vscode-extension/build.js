const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  minify: !isWatch
};

const webviewConfig = {
  entryPoints: ['src/webview/index.tsx'],
  bundle: true,
  outfile: 'dist/webview/webview.js',
  format: 'iife',
  platform: 'browser',
  sourcemap: true,
  minify: !isWatch,
  loader: {
    '.css': 'css'
  }
};

async function build() {
  try {
    if (isWatch) {
      const extensionContext = await esbuild.context(extensionConfig);
      const webviewContext = await esbuild.context(webviewConfig);
      
      await Promise.all([
        extensionContext.watch(),
        webviewContext.watch()
      ]);
      
      console.log('Watching for changes...');
    } else {
      await Promise.all([
        esbuild.build(extensionConfig),
        esbuild.build(webviewConfig)
      ]);
      
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
