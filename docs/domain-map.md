# 领域资产映射 (Domain-Module Map)

本文件用于界定项目边界，防止代码写错位置。任何新功能开发前，必须确认目标位置。

## 1. 核心引擎层 (`packages/core`)
- **职责**：纯业务逻辑、数据契约、能力注册、智能体执行调度。**严禁包含任何 UI 或平台特定的代码。**
- **核心文件**：
  - `src/runtime/registry.ts`：能力注册中心，**禁止在此处写具体业务逻辑**。
  - `src/runtime/agentic-loop.ts`：执行闭环调度器。
  - `src/runtime/workflow-types.ts`：全局唯一契约（Zod）。
- **扩展规则**：新增能力包，必须在 `src/runtime/capabilities/` 下建立独立文件。

## 2. 接入层 (`packages/mcp-server`)
- **职责**：HTTP 路由、鉴权、SSE 推送、数据持久化。
- **核心文件**：
  - `src/server.ts`：路由分发。**禁止在此处写复杂业务逻辑**，只做参数校验和转发。
  - `src/workflow-store.ts`：文件持久化。必须包含安全校验。

## 3. 可视化前端 (`apps/studio`)
- **职责**：纯 UI 展示与交互。
- **核心文件**：
  - `src/routes/+page.svelte`：编辑器主视图，负责状态管理。
  - `src/routes/gallery/+page.svelte`：资产画廊。
  - `src/lib/components/FlowCanvas.svelte`：画布渲染。
  - `src/lib/utils.ts`：纯函数，包括 Mapper 和 cn。
- **扩展规则**：禁止在组件中直接写 fetch 业务逻辑，必须通过 Mapper 转换后提交。

## 4. 工具链 (`apps/cli` & `apps/coordinator`)
- **职责**：命令行交互与多 Agent 调度。
