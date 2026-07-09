import pool from '../utils/db'
import { AuditAction } from '../audit/actions'
import type { RequestContext } from '../utils/context'
import { recordAudit } from './audit.service'

export interface Address {
  id: number
  address: string
  lng: number
  lat: number
  created_at?: string
  updated_at?: string
}

export interface AddressInput {
  address: string
  lng: number
  lat: number
}

interface DbAddressRow {
  id: number
  address: string
  lng: number | string
  lat: number | string
  created_at?: Date | string
  updated_at?: Date | string
}

function mapRow(row: DbAddressRow): Address {
  return {
    id: row.id,
    address: row.address,
    lng: Number(row.lng),
    lat: Number(row.lat),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at as string | undefined,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at as string | undefined,
  }
}

/** 获取当前用户的地址列表 */
export async function listAddresses(userId: number): Promise<Address[]> {
  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  ) as [DbAddressRow[], unknown]
  return rows.map(mapRow)
}

/** 新增地图点位并记录审计 */
export async function createAddress(ctx: RequestContext, input: AddressInput): Promise<Address> {
  const [result] = await pool.query(
    'INSERT INTO addresses (user_id, address, lng, lat) VALUES (?, ?, ?, ?)',
    [ctx.user.id, input.address.trim(), input.lng, input.lat],
  ) as [{ insertId: number }, unknown]

  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE id = ?',
    [result.insertId],
  ) as [DbAddressRow[], unknown]

  const address = mapRow(rows[0]!)
  await recordAudit(ctx, {
    action: AuditAction.ADDRESS_CREATE,
    resourceType: 'address',
    resourceId: String(address.id),
    description: `新增了地图点位「${address.address}」`,
    metadata: { after: address },
  })
  return address
}

/** 更新地图点位并记录审计 */
export async function updateAddress(
  ctx: RequestContext,
  id: number,
  input: AddressInput,
): Promise<Address | null> {
  const [existing] = await pool.query(
    'SELECT id, address, lng, lat FROM addresses WHERE id = ? AND user_id = ?',
    [id, ctx.user.id],
  ) as [DbAddressRow[], unknown]

  if (!existing[0]) return null

  const before = mapRow(existing[0])

  await pool.query(
    'UPDATE addresses SET address = ?, lng = ?, lat = ? WHERE id = ? AND user_id = ?',
    [input.address.trim(), input.lng, input.lat, id, ctx.user.id],
  )

  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE id = ?',
    [id],
  ) as [DbAddressRow[], unknown]

  const after = mapRow(rows[0]!)
  await recordAudit(ctx, {
    action: AuditAction.ADDRESS_UPDATE,
    resourceType: 'address',
    resourceId: String(id),
    description: `修改了地图点位「${after.address}」`,
    metadata: { before, after },
  })
  return after
}

/** 删除地图点位并记录审计 */
export async function deleteAddress(ctx: RequestContext, id: number): Promise<boolean> {
  const [existing] = await pool.query(
    'SELECT id, address, lng, lat FROM addresses WHERE id = ? AND user_id = ?',
    [id, ctx.user.id],
  ) as [DbAddressRow[], unknown]

  if (!existing[0]) return false

  const before = mapRow(existing[0])

  const [result] = await pool.query(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [id, ctx.user.id],
  ) as [{ affectedRows: number }, unknown]

  if (!result.affectedRows) return false

  await recordAudit(ctx, {
    action: AuditAction.ADDRESS_DELETE,
    resourceType: 'address',
    resourceId: String(id),
    description: `删除了地图点位「${before.address}」`,
    metadata: { before },
  })
  return true
}
