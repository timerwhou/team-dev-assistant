# 架构设计

> 本项目在 v1.2.0 实现了跨模型、跨工作流的团队级架构记忆中枢。

## 核心架构图

```text
[ 本地 IDE (Cursor) ]      [ 远程 Agent (Dify/Coze) ]
        |                           |
   (stdio 模式)              (Streamable HTTP 模式)
        |                           |
        +-------------+-------------+
                      |
              [ 鉴权与安全校验 ]
             (Bearer Token / 限流)
                      |
+-------------------------------------------+
|                MCP Server                 |
|  (动态技能发现、资源路由、Playbook 暴露)  |
+-------------------------------------------+
                      |
+-------------------------------------------+
|             Team Playbook 引擎            |
|                                           |
|  [捕获] -> [存储] -> [检索] -> [注入]     |
|    |          |          |          |     |
| @fact      Markdown   混合检索    MCP     |
| HITL       YAML决策   (BM25+向量) /inject |
+-------------------------------------------+
```

## 数据流与生命周期

1. **捕获（Capture）**：`// @fact` 标注或 HITL 确认，沉淀业务约束与决策。
2. **存储（Store）**：`docs/playbook/` 目录，结构化记录 `decision` / `alternatives`。
3. **检索（Retrieve）**：`AsyncHybridRetriever` 并发执行 BM25 与 Embedding 语义检索，通过 RRF 融合并截断 Top-K。
4. **消费（Consume）**：
   - **本地**：通过 `stdio` 管道直接注入 IDE。
   - **远程**：通过 HTTP 协议暴露，供第三方 Agent 拉取。

## 安全边界
- **网络层**：强制校验 Origin，防 DNS 重绑定。
- **应用层**：HTTP 模式支持 Bearer Token 鉴权。
- **容器层**：最小化权限运行、只读文件系统、剥离 Capabilities。
