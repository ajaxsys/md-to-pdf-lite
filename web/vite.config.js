import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  envDir: '../',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
