import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    pool: 'threads',
    maxWorkers: 2,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './') },
  },
})
