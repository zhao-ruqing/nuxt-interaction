SET @accuracy_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'xj_checkins' AND COLUMN_NAME = 'accuracy_meters'
);
SET @add_accuracy_sql = IF(
  @accuracy_column_exists = 0,
  'ALTER TABLE xj_checkins ADD COLUMN accuracy_meters DECIMAL(8, 2) NULL AFTER latitude',
  'SELECT 1'
);
PREPARE add_accuracy_statement FROM @add_accuracy_sql;
EXECUTE add_accuracy_statement;
DEALLOCATE PREPARE add_accuracy_statement;

INSERT INTO xj_settings (setting_key, setting_value, value_type, label, description) VALUES
('location_max_accuracy', '100', 'number', '最大定位误差', '浏览器定位精度大于该数值时拒绝打卡，单位米')
ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description);

UPDATE xj_settings SET setting_value = 'true' WHERE setting_key = 'location_check_enabled';
