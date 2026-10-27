import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // 🌟 关键修复：将 @tda/a2a 也加入 noExternal，确保 ESM/CJS 兼容
  noExternal: ['@tda/core', '@tda/skills', '@tda/a2a'],
  // 注入 createRequire，让 ESM 包内的 require() 正常工作
  banner: {
    js: `import { createRequire as __createRequire } from 'module'; var require = __createRequire(import.meta.url);`,
  },
  onSuccess: async () => {
    const file = 'dist/index.js';
    let content = readFileSync(file, 'utf8');
    // 移除任意位置的 shebang
    content = content.replace(/^#!.*\r?\n/m, '');
    // 强制在第一行插入 shebang（必须在 banner 之前）
    writeFileSync(file, '#!/usr/bin/env node\n' + content, 'utf8');
    // 赋予可执行权限
    chmodSync(file, 0o755);
    console.log('✅ Shebang 已强制置于第一行，require 兼容层已注入');
  },
});
