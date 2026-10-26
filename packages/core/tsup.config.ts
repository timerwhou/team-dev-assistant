import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: false, // 由 tsc 与 clean 任务管理，避免竞争
  sourcemap: true,
  shims: true,
});
