import { defineConfig } from 'vite';

// Builds the playable game into the repository root, so GitHub Pages serves it
// at https://gabifav.github.io/good-in-the-hood/
export default defineConfig({
  base: './',
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
});
