-- 系统配置表：以键值对形式存储各类配置（API Key 等）
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT '' COMMENT '配置说明',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 插入 DeepSeek API Key（模拟 key，实际使用前请替换为真实 key）
INSERT IGNORE INTO `system_configs` (`config_key`, `config_value`, `description`)
VALUES ('deepseek_api_key', 'sk-mock-deepseek-key-replace-with-real-one', 'DeepSeek AI API 密钥');

-- 插入 Dify API Key（如已存在则跳过）
INSERT IGNORE INTO `system_configs` (`config_key`, `config_value`, `description`)
VALUES ('dify_api_key', 'app-mock-dify-key-replace-with-real-one', 'Dify AI API 密钥');
