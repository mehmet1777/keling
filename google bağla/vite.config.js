import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Critical: Enables relative paths for Capacitor (fixes blank screen issue)
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable for production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined // Optimize chunk splitting
      }
    },
    // Exclude audio folder from build (moved to Play Asset Delivery)
    copyPublicDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com', '.loca.lt', 'localhost'],
    hmr: {
      clientPort: 5173
    }
  }
})
