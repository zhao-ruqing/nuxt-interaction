-- 饮品商品表
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  category VARCHAR(50) NOT NULL COMMENT '分类标识',
  category_name VARCHAR(50) NOT NULL COMMENT '分类名称',
  price DECIMAL(10, 2) NOT NULL COMMENT '默认售价',
  original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价',
  description TEXT NOT NULL COMMENT '商品描述',
  image VARCHAR(20) NOT NULL COMMENT '展示图标',
  tags JSON NOT NULL COMMENT '标签数组',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0 COMMENT '评分',
  sales INT NOT NULL DEFAULT 0 COMMENT '销量',
  stock INT NOT NULL DEFAULT 0 COMMENT '库存',
  specs JSON NOT NULL COMMENT '规格列表 [{size, price}]',
  ingredients JSON DEFAULT NULL COMMENT '配料表',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='饮品商品表';

-- 清空旧数据（可选，首次导入时执行）
-- TRUNCATE TABLE products;

INSERT INTO products (name, category, category_name, price, original_price, description, image, tags, rating, sales, stock, specs, ingredients) VALUES
('经典美式咖啡', 'coffee', '咖啡', 18.00, 22.00,
 '精选阿拉比卡咖啡豆，中深度烘焙，口感醇厚顺滑，带有淡淡的坚果与巧克力香气。',
 '☕', '["热销", "低卡"]', 4.8, 3260, 99,
 '[{"size": "中杯 350ml", "price": 18}, {"size": "大杯 500ml", "price": 22}, {"size": "超大杯 700ml", "price": 26}]',
 '["阿拉比卡咖啡豆", "纯净水"]'),

('拿铁咖啡', 'coffee', '咖啡', 22.00, 26.00,
 '浓郁意式浓缩与丝滑鲜奶的完美融合，入口绵密，奶香与咖啡香层次分明。',
 '☕', '["招牌", "奶香"]', 4.9, 5120, 88,
 '[{"size": "中杯 350ml", "price": 22}, {"size": "大杯 500ml", "price": 26}, {"size": "超大杯 700ml", "price": 30}]',
 '["意式浓缩", "鲜牛奶", "奶泡"]'),

('冰萃冷泡咖啡', 'coffee', '咖啡', 24.00, NULL,
 '12 小时低温慢萃，酸度柔和，果香突出，夏日解暑首选。',
 '🧊', '["冰饮", "清爽"]', 4.7, 1890, 56,
 '[{"size": "中杯 350ml", "price": 24}, {"size": "大杯 500ml", "price": 28}]',
 '["冷萃咖啡液", "冰块"]'),

('可口可乐', 'soda', '汽水', 6.00, NULL,
 '经典可乐口味，气泡十足，冰爽畅快，搭配餐食更美味。',
 '🥤', '["经典", "冰爽"]', 4.6, 8900, 200,
 '[{"size": "罐装 330ml", "price": 6}, {"size": "瓶装 500ml", "price": 8}, {"size": "瓶装 1.25L", "price": 12}]',
 '["碳酸水", "白砂糖", "焦糖色", "天然香料"]'),

('百事可乐', 'soda', '汽水', 6.00, NULL,
 '年轻活力的可乐选择，口感甜润，气泡细腻持久。',
 '🥤', '["年轻", "甜润"]', 4.5, 7200, 180,
 '[{"size": "罐装 330ml", "price": 6}, {"size": "瓶装 500ml", "price": 8}]',
 '["碳酸水", "白砂糖", "焦糖色"]'),

('雪碧柠檬味汽水', 'soda', '汽水', 6.00, NULL,
 '清新柠檬味，透明无色，口感清甜，解腻首选。',
 '🍋', '["清新", "柠檬"]', 4.6, 6500, 150,
 '[{"size": "罐装 330ml", "price": 6}, {"size": "瓶装 500ml", "price": 8}]',
 '["碳酸水", "白砂糖", "柠檬酸", "天然柠檬香料"]'),

('茉莉绿茶', 'tea', '茶饮', 12.00, NULL,
 '选用优质茉莉花茶，花香清雅，茶味回甘，零添加更安心。',
 '🍵', '["清香", "无糖"]', 4.7, 2800, 120,
 '[{"size": "中杯 500ml", "price": 12}, {"size": "大杯 700ml", "price": 15}]',
 '["茉莉花茶", "纯净水"]'),

('芝士奶盖红茶', 'tea', '茶饮', 20.00, 24.00,
 '斯里兰卡红茶底搭配绵密芝士奶盖，先抿奶盖再品茶，层次丰富。',
 '🧋', '["招牌", "奶盖"]', 4.9, 4560, 75,
 '[{"size": "中杯 500ml", "price": 20}, {"size": "大杯 700ml", "price": 24}]',
 '["红茶", "芝士奶盖", "淡奶油", "海盐"]'),

('鲜榨橙汁', 'juice', '果汁', 16.00, NULL,
 '当日新鲜脐橙现榨，不加水不加糖，满满维 C，健康美味。',
 '🍊', '["鲜榨", "维C"]', 4.8, 2100, 60,
 '[{"size": "中杯 350ml", "price": 16}, {"size": "大杯 500ml", "price": 20}]',
 '["新鲜脐橙"]'),

('西瓜汁', 'juice', '果汁', 14.00, NULL,
 '当季麒麟西瓜现榨，清甜多汁，冰镇后口感更佳。',
 '🍉', '["季节限定", "清甜"]', 4.7, 1680, 45,
 '[{"size": "中杯 350ml", "price": 14}, {"size": "大杯 500ml", "price": 18}]',
 '["新鲜西瓜"]'),

('珍珠奶茶', 'milk', '奶茶', 15.00, 18.00,
 '经典台式风味，Q 弹黑糖珍珠搭配香浓奶茶，百喝不腻。',
 '🧋', '["经典", "珍珠"]', 4.8, 6800, 100,
 '[{"size": "中杯 500ml", "price": 15}, {"size": "大杯 700ml", "price": 18}]',
 '["红茶", "鲜奶", "黑糖珍珠"]'),

('芋泥波波奶茶', 'milk', '奶茶', 22.00, NULL,
 '手作芋泥绵密香甜，搭配软糯小芋圆和醇香奶茶，口感丰富。',
 '🍠', '["网红", "芋泥"]', 4.9, 3900, 65,
 '[{"size": "中杯 500ml", "price": 22}, {"size": "大杯 700ml", "price": 26}]',
 '["芋泥", "小芋圆", "鲜奶", "红茶"]');
