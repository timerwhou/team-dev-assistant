# apps/cli/src/index.ts 代码评审

评审时间：2026-10-15
评审 Agent：@tda/reviewer
评分：68-72 / 100

## 已识别的真实问题

| 严重程度 | 位置 | 问题 |
|---|---|---|
| 高 | main L57-62 | join+split 破坏带空格路径语义 |
| 高 | L126-128 | recorder.flush() 未 await，trace 可能丢失 |
| 中 | L96 | parseSkillArgs(_, skill as any) 绕过类型 |
| 中 | L108 | --quiet=false 变字符串，verbose 逻辑失效 |
| 中 | L110 | 启动横幅不受 verbose 控制 |
| 中 | L8-11 | JSONL reporter 无条件写盘，隐私隐患 |
| 低 | L54 | filter(a => a !== "--") 会删所有 -- |
| 低 | L28-30 | 无类型 coercion，-1 被当 flag |
| 低 | L20-27 | 边界 token 产生垃圾 key |

## 决策

**暂不修复**。理由：
- CLI 是本地调试入口，非产品核心
- 边缘场景不影响 Agent 工程能力演示
- 留作后续 "让 Agent 自己修" 的素材
