import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: [{ find: /^react-native$/, replacement: 'react-native-web' }],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-native-web'],
    exclude: ['react-native'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
