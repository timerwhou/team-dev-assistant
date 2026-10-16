import { estimateTokens } from "./builder";
import type { CompressorOptions, CompressionResult } from "./types";

/** 默认压缩阈值 */
const DEFAULT_OPTIONS: Required<CompressorOptions> = {
  readFileMaxLines: 500,
  searchCodeMaxMatches: 20,
  listIssuesMaxItems: 20,
};

/**
 * 压缩单个工具结果。
 *
 * 策略（第一版）：
 * - read_file：超过 N 行 → 保留前 N/2 行 + 后 N/2 行 + 省略提示
 * - search_code：超过 N 匹配 → 保留前 N 个 + 总数提示
 * - list_issues：超过 N 条 → 保留前 N 条 + 总数提示
 * - 其他：原样返回
 *
 * 参见 ADR-0005 和 docs/design/context-engineering.md。
 */
export function compressToolResult(
  toolName: string,
  result: unknown,
  opts: CompressorOptions = {}
): CompressionResult {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const rawContent = JSON.stringify(result);
  const beforeTokens = estimateTokens(rawContent);

  switch (toolName) {
    case "read_file":
      return compressReadFile(result, options, beforeTokens);
    case "search_code":
      return compressSearchCode(result, options, beforeTokens);
    case "list_issues":
      return compressListIssues(result, options, beforeTokens);
    default:
      return {
        content: rawContent,
        compressed: false,
        beforeTokens,
        afterTokens: beforeTokens,
      };
  }
}

function compressReadFile(
  result: unknown,
  options: Required<CompressorOptions>,
  beforeTokens: number
): CompressionResult {
  const r = result as { path?: string; totalLines?: number; content?: string };
  if (!r?.content) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  const lines = r.content.split("\n");
  if (lines.length <= options.readFileMaxLines) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  const half = Math.floor(options.readFileMaxLines / 2);
  const head = lines.slice(0, half);
  const tail = lines.slice(-half);
  const omitted = lines.length - options.readFileMaxLines;

  const compressedContent = [
    ...head,
    "",
    `... [省略 ${omitted} 行] ...`,
    "",
    ...tail,
  ].join("\n");

  const compressedResult = {
    ...r,
    content: compressedContent,
    _compressed: true,
    _originalLineCount: lines.length,
  };

  const content = JSON.stringify(compressedResult);
  return {
    content,
    compressed: true,
    beforeTokens,
    afterTokens: estimateTokens(content),
    reason: `read_file 返回 ${lines.length} 行 > ${options.readFileMaxLines}，保留前后各 ${half} 行`,
  };
}

function compressSearchCode(
  result: unknown,
  options: Required<CompressorOptions>,
  beforeTokens: number
): CompressionResult {
  const r = result as { count?: number; matches?: unknown[] };
  if (!Array.isArray(r?.matches)) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  if (r.matches.length <= options.searchCodeMaxMatches) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  const kept = r.matches.slice(0, options.searchCodeMaxMatches);
  const compressedResult = {
    count: r.count ?? r.matches.length,
    matches: kept,
    _compressed: true,
    _omitted: r.matches.length - options.searchCodeMaxMatches,
  };

  const content = JSON.stringify(compressedResult);
  return {
    content,
    compressed: true,
    beforeTokens,
    afterTokens: estimateTokens(content),
    reason: `search_code 返回 ${r.matches.length} 匹配 > ${options.searchCodeMaxMatches}，保留前 ${options.searchCodeMaxMatches} 个`,
  };
}

function compressListIssues(
  result: unknown,
  options: Required<CompressorOptions>,
  beforeTokens: number
): CompressionResult {
  const r = result as { count?: number; items?: unknown[] };
  if (!Array.isArray(r?.items)) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  if (r.items.length <= options.listIssuesMaxItems) {
    return {
      content: JSON.stringify(result),
      compressed: false,
      beforeTokens,
      afterTokens: beforeTokens,
    };
  }

  const kept = r.items.slice(0, options.listIssuesMaxItems);
  const compressedResult = {
    count: r.count ?? r.items.length,
    items: kept,
    _compressed: true,
    _omitted: r.items.length - options.listIssuesMaxItems,
  };

  const content = JSON.stringify(compressedResult);
  return {
    content,
    compressed: true,
    beforeTokens,
    afterTokens: estimateTokens(content),
    reason: `list_issues 返回 ${r.items.length} 条 > ${options.listIssuesMaxItems}，保留前 ${options.listIssuesMaxItems} 条`,
  };
}
