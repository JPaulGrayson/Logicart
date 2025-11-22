import { Plugin } from 'vite';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Vite plugin to copy extension.json to the build output directory
 */
export function copyExtensionManifest(): Plugin {
  return {
    name: 'copy-extension-manifest',
    closeBundle() {
      const source = resolve(import.meta.dirname, 'public/extension.json');
      const dest = resolve(import.meta.dirname, 'dist/extension/extension.json');
      
      // Ensure directory exists
      mkdirSync(dirname(dest), { recursive: true });
      
      // Copy manifest
      copyFileSync(source, dest);
      console.log('✓ Copied extension.json to dist/extension/');
    }
  };
}
