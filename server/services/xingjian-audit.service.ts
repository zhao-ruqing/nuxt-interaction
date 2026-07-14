import type { AuditActionType } from '../audit/actions'
import type { RequestContext } from '../utils/context'
import { recordAudit } from './audit.service'

export async function recordXingjianAudit(
  context: RequestContext,
  action: AuditActionType,
  resourceType: string,
  resourceId: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  await recordAudit(context, { action, resourceType, resourceId, description, metadata })
}
