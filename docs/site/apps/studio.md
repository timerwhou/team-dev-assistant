# Visual Studio (可视化编排)

基于 Svelte 5 + Svelte Flow 构建的企业级工作流编排与观测平台。

## 🚀 快速启动

Studio 是独立的 SvelteKit 应用，需要与后端的 MCP Server 配合使用。

### 1. 启动后端
```bash
# 在项目根目录
MCP_TRANSPORT=http pnpm --filter @tda/mcp-server dev
```
后端将启动在 `http://127.0.0.1:3000`。

### 2. 启动前端 Studio
```bash
cd apps/studio
pnpm install
pnpm run dev
```
浏览器访问 `http://localhost:5173` 即可看到画布。

> ⚙️ **环境变量**：如果你修改了后端端口，请在 `apps/studio/.env.development` 中修改 `VITE_API_BASE_URL`。

## 🎨 核心交互指南
- **添加节点**：从左侧「组件库」按住 `Context Gathering`、`Execution` 或 `Review`，拖入中间画布。
- **编辑属性**：点击画布中的任意节点，右侧「节点属性」面板会滑出，可修改名称、勾选需要绑定的底层能力（如 `search_code`）。
- **保存资产**：点击顶部「保存」，系统会生成 `WorkflowManifest` 并调用 `/api/assets` 持久化。
- **运行与观测**：点击「运行工作流」，节点会亮起蓝色呼吸灯（SSE 实时推送执行 Trace）。
- **历史回放**：点击顶部「历史记录」，选择任意一次执行记录，可瞬间还原当时的 Console 日志与节点高亮状态。

## 🗂️ 资产管理
访问 `http://localhost:5173/gallery` 可以进入资产画廊，这里展示了所有已保存的工作流，支持一键加载至画布、重命名或删除。
