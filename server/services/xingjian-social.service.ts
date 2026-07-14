import { randomBytes } from 'node:crypto'
import pool from '../utils/db'

export async function getSocialOverview(userId: number) {
  const [[friendRows], [requestRows], [teamRows], [teamMemberRows]] = await Promise.all([
    pool.query(
      `SELECT u.id, u.username, COALESCE(a.total_earned, 0) AS total_earned, COUNT(ci.id) AS checkin_count
       FROM xj_friendships f JOIN users u ON u.id = f.friend_id
       LEFT JOIN xj_point_accounts a ON a.user_id = u.id
       LEFT JOIN xj_checkins ci ON ci.user_id = u.id
       WHERE f.user_id = ? GROUP BY u.id ORDER BY u.username`,
      [userId],
    ),
    pool.query(
      `SELECT fr.id, fr.message, fr.created_at, u.id AS sender_id, u.username AS sender_name
       FROM xj_friend_requests fr JOIN users u ON u.id = fr.sender_id
       WHERE fr.receiver_id = ? AND fr.status = 'pending' ORDER BY fr.created_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT t.id, t.name, t.code, t.description, tm.role,
              COUNT(all_members.user_id) AS member_count,
              COALESCE(SUM(a.total_earned), 0) AS total_points
       FROM xj_team_members tm JOIN xj_teams t ON t.id = tm.team_id
       LEFT JOIN xj_team_members all_members ON all_members.team_id = t.id
       LEFT JOIN xj_point_accounts a ON a.user_id = all_members.user_id
       WHERE tm.user_id = ? GROUP BY t.id, tm.role`,
      [userId],
    ),
    pool.query(
      `SELECT u.id, u.username, tm.role, COALESCE(a.total_earned, 0) AS total_earned
       FROM xj_team_members mine JOIN xj_team_members tm ON tm.team_id = mine.team_id
       JOIN users u ON u.id = tm.user_id LEFT JOIN xj_point_accounts a ON a.user_id = u.id
       WHERE mine.user_id = ? ORDER BY tm.role, a.total_earned DESC`,
      [userId],
    ),
  ]) as any
  return {
    friends: friendRows.map((row: any) => ({ id: row.id, username: row.username, totalEarned: row.total_earned, checkinCount: Number(row.checkin_count) })),
    requests: requestRows.map((row: any) => ({ id: row.id, senderId: row.sender_id, senderName: row.sender_name, message: row.message, createdAt: row.created_at })),
    team: teamRows[0] ? { id: teamRows[0].id, name: teamRows[0].name, code: teamRows[0].code, description: teamRows[0].description, role: teamRows[0].role, memberCount: Number(teamRows[0].member_count), totalPoints: Number(teamRows[0].total_points) } : null,
    teamMembers: teamMemberRows.map((row: any) => ({ id: row.id, username: row.username, role: row.role, totalEarned: row.total_earned })),
  }
}

export async function sendFriendRequest(userId: number, username: string, message: string) {
  const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username]) as any
  const receiver = users[0]
  if (!receiver) throw createError({ statusCode: 404, message: '未找到该用户' })
  if (receiver.id === userId) throw createError({ statusCode: 400, message: '不能添加自己为好友' })
  const [friends] = await pool.query('SELECT 1 FROM xj_friendships WHERE user_id = ? AND friend_id = ?', [userId, receiver.id]) as any
  if (friends.length) throw createError({ statusCode: 409, message: '你们已经是好友' })
  await pool.query(
    `INSERT INTO xj_friend_requests (sender_id, receiver_id, message, status) VALUES (?, ?, ?, 'pending')
     ON DUPLICATE KEY UPDATE message = VALUES(message), status = 'pending', updated_at = CURRENT_TIMESTAMP`,
    [userId, receiver.id, message.slice(0, 120)],
  )
  return { receiverId: receiver.id, receiverName: receiver.username }
}

