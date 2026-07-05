import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: /^react-native-health$/, replacement: path.resolve(__dirname, 'stubs/react-native-health.js') },
      { find: /^react-native-health-connect$/, replacement: path.resolve(__dirname, 'stubs/react-native-health-connect.js') },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
