import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Solea',
        short_name: 'Solea',
        description: 'Plantar fascia recovery reminders and exercise guide',
        theme_color: '#7BAF8E',
        background_color: '#F9F6F1',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});