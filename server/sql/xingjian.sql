SET NAMES utf8mb4;

SET @role_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
);
SET @add_role_sql = IF(
  @role_column_exists = 0,
  "ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER password",
  'SELECT 1'
);
PREPARE add_role_statement FROM @add_role_sql;
EXECUTE add_role_statement;
DEALLOCATE PREPARE add_role_statement;
UPDATE users SET role = 'admin' WHERE username = 'admin' OR id = 1;

CREATE TABLE IF NOT EXISTS xj_cities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(32) NOT NULL,
  province VARCHAR(50) NOT NULL DEFAULT '',
  description VARCHAR(500) NOT NULL DEFAULT '',
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  longitude DECIMAL(10, 6) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  status ENUM('draft', 'published', 'disabled') NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_cities_code (code),
  KEY idx_xj_cities_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行鉴城市';

CREATE TABLE IF NOT EXISTS xj_points (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(40) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'landmark',
  address VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  longitude DECIMAL(10, 6) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  checkin_radius INT UNSIGNED NOT NULL DEFAULT 500,
  points_reward INT UNSIGNED NOT NULL DEFAULT 10,
  daily_limit INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('draft', 'published', 'disabled') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_points_code (code),
  KEY idx_xj_points_city_status (city_id, status),
  CONSTRAINT fk_xj_points_city FOREIGN KEY (city_id) REFERENCES xj_cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行鉴打卡点位';

CREATE TABLE IF NOT EXISTS xj_routes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  difficulty ENUM('easy', 'normal', 'hard') NOT NULL DEFAULT 'easy',
  estimated_minutes INT UNSIGNED NOT NULL DEFAULT 60,
  points_reward INT UNSIGNED NOT NULL DEFAULT 30,
  status ENUM('draft', 'published', 'disabled') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_xj_routes_city_status (city_id, status),
  CONSTRAINT fk_xj_routes_city FOREIGN KEY (city_id) REFERENCES xj_cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行鉴路线';

CREATE TABLE IF NOT EXISTS xj_route_points (
  route_id INT UNSIGNED NOT NULL,
  point_id INT UNSIGNED NOT NULL,
  sequence_no INT UNSIGNED NOT NULL,
  PRIMARY KEY (route_id, point_id),
  UNIQUE KEY uk_xj_route_sequence (route_id, sequence_no),
  CONSTRAINT fk_xj_route_points_route FOREIGN KEY (route_id) REFERENCES xj_routes(id) ON DELETE CASCADE,
  CONSTRAINT fk_xj_route_points_point FOREIGN KEY (point_id) REFERENCES xj_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='路线点位';

CREATE TABLE IF NOT EXISTS xj_point_accounts (
  user_id INT NOT NULL PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  total_earned INT UNSIGNED NOT NULL DEFAULT 0,
  total_spent INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_xj_point_accounts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户积分账户';

CREATE TABLE IF NOT EXISTS xj_point_ledger (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  change_amount INT NOT NULL,
  balance_after INT NOT NULL,
  business_type VARCHAR(40) NOT NULL,
  business_id VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_ledger_business (user_id, business_type, business_id),
  KEY idx_xj_ledger_user_created (user_id, created_at),
  CONSTRAINT fk_xj_point_ledger_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水';

CREATE TABLE IF NOT EXISTS xj_checkins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  point_id INT UNSIGNED NOT NULL,
  checkin_date DATE NOT NULL,
  checkin_method ENUM('desktop', 'qr', 'admin') NOT NULL DEFAULT 'desktop',
  longitude DECIMAL(10, 6) NULL,
  latitude DECIMAL(10, 6) NULL,
  distance_meters INT UNSIGNED NULL,
  points_awarded INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_checkin_daily (user_id, point_id, checkin_date),
  KEY idx_xj_checkins_user_created (user_id, created_at),
  KEY idx_xj_checkins_point_created (point_id, created_at),
  CONSTRAINT fk_xj_checkins_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xj_checkins_point FOREIGN KEY (point_id) REFERENCES xj_points(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户打卡';

CREATE TABLE IF NOT EXISTS xj_activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_id INT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  venue VARCHAR(255) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  registration_deadline DATETIME NOT NULL,
  capacity INT UNSIGNED NOT NULL DEFAULT 100,
  registered_count INT UNSIGNED NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  points_reward INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_xj_activities_city_time (city_id, starts_at),
  CONSTRAINT fk_xj_activities_city FOREIGN KEY (city_id) REFERENCES xj_cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行鉴活动';

CREATE TABLE IF NOT EXISTS xj_activity_registrations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id INT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  status ENUM('pending_payment', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending_payment',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_activity_user (activity_id, user_id),
  CONSTRAINT fk_xj_registration_activity FOREIGN KEY (activity_id) REFERENCES xj_activities(id),
  CONSTRAINT fk_xj_registration_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名';

CREATE TABLE IF NOT EXISTS xj_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_no VARCHAR(40) NOT NULL,
  user_id INT NOT NULL,
  registration_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  channel ENUM('mock') NOT NULL DEFAULT 'mock',
  status ENUM('pending', 'paid', 'closed', 'refunded') NOT NULL DEFAULT 'pending',
  mock_code VARCHAR(64) NOT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_payment_no (payment_no),
  UNIQUE KEY uk_xj_payment_registration (registration_id),
  CONSTRAINT fk_xj_payment_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xj_payment_registration FOREIGN KEY (registration_id) REFERENCES xj_activity_registrations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模拟支付单';

CREATE TABLE IF NOT EXISTS xj_mall_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  points_price INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  exchanged_count INT UNSIGNED NOT NULL DEFAULT 0,
  product_type ENUM('physical', 'virtual') NOT NULL DEFAULT 'physical',
  status ENUM('draft', 'published', 'sold_out') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_xj_mall_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分商城商品';

CREATE TABLE IF NOT EXISTS xj_exchange_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(40) NOT NULL,
  user_id INT NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  points_amount INT UNSIGNED NOT NULL,
  status ENUM('paid', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'paid',
  receiver_name VARCHAR(50) NOT NULL DEFAULT '',
  receiver_phone VARCHAR(30) NOT NULL DEFAULT '',
  receiver_address VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_exchange_order_no (order_no),
  KEY idx_xj_exchange_user_created (user_id, created_at),
  CONSTRAINT fk_xj_exchange_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xj_exchange_product FOREIGN KEY (product_id) REFERENCES xj_mall_products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分兑换订单';

INSERT INTO xj_cities (name, code, province, description, longitude, latitude, sort_order) VALUES
('上海', 'shanghai', '上海市', '从街区肌理到滨江天际线，沿城市文化坐标发现上海。', 121.473701, 31.230416, 10),
('杭州', 'hangzhou', '浙江省', '沿西湖与运河展开一场自然、人文和城市生活之旅。', 120.155070, 30.274084, 20)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO xj_points (city_id, name, code, category, address, description, longitude, latitude, checkin_radius, points_reward)
SELECT id, '武康大楼', 'sh-wukang-building', 'architecture', '上海市徐汇区淮海中路1850号', '城市转角处的经典历史建筑，也是观察街区生活的理想起点。', 121.438080, 31.205055, 500, 10 FROM xj_cities WHERE code = 'shanghai'
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address);
INSERT INTO xj_points (city_id, name, code, category, address, description, longitude, latitude, checkin_radius, points_reward)
SELECT id, '徐汇滨江', 'sh-xuhui-riverside', 'riverside', '上海市徐汇区龙腾大道', '工业遗存、公共艺术与滨江步道共同构成开放的城市客厅。', 121.464126, 31.183735, 800, 15 FROM xj_cities WHERE code = 'shanghai'
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address);
INSERT INTO xj_points (city_id, name, code, category, address, description, longitude, latitude, checkin_radius, points_reward)
SELECT id, '西湖断桥', 'hz-broken-bridge', 'landmark', '杭州市西湖区北山街', '从断桥出发观察西湖四季与城市山水关系。', 120.150291, 30.259074, 600, 10 FROM xj_cities WHERE code = 'hangzhou'
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address);
INSERT INTO xj_points (city_id, name, code, category, address, description, longitude, latitude, checkin_radius, points_reward)
SELECT id, '小河直街', 'hz-xiaohe-street', 'neighborhood', '杭州市拱墅区小河直街', '运河边保留完整的传统街巷尺度与日常生活气息。', 120.143814, 30.311878, 500, 15 FROM xj_cities WHERE code = 'hangzhou'
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address);

INSERT INTO xj_routes (city_id, name, description, difficulty, estimated_minutes, points_reward)
SELECT id, '上海城市漫游线', '从历史建筑走向滨江公共空间，感受城市更新的两种尺度。', 'easy', 150, 30 FROM xj_cities c
WHERE c.code = 'shanghai' AND NOT EXISTS (SELECT 1 FROM xj_routes r WHERE r.city_id = c.id AND r.name = '上海城市漫游线');
INSERT IGNORE INTO xj_route_points (route_id, point_id, sequence_no)
SELECT r.id, p.id, 1 FROM xj_routes r JOIN xj_points p ON p.city_id = r.city_id WHERE r.name = '上海城市漫游线' AND p.code = 'sh-wukang-building';
INSERT IGNORE INTO xj_route_points (route_id, point_id, sequence_no)
SELECT r.id, p.id, 2 FROM xj_routes r JOIN xj_points p ON p.city_id = r.city_id WHERE r.name = '上海城市漫游线' AND p.code = 'sh-xuhui-riverside';

INSERT INTO xj_activities (city_id, title, description, venue, starts_at, ends_at, registration_deadline, capacity, price, points_reward)
SELECT id, '上海街区建筑夜行', '由城市观察员带队，在夜色中认识街区建筑细节与历史线索。', '武康大楼前广场', '2026-08-15 19:00:00', '2026-08-15 21:30:00', '2026-08-14 18:00:00', 30, 39.00, 20
FROM xj_cities c WHERE c.code = 'shanghai' AND NOT EXISTS (SELECT 1 FROM xj_activities a WHERE a.title = '上海街区建筑夜行');
INSERT INTO xj_activities (city_id, title, description, venue, starts_at, ends_at, registration_deadline, capacity, price, points_reward)
SELECT id, '杭州运河生活采集', '沿小河直街记录社区店铺、桥梁和运河生活，用照片完成城市采集任务。', '小河直街历史文化街区', '2026-09-05 09:30:00', '2026-09-05 12:00:00', '2026-09-03 18:00:00', 40, 29.00, 20
FROM xj_cities c WHERE c.code = 'hangzhou' AND NOT EXISTS (SELECT 1 FROM xj_activities a WHERE a.title = '杭州运河生活采集');

INSERT INTO xj_mall_products (name, description, points_price, stock, product_type)
SELECT '行鉴城市徽章', '城市限定金属徽章，记录完成一次城市探索。', 120, 50, 'physical'
WHERE NOT EXISTS (SELECT 1 FROM xj_mall_products WHERE name = '行鉴城市徽章');
INSERT INTO xj_mall_products (name, description, points_price, stock, product_type)
SELECT '城市路线电子手册', '包含路线故事、建筑背景和观察任务的数字手册。', 60, 999, 'virtual'
WHERE NOT EXISTS (SELECT 1 FROM xj_mall_products WHERE name = '城市路线电子手册');
INSERT INTO xj_mall_products (name, description, points_price, stock, product_type)
SELECT '行鉴帆布袋', '简洁桌面网格视觉延伸的城市探索帆布袋。', 260, 30, 'physical'
WHERE NOT EXISTS (SELECT 1 FROM xj_mall_products WHERE name = '行鉴帆布袋');

INSERT INTO xj_point_accounts (user_id, balance, total_earned, total_spent)
SELECT id, 300, 300, 0 FROM users
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

CREATE TABLE IF NOT EXISTS xj_route_completions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id INT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  points_awarded INT UNSIGNED NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_route_completion (route_id, user_id),
  KEY idx_xj_route_completion_user (user_id, completed_at),
  CONSTRAINT fk_xj_route_completion_route FOREIGN KEY (route_id) REFERENCES xj_routes(id),
  CONSTRAINT fk_xj_route_completion_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='路线完成记录';

CREATE TABLE IF NOT EXISTS xj_badges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(40) NOT NULL DEFAULT 'award',
  trigger_type ENUM('manual', 'first_checkin', 'checkin_count', 'route_complete') NOT NULL DEFAULT 'manual',
  trigger_value INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_badges_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='徽章定义';

CREATE TABLE IF NOT EXISTS xj_user_badges (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT UNSIGNED NOT NULL,
  source_type VARCHAR(40) NOT NULL DEFAULT 'system',
  source_id VARCHAR(64) NOT NULL DEFAULT '',
  awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_user_badge (user_id, badge_id),
  CONSTRAINT fk_xj_user_badge_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xj_user_badge_badge FOREIGN KEY (badge_id) REFERENCES xj_badges(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户徽章';

CREATE TABLE IF NOT EXISTS xj_friend_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message VARCHAR(120) NOT NULL DEFAULT '',
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_friend_request_pair (sender_id, receiver_id),
  KEY idx_xj_friend_request_receiver (receiver_id, status),
  CONSTRAINT fk_xj_friend_request_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_xj_friend_request_receiver FOREIGN KEY (receiver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友申请';

CREATE TABLE IF NOT EXISTS xj_friendships (
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT fk_xj_friendship_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xj_friendship_friend FOREIGN KEY (friend_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友关系';

CREATE TABLE IF NOT EXISTS xj_teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(16) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  owner_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_xj_teams_code (code),
  CONSTRAINT fk_xj_team_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='探索团队';

CREATE TABLE IF NOT EXISTS xj_team_members (
  team_id INT UNSIGNED NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  UNIQUE KEY uk_xj_team_member_user (user_id),
  CONSTRAINT fk_xj_team_member_team FOREIGN KEY (team_id) REFERENCES xj_teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_xj_team_member_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队成员';

INSERT INTO xj_badges (code, name, description, icon, trigger_type, trigger_value) VALUES
('first-step', '城市第一步', '完成首次城市点位打卡。', 'footprints', 'first_checkin', 1),
('ten-checkins', '坐标收藏家', '累计完成 10 次点位打卡。', 'map-pinned', 'checkin_count', 10),
('first-route', '路线完成者', '完成第一条城市探索路线。', 'route', 'route_complete', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

CREATE TABLE IF NOT EXISTS xj_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value VARCHAR(500) NOT NULL,
  value_type ENUM('string', 'number', 'boolean') NOT NULL DEFAULT 'string',
  label VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_xj_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行鉴系统设置';

INSERT INTO xj_settings (setting_key, setting_value, value_type, label, description) VALUES
('default_checkin_radius', '500', 'number', '默认打卡半径', '新建点位时建议使用的围栏半径，单位米'),
('default_checkin_points', '10', 'number', '默认打卡积分', '新建点位时建议发放的基础积分'),
('daily_checkin_limit', '1', 'number', '单点每日打卡次数', '当前业务通过唯一约束固定为每日一次'),
('payment_mode', 'mock', 'string', '支付模式', '当前固定为 mock 模拟支付'),
('ranking_limit', '50', 'number', '排行榜展示人数', '个人榜和团队榜默认展示上限')
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description);
