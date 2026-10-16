# GHCR 部署

项目在每次 Release 时自动构建 Docker 镜像并推送到 GitHub Container Registry（GHCR）。

## 镜像地址

```
ghcr.io/timerwhou/team-dev-assistant:latest
ghcr.io/timerwhou/team-dev-assistant:v0.1.6
ghcr.io/timerwhou/team-dev-assistant:0.1
```

**Tag 策略**：
- `latest`：最新 Release
- `v0.1.6`：具体版本
- `0.1`：minor 版本

## 拉取镜像

**镜像已设为 public**，无需登录：

```bash
docker pull ghcr.io/timerwhou/team-dev-assistant:latest
```

**如果需要登录**（比如镜像改为 private）：

```bash
# 1. 创建 GitHub PAT（需要 read:packages scope）
# 2. 登录 GHCR
echo "YOUR_PAT" | docker login ghcr.io -u timerwhou --password-stdin

# 3. 拉取
docker pull ghcr.io/timerwhou/team-dev-assistant:latest
```

## 运行镜像

```bash
docker run --rm \
  -e OPENAI_API_KEY=sk-xxx \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  -e MODEL=gpt-4o-mini \
  -v /path/to/your/project:/workspace:ro \
  ghcr.io/timerwhou/team-dev-assistant:latest \
  pnpm --filter @tda/cli dev -- /help
```

## 自动化发布流程

每次 Release Please 合并 `chore(main): release x.y.z` PR 后：

1. Release Please 打 tag `vx.y.z`
2. GitHub Actions 触发 `release.yml`
3. `publish-docker` job 构建并推送镜像
4. 镜像标签：`latest` + `vx.y.z` + `x.y`

## 参考

- [Release workflow](https://github.com/timerwhou/team-dev-assistant/blob/main/.github/workflows/release.yml)
- [GHCR 官方文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
