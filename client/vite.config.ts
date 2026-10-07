import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // reads client/.env, .env.local, .env.[mode]
  const target = env.VITE_PROXY_TARGET || 'http://localhost:5005';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // In development, /api calls go to the Node server, so the browser sees one origin and CORS never comes up.
      proxy: { '/api': { target, changeOrigin: true } },
    },
  };
});
