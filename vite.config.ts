import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    visualizer({ filename: 'stats.html', gzipSize: true, brotliSize: true }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    sourcemap: false, // Optional: Disable sourcemaps in production
    minify: 'esbuild', // Ensure esbuild is used for minification
    esbuild: {
      drop: ['console', 'debugger'], // This line removes console.log and debugger statements
    },
    target: 'es2020',
    modulePreload: { polyfill: false },
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Force major islands into their own long-lived chunks
          if (id.includes('livekit')) return 'livekit';
          if (id.includes('@emoji-mart') || id.includes('emoji-mart'))
            return 'emoji';
          if (id.includes('@tanstack')) return 'react-query';
          if (id.includes('react-router')) return 'router';
          // Removed radix chunk to avoid isolating it from React
          if (id.includes('date-fns')) return 'dates';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('zod')) return 'zod';
          return 'vendor';
        },
      },
    },
  },
}));
