import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const VENDOR_CHUNKS: Record<string, string[]> = {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  three: ['three', '@react-three/fiber', '@react-three/drei'],
  ui: ['framer-motion', 'recharts'],
  query: ['@tanstack/react-query', 'axios', 'zustand'],
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          for (const [chunk, deps] of Object.entries(VENDOR_CHUNKS)) {
            if (deps.some((dep) => id.includes(dep))) return chunk
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
