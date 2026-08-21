import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Must match the GitHub Pages project path exactly. Changing it later breaks the
// scope of every PWA already installed on a phone, so it is fixed here in one
// place and reused by the manifest below.
const BASE = '/thuong-lo/';

export default defineConfig({
  base: BASE,
  define: {
    // Rendered in the corner of the screen so a phone can be checked against the
    // latest deploy without guessing whether the service worker updated.
    __BUILD_ID__: JSON.stringify(new Date().toISOString().replace('T', ' ').slice(0, 16)),
  },
  build: {
    target: 'es2020',
    // Phaser is a single large chunk by design; the warning is noise, not a
    // signal, so raise the bar rather than splitting the engine apart.
    chunkSizeWarningLimit: 1600,
  },
  plugins: [
    VitePWA({
      // 'prompt' rather than 'autoUpdate' so a new build never reloads the page
      // mid-fight — the player is asked first (CLAUDE.md §3.1).
      registerType: 'prompt',
      // Registration happens by hand in src/systems/pwa-update.ts so the prompt
      // is wired to real UI instead of the plugin's default no-op.
      injectRegister: null,
      // No `includeAssets` here: the workbox globs below already sweep up
      // everything in public/, and listing the icons twice puts duplicate URLs
      // in the precache manifest.
      manifest: {
        id: BASE,
        name: 'Thương Lộ',
        short_name: 'Thương Lộ',
        description: 'ARPG offline 2D isometric trên con đường thương mại cổ.',
        lang: 'vi',
        start_url: BASE,
        scope: BASE,
        // Android honours 'fullscreen'. iPhone has no Fullscreen API and falls
        // back to 'standalone'; the override list makes that explicit rather
        // than accidental. iOS also ignores 'orientation' entirely — the
        // landscape prompt is handled by #rotate-overlay in index.html.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        background_color: '#14101C',
        theme_color: '#2A1B3C',
        categories: ['games'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg,ico,webp,woff2,mp3,ogg}'],
        // Workbox defaults to 2 MiB and silently drops anything larger from the
        // precache — a file missed here does not fail the build, it fails the
        // game offline. The Phaser bundle is ~1.2 MiB today, so the default
        // still holds, but the texture atlases from Phase 1 will not. Raised now
        // rather than after the first "works online, blank offline" report.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
      },
      devOptions: { enabled: false },
    }),
  ],
});
