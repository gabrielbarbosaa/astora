import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // funciona em GitHub Pages e em qualquer subpasta
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
});
