import { createRemoteJWKSet, jwtVerify } from "jose";
import type { IncomingMessage, ServerResponse } from "node:http";

// 从环境变量读取 IdP 配置（需在部署时注入）
const AUTH_SERVER_ISSUER = process.env.OAUTH_ISSUER || "";
const AUTH_SERVER_JWKS_URI = process.env.OAUTH_JWKS_URI || "";
const MCP_CANONICAL_URI = process.env.MCP_CANONICAL_URI || ""; // 例如 https://mcp.example.com

// 惰性初始化 JWKS 客户端（避免启动时无配置导致崩溃）
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!AUTH_SERVER_JWKS_URI) return null;
  if (!jwks) jwks = createRemoteJWKSet(new URL(AUTH_SERVER_JWKS_URI));
  return jwks;
}

export interface AuthResult {
  ok: boolean;
  status?: number;
  error?: string;
  scopes?: string[];
  tenantId?: string; // 🌟 新增：多租户隔离标识
}

/**
 * 校验 Bearer Token（OAuth 2.1 资源服务器职责）
 * - 验证签名（通过 JWKS）
 * - 验证 issuer
 * - 验证 audience（RFC 8707：Token 必须是为本 MCP Server 签发的）
 * - 验证过期时间
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  const keySet = getJWKS();
  if (!keySet) {
    // 如果未配置 OAuth，降级为“无鉴权”模式（仅限本地开发），且默认分配到 default 租户
    return { ok: true, tenantId: "default-tenant" };
  }

  if (!MCP_CANONICAL_URI) {
    return { ok: false, status: 500, error: "MCP_CANONICAL_URI 未配置" };
  }

  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer: AUTH_SERVER_ISSUER,
      audience: MCP_CANONICAL_URI, // 🔑 RFC 8707 核心：强制校验 aud
      algorithms: ["RS256", "ES256"],
    });

    // 解析 scope（OAuth 2.1 用空格分隔），并过滤空字符串防止解析异常
    const scopes = typeof payload.scope === "string" 
      ? payload.scope.split(" ").filter(Boolean) 
      : [];
      
    // 🌟 解析 tenant_id，兼容常见的 OIDC Claim 命名
    const tenantId = 
      (payload.tenant_id as string) || 
      (payload.org_id as string) || 
      (payload.sub as string) || 
      "default-tenant";

    return { ok: true, scopes, tenantId };
  } catch (e) {
    const msg = (e as Error).message;
    // 区分“过期”和“非法”，便于客户端决定是否刷新
    if (msg.includes("expired")) {
      return { ok: false, status: 401, error: "token_expired" };
    }
    return { ok: false, status: 401, error: "invalid_token" };
  }
}

/**
 * 暴露 RFC 9728 Protected Resource Metadata
 */
export function handleProtectedResourceMetadata(
  req: IncomingMessage,
  res: ServerResponse,
): boolean {
  if (req.url !== "/.well-known/oauth-protected-resource") return false;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      resource: MCP_CANONICAL_URI,
      authorization_servers: AUTH_SERVER_ISSUER ? [AUTH_SERVER_ISSUER] : [],
      scopes_supported: ["playbook:read", "playbook:write"],
      bearer_methods_supported: ["header"],
    }),
  );
  return true;
}

/**
 * 校验 scope 是否满足操作要求
 */
export function requireScope(scopes: string[] | undefined, required: string): boolean {
  if (!scopes) return false;
  return scopes.includes(required);
}
