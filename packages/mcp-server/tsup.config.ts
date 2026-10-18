import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // 强制将内部 workspace 包打包进 dist
  noExternal: ['@tda/core', '@tda/skills'],
  // 保留 shebang
  banner: {
    js: '#!/usr/bin/env node',
  },
});
