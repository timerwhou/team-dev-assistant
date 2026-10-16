# 容器化

`docker compose` 一键起多 Agent。

## 启动

```bash
cd docker
docker compose up -d
docker compose logs -f coordinator
docker compose down
```

## 服务

| 服务 | 端口 | 说明 |
|---|---|---|
| `reviewer` | 4101 | 代码评审 Agent |
| `investigator` | 4102 | 问题排查 Agent |
| `coordinator` | — | 协调器，跑一次退出 |

## 设计要点

- **单阶段构建**：简单可靠，避开 pnpm 软链坑
- **healthcheck**：`start_period: 30s`，等 Agent 就绪
- **depends_on**：`condition: service_healthy`，等两个 Agent healthy
- **volume 挂载**：宿主机项目挂到容器 `/workspace:ro`
- **密钥注入**：`env_file: ../.env`，不 COPY 进镜像

## 启动时间

- 首次 `build`：~90s
- 再次 `build`：~1s（缓存）
- `up -d` 到 healthy：~6s
