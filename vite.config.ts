import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base + hash routing lets the build run from any static host path
// (e.g. GitHub Pages at /cableera/) with no server rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
})
