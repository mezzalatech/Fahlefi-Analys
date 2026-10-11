import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: [
        '**/data/**',
        '**/*.db',
        '**/*.db-journal',
        '**/*.db-wal',
        '**/*.db-shm',
        '**/*.xlsx',
        '**/*.pptx',
        '**/*.pdf'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
