import { test } from "node:test";
import assert from "node:assert/strict";
import { compressToolResult } from "../src/context/compressor";

test("read_file 未超阈值不压缩", () => {
  const result = { path: "a.ts", content: "line1\nline2\nline3" };
  const compressed = compressToolResult("read_file", result, {
    readFileMaxLines: 10,
  });
  assert.equal(compressed.compressed, false);
  assert.equal(compressed.beforeTokens, compressed.afterTokens);
});

test("read_file 超阈值压缩（保留前后各半）", () => {
  const lines = Array.from({ length: 1000 }, (_, i) => `line ${i}`);
  const result = { path: "a.ts", content: lines.join("\n") };
  const compressed = compressToolResult("read_file", result, {
    readFileMaxLines: 100,
  });
  assert.equal(compressed.compressed, true);
  assert.ok(compressed.afterTokens < compressed.beforeTokens);
  assert.ok(compressed.reason?.includes("1000 行"));
  assert.ok(compressed.content.includes("省略 900 行"));
});

test("search_code 未超阈值不压缩", () => {
  const result = { count: 5, matches: [{ file: "a.ts" }] };
  const compressed = compressToolResult("search_code", result, {
    searchCodeMaxMatches: 10,
  });
  assert.equal(compressed.compressed, false);
});

test("search_code 超阈值压缩", () => {
  const matches = Array.from({ length: 100 }, (_, i) => ({
    file: `file${i}.ts`,
    line: i,
  }));
  const result = { count: 100, matches };
  const compressed = compressToolResult("search_code", result, {
    searchCodeMaxMatches: 20,
  });
  assert.equal(compressed.compressed, true);
  assert.ok(compressed.content.includes("_omitted"));
  assert.ok(compressed.reason?.includes("100 匹配"));
});

test("list_issues 超阈值压缩", () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ number: i }));
  const result = { count: 50, items };
  const compressed = compressToolResult("list_issues", result, {
    listIssuesMaxItems: 10,
  });
  assert.equal(compressed.compressed, true);
  assert.ok(compressed.reason?.includes("50 条"));
});

test("未知工具原样返回", () => {
  const result = { foo: "bar" };
  const compressed = compressToolResult("unknown_tool", result);
  assert.equal(compressed.compressed, false);
  assert.equal(compressed.content, JSON.stringify(result));
});
