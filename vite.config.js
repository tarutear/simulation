import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative asset paths so the build works from any sub-path and can be
  // inlined into a single file (scripts/build-artifact.mjs)
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500, // three.js + r3f + drei in one chunk is expected here
  },
})
