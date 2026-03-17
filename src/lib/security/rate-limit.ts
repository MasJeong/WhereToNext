type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * 만료된 버킷을 제거한다.
 * @param now 현재 시각
 * @returns 없음
 */
function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * 메모리 버킷 기반으로 요청 허용 여부를 계산한다.
 * @param key 제한 식별 키
 * @param options 제한 횟수와 윈도우
 * @returns 허용 여부와 잔여 횟수, 리셋 시각
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const next = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, next);

    return { allowed: true, remaining: options.limit - 1, resetAt: next.resetAt };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * 헤더 기반 클라이언트 IP를 정규화한다.
 * @param forwardedFor x-forwarded-for 헤더 값
 * @param realIp x-real-ip 헤더 값
 * @returns rate-limit 키로 사용할 정규화된 IP
 */
export function getClientIp(forwardedFor: string | null, realIp: string | null): string {
  return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
}