export async function respondFriendRequest(userId: number, requestId: number, action: 'accept' | 'reject') {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [requests] = await connection.query(
      "SELECT * FROM xj_friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending' FOR UPDATE",
      [requestId, userId],
    ) as any
    const request = requests[0]
    if (!request) throw createError({ statusCode: 404, message: '好友申请不存在或已处理' })
    if (action === 'accept') {
      await connection.query('INSERT IGNORE INTO xj_friendships (user_id, friend_id) VALUES (?, ?), (?, ?)', [request.sender_id, request.receiver_id, request.receiver_id, request.sender_id])
      await connection.query("UPDATE xj_friend_requests SET status = 'accepted' WHERE id = ?", [requestId])
    }
    else {
      await connection.query("UPDATE xj_friend_requests SET status = 'rejected' WHERE id = ?", [requestId])
    }
    await connection.commit()
    return { requestId, status: action === 'accept' ? 'accepted' : 'rejected' }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function createTeam(userId: number, name: string, description: string) {
  if (!name.trim()) throw createError({ statusCode: 400, message: '团队名称不能为空' })
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [membership] = await connection.query('SELECT team_id FROM xj_team_members WHERE user_id = ? FOR UPDATE', [userId]) as any
    if (membership.length) throw createError({ statusCode: 409, message: '你已经加入了一个团队' })
    const code = randomBytes(4).toString('hex').toUpperCase()
    const [result] = await connection.query('INSERT INTO xj_teams (name, code, description, owner_id) VALUES (?, ?, ?, ?)', [name.trim(), code, description.trim(), userId]) as any
    await connection.query("INSERT INTO xj_team_members (team_id, user_id, role) VALUES (?, ?, 'owner')", [result.insertId, userId])
    await connection.commit()
    return { id: result.insertId, name: name.trim(), code }
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function joinTeam(userId: number, code: string) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [membership] = await connection.query('SELECT team_id FROM xj_team_members WHERE user_id = ? FOR UPDATE', [userId]) as any
    if (membership.length) throw createError({ statusCode: 409, message: '你已经加入了一个团队' })
    const [teams] = await connection.query('SELECT id, name, code FROM xj_teams WHERE code = ? FOR UPDATE', [code.trim().toUpperCase()]) as any
    if (!teams[0]) throw createError({ statusCode: 404, message: '团队邀请码无效' })
    await connection.query('INSERT INTO xj_team_members (team_id, user_id) VALUES (?, ?)', [teams[0].id, userId])
    await connection.commit()
    return teams[0]
  }
  catch (error) {
    await connection.rollback()
    throw error
  }
  finally {
    connection.release()
  }
}

export async function getTeamRankings() {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.code, COUNT(tm.user_id) AS member_count, COALESCE(SUM(a.total_earned), 0) AS total_points
     FROM xj_teams t LEFT JOIN xj_team_members tm ON tm.team_id = t.id
     LEFT JOIN xj_point_accounts a ON a.user_id = tm.user_id
     GROUP BY t.id ORDER BY total_points DESC, member_count DESC LIMIT 50`,
  ) as any
  return rows.map((row: any, index: number) => ({ rank: index + 1, id: row.id, name: row.name, code: row.code, memberCount: Number(row.member_count), totalPoints: Number(row.total_points) }))
}

export async function getFriendRankings(userId: number) {
  const [rows] = await pool.query(
    `SELECT u.id AS user_id, u.username, COALESCE(a.balance, 0) AS balance, COALESCE(a.total_earned, 0) AS total_earned,
            COUNT(ci.id) AS checkin_count
     FROM users u LEFT JOIN xj_point_accounts a ON a.user_id = u.id
     LEFT JOIN xj_checkins ci ON ci.user_id = u.id
     WHERE u.id = ? OR u.id IN (SELECT friend_id FROM xj_friendships WHERE user_id = ?)
     GROUP BY u.id ORDER BY total_earned DESC, checkin_count DESC`,
    [userId, userId],
  ) as any
  return rows.map((row: any, index: number) => ({ rank: index + 1, userId: row.user_id, username: row.username, balance: row.balance, totalEarned: row.total_earned, checkinCount: Number(row.checkin_count) }))
}
