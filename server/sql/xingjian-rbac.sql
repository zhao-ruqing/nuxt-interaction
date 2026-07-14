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
