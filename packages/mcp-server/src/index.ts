#!/usr/bin/env node
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { discoverSkills, registerSkillResources } from "@olaservo/ext-skills/server";
import { getMonorepoRoot } from "@tda/core";
import { registerReadFile } from "./tools/read-file";
import { registerSearchCode } from "./tools/search-code";
import { registerListIssues } from "./tools/list-issues";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";

const rootDir = process.env.MCP_ROOT || getMonorepoRoot();
const skillsRoot = path.resolve(rootDir, "packages/skills/skills");

// 启动时扫描一次，计算每个 Skill 的 SHA-256 摘要
const skillMap = discoverSkills(skillsRoot);

const handle = serveStdio(() => {
  const server = new McpServer(
    { name: "team-dev-assistant", version: "0.1.0" },
    { capabilities: { resources: {} } },
  );

  registerReadFile(server, rootDir);
  registerSearchCode(server, rootDir);
  registerListIssues(server);
  registerCodeReviewPrompt(server);
  registerProjectFilesResource(server, rootDir);

  registerSkillResources(server, skillMap, skillsRoot, {
    template: true,
    directoryRead: true,
    ttlMs: 60_000,
    cacheScope: "public",
  });

  return server;
});

process.on("SIGINT", () => {
  void handle.close();
});

console.error(`[mcp] running, root=${rootDir}, skills=${skillMap.size}`);
