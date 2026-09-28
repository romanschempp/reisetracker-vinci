import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Erzeugt die PNG-Icons aus public/favicon.svg: `npm run icons`
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#260600' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#260600' } },
  },
  images: ['public/favicon.svg'],
});
