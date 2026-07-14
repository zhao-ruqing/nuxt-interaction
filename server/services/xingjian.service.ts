import { randomUUID } from 'node:crypto'
import pool from '../utils/db'

export interface CityInput {
  name: string
  code: string
  province: string
  description: string
  longitude: number
  latitude: number
  status: string
  sortOrder: number
}

export interface PointInput {
  cityId: number
  name: string
  code: string
  category: string
  address: string
  description: string
  longitude: number
  latitude: number
  checkinRadius: number
  pointsReward: number
  status: string
}

function parseNumber(value: unknown, fallback = 0) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

function calculateDistanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
  const radians = (degree: number) => degree * Math.PI / 180
  const earthRadius = 6371000
  const latitudeDelta = radians(latitude2 - latitude1)
  const longitudeDelta = radians(longitude2 - longitude1)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) * Math.sin(longitudeDelta / 2) ** 2
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)))
}

function mapCity(row: any) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    province: row.province,
    description: row.description,
    coverImage: row.cover_image,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    status: row.status,
    sortOrder: row.sort_order,
    pointCount: Number(row.point_count || 0),
  }
}

function mapPoint(row: any) {
  return {
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name,
    name: row.name,
    code: row.code,
    category: row.category,
    address: row.address,
    description: row.description,
    coverImage: row.cover_image,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    checkinRadius: row.checkin_radius,
    pointsReward: row.points_reward,
    dailyLimit: row.daily_limit,
    status: row.status,
    checkinCount: Number(row.checkin_count || 0),
    checkedToday: Boolean(row.checked_today),
  }
}

export function parseCityInput(body: Record<string, unknown>): CityInput {
  const input = {
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toLowerCase(),
    province: String(body.province || '').trim(),
    description: String(body.description || '').trim(),
    longitude: parseNumber(body.longitude),
    latitude: parseNumber(body.latitude),
    status: String(body.status || 'published'),
    sortOrder: parseNumber(body.sortOrder),
  }
  if (!input.name || !input.code) throw createError({ statusCode: 400, message: '城市名称和编码不能为空' })
  if (!['draft', 'published', 'disabled'].includes(input.status)) throw createError({ statusCode: 400, message: '城市状态无效' })
  return input
}

export function parsePointInput(body: Record<string, unknown>): PointInput {
  const input = {
    cityId: parseNumber(body.cityId),
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toLowerCase(),
    category: String(body.category || 'landmark').trim(),
    address: String(body.address || '').trim(),
    description: String(body.description || '').trim(),
    longitude: parseNumber(body.longitude),
    latitude: parseNumber(body.latitude),
    checkinRadius: Math.max(50, parseNumber(body.checkinRadius, 500)),
    pointsReward: Math.max(0, parseNumber(body.pointsReward, 10)),
    status: String(body.status || 'published'),
  }
  if (!input.cityId || !input.name || !input.code || !input.address) {
    throw createError({ statusCode: 400, message: '城市、点位名称、编码和地址不能为空' })
  }
  if (!['draft', 'published', 'disabled'].includes(input.status)) throw createError({ statusCode: 400, message: '点位状态无效' })
  return input
}

export async function listCities(includeAll = false) {
  const [rows] = await pool.query(
    `SELECT c.*, COUNT(p.id) AS point_count
     FROM xj_cities c
     LEFT JOIN xj_points p ON p.city_id = c.id AND p.status = 'published'
     ${includeAll ? '' : "WHERE c.status = 'published'"}
     GROUP BY c.id ORDER BY c.sort_order, c.id`,
  ) as any
  return rows.map(mapCity)
}

