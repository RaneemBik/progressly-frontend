/**
 * vite.config.ts — Vite Build Configuration
 *
 * Configures the Vite dev server and production build:
 *  - @vitejs/plugin-react: enables React Fast Refresh in dev and JSX transform
 *  - TypeScript path aliases (if any)
 *  - Build output goes to dist/
 *
 * In production (npm run build), Vite bundles and tree-shakes the app.
 * The output is a static site that can be deployed to Vercel, Netlify, etc.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
