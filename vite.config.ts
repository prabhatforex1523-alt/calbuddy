import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (id.includes('firebase')) {
    return 'firebase-vendor';
  }

  if (id.includes('recharts') || id.includes('d3-')) {
    return 'charts-vendor';
  }

  if (id.includes('motion') || id.includes('canvas-confetti')) {
    return 'motion-vendor';
  }

  if (id.includes('@google/genai')) {
    return 'ai-vendor';
  }

  if (id.includes('@capacitor') || id.includes('@capacitor-community')) {
    return 'capacitor-vendor';
  }

  return 'vendor';
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify; file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      target: 'chrome61',
      cssCodeSplit: false,
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
