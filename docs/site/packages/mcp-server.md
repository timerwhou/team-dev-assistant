# @tda/mcp-server

提供 MCP 协议接入及可视化 Studio 的 RESTful API 支撑。

## 🚀 传输模式与鉴权
| 模式 | 环境变量 | 适用场景 | 鉴权机制 |
|---|---|---|---|
| stdio | `MCP_TRANSPORT=stdio` | 本地 IDE | 进程信任 |
| HTTP | `MCP_TRANSPORT=http` | Dify / Studio | `MCP_API_KEY` 或 OAuth 2.1 |

## 📡 API 端点矩阵
- **资产 CRUD**：`GET /api/assets`, `POST /api/assets`, `PUT /api/assets/:id`, `DELETE /api/assets/:id`
- **执行与观测**：`POST /api/workflows/execute`（触发），`GET /trace/:workflowId`（SSE 实时接收）
- **历史查询**：`GET /api/traces`, `GET /api/traces/:workflowId`

> 🛡️ **安全提示**：API 已启用严格的 CORS 校验、路径穿越防御（UUID 严格校验）及日志注入拦截。
