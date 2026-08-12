import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project at /sara/ instead of the domain root, so
// the CI build passes DEPLOY_TARGET=gh-pages to switch the base path; other
// hosts (Vercel, Netlify, local dev) keep serving from '/' unchanged.
const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/sara/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: base,
        name: 'החוקר הקטן שלי - Little Explorer',
        short_name: 'החוקר הקטן',
        description: 'אפליקציית לימוד קסומה לפעוטות בגילאי 2-3',
        theme_color: '#FFB6C1',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        lang: 'he',
        dir: 'rtl',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
