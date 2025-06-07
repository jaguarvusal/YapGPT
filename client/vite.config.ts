import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // Increase the limit to 1000kb
  },
  server: {
    port: 3000,
    open: true,
    proxy: process.env.NODE_ENV === 'production' 
      ? undefined 
      : {
          '/graphql': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
});
