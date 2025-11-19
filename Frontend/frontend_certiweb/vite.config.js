import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import polyfillNode from 'rollup-plugin-polyfill-node';
import * as StellarSdk from '@stellar/stellar-sdk';

// Usamos solo una vez cada clave y eliminamos duplicados.
export default defineConfig({
  plugins: [
    vue(),
    polyfillNode()  // Integrar polyfill para Node.js en el navegador
  ],
  define: {
    global: {}  // Evita errores por la variable global
  },
  resolve: {
    alias: {
      global: 'globalthis',  // Emula "global"
      process: 'rollup-plugin-polyfill-node/polyfills/process-es6',
      Buffer: 'rollup-plugin-polyfill-node/polyfills/buffer-es6'
    }
  },
  methods: {
  connectFreighter() {
    // tu código para conectar la wallet
  },
  registrarDocumento() {
    // tu código para registrar documento
  }
},
  optimizeDeps: {
    include: ['buffer', 'process']  // Pre-bundle dependencias necesarias
  },
  build: {
    rollupOptions: {
      plugins: [
        polyfillNode()
      ]
    }
  }
});

