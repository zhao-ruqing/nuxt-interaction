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

export interface ActionRegistryItem {
  key: string
  label: string
}

export interface ActionRegistryGroup {
  group: string
  label: string
  actions: ActionRegistryItem[]
}

export interface AuditLogListResponse {
  success: boolean
  message?: string
  data?: {
    list: AuditLog[]
    total: number
    page: number
    pageSize: number
    actionRegistry: ActionRegistryGroup[]
  }
}
