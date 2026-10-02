-- DalciosPay - esquema completo para homologação MariaDB
-- Seguro para banco vazio. Não lê nem altera Firebase, MongoDB ou Supabase.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  firebase_uid VARCHAR(128) NULL,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(160) NULL,
  status ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_app_users_firebase_uid (firebase_uid),
  UNIQUE KEY uq_app_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_key VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_role_key (role_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_key VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_permission_key (permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  granted_by BIGINT UNSIGNED NULL,
  granted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_granted_by FOREIGN KEY (granted_by) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  last_seen_at DATETIME(6) NULL,
  revoked_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY idx_auth_sessions_user_expiry (user_id, expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_user_mappings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  source_system ENUM('mongodb', 'firebase', 'supabase', 'local') NOT NULL,
  legacy_user_id VARCHAR(191) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_legacy_source_user (source_system, legacy_user_id),
  KEY idx_legacy_mapping_user (user_id),
  CONSTRAINT fk_legacy_mapping_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_months (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  month_id CHAR(7) NOT NULL,
  salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  expenses JSON NOT NULL,
  extra_incomes JSON NOT NULL,
  piggy_bank JSON NOT NULL,
  investments JSON NOT NULL,
  legacy_source VARCHAR(32) NULL,
  legacy_record_id VARCHAR(191) NULL,
  source_updated_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_financial_month_user_month (user_id, month_id),
  KEY idx_financial_month_month (month_id),
  CONSTRAINT fk_financial_month_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_financial_month_id CHECK (month_id REGEXP '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT chk_financial_month_salary CHECK (salary >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  legacy_trip_id VARCHAR(191) NOT NULL,
  payload JSON NOT NULL,
  legacy_source VARCHAR(32) NULL,
  source_updated_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_trip_user_legacy (user_id, legacy_trip_id),
  CONSTRAINT fk_trip_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS migration_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id CHAR(36) NOT NULL,
  source_system VARCHAR(32) NOT NULL,
  status ENUM('started', 'validated', 'completed', 'failed', 'rolled_back') NOT NULL DEFAULT 'started',
  records_read BIGINT UNSIGNED NOT NULL DEFAULT 0,
  records_written BIGINT UNSIGNED NOT NULL DEFAULT 0,
  records_skipped BIGINT UNSIGNED NOT NULL DEFAULT 0,
  summary JSON NULL,
  started_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  finished_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_migration_runs_run_id (run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS migration_conflicts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id CHAR(36) NOT NULL,
  legacy_user_id VARCHAR(191) NULL,
  month_id CHAR(7) NULL,
  conflict_type VARCHAR(100) NOT NULL,
  details JSON NOT NULL,
  resolution_status ENUM('pending', 'accepted_source', 'merged', 'ignored') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_migration_conflicts_run (run_id, resolution_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(191) NULL,
  request_id CHAR(36) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  metadata JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_audit_actor_created (actor_user_id, created_at),
  KEY idx_audit_resource (resource_type, resource_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (role_key, name, description) VALUES
  ('user', 'Usuário', 'Acesso aos próprios dados'),
  ('support', 'Suporte', 'Consulta limitada para atendimento'),
  ('manager', 'Gestor', 'Gestão operacional sem controle total'),
  ('super_admin', 'Superadministrador', 'Acesso administrativo completo');

INSERT IGNORE INTO permissions (permission_key, description) VALUES
  ('admin.access', 'Acessar o painel administrativo'),
  ('users.read', 'Consultar usuários'),
  ('users.manage', 'Bloquear, desbloquear e alterar usuários'),
  ('financial.read', 'Consultar dados financeiros autorizados'),
  ('financial.manage', 'Executar operações financeiras administrativas'),
  ('audit.read', 'Consultar registros de auditoria'),
  ('system_health.read', 'Consultar a saúde das integrações');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.role_key = 'super_admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('admin.access', 'users.read', 'financial.read', 'audit.read', 'system_health.read')
WHERE r.role_key = 'manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key IN ('admin.access', 'users.read')
WHERE r.role_key = 'support';
