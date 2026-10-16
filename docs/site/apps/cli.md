# CLI

命令行入口，本地调试用。

## 用法

```bash
pnpm dev "/<skill> [参数]"
```

## 示例

```bash
pnpm dev "/review apps/cli/src/index.ts"
pnpm dev "/investigate 项目里有没有 SQL 注入"
pnpm dev "/issues --state=open --label=bug"
pnpm dev "/help"
```

## 参数解析

支持三种形式：

```bash
pnpm dev "/review apps/cli/src/index.ts"     # 整串
pnpm dev /review apps/cli/src/index.ts       # 拆分
pnpm --filter @tda/cli dev -- /review x.ts   # 带分隔符
```

## 环境变量

| 变量 | 作用 |
|---|---|
| `TDA_TRACE=0` | 关闭 trace |
| `TDA_TRACE_CONSOLE=1` | trace 打到控制台 |
| `TDA_VERBOSE=0` | 关闭 verbose |