export async function createCity(input: CityInput) {
  const [result] = await pool.query(
    `INSERT INTO xj_cities (name, code, province, description, longitude, latitude, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.name, input.code, input.province, input.description, input.longitude, input.latitude, input.status, input.sortOrder],
  ) as any
  const [rows] = await pool.query('SELECT * FROM xj_cities WHERE id = ?', [result.insertId]) as any
  return mapCity(rows[0])
}

export async function updateCity(id: number, input: CityInput) {
  const [result] = await pool.query(
    `UPDATE xj_cities SET name = ?, code = ?, province = ?, description = ?, longitude = ?, latitude = ?, status = ?, sort_order = ? WHERE id = ?`,
    [input.name, input.code, input.province, input.description, input.longitude, input.latitude, input.status, input.sortOrder, id],
  ) as any
  if (!result.affectedRows) throw createError({ statusCode: 404, message: '城市不存在' })
  const [rows] = await pool.query('SELECT * FROM xj_cities WHERE id = ?', [id]) as any
  return mapCity(rows[0])
}

export async function listPoints(query: { cityId?: number, keyword?: string, includeAll?: boolean, userId?: number }) {
  const conditions = query.includeAll ? ['1 = 1'] : ["p.status = 'published'", "c.status = 'published'"]
  const params: unknown[] = []
  if (query.cityId) {
    conditions.push('p.city_id = ?')
    params.push(query.cityId)
  }
  if (query.keyword) {
    conditions.push('(p.name LIKE ? OR p.address LIKE ? OR p.description LIKE ?)')
    const keyword = `%${query.keyword}%`
    params.push(keyword, keyword, keyword)
  }
  const userJoin = query.userId
    ? 'LEFT JOIN xj_checkins today ON today.point_id = p.id AND today.user_id = ? AND today.checkin_date = CURRENT_DATE'
    : ''
  const userSelect = query.userId ? ', MAX(today.id IS NOT NULL) AS checked_today' : ', 0 AS checked_today'
  if (query.userId) params.unshift(query.userId)

  const [rows] = await pool.query(
    `SELECT p.*, c.name AS city_name, COUNT(DISTINCT ci.id) AS checkin_count ${userSelect}
     FROM xj_points p
     JOIN xj_cities c ON c.id = p.city_id
     LEFT JOIN xj_checkins ci ON ci.point_id = p.id
     ${userJoin}
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id ORDER BY p.city_id, p.id`,
    params,
  ) as any
  return rows.map(mapPoint)
}

export async function getPoint(id: number, userId?: number) {
  const points = await listPoints({ includeAll: true, userId })
  return points.find((point: any) => point.id === id) || null
}

export async function createPoint(input: PointInput) {
  const [result] = await pool.query(
    `INSERT INTO xj_points
      (city_id, name, code, category, address, description, longitude, latitude, checkin_radius, points_reward, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.cityId, input.name, input.code, input.category, input.address, input.description, input.longitude, input.latitude, input.checkinRadius, input.pointsReward, input.status],
  ) as any
  return getPoint(result.insertId)
}

export async function updatePoint(id: number, input: PointInput) {
  const [result] = await pool.query(
    `UPDATE xj_points SET city_id = ?, name = ?, code = ?, category = ?, address = ?, description = ?, longitude = ?, latitude = ?, checkin_radius = ?, points_reward = ?, status = ? WHERE id = ?`,
    [input.cityId, input.name, input.code, input.category, input.address, input.description, input.longitude, input.latitude, input.checkinRadius, input.pointsReward, input.status, id],
  ) as any
  if (!result.affectedRows) throw createError({ statusCode: 404, message: '点位不存在' })
  return getPoint(id)
}

