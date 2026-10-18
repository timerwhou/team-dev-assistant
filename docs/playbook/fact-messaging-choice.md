---
id: fact-messaging-choice
type: fact
domain: infra
status: active
title: 消息队列严禁使用 Redis Pub/Sub
decision: 统一使用 Kafka 作为消息总线
alternatives:
  - redis-pubsub: 不支持消息持久化与消费组回溯，高并发下会丢消息，否决
  - rabbitmq: 运维成本高，且团队缺乏相关经验，否决
rationale: 核心业务要求 at-least-once 保证与完整的 traceId 追踪链路
decided_by: 架构组
decided_at: 2026-10-19
---
如遇异步通知、订单推送等需求，必须使用 `src/lib/kafka.ts` 封装的生产者，严禁引入任何 Redis 队列方案。
