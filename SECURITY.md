# Security Policy

## 支持的版本

我们为以下版本提供安全更新：

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## 报告漏洞

**请不要通过公开的 GitHub Issue 报告安全漏洞。**

我们提供以下私密渠道：

1. **GitHub Private Vulnerability Reporting**（推荐）
   打开 https://github.com/timerwhou/team-dev-assistant/security/advisories/new
   填写漏洞详情，提交后只有维护者可见。

2. **邮件**
   发送至 `security@example.com`（把这里换成你的真实邮箱）

### 报告内容应包含

- 漏洞类型（命令注入 / 路径穿越 / XSS / SSRF / Prompt Injection 等）
- 受影响的文件与版本
- 复现步骤（PoC）
- 影响评估
- 建议的修复方案（可选）

### 响应时间

| 阶段 | 时间 |
| ---- | ---- |
| 确认收到 | 48 小时内 |
| 初步评估 | 5 个工作日内 |
| 修复发布 | 视严重程度，Critical 7 天内 |

### 漏洞披露

修复发布后，我们会在 GitHub Security Advisory 中公开致谢（除非你要求匿名）。

## 已知安全设计

本项目已实现以下安全措施：

- **命令注入防护**：`search_code` 使用 `execFile` + 参数数组，不走 shell
- **路径穿越防护**：`read_file` 使用 `path.relative` 校验，拒绝 `..` 逃逸
- **密钥隔离**：`.env` 不进 git、不进 Docker 镜像
- **工具白名单**：每个 Skill 只能调用声明的工具
- **回归测试**：`packages/tools/test/read-file.test.ts` 覆盖攻击用例
