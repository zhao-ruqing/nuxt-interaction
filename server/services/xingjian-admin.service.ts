import pool from '../utils/db'

export async function listAdminRoutes() {
  const [rows] = await pool.query(
    `SELECT r.*, c.name AS city_name, GROUP_CONCAT(rp.point_id ORDER BY rp.sequence_no) AS point_ids
     FROM xj_routes r JOIN xj_cities c ON c.id = r.city_id
     LEFT JOIN xj_route_points rp ON rp.route_id = r.id
     GROUP BY r.id ORDER BY r.id DESC`,
  ) as any
  return rows.map((row: any) => ({ id: row.id, cityId: row.city_id, cityName: row.city_name, name: row.name, description: row.description, difficulty: row.difficulty, estimatedMinutes: row.estimated_minutes, pointsReward: row.points_reward, status: row.status, pointIds: row.point_ids ? String(row.point_ids).split(',').map(Number) : [] }))
}

export function parseRouteInput(body: Record<string, unknown>) {
  const input = { cityId: Number(body.cityId), name: String(body.name || '').trim(), description: String(body.description || '').trim(), difficulty: String(body.difficulty || 'easy'), estimatedMinutes: Math.max(1, Number(body.estimatedMinutes || 60)), pointsReward: Math.max(0, Number(body.pointsReward || 0)), status: String(body.status || 'published'), pointIds: Array.isArray(body.pointIds) ? body.pointIds.map(Number).filter(Boolean) : [] }
  if (!input.cityId || !input.name || !input.pointIds.length) throw createError({ statusCode: 400, message: '路线名称、城市和点位不能为空' })
  return input
}

export async function saveRoute(id: number | null, input: ReturnType<typeof parseRouteInput>) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    let routeId = id
    const params = [input.cityId, input.name, input.description, input.difficulty, input.estimatedMinutes, input.pointsReward, input.status]
    if (routeId) {
      const [result] = await connection.query('UPDATE xj_routes SET city_id=?,name=?,description=?,difficulty=?,estimated_minutes=?,points_reward=?,status=? WHERE id=?', [...params, routeId]) as any
      if (!result.affectedRows) throw createError({ statusCode: 404, message: '路线不存在' })
      await connection.query('DELETE FROM xj_route_points WHERE route_id = ?', [routeId])
    }
    else {
      const [result] = await connection.query('INSERT INTO xj_routes (city_id,name,description,difficulty,estimated_minutes,points_reward,status) VALUES (?,?,?,?,?,?,?)', params) as any
      routeId = result.insertId
    }
    for (const [index, pointId] of input.pointIds.entries()) {
      await connection.query('INSERT INTO xj_route_points (route_id, point_id, sequence_no) VALUES (?, ?, ?)', [routeId, pointId, index + 1])
    }
    await connection.commit()
    return { id: routeId }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function listAdminUsers() {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.created_at, COALESCE(a.balance,0) AS balance, COALESCE(a.total_earned,0) AS total_earned,
            COUNT(DISTINCT ci.id) AS checkin_count, COUNT(DISTINCT ub.id) AS badge_count
     FROM users u LEFT JOIN xj_point_accounts a ON a.user_id = u.id
     LEFT JOIN xj_checkins ci ON ci.user_id = u.id LEFT JOIN xj_user_badges ub ON ub.user_id = u.id
     GROUP BY u.id ORDER BY u.id DESC`,
  ) as any
  return rows.map((row: any) => ({ id: row.id, username: row.username, createdAt: row.created_at, balance: row.balance, totalEarned: row.total_earned, checkinCount: Number(row.checkin_count), badgeCount: Number(row.badge_count) }))
}

export async function listAdminActivities() {
  const [rows] = await pool.query(`SELECT a.*, c.name AS city_name FROM xj_activities a JOIN xj_cities c ON c.id = a.city_id ORDER BY a.starts_at DESC`) as any
  return rows.map((row: any) => ({ id: row.id, cityId: row.city_id, cityName: row.city_name, title: row.title, description: row.description, venue: row.venue, startsAt: row.starts_at, endsAt: row.ends_at, registrationDeadline: row.registration_deadline, capacity: row.capacity, registeredCount: row.registered_count, price: Number(row.price), pointsReward: row.points_reward, status: row.status }))
}

export function parseActivityInput(body: Record<string, unknown>) {
  const input = {
    cityId: Number(body.cityId), title: String(body.title || '').trim(), description: String(body.description || '').trim(), venue: String(body.venue || '').trim(),
    startsAt: String(body.startsAt || '').replace('T', ' '), endsAt: String(body.endsAt || '').replace('T', ' '), registrationDeadline: String(body.registrationDeadline || '').replace('T', ' '),
    capacity: Math.max(1, Number(body.capacity || 1)), price: Math.max(0, Number(body.price || 0)), pointsReward: Math.max(0, Number(body.pointsReward || 0)), status: String(body.status || 'published'),
  }
  if (!input.cityId || !input.title || !input.venue || !input.startsAt || !input.endsAt || !input.registrationDeadline) throw createError({ statusCode: 400, message: '请填写完整活动信息' })
  return input
}

export async function saveActivity(id: number | null, input: ReturnType<typeof parseActivityInput>) {
  const params = [input.cityId, input.title, input.description, input.venue, input.startsAt, input.endsAt, input.registrationDeadline, input.capacity, input.price, input.pointsReward, input.status]
  if (id) {
    const [result] = await pool.query(`UPDATE xj_activities SET city_id=?,title=?,description=?,venue=?,starts_at=?,ends_at=?,registration_deadline=?,capacity=?,price=?,points_reward=?,status=? WHERE id=?`, [...params, id]) as any
    if (!result.affectedRows) throw createError({ statusCode: 404, message: '活动不存在' })
    return { id }
  }
  const [result] = await pool.query(`INSERT INTO xj_activities (city_id,title,description,venue,starts_at,ends_at,registration_deadline,capacity,price,points_reward,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, params) as any
  return { id: result.insertId }
}

