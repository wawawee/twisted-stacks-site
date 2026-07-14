import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/suparays': {
          target: 'http://127.0.0.1:3011',
          changeOrigin: true,
        },
        '/api/ate': {
          target: 'http://127.0.0.1:3012',
          changeOrigin: true,
        },
      },
    },
  };
});
