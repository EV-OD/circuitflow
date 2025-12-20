import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY1': JSON.stringify(env.GEMINI_API_KEY1),
        'process.env.GEMINI_API_KEY2': JSON.stringify(env.GEMINI_API_KEY2),
        'process.env.GEMINI_API_KEY3': JSON.stringify(env.GEMINI_API_KEY3),
        'process.env.GEMINI_API_KEY4': JSON.stringify(env.GEMINI_API_KEY4),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
