import path from "node:path";
import { getMonorepoRoot } from "@tda/core";

export interface TenantContext {
  tenantId: string;
  rootDir: string;
  playbookDir: string;
}

/**
 * 根据 tenantId 动态路由数据目录，实现真正的数据隔离
 */
export function resolveTenantContext(tenantId: string): TenantContext {
  const isDefault = tenantId === "default-tenant" || !tenantId;
  const baseRoot = process.env.MCP_ROOT || getMonorepoRoot();
  
  // 如果是默认租户（本地开发），直接使用项目根目录
  // 如果是真实企业租户，使用独立的隔离目录
  const rootDir = isDefault ? baseRoot : path.join(baseRoot, ".tda-tenants", tenantId);
  const playbookDir = path.join(rootDir, ".tda");

  return { tenantId, rootDir, playbookDir };
}
