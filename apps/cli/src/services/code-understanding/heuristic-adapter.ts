import fs from "node:fs/promises";
import path from "node:path";
import type { CodeSkeleton, CodeUnderstandingAdapter } from "./types";

export class HeuristicAdapter implements CodeUnderstandingAdapter {
  name = "Heuristic (零依赖)";

  async isAvailable(rootDir: string): Promise<boolean> {
    return true; // 启发式永远可用，但在 extract 内部做精准探测
  }

  async extract(rootDir: string): Promise<CodeSkeleton[]> {
    const skeletons: CodeSkeleton[] = [];
    const ignoreDirs = ["node_modules", ".git", "dist", "build", ".next", "vendor", ".tda", "target"];
    
    // 1. 收集所有文件（排除忽略目录）
    const allFiles: string[] = [];
    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (ignoreDirs.includes(entry.name)) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) await walk(fullPath);
          else allFiles.push(fullPath);
        }
      } catch {}
    }
    await walk(rootDir);

    // 辅助函数：检查根目录是否存在特定文件
    const hasFile = async (f: string) => {
      try { await fs.access(path.join(rootDir, f)); return true; } catch { return false; }
    };

    // ==================== TypeScript / JavaScript ====================
    const tsFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
    if (tsFiles.length > 0) {
      const routes: Set<string> = new Set();
      const services: { name: string; methods: string[] }[] = [];
      const envVars: Set<string> = new Set();

      for (const f of tsFiles) {
        const content = await fs.readFile(f, "utf-8");
        for (const m of content.matchAll(/(?:app|router)\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g)) routes.add(`${m[1].toUpperCase()} ${m[2]}`);
        for (const m of content.matchAll(/class\s+(\w+(?:Service|Repository|Controller))\b/g)) {
          const methods = Array.from(content.matchAll(/^\s+(?:async\s+)?(\w+)\s*\(/gm)).map(x => x[1]).filter(n => n !== "constructor");
          if (methods.length >= 2) services.push({ name: m[1], methods: Array.from(new Set(methods)) });
        }
        for (const m of content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) envVars.add(m[1]);
      }

      let projectType: CodeSkeleton["projectType"] = "unknown";
      if (await hasFile("package.json")) {
        try {
          const pkg = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf-8"));
          if (pkg.bin) projectType = "cli";
          else if (pkg.dependencies?.express || pkg.dependencies?.["@nestjs/core"]) projectType = "web-backend";
          else if (pkg.dependencies?.react || pkg.dependencies?.vue || pkg.dependencies?.svelte) projectType = "frontend";
          else projectType = "library";
        } catch {}
      }

      skeletons.push({ language: "TypeScript/JavaScript", routes: Array.from(routes), services, envVars: Array.from(envVars), projectType, accuracy: "heuristic" });
    }

    // ==================== Rust ====================
    const rsFiles = allFiles.filter(f => f.endsWith(".rs"));
    if (rsFiles.length > 0 || await hasFile("Cargo.toml")) {
      const routes: Set<string> = new Set();
      const services: { name: string; methods: string[] }[] = [];
      const envVars: Set<string> = new Set();

      for (const f of rsFiles) {
        const content = await fs.readFile(f, "utf-8");
        // 提取 Actix / Axum 路由
        for (const m of content.matchAll(/\.route\(\s*["`](.*?)["`]\s*,\s*(web::(?:get|post|put|delete)\(\))/g)) routes.add(`${m[2].toUpperCase()} ${m[1]}`);
        for (const m of content.matchAll(/#\[(get|post|put|delete)\(\s*["`](.*?)["`]\)/g)) routes.add(`${m[1].toUpperCase()} ${m[2]}`);
        
        // 提取 Rust Struct 和 Impl
        for (const m of content.matchAll(/struct\s+(\w+(?:Service|Repository|Controller))/g)) {
          const impls = Array.from(content.matchAll(new RegExp(`impl\\s+${m[1]}\\s*\\{[^}]*fn\\s+(\\w+)`, "g"))).map(x => x[1]);
          if (impls.length >= 2) services.push({ name: m[1], methods: impls });
        }

        // 提取环境变量
        for (const m of content.matchAll(/env::var\(["`](.*?)["`]\)/g)) envVars.add(m[1]);
      }

      skeletons.push({ 
        language: "Rust", 
        routes: Array.from(routes), 
        services, 
        envVars: Array.from(envVars), 
        projectType: await hasFile("Cargo.toml") ? "web-backend" : "unknown", 
        accuracy: "heuristic" 
      });
    }

    // ==================== Go ====================
    const goFiles = allFiles.filter(f => f.endsWith(".go"));
    if (goFiles.length > 0 || await hasFile("go.mod")) {
      const routes: Set<string> = new Set();
      const services: { name: string; methods: string[] }[] = [];
      const envVars: Set<string> = new Set();

      for (const f of goFiles) {
        const content = await fs.readFile(f, "utf-8");
        for (const m of content.matchAll(/\b(?:r|e|router)\.(GET|POST|PUT|DELETE)\(["`](.*?)["`]/g)) routes.add(`${m[1]} ${m[2]}`);
        for (const m of content.matchAll(/type\s+(\w+(?:Service|Repository|Controller))\s+struct/g)) {
          const funcs = Array.from(content.matchAll(new RegExp(`func \\(.*${m[1]}\\) (\\w+)`, "g"))).map(x => x[1]);
          if (funcs.length >= 2) services.push({ name: m[1], methods: funcs });
        }
        for (const m of content.matchAll(/os\.Getenv\(["`](.*?)["`]\)/g)) envVars.add(m[1]);
      }

      skeletons.push({ 
        language: "Go", 
        routes: Array.from(routes), 
        services, 
        envVars: Array.from(envVars), 
        projectType: "web-backend", 
        accuracy: "heuristic" 
      });
    }

    // ==================== Python ====================
    const pyFiles = allFiles.filter(f => f.endsWith(".py"));
    if (pyFiles.length > 0 || await hasFile("requirements.txt") || await hasFile("pyproject.toml")) {
      const routes: Set<string> = new Set();
      const services: { name: string; methods: string[] }[] = [];
      const envVars: Set<string> = new Set();

      for (const f of pyFiles) {
        const content = await fs.readFile(f, "utf-8");
        for (const m of content.matchAll(/@(app|router)\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g)) routes.add(`${m[1].toUpperCase()}.${m[2].toUpperCase()} ${m[3]}`);
        for (const m of content.matchAll(/class\s+(\w+(?:Service|Repository|Controller))\b/g)) {
          const methods = Array.from(content.matchAll(/def\s+(\w+)/g)).map(x => x[1]);
          if (methods.length >= 2) services.push({ name: m[1], methods });
        }
        for (const m of content.matchAll(/os\.environ\.get\(['"`](.*?)['"`]/g)) envVars.add(m[1]);
      }

      let projectType: CodeSkeleton["projectType"] = "unknown";
      try {
        const reqs = await fs.readFile(path.join(rootDir, "requirements.txt"), "utf-8");
        if (reqs.includes("fastapi") || reqs.includes("flask") || reqs.includes("django")) projectType = "web-backend";
      } catch {}

      skeletons.push({ language: "Python", routes: Array.from(routes), services, envVars: Array.from(envVars), projectType, accuracy: "heuristic" });
    }

    // ==================== Java ====================
    const javaFiles = allFiles.filter(f => f.endsWith(".java"));
    if (javaFiles.length > 0 || await hasFile("pom.xml")) {
      const routes: Set<string> = new Set();
      const services: { name: string; methods: string[] }[] = [];
      const envVars: Set<string> = new Set();

      for (const f of javaFiles) {
        const content = await fs.readFile(f, "utf-8");
        for (const m of content.matchAll(/@(Get|Post|Put|Delete)Mapping\(\s*["`](.*?)["`]/g)) routes.add(`${m[1].toUpperCase()} ${m[2]}`);
        for (const m of content.matchAll(/(?:class|interface)\s+(\w+(?:Service|Repository|Controller))\b/g)) {
          const methods = Array.from(content.matchAll(/public\s+\w+\s+(\w+)\(/g)).map(x => x[1]).filter(n => n !== "class");
          if (methods.length >= 2) services.push({ name: m[1], methods: Array.from(new Set(methods)) });
        }
        for (const m of content.matchAll(/System\.getenv\(["`](.*?)["`]\)/g)) envVars.add(m[1]);
      }

      skeletons.push({ 
        language: "Java", 
        routes: Array.from(routes), 
        services, 
        envVars: Array.from(envVars), 
        projectType: "web-backend", 
        accuracy: "heuristic" 
      });
    }

    return skeletons;
  }
}
