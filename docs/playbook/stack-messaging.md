---
id: stack-messaging
type: stack
domain: infra
status: active
title: 消息推送技术选型
---
- **主选型**：Kafka
- **客户端库**：kafkajs 版本 ^2.2.4
- **设计规范**：所有消息发送必须带 traceId，并统一经过 `src/lib/kafka.ts` 封装的 Producer 发送。
