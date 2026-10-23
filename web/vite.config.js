import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  envDir: '../',
  resolve: {
    alias: {
      '@examples': path.resolve(__dirname, '../examples')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});

