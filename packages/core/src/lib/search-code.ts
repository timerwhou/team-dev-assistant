import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { getMonorepoRoot } from "./env";

const execFileAsync = promisify(execFile);

export type SearchMatch = {
  file: string;
  line: number;
  text: string;
};

export type SearchResult = {
  count: number;
  matches: SearchMatch[];
};

type RgJson =
  | {
      type: "match";
      data: { path: { text: string }; line_number: number; lines: { text: string } };
    }
  | { type: string; data?: unknown };

/**
 * 用 ripgrep 在 monorepo 内搜索。使用 execFile + 参数数组，不经过 shell，
 * 杜绝命令注入。query/glob 作为独立参数传递。
 */
export async function searchCode(opts: {
  query: string;
  glob?: string;
  maxResults?: number;
  cwd?: string;
}): Promise<SearchResult> {
  const root = opts.cwd || process.env.TDA_ROOT || getMonorepoRoot();
  const maxResults = opts.maxResults ?? 20;

  // 参数数组：第一个是二进制，之后每个都是独立参数，shell 不参与解析
  const args = ["--json", "-m", String(maxResults)];
  if (opts.glob) args.push("-g", opts.glob);
  args.push(opts.query, ".");

  try {
    const { stdout } = await execFileAsync("rg", args, {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
    });

    const matches = stdout
      .split("\n")
      .filter(Boolean)
      .map((l): RgJson => JSON.parse(l))
      .filter((j): j is Extract<RgJson, { type: "match" }> => j.type === "match")
      .map((j) => ({
        file: j.data.path.text,
        line: j.data.line_number,
        text: j.data.lines.text.trim(),
      }));

    return { count: matches.length, matches };
  } catch (e: any) {
    // rg 未匹配时退出码 1
    if (e.code === 1 || e.code === "1") return { count: 0, matches: [] };
    // rg 不存在
    if (e.code === "ENOENT") {
      throw new Error("未找到 ripgrep（rg）。请先安装：brew install ripgrep");
    }
    throw new Error(`搜索失败：${e.message}`);
  }
}
