import { defineConfig } from "vitepress";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __configDir = path.dirname(fileURLToPath(import.meta.url));
const __skillsSidebarPath = path.resolve(__configDir, "../../skills/_sidebar.json");
const skillsSidebar = fs.existsSync(__skillsSidebarPath)
  ? JSON.parse(fs.readFileSync(__skillsSidebarPath, "utf-8")).skills
  : [{ text: "总览", link: "/skills/" }];
import pkg from "../../../package.json" with { type: "json" };

export default defineConfig({
  title: "Team Dev Assistant",
  description: "面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。",
  base: "/team-dev-assistant/",   // ← 必须，否则资源 404
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/team-dev-assistant/logo.svg" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:title", content: "Team Dev Assistant" }],
    ["meta", { name: "og:description", content: "面向研发团队的 AI Agent 工具集：一条命令启动代码评审、问题排查、Issue 汇总三类 Agent，支持 CLI / A2A / MCP 接入，多 Agent 协作。内置可观测性（LLM/Agent trace）、安全加固（防命令注入/路径穿越）与评估体系（回归用例），开箱可用。" }],
  ],

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Team Dev Assistant",

    nav: [
      { text: "指南", link: "/guide/getting-started" },
      { text: "架构", link: "/guide/architecture" },
      { text: "包", link: "/packages/core" },
      { text: "应用", link: "/apps/cli" },
      { text: "开发", link: "/dev/eval" },
      { text: "MCP", link: "/mcp/" },
      { text: "Context", link: "/context/" },
      { text: "Eval", link: "/eval/" },
      { text: "部署", link: "/deploy/ghcr" },
      { text: "ADR", link: "/adr/0000-use-adrs" },
      { text: "设计", link: "/design/skills-migration" },
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
            { text: "架构", link: "/guide/architecture" },
            { text: "演示", link: "/guide/demo" },
          ],
        },
      ],
      "/packages/": [
        {
          text: "核心包",
          items: [
            { text: "@tda/core", link: "/packages/core" },
            { text: "@tda/tools", link: "/packages/tools" },
            { text: "@tda/skills", link: "/packages/skills" },
          ],
        },
        {
          text: "协议",
          items: [
            { text: "@tda/a2a", link: "/packages/a2a" },
            { text: "@tda/mcp-server", link: "/packages/mcp-server" },
          ],
        },
      ],
      "/apps/": [
        {
          text: "应用",
          items: [
            { text: "CLI", link: "/apps/cli" },
            { text: "Reviewer", link: "/apps/reviewer" },
            { text: "Coordinator", link: "/apps/coordinator" },
          ],
        },
      ],      "/mcp/": [
        {
          text: "MCP 集成",
          items: [
            { text: "总览", link: "/mcp/" },
            { text: "客户端支持", link: "/mcp/client-compat" },
            { text: "v1 → v2 迁移", link: "/mcp/migration-notes" },
          ],
        },
      ],      "/eval/": [
        {
          text: "质量仪表盘",
          items: [
            { text: "总览", link: "/eval/" },
          ],
        },
      ],
      "/context/": [
        {
          text: "Context Engineering",
          items: [
            { text: "总览", link: "/context/" },
            { text: "设计文档", link: "/context/design" },
          ],
        },
      ],

      "/deploy/": [
        {
          text: "部署",
          items: [
            { text: "GHCR 镜像", link: "/deploy/ghcr" },
          ],
        },
      ],

      "/dev/": [
        {
          text: "开发",
          items: [
            { text: "评估集", link: "/dev/eval" },
            { text: "可观测性", link: "/dev/trace" },
            { text: "容器化", link: "/dev/docker" },
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
          ],
        },
      ],
      "/design/": [
        {
          text: "设计文档",
          items: [
            { text: "Skill 迁移", link: "/design/skills-migration" },
            { text: "MCP v2 迁移", link: "/design/mcp-v2-migration" },
            { text: "版本策略", link: "/design/versioning-strategy" },
          ],
        },
      ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/timerwhou/team-dev-assistant" },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "基于 MIT 协议发布",
      copyright: "Copyright © 2026 timerwhou",
    },

    editLink: {
      pattern: "https://github.com/timerwhou/team-dev-assistant/edit/main/docs/site/:path",
      text: "在 GitHub 上编辑此页",
    },
  },
});
