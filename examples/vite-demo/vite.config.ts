import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logigoPlugin from 'logigo-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logigoPlugin({
      manifestPath: 'logigo-manifest.json',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**']
    })
  ],
  server: {
    port: 3001
  }
});