export async function listRoutes(cityId?: number) {
  const params: unknown[] = []
  const cityFilter = cityId ? 'AND r.city_id = ?' : ''
  if (cityId) params.push(cityId)
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS city_name, COUNT(rp.point_id) AS point_count
     FROM xj_routes r JOIN xj_cities c ON c.id = r.city_id
     LEFT JOIN xj_route_points rp ON rp.route_id = r.id
     WHERE r.status = 'published' ${cityFilter}
     GROUP BY r.id ORDER BY r.id`,
    params,
  ) as any
  return rows.map((row: any) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name,
    name: row.name,
    description: row.description,
    difficulty: row.difficulty,
    estimatedMinutes: row.estimated_minutes,
    pointsReward: row.points_reward,
    pointCount: Number(row.point_count),
  }))
}

export async function getRoute(id: number, userId?: number) {
  const [routeRows] = await pool.query(
    `SELECT r.*, c.name AS city_name FROM xj_routes r JOIN xj_cities c ON c.id = r.city_id WHERE r.id = ? AND r.status = 'published'`,
    [id],
  ) as any
  const route = routeRows[0]
  if (!route) return null
  const params: unknown[] = []
  const checkedSelect = userId
    ? ', EXISTS(SELECT 1 FROM xj_checkins ci WHERE ci.user_id = ? AND ci.point_id = p.id) AS checked'
    : ', 0 AS checked'
  if (userId) params.push(userId)
  params.push(id)
  const [pointRows] = await pool.query(
    `SELECT p.*, rp.sequence_no ${checkedSelect}
     FROM xj_route_points rp JOIN xj_points p ON p.id = rp.point_id
     WHERE rp.route_id = ? ORDER BY rp.sequence_no`,
    params,
  ) as any
  const [completionRows] = userId
    ? await pool.query('SELECT id, completed_at FROM xj_route_completions WHERE route_id = ? AND user_id = ?', [id, userId]) as any
    : [[]]
  const points = pointRows.map((row: any) => ({ ...mapPoint(row), sequenceNo: row.sequence_no, checked: Boolean(row.checked) }))
  return {
    id: route.id,
    cityId: route.city_id,
    cityName: route.city_name,
    name: route.name,
    description: route.description,
    difficulty: route.difficulty,
    estimatedMinutes: route.estimated_minutes,
    pointsReward: route.points_reward,
    points,
    checkedCount: points.filter((point: any) => point.checked).length,
    completed: Boolean(completionRows[0]),
  }
}

export async function completeRoute(userId: number, routeId: number) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [routes] = await connection.query("SELECT id, name, points_reward FROM xj_routes WHERE id = ? AND status = 'published' FOR UPDATE", [routeId]) as any
    const route = routes[0]
    if (!route) throw createError({ statusCode: 404, message: '路线不存在' })
    const [existing] = await connection.query('SELECT id FROM xj_route_completions WHERE route_id = ? AND user_id = ?', [routeId, userId]) as any
    if (existing[0]) throw createError({ statusCode: 409, message: '该路线已经领取过完成奖励' })
    const [progressRows] = await connection.query(
      `SELECT COUNT(*) AS total, COUNT(ci.point_id) AS checked
       FROM xj_route_points rp
       LEFT JOIN (SELECT DISTINCT point_id FROM xj_checkins WHERE user_id = ?) ci ON ci.point_id = rp.point_id
       WHERE rp.route_id = ?`,
      [userId, routeId],
    ) as any
    const progress = progressRows[0]
    if (!progress.total || Number(progress.checked) < Number(progress.total)) {
      throw createError({ statusCode: 409, message: `路线尚未完成，当前 ${progress.checked}/${progress.total} 个点位` })
    }
    const [completionResult] = await connection.query(
      'INSERT INTO xj_route_completions (route_id, user_id, points_awarded) VALUES (?, ?, ?)',
      [routeId, userId, route.points_reward],
    ) as any
    await connection.query(
      `INSERT INTO xj_point_accounts (user_id, balance, total_earned) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), total_earned = total_earned + VALUES(total_earned)`,
      [userId, route.points_reward, route.points_reward],
    )
    const [accounts] = await connection.query('SELECT balance FROM xj_point_accounts WHERE user_id = ?', [userId]) as any
    await connection.query(
      `INSERT INTO xj_point_ledger (user_id, change_amount, balance_after, business_type, business_id, description)
       VALUES (?, ?, ?, 'route_complete', ?, ?)`,
      [userId, route.points_reward, accounts[0].balance, String(completionResult.insertId), `完成路线「${route.name}」`],
    )
    await connection.query(
      `INSERT IGNORE INTO xj_user_badges (user_id, badge_id, source_type, source_id)
       SELECT ?, id, 'route_complete', ? FROM xj_badges WHERE code = 'first-route' AND status = 'active'`,
      [userId, String(routeId)],
    )
    await connection.commit()
    return { routeId, awarded: route.points_reward, balance: accounts[0].balance }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function checkin(userId: number, pointId: number, location?: { longitude?: number, latitude?: number }) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [points] = await connection.query(
      "SELECT id, name, points_reward, longitude, latitude, checkin_radius FROM xj_points WHERE id = ? AND status = 'published' FOR UPDATE",
      [pointId],
    ) as any
    const point = points[0]
    if (!point) throw createError({ statusCode: 404, message: '点位不存在或未发布' })
    const [settingRows] = await connection.query("SELECT setting_value FROM xj_settings WHERE setting_key = 'location_check_enabled'") as any
    const locationCheckEnabled = settingRows[0]?.setting_value === 'true'
    const hasLocation = Number.isFinite(location?.longitude) && Number.isFinite(location?.latitude)
    if (locationCheckEnabled && !hasLocation) throw createError({ statusCode: 400, message: '当前已启用定位校验，请允许浏览器获取位置' })
    const distanceMeters = hasLocation
      ? calculateDistanceMeters(Number(location?.latitude), Number(location?.longitude), Number(point.latitude), Number(point.longitude))
      : null
    if (locationCheckEnabled && distanceMeters != null && distanceMeters > point.checkin_radius) {
      throw createError({ statusCode: 409, message: `距离点位约 ${distanceMeters} 米，需进入 ${point.checkin_radius} 米范围` })
    }

    const [existing] = await connection.query(
      'SELECT id FROM xj_checkins WHERE user_id = ? AND point_id = ? AND checkin_date = CURRENT_DATE',
      [userId, pointId],
    ) as any
    if (existing.length) throw createError({ statusCode: 409, message: '今天已经打卡过该点位' })

    await connection.query(
      `INSERT INTO xj_checkins (user_id, point_id, checkin_date, longitude, latitude, distance_meters, points_awarded)
       VALUES (?, ?, CURRENT_DATE, ?, ?, ?, ?)`,
      [userId, pointId, location?.longitude ?? null, location?.latitude ?? null, distanceMeters, point.points_reward],
    )
    await connection.query(
      `INSERT INTO xj_point_accounts (user_id, balance, total_earned) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), total_earned = total_earned + VALUES(total_earned)`,
      [userId, point.points_reward, point.points_reward],
    )
    const [accounts] = await connection.query('SELECT balance FROM xj_point_accounts WHERE user_id = ?', [userId]) as any
    await connection.query(
      `INSERT INTO xj_point_ledger (user_id, change_amount, balance_after, business_type, business_id, description)
       VALUES (?, ?, ?, 'checkin', ?, ?)`,
      [userId, point.points_reward, accounts[0].balance, `${pointId}:${new Date().toISOString().slice(0, 10)}`, `打卡「${point.name}」`],
    )
    await connection.query(
      `INSERT IGNORE INTO xj_user_badges (user_id, badge_id, source_type, source_id)
       SELECT ?, id, 'checkin', ? FROM xj_badges WHERE code = 'first-step' AND status = 'active'`,
      [userId, String(pointId)],
    )
    await connection.query(
      `INSERT IGNORE INTO xj_user_badges (user_id, badge_id, source_type, source_id)
       SELECT ?, b.id, 'checkin_count', CAST(COUNT(ci.id) AS CHAR)
       FROM xj_badges b JOIN xj_checkins ci ON ci.user_id = ?
       WHERE b.code = 'ten-checkins' AND b.status = 'active'
       GROUP BY b.id, b.trigger_value HAVING COUNT(ci.id) >= b.trigger_value`,
      [userId, userId],
    )
    await connection.commit()
    return { pointId, pointName: point.name, awarded: point.points_reward, balance: accounts[0].balance, distanceMeters }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function getUserProfile(userId: number) {
  await pool.query('INSERT IGNORE INTO xj_point_accounts (user_id) VALUES (?)', [userId])
  const [[accountRows], [checkinRows], [ledgerRows], [badgeRows], [routeRows]] = await Promise.all([
    pool.query('SELECT balance, total_earned, total_spent FROM xj_point_accounts WHERE user_id = ?', [userId]),
    pool.query(`SELECT ci.*, p.name AS point_name, c.name AS city_name FROM xj_checkins ci JOIN xj_points p ON p.id = ci.point_id JOIN xj_cities c ON c.id = p.city_id WHERE ci.user_id = ? ORDER BY ci.created_at DESC LIMIT 20`, [userId]),
    pool.query('SELECT * FROM xj_point_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]),
    pool.query(`SELECT b.id, b.code, b.name, b.description, b.icon, ub.awarded_at FROM xj_user_badges ub JOIN xj_badges b ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.awarded_at DESC`, [userId]),
    pool.query(`SELECT rc.id, rc.completed_at, rc.points_awarded, r.id AS route_id, r.name FROM xj_route_completions rc JOIN xj_routes r ON r.id = rc.route_id WHERE rc.user_id = ? ORDER BY rc.completed_at DESC`, [userId]),
  ]) as any
  const account = accountRows[0] || { balance: 0, total_earned: 0, total_spent: 0 }
  return {
    account: { balance: account.balance, totalEarned: account.total_earned, totalSpent: account.total_spent },
    checkins: checkinRows.map((row: any) => ({ id: row.id, pointId: row.point_id, pointName: row.point_name, cityName: row.city_name, pointsAwarded: row.points_awarded, createdAt: row.created_at })),
    ledger: ledgerRows.map((row: any) => ({ id: row.id, changeAmount: row.change_amount, balanceAfter: row.balance_after, businessType: row.business_type, description: row.description, createdAt: row.created_at })),
    badges: badgeRows.map((row: any) => ({ id: row.id, code: row.code, name: row.name, description: row.description, icon: row.icon, awardedAt: row.awarded_at })),
    completedRoutes: routeRows.map((row: any) => ({ id: row.id, routeId: row.route_id, name: row.name, pointsAwarded: row.points_awarded, completedAt: row.completed_at })),
  }
}

export async function getRankings(limit = 20) {
  const [rows] = await pool.query(
    `SELECT u.id AS user_id, u.username, COALESCE(a.balance, 0) AS balance, COALESCE(a.total_earned, 0) AS total_earned,
            COUNT(ci.id) AS checkin_count
     FROM users u LEFT JOIN xj_point_accounts a ON a.user_id = u.id
     LEFT JOIN xj_checkins ci ON ci.user_id = u.id
     GROUP BY u.id ORDER BY total_earned DESC, checkin_count DESC, u.id ASC LIMIT ?`,
    [Math.min(100, Math.max(1, limit))],
  ) as any
  return rows.map((row: any, index: number) => ({ rank: index + 1, userId: row.user_id, username: row.username, balance: row.balance, totalEarned: row.total_earned, checkinCount: Number(row.checkin_count) }))
}

export async function listActivities(cityId?: number) {
  const params: unknown[] = []
  const filter = cityId ? 'AND a.city_id = ?' : ''
  if (cityId) params.push(cityId)
  const [rows] = await pool.query(
    `SELECT a.*, c.name AS city_name FROM xj_activities a JOIN xj_cities c ON c.id = a.city_id
     WHERE a.status = 'published' ${filter} ORDER BY a.starts_at`,
    params,
  ) as any
  return rows.map((row: any) => ({
    id: row.id, cityId: row.city_id, cityName: row.city_name, title: row.title, description: row.description,
    venue: row.venue, startsAt: row.starts_at, endsAt: row.ends_at, registrationDeadline: row.registration_deadline,
    capacity: row.capacity, registeredCount: row.registered_count, price: Number(row.price), pointsReward: row.points_reward,
  }))
}

export async function getActivity(id: number) {
  const activities = await listActivities()
  return activities.find((activity: any) => activity.id === id) || null
}

export async function registerActivity(userId: number, activityId: number, contactName: string, contactPhone: string) {
  if (!contactName || !contactPhone) throw createError({ statusCode: 400, message: '联系人和联系电话不能为空' })
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [activities] = await connection.query("SELECT * FROM xj_activities WHERE id = ? AND status = 'published' FOR UPDATE", [activityId]) as any
    const activity = activities[0]
    if (!activity) throw createError({ statusCode: 404, message: '活动不存在' })
    if (activity.registered_count >= activity.capacity) throw createError({ statusCode: 409, message: '活动名额已满' })

    const [existingRows] = await connection.query('SELECT id, status FROM xj_activity_registrations WHERE activity_id = ? AND user_id = ?', [activityId, userId]) as any
    if (existingRows[0]) {
      const [payments] = await connection.query('SELECT * FROM xj_payments WHERE registration_id = ?', [existingRows[0].id]) as any
      await connection.commit()
      const existingPayment = payments[0]
      return {
        registrationId: existingRows[0].id,
        payment: existingPayment && {
          id: existingPayment.id,
          paymentNo: existingPayment.payment_no,
          amount: Number(existingPayment.amount),
          status: existingPayment.status,
          mockCode: existingPayment.mock_code,
        },
      }
    }

    const [registrationResult] = await connection.query(
      `INSERT INTO xj_activity_registrations (activity_id, user_id, contact_name, contact_phone) VALUES (?, ?, ?, ?)`,
      [activityId, userId, contactName, contactPhone],
    ) as any
    const paymentNo = `MOCK${Date.now()}${String(userId).padStart(4, '0')}`
    const mockCode = randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()
    const [paymentResult] = await connection.query(
      `INSERT INTO xj_payments (payment_no, user_id, registration_id, amount, mock_code) VALUES (?, ?, ?, ?, ?)`,
      [paymentNo, userId, registrationResult.insertId, activity.price, mockCode],
    ) as any
    await connection.commit()
    return { registrationId: registrationResult.insertId, payment: { id: paymentResult.insertId, paymentNo, amount: Number(activity.price), status: 'pending', mockCode } }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function confirmMockPayment(userId: number, paymentId: number) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [payments] = await connection.query(
      `SELECT p.*, r.activity_id, a.points_reward, a.title AS activity_title
       FROM xj_payments p JOIN xj_activity_registrations r ON r.id = p.registration_id
       JOIN xj_activities a ON a.id = r.activity_id
       WHERE p.id = ? AND p.user_id = ? FOR UPDATE`,
      [paymentId, userId],
    ) as any
    const payment = payments[0]
    if (!payment) throw createError({ statusCode: 404, message: '支付单不存在' })
    if (payment.status === 'paid') {
      await connection.commit()
      return { paymentId, status: 'paid' }
    }
    await connection.query("UPDATE xj_payments SET status = 'paid', paid_at = NOW() WHERE id = ?", [paymentId])
    await connection.query("UPDATE xj_activity_registrations SET status = 'confirmed', paid_amount = ? WHERE id = ?", [payment.amount, payment.registration_id])
    await connection.query(`UPDATE xj_activities a JOIN xj_activity_registrations r ON r.activity_id = a.id SET a.registered_count = a.registered_count + 1 WHERE r.id = ?`, [payment.registration_id])
    if (payment.points_reward > 0) {
      await connection.query(
        `INSERT INTO xj_point_accounts (user_id, balance, total_earned) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance), total_earned = total_earned + VALUES(total_earned)`,
        [userId, payment.points_reward, payment.points_reward],
      )
      const [accounts] = await connection.query('SELECT balance FROM xj_point_accounts WHERE user_id = ?', [userId]) as any
      await connection.query(
        `INSERT INTO xj_point_ledger (user_id, change_amount, balance_after, business_type, business_id, description)
         VALUES (?, ?, ?, 'activity_payment', ?, ?)`,
        [userId, payment.points_reward, accounts[0].balance, String(payment.registration_id), `报名活动「${payment.activity_title}」`],
      )
    }
    await connection.commit()
    return { paymentId, status: 'paid' }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function listMallProducts() {
  const [rows] = await pool.query("SELECT * FROM xj_mall_products WHERE status IN ('published', 'sold_out') ORDER BY id") as any
  return rows.map((row: any) => ({ id: row.id, name: row.name, description: row.description, coverImage: row.cover_image, pointsPrice: row.points_price, stock: row.stock, exchangedCount: row.exchanged_count, productType: row.product_type, status: row.status }))
}

export async function exchangeMallProduct(userId: number, productId: number, quantity: number, receiver: { name?: string, phone?: string, address?: string }) {
  quantity = Math.max(1, Math.floor(quantity || 1))
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [products] = await connection.query("SELECT * FROM xj_mall_products WHERE id = ? AND status = 'published' FOR UPDATE", [productId]) as any
    const product = products[0]
    if (!product) throw createError({ statusCode: 404, message: '积分商品不存在或已下架' })
    if (product.stock < quantity) throw createError({ statusCode: 409, message: '库存不足' })
    await connection.query('INSERT IGNORE INTO xj_point_accounts (user_id) VALUES (?)', [userId])
    const [accounts] = await connection.query('SELECT * FROM xj_point_accounts WHERE user_id = ? FOR UPDATE', [userId]) as any
    const pointsAmount = product.points_price * quantity
    if (accounts[0].balance < pointsAmount) throw createError({ statusCode: 409, message: '积分不足' })
    if (product.product_type === 'physical' && (!receiver.name || !receiver.phone || !receiver.address)) {
      throw createError({ statusCode: 400, message: '实物商品需要填写完整收货信息' })
    }
    const orderNo = `XJ${Date.now()}${String(userId).padStart(4, '0')}`
    const orderStatus = product.product_type === 'virtual' ? 'completed' : 'paid'
    const [orderResult] = await connection.query(
      `INSERT INTO xj_exchange_orders (order_no, user_id, product_id, product_name, quantity, points_amount, status, receiver_name, receiver_phone, receiver_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, userId, productId, product.name, quantity, pointsAmount, orderStatus, receiver.name || '', receiver.phone || '', receiver.address || ''],
    ) as any
    await connection.query('UPDATE xj_mall_products SET stock = stock - ?, exchanged_count = exchanged_count + ? WHERE id = ?', [quantity, quantity, productId])
    await connection.query('UPDATE xj_point_accounts SET balance = balance - ?, total_spent = total_spent + ? WHERE user_id = ?', [pointsAmount, pointsAmount, userId])
    const balanceAfter = accounts[0].balance - pointsAmount
    await connection.query(
      `INSERT INTO xj_point_ledger (user_id, change_amount, balance_after, business_type, business_id, description) VALUES (?, ?, ?, 'exchange', ?, ?)`,
      [userId, -pointsAmount, balanceAfter, String(orderResult.insertId), `兑换「${product.name}」`],
    )
    await connection.commit()
    return { orderId: orderResult.insertId, orderNo, pointsAmount, balance: balanceAfter }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}
