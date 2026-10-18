# 容器化部署

通过 `docker compose` 一键启动多 Agent 环境。

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
| `reviewer` | 4101 | 代码评审 Agent（HTTP + WebSocket） |
| `investigator` | 4102 | 问题排查 Agent（HTTP + WebSocket） |
| `coordinator` | — | 协调器（跑完即退出） |

## 镜像发布

每次 GitHub Release 自动推送镜像到 GHCR。

```bash
docker pull ghcr.io/timerwhou/team-dev-assistant:latest
```

详见 [GHCR 部署文档](/deploy/ghcr)。
