import pkg from "../../../package.json" with { type: "json" };

import { defineConfig } from "vitepress";

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/team-dev-assistant/' : '/',
  title: "Team Dev Assistant",
  description: "面向 AI Agent 研发的团队级架构记忆体",
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Team Dev Assistant",

    nav: [
      { text: "指南", link: "/guide/getting-started" },
      {
        text: "核心能力",
        items: [
          { text: "Team Playbook (架构记忆)", link: "/guide/playbook" },
          { text: "Context Engineering", link: "/context/" },
          { text: "Eval Regression Gate", link: "/eval/" },
          { text: "HITL & A2A", link: "/a2a/" },
          { text: "Agent Skills", link: "/skills/" }
        ]
      },
      {
        text: "开发参考",
        items: [
          { text: "CLI 命令行", link: "/apps/cli" },
          { text: "MCP Server", link: "/mcp/" },
          { text: "核心包 (Core)", link: "/packages/core" },
          { text: "应用架构 (Apps)", link: "/apps/coordinator" }
        ]
      },
      {
        text: "生态与设计",
        items: [
          { text: "GHCR 部署", link: "/deploy/ghcr" },
          { text: "架构决策 (ADR)", link: "/adr/0000-use-adrs" },
          { text: "设计文档", link: "/design/versioning-strategy" }
        ]
      },
      {
        text: `v${pkg.version}`,
        items: [
          { text: "Release", link: "https://github.com/timerwhou/team-dev-assistant/releases" },
          { text: "CHANGELOG", link: "https://github.com/timerwhou/team-dev-assistant/blob/main/CHANGELOG.md" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "入门",
          items: [
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "架构设计", link: "/guide/architecture" },
            { text: "3分钟演示", link: "/guide/demo" },
            { text: "Team Playbook 指南", link: "/guide/playbook" },
          ],
        },
      ],
      "/context/": [
        { text: "Context Engineering", items: [{ text: "总览", link: "/context/" }, { text: "设计文档", link: "/context/design" }] }
      ],
      "/eval/": [
        { text: "Eval Gate", items: [{ text: "质量仪表盘", link: "/eval/" }] }
      ],
      "/a2a/": [
        { text: "A2A 协议", items: [{ text: "双向流与 HITL", link: "/a2a/" }] }
      ],
      "/skills/": [
        { text: "Agent Skills", items: [{ text: "总览", link: "/skills/" }, { text: "Review", link: "/skills/review" }, { text: "Investigate", link: "/skills/investigate" }, { text: "Issues", link: "/skills/issues" }] }
      ],
      "/apps/": [
        { text: "应用", items: [{ text: "CLI", link: "/apps/cli" }, { text: "Coordinator", link: "/apps/coordinator" }, { text: "Reviewer", link: "/apps/reviewer" }] }
      ],
      "/mcp/": [
        { text: "MCP 集成", items: [{ text: "总览", link: "/mcp/" }, { text: "客户端支持", link: "/mcp/client-compat" }, { text: "v1 → v2 迁移", link: "/mcp/migration-notes" }] }
      ],
      "/packages/": [
        { text: "核心包", items: [{ text: "@tda/core", link: "/packages/core" }, { text: "@tda/tools", link: "/packages/tools" }, { text: "@tda/skills", link: "/packages/skills" }] },
        { text: "协议", items: [{ text: "@tda/a2a", link: "/packages/a2a" }, { text: "@tda/mcp-server", link: "/packages/mcp-server" }] }
      ],
      "/deploy/": [
        { text: "部署", items: [{ text: "GHCR 镜像", link: "/deploy/ghcr" }] }
      ],
      "/adr/": [
        {
          text: "Architecture Decisions",
          items: [
            { text: "0. Use ADRs", link: "/adr/0000-use-adrs" },
            { text: "1. Adopt MCP Skills Extension", link: "/adr/0001-adopt-mcp-skills-extension" },
            { text: "2. Upgrade to MCP v2", link: "/adr/0002-upgrade-to-mcp-v2" },
            { text: "3. Implement Skills as Native Extension", link: "/adr/0003-implement-skills-as-native-extension" },
            { text: "4. Align Release Versioning", link: "/adr/0004-align-release-versioning-with-milestones" },
            { text: "6. Decouple Versioning from Milestones", link: "/adr/0006-decouple-versioning-from-milestones" },
            { text: "7. Eval Regression Gate", link: "/adr/0007-eval-regression-gate" },
            { text: "8. A2A BiDi & HITL", link: "/adr/0008-a2a-bidi-hitl" },
            { text: "9. Team Playbook", link: "/adr/0009-team-playbook-architecture" },
          ],
        },
      ],
      "/design/": [
        { text: "设计文档", items: [{ text: "版本策略", link: "/design/versioning-strategy" }, { text: "Eval Gate 设计", link: "/design/eval-gate" }, { text: "Context 设计", link: "/design/context-engineering" }] }
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/timerwhou/team-dev-assistant" },
    ],

    search: { provider: "local" },
    footer: { message: "基于 MIT 协议发布", copyright: "Copyright © 2026 timerwhou" },
    editLink: { pattern: "https://github.com/timerwhou/team-dev-assistant/edit/main/docs/site/:path", text: "在 GitHub 上编辑此页" },
  },
});
