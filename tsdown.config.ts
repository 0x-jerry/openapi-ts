import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: 'node',
  entry: ['src/index.ts', 'cli/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
})
