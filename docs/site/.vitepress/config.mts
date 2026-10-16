import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Team Dev Assistant",
  description: "AI Agent monorepo — 代码评审、问题排查、Issue 汇总",
  base: "/team-dev-assistant/",   // ← 必须，否则资源 404
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/team-dev-assistant/logo.svg" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:title", content: "Team Dev Assistant" }],
    ["meta", { name: "og:description", content: "AI Agent monorepo" }],
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
      {
        text: "v0.1.1",
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
      ],
      "/dev/": [
        {
          text: "开发",
          items: [
            { text: "评估集", link: "/dev/eval" },
            { text: "可观测性", link: "/dev/trace" },
            { text: "容器化", link: "/dev/docker" },
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
