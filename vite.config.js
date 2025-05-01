import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// eslint-disable-next-line no-unused-vars
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  publicDir: 'public', // ensures public/_redirects is copied
});
