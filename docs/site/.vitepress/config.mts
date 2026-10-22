import pkg from "../../../package.json" with { type: "json" };
import { defineConfig } from "vitepress";

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/team-dev-assistant/' : '/',
  title: "Team Dev Assistant",
  description: "面向 AI Agent 研发的团队级架构记忆体",
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Team Dev Assistant",
    outline: { level: [2, 3] },

    nav: [
      { text: "指南", link: "/guide/getting-started" },
      {
        text: "核心能力",
        items: [
          { text: "Visual Studio (可视化编排)", link: "/apps/studio" },
          { text: "Team Playbook (架构记忆)", link: "/guide/playbook" },
          { text: "Context Engineering", link: "/context/" },
          { text: "Eval Regression Gate", link: "/eval/" },
          { text: "HITL & A2A 协同", link: "/a2a/" }
        ]
      },
      {
        text: "开发参考",
        items: [
          { text: "CLI 命令行工具", link: "/apps/cli" },
          { text: "MCP Server 接入", link: "/packages/mcp-server" },
          { text: "核心包 (Core Engine)", link: "/packages/core" }
        ]
      },
      { text: "安全部署", link: "/deploy/ghcr" },
      { text: "架构决策 (ADR)", link: "/adr/0006-decouple-versioning-from-milestones" },
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
        { text: "快速入门", items: [
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "3分钟演示", link: "/guide/demo" },
            { text: "架构设计", link: "/guide/architecture" }
        ]},
        { text: "核心概念", items: [
            { text: "Team Playbook (记忆体)", link: "/guide/playbook" },
            { text: "Context Engineering", link: "/context/" }
        ]}
      ],
      "/apps/": [
        { text: "可视化编排", items: [
            { text: "Studio 画布与画廊", link: "/apps/studio" }
        ]},
        { text: "开发者工具", items: [
            { text: "CLI 命令行", link: "/apps/cli" }
        ]}
      ],
      "/packages/": [
        { text: "核心引擎", items: [
            { text: "@tda/core (运行时)", link: "/packages/core" },
            { text: "@tda/tools (基础工具)", link: "/packages/tools" },
            { text: "@tda/skills (技能包)", link: "/packages/skills" }
        ]},
        { text: "通信与协议", items: [
            { text: "@tda/mcp-server (接入层)", link: "/packages/mcp-server" },
            { text: "@tda/a2a (Agent间通信)", link: "/packages/a2a" }
        ]}
      ],
      "/mcp/": [
        { text: "MCP 接入", items: [
            { text: "总览", link: "/mcp/" },
            { text: "客户端支持", link: "/mcp/client-compat" }
        ]}
      ],
      "/deploy/": [
        { text: "部署与安全", items: [
            { text: "GHCR 镜像", link: "/deploy/ghcr" }
        ]}
      ],
      "/adr/": [
        { text: "Architecture Decisions", items: [
            { text: "版本策略解耦", link: "/adr/0006-decouple-versioning-from-milestones" },
            { text: "Eval 回归门禁", link: "/adr/0007-eval-regression-gate" },
            { text: "A2A 双向流与 HITL", link: "/adr/0008-a2a-bidi-hitl" },
            { text: "Team Playbook 架构", link: "/adr/0009-team-playbook-architecture" }
        ]}
      ],
      "/skills/": [
        { text: "Agent Skills", items: [
            { text: "总览", link: "/skills/" },
            { text: "Review", link: "/skills/review" },
            { text: "Investigate", link: "/skills/investigate" },
            { text: "Issues", link: "/skills/issues" }
        ]}
      ],
      "/a2a/": [
        { text: "A2A 协议", items: [
            { text: "双向流与 HITL", link: "/a2a/" }
        ]}
      ],
      "/eval/": [
        { text: "Eval Gate", items: [
            { text: "质量仪表盘", link: "/eval/" }
        ]}
      ],
      "/context/": [
        { text: "Context Engineering", items: [
            { text: "总览", link: "/context/" },
            { text: "设计文档", link: "/context/design" }
        ]}
      ]
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/timerwhou/team-dev-assistant" },
    ],

    search: { provider: "local" },
    footer: { message: "基于 MIT 协议发布", copyright: "Copyright © 2026 timerwhou" },
    editLink: { pattern: "https://github.com/timerwhou/team-dev-assistant/edit/main/docs/site/:path", text: "在 GitHub 上编辑此页" },
  },
});
