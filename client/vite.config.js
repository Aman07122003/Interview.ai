import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: 'build', // This tells Vite to output to 'build' instead of 'dist'
    emptyOutDir: true // This will clear the directory before each build
  }
})
