#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerReadFile } from "./tools/read-file";
import { registerSearchCode } from "./tools/search-code";
import { registerListIssues } from "./tools/list-issues";
import { registerCodeReviewPrompt } from "./prompts/code-review";
import { registerProjectFilesResource } from "./resources/project-files";

const rootDir = process.env.MCP_ROOT || process.cwd();
const server = new McpServer({ name: "team-dev-assistant", version: "0.1.0" });

registerReadFile(server, rootDir);
registerSearchCode(server, rootDir);
registerListIssues(server);
registerCodeReviewPrompt(server);
registerProjectFilesResource(server, rootDir);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[mcp] running, root=${rootDir}`);
