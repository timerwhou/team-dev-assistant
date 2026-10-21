export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * 采用滑动窗口算法，记录请求时间戳，精准控制并发与频次
   */
  public consume(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let timestamps = this.windows.get(key) || [];
    // 清理过期的时间戳
    timestamps = timestamps.filter(t => t > windowStart);
    
    if (timestamps.length >= this.maxRequests) {
      return false; // 触发限流
    }
    
    timestamps.push(now);
    this.windows.set(key, timestamps);
    return true;
  }

  // 后台清理机制，避免内存泄漏
  public startCleanup(intervalMs = 60000) {
    setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      for (const [key, timestamps] of this.windows.entries()) {
        const valid = timestamps.filter(t => t > windowStart);
        if (valid.length === 0) {
          this.windows.delete(key);
        } else {
          this.windows.set(key, valid);
        }
      }
    }, intervalMs).unref();
  }
}
