import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      },
      resolve: {
        alias: {
          // FIX: __dirname is not available in ES modules. Using import.meta.url instead.
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});