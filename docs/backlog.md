# 项目技术债与质量加固待办清单 (Backlog)

## 📌 质量加固周期 (v1.14.1 / v1.15.0)

### P0：生产部署与白屏隐患 (Blocker)
- [x] **[Backlog-001] 前端 Studio 客户端误引用 Node 原生模块**
  - **位置**: `apps/studio/src/lib/utils.ts`
  - **现象**: `import from "node:crypto"` 在浏览器环境下会导致白屏崩溃
  - **方案**: 替换为 Web 标准 `globalThis.crypto.randomUUID()`
- [x] **[Backlog-002] SvelteKit 生产适配器缺失**
  - **位置**: `apps/studio/svelte.config.js`
  - **现象**: `studio:build: adapter_missing`，无法产出确定的独立生产部署包
  - **方案**: 引入 `@sveltejs/adapter-static` 达成 SPA 纯净静态导出

### P1：无障碍合规与可观测性守护 (Quality)
- [ ] **[Backlog-003] FlowCanvas 画布 A11y 交互与语义违规**
  - **位置**: `apps/studio/src/lib/components/FlowCanvas.svelte`
  - **现象**: `<main>` 标签绑定 click 事件触发 Svelte 5 A11y 警告
  - **方案**: 补齐键盘事件处理程序与交互语义属性
- [ ] **[Backlog-004] 向量检索静默降级指标可见性**
  - **位置**: `packages/core/src/playbook/retriever.ts`
  - **现象**: Embedding 服务异常时静默降级为 BM25，缺少结构化 Trace
  - **方案**: 引入 `retriever_degraded` 事件上报至 Trace 总线
- [ ] **[Backlog-005] Studio 前端单元测试体系建立**
  - **位置**: `apps/studio`
  - **现象**: 目前测试用例为 0（`passWithNoTests`）
  - **方案**: 配置 Vitest + Testing Library，覆盖组件渲染与数据流测试

### P2：依赖链治理 (Maintenance)
- [ ] **[Backlog-006] 废弃依赖升级与 Dependabot PR #197 消化**
  - **现象**: `lucide-svelte@1.0.1` 废弃警告及 Peer 依赖冲突
  - **方案**: 梳理依赖树，验证并合入 PR #197
