/**
 * 登录回跳路径校验工具
 * 用法：resolveAuthRedirect(query.redirect) → 安全的站内路径，非法则返回 null
 */

/** 判断是否为可回跳的站内相对路径 */
export function isSafeAuthRedirect(path: unknown): path is string {
  if (typeof path !== 'string' || !path) return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.startsWith('/auth/')) return false
  return true
}

/** 从 query 解析安全回跳地址，非法时返回 null */
export function resolveAuthRedirect(redirect: unknown): string | null {
  return isSafeAuthRedirect(redirect) ? redirect : null
}

/** 按角色决定登录成功后的默认落地页 */
export function defaultPostLoginPath(role?: string | null): string {
  return role === 'admin' ? '/dashboard' : '/xingjian'
}
