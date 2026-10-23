export interface CodeSkeleton {
  language: string;
  routes: string[];
  services: { name: string; methods: string[] }[];
  envVars: string[];
  projectType: "web-backend" | "frontend" | "cli" | "library" | "unknown";
  accuracy: "heuristic" | "precise";
}

export interface CodeUnderstandingAdapter {
  name: string;
  isAvailable(rootDir: string): Promise<boolean>;
  extract(rootDir: string): Promise<CodeSkeleton[]>;
}
