---
id: fact-jwt-auth
type: fact
domain: security
status: active
title: 登录鉴权必须校验 JWT 签名
decision: 使用 JWT 作为无状态鉴权方案
rationale: 为了保护微服务接口的安全，必须校验签名以防止伪造 token。
---
所有需要鉴权的 API 必须引入 `src/lib/auth.ts` 进行 Token 校验。严禁使用基于 Session 的鉴权。
