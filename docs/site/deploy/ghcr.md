# 安全部署 (GHCR)

## 镜像拉取

```bash
docker pull ghcr.io/timerwhou/team-dev-assistant:latest
```

## 安全启动

```bash
docker run -d --rm \
  --name tda-mcp \
  -p 3000:3000 \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -v $(pwd)/docs/playbook:/app/docs/playbook:ro \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  ghcr.io/timerwhou/team-dev-assistant:v1.2.0
```

### 企业级多租户与安全配置

在生产环境中，若需启用多租户与限流，请添加以下环境变量：

```bash
  -e OAUTH_ISSUER=https://your-idp.com \
  -e OAUTH_JWKS_URI=https://your-idp.com/.well-known/jwks.json \
  -e MCP_CANONICAL_URI=https://mcp.your-domain.com \
  # 可选：自定义限流配置（默认 60 req/min）
  # -e MCP_RATE_LIMIT_MAX=100 \
  # -e MCP_RATE_LIMIT_WINDOW_MS=60000 \
```

> **Note**：启用 OAuth 后，服务会自动根据 JWT 的 `tenant_id` 将不同的请求路由到隔离的存储目录，并对每个租户独立执行频率限制。

### 参数解释
- `--read-only`：强制容器文件系统只读，防止恶意写入。
- `--cap-drop=ALL`：剥离所有 Linux 特权能力，防止容器逃逸。
- `--security-opt=no-new-privileges`：防止提权。
- `-v ...:ro`：Playbook 通过只读挂载注入，确保数据不被篡改。
- `MCP_API_KEY`：启用 Bearer Token 鉴权，拒绝未授权访问。