export async function listAdminMallProducts() {
  const [rows] = await pool.query('SELECT * FROM xj_mall_products ORDER BY id DESC') as any
  return rows.map((row: any) => ({ id: row.id, name: row.name, description: row.description, pointsPrice: row.points_price, stock: row.stock, exchangedCount: row.exchanged_count, productType: row.product_type, status: row.status }))
}

export function parseMallProductInput(body: Record<string, unknown>) {
  const input = { name: String(body.name || '').trim(), description: String(body.description || '').trim(), pointsPrice: Math.max(1, Number(body.pointsPrice || 1)), stock: Math.max(0, Number(body.stock || 0)), productType: String(body.productType || 'physical'), status: String(body.status || 'published') }
  if (!input.name || !input.description) throw createError({ statusCode: 400, message: '商品名称和介绍不能为空' })
  return input
}

export async function saveMallProduct(id: number | null, input: ReturnType<typeof parseMallProductInput>) {
  const params = [input.name, input.description, input.pointsPrice, input.stock, input.productType, input.status]
  if (id) {
    const [result] = await pool.query('UPDATE xj_mall_products SET name=?,description=?,points_price=?,stock=?,product_type=?,status=? WHERE id=?', [...params, id]) as any
    if (!result.affectedRows) throw createError({ statusCode: 404, message: '积分商品不存在' })
    return { id }
  }
  const [result] = await pool.query('INSERT INTO xj_mall_products (name,description,points_price,stock,product_type,status) VALUES (?,?,?,?,?,?)', params) as any
  return { id: result.insertId }
}

export async function listExchangeOrders() {
  const [rows] = await pool.query(`SELECT o.*, u.username FROM xj_exchange_orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC`) as any
  return rows.map((row: any) => ({ id: row.id, orderNo: row.order_no, username: row.username, productName: row.product_name, quantity: row.quantity, pointsAmount: row.points_amount, status: row.status, receiverName: row.receiver_name, receiverPhone: row.receiver_phone, receiverAddress: row.receiver_address, createdAt: row.created_at }))
}

export async function shipExchangeOrder(id: number) {
  const [result] = await pool.query("UPDATE xj_exchange_orders SET status = 'shipped' WHERE id = ? AND status = 'paid'", [id]) as any
  if (!result.affectedRows) throw createError({ statusCode: 409, message: '订单不存在或当前状态不可发货' })
  return { id, status: 'shipped' }
}

export async function listUserExchangeOrders(userId: number) {
  const [rows] = await pool.query('SELECT * FROM xj_exchange_orders WHERE user_id = ? ORDER BY created_at DESC', [userId]) as any
  return rows.map((row: any) => ({ id: row.id, orderNo: row.order_no, productName: row.product_name, quantity: row.quantity, pointsAmount: row.points_amount, status: row.status, createdAt: row.created_at }))
}

export async function listUserRegistrations(userId: number) {
  const [rows] = await pool.query(`SELECT r.*, a.title, a.starts_at, a.venue, p.status AS payment_status FROM xj_activity_registrations r JOIN xj_activities a ON a.id = r.activity_id LEFT JOIN xj_payments p ON p.registration_id = r.id WHERE r.user_id = ? ORDER BY r.created_at DESC`, [userId]) as any
  return rows.map((row: any) => ({ id: row.id, activityId: row.activity_id, title: row.title, startsAt: row.starts_at, venue: row.venue, status: row.status, paymentStatus: row.payment_status, paidAmount: Number(row.paid_amount) }))
}
