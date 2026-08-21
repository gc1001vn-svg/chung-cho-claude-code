import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Build-time only. Icons are generated once and committed to `public/`, so this
// is not a permanent dependency — see ASSETS.md for how to re-run it.
//
// The preset defaults to padding 0.3 on both the maskable and the Apple icon.
// That is meant for logos on a plain background; our icon is a full-bleed scene,
// and both platforms apply their own mask on top, so padding is set to 0 to stop
// the artwork rendering as a small card floating inside a larger one.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { fit: 'cover', background: '#2A1B3C' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { fit: 'cover', background: '#2A1B3C' },
    },
  },
  images: ['assets-src/icon.svg'],
});
