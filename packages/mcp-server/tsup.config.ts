import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  noExternal: ['@tda/core', '@tda/skills'],
  // 移除 banner 配置，改由 onSuccess 后处理
  onSuccess: async () => {
    const file = 'dist/index.js';
    let content = readFileSync(file, 'utf8');
    // 移除任意位置的 shebang
    content = content.replace(/^#!.*\r?\n/m, '');
    // 强制在第一行插入 shebang
    writeFileSync(file, '#!/usr/bin/env node\n' + content, 'utf8');
    // 赋予可执行权限
    chmodSync(file, 0o755);
    console.log('✅ Shebang 已强制置于第一行，文件已设为可执行');
  },
});
