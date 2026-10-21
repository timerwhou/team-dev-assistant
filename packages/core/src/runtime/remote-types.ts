export interface RemoteCapabilityManifest {
  /** 能力包名称，例如 "github-integration" */
  name: string;
  /** 版本号 */
  version: string;
  /** 远程拉取地址（如 GitHub Raw 或 OSS URL） */
  url: string;
  /** 校验哈希（SHA-256），用于防止供应链投毒 */
  sha256: string;
  /** 暴露的能力名称列表 */
  capabilities: string[];
}

export interface RemoteRegistryOptions {
  /** 本地缓存目录，默认 .tda/plugins/ */
  cacheDir?: string;
  /** 是否强制重新拉取 */
  forceUpdate?: boolean;
}
