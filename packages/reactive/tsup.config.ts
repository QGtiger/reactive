import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  format: ['iife', 'cjs', 'esm'],
  dts: true,
  clean: true,
})