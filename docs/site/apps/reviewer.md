# Reviewer Agent

代码评审 Agent，通过 A2A 协议暴露。

## 启动

```bash
pnpm --filter @tda/reviewer dev
```

监听 `http://localhost:4101`。

## Agent Card

```bash
curl http://localhost:4101/.well-known/agent.json | jq
```

## 调用

```bash
curl -X POST http://localhost:4101/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tasks/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"type": "text", "text": "function add(a,b){return a+b}"}],
        "messageId": "m1"
      }
    }
  }'
```

返回 Task 后轮询 `tasks/get`。
