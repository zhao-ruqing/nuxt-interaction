-- 审计日志表（只追加，应用层不提供修改/删除）
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL COMMENT '操作人 ID',
  username      VARCHAR(50) NOT NULL COMMENT '操作人用户名',
  action        VARCHAR(64) NOT NULL COMMENT '动作标识，如 product.update',
  resource_type VARCHAR(32) NOT NULL COMMENT '资源类型，如 product / address',
  resource_id   VARCHAR(64) DEFAULT NULL COMMENT '资源 ID',
  description   VARCHAR(500) NOT NULL COMMENT '可读摘要',
  metadata      JSON DEFAULT NULL COMMENT '结构化变更详情',
  request_id    VARCHAR(36) DEFAULT NULL COMMENT '请求追踪 ID',
  ip            VARCHAR(45) DEFAULT NULL COMMENT '客户端 IP',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志';
