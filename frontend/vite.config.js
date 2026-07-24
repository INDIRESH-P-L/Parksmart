import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    // framer-motion + leaflet + recharts are the heavy chunks — split them so
    // the initial paint of the landing page stays light.
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['framer-motion'],
          map: ['leaflet', 'react-leaflet'],
          charts: ['recharts'],
        },
      },
    },
  },
});
