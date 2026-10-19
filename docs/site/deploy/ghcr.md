# GHCR 部署

项目在每次 Release 时自动构建 Docker 镜像并推送到 GitHub Container Registry。

## 镜像地址
`ghcr.io/timerwhou/team-dev-assistant:latest`

## 生产级安全运行命令

不要直接使用 `docker run` 默认参数运行，请严格遵循以下安全配置：

```bash
docker run -d --rm \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e MCP_API_KEY=your-secure-token \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  -v $(pwd)/docs/playbook:/app/docs/playbook:ro \
  ghcr.io/timerwhou/team-dev-assistant:v1.2.0
```

### 参数解释
- `--read-only`：强制容器文件系统只读，防止恶意写入。
- `--cap-drop=ALL`：剥离所有 Linux 特权能力，防止容器逃逸。
- `--security-opt=no-new-privileges`：防止提权。
- `-v ...:ro`：Playbook 通过只读挂载注入，确保数据不被篡改。
- `MCP_API_KEY`：启用 Bearer Token 鉴权，拒绝未授权访问。
