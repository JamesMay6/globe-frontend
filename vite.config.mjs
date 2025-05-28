import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: 'Cesium' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: 'Cesium' },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: 'Cesium' },
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: 'Cesium' }
      ]
    })
  ],
  resolve: {
    alias: {
      cesium: path.resolve('node_modules/cesium')
    }
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/Cesium')
  }
});
