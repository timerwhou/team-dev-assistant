# 生产级部署指南

Team Dev Assistant 提供两种部署形态：**单机评估**与**多 Agent 生产编排**。请根据你的场景选择。

> ⚠️ **安全警告**：若未配置 `MCP_API_KEY` 或 `OAUTH_ISSUER`，服务将处于**无鉴权状态**，**严禁**暴露在公网。

## 场景一：单机快速评估（仅 MCP Server + Studio）

适用于：快速体验 Studio、验证 MCP 接口。

```bash
docker run -d --rm \
  --name tda-mcp \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  -v $(pwd)/.tda:/app/.tda \
  ghcr.io/timerwhou/team-dev-assistant:v1.12.0
```

启动后访问 `http://localhost:3000/studio` 即可使用可视化画布。

### 📁 数据持久化
务必挂载 `.tda` 目录。否则容器重启后，Playbook、工作流资产、Trace 历史将全部丢失。

### 🔐 权限契约
容器以非 root 用户（UID 10001）运行。挂载宿主机目录前，请确保权限正确：
```bash
mkdir -p .tda && sudo chown -R 10001:10001 .tda
```

## 场景二：完整生产部署（多 Agent 协同）

适用于：需要 Reviewer / Investigator / Coordinator 协同工作的团队。

```bash
docker compose -f docker/compose.prod.yml up -d
```

该 Compose 文件复用**同一个镜像**，通过 `command` 启动不同角色：
- `mcp-server`：核心网关，暴露 3000 端口。
- `reviewer`：代码评审 Agent，暴露 4101 端口。
- `investigator`：问题调查 Agent，暴露 4102 端口。
- `coordinator`：任务调度器，依赖上述两个 Agent。

## 场景三：企业级安全加固

在场景一或二的基础上，配置 OAuth 2.1：

```bash
-e OAUTH_ISSUER=https://your-idp.com \
-e OAUTH_JWKS_URI=https://your-idp.com/.well-known/jwks.json \
-e MCP_CANONICAL_URI=https://mcp.your-domain.com \
```

启用后，服务将基于 JWT 的 `tenant_id` 实现多租户隔离，并对每个租户独立限流。

## 版本策略
生产环境**务必使用固定版本 Tag**（如 `v1.12.0`），而非 `latest`，以确保部署的可复现性。
