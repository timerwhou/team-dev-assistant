import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/lib/env.ts'],
  format: ['esm'],
  clean: false,
  sourcemap: true,
  shims: true,
});
