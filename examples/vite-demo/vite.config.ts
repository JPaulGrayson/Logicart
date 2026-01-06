import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import logicartPlugin from 'logicart-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    logicartPlugin({
      manifestPath: 'logicart-manifest.json',
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/node_modules/**']
    })
  ],
  server: {
    port: 3001
  }
});
