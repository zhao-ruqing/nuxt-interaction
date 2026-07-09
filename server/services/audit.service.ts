import pool from '../utils/db'
import type { RequestContext } from '../utils/context'
import type { AuditActionType } from '../audit/actions'
import { ACTION_REGISTRY } from '../audit/actions'

export interface AuditRecordInput {
  action: AuditActionType
  resourceType: string
  resourceId?: string
  description: string
  metadata?: Record<string, unknown>
}

export interface AuditLog {
  id: number
  userId: number
  username: string
  action: string
  resourceType: string
  resourceId: string | null
  description: string
  metadata: Record<string, unknown> | null
  requestId: string | null
  ip: string | null
  createdAt: string
}

export interface AuditLogListQuery {
  page?: number
  pageSize?: number
  action?: string
  resourceType?: string
  keyword?: string
  startDate?: string
  endDate?: string
}

interface DbAuditRow {
  id: number
  user_id: number
  username: string
  action: string
  resource_type: string
  resource_id: string | null
  description: string
  metadata: string | Record<string, unknown> | null
  request_id: string | null
  ip: string | null
  created_at: Date | string
}

function mapRow(row: DbAuditRow): AuditLog {
  let metadata: Record<string, unknown> | null = null
  if (row.metadata) {
    metadata = typeof row.metadata === 'string'
      ? JSON.parse(row.metadata)
      : row.metadata
  }

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    description: row.description,
    metadata,
    requestId: row.request_id,
    ip: row.ip,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  }
}

/** 写入一条审计日志 */
export async function recordAudit(ctx: RequestContext, input: AuditRecordInput): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs
      (user_id, username, action, resource_type, resource_id, description, metadata, request_id, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ctx.user.id,
      ctx.user.username,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.description,
      input.metadata ? JSON.stringify(input.metadata) : null,
      ctx.requestId,
      ctx.ip ?? null,
    ],
  )
}

/** 封装写操作：业务成功后自动记录审计 */
export async function withAuditMutation<T>(
  ctx: RequestContext,
  base: Omit<AuditRecordInput, 'description' | 'metadata'>,
  run: () => Promise<{ result: T, description: string, metadata?: Record<string, unknown> }>,
): Promise<T> {
  const { result, description, metadata } = await run()
  await recordAudit(ctx, { ...base, description, metadata })
  return result
}

/** 分页查询审计日志 */
export async function listAuditLogs(query: AuditLogListQuery) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  const offset = (page - 1) * pageSize

  const conditions: string[] = []
  const params: unknown[] = []

  if (query.action) {
    conditions.push('action = ?')
    params.push(query.action)
  }

  if (query.resourceType) {
    conditions.push('resource_type = ?')
    params.push(query.resourceType)
  }

  if (query.keyword?.trim()) {
    const kw = `%${query.keyword.trim()}%`
    conditions.push('(username LIKE ? OR description LIKE ? OR resource_id LIKE ?)')
    params.push(kw, kw, kw)
  }

  if (query.startDate) {
    conditions.push('created_at >= ?')
    params.push(`${query.startDate} 00:00:00`)
  }

  if (query.endDate) {
    conditions.push('created_at <= ?')
    params.push(`${query.endDate} 23:59:59`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs ${where}`,
    params,
  ) as [{ total: number }[], unknown]

  const [rows] = await pool.query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  ) as [DbAuditRow[], unknown]

  return {
    list: rows.map(mapRow),
    total: Number(countRows[0]?.total ?? 0),
    page,
    pageSize,
    actionRegistry: ACTION_REGISTRY,
  }
}
