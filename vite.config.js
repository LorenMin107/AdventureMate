import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'public/dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    // Configure asset handling
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@assets': path.resolve(__dirname, 'client/src/assets'),
      '@components': path.resolve(__dirname, 'client/src/components'),
      '@context': path.resolve(__dirname, 'client/src/context'),
      '@hooks': path.resolve(__dirname, 'client/src/hooks'),
      '@layouts': path.resolve(__dirname, 'client/src/layouts'),
      '@pages': path.resolve(__dirname, 'client/src/pages'),
      '@utils': path.resolve(__dirname, 'client/src/utils')
    },
    mainFields: ['module', 'main', 'browser']
  },
  // Configure static asset handling
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.svg', '**/*.gif', '**/*.webp', '**/*.avif', '**/*.woff', '**/*.woff2', '**/*.eot', '**/*.ttf', '**/*.otf']
});
