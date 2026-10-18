# CLI

命令行入口，主要用于本地调试与单 Agent 运行。

## 用法

```bash
pnpm dev "/<skill> [参数]"
```

## 架构记忆体工具

### 导出背景包 (/inject)
```bash
pnpm dev "/inject 我要做一个订单消息推送"
```

### 扫描代码入库 (/sync-facts)
```bash
pnpm dev "/sync-facts"
```

## 示例

```bash
pnpm dev "/review apps/cli/src/index.ts"
pnpm dev "/investigate 项目里有没有 SQL 注入"
pnpm dev "/issues --state=open --label=bug"
pnpm dev "/help"
```

## 环境变量

| 变量 | 作用 |
|---|---|
| `TDA_TRACE=0` | 关闭 trace 日志 |
| `TDA_TRACE_CONSOLE=1` | 将 trace 输出到控制台 |
| `TDA_VERBOSE=0` | 关闭 verbose 模式 |
