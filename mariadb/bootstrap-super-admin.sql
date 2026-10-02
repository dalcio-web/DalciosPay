-- DalciosPay - criação idempotente do primeiro superadministrador
-- Não contém nem altera senhas.

START TRANSACTION;

-- Substitua estes dois valores antes de executar em um banco novo.
SET @bootstrap_firebase_uid := 'FIREBASE_UID';
SET @bootstrap_email := 'admin@example.com';
SET @bootstrap_display_name := 'Administrador';

INSERT INTO app_users (firebase_uid, email, display_name, status)
VALUES (@bootstrap_firebase_uid, @bootstrap_email, @bootstrap_display_name, 'active')
ON DUPLICATE KEY UPDATE
  firebase_uid = VALUES(firebase_uid),
  email = VALUES(email),
  display_name = VALUES(display_name),
  status = 'active';

INSERT IGNORE INTO legacy_user_mappings (user_id, source_system, legacy_user_id)
SELECT id, 'firebase', firebase_uid
FROM app_users
WHERE firebase_uid = @bootstrap_firebase_uid;

INSERT IGNORE INTO user_roles (user_id, role_id, granted_by)
SELECT u.id, r.id, u.id
FROM app_users u
JOIN roles r ON r.role_key = 'super_admin'
WHERE u.firebase_uid = @bootstrap_firebase_uid;

INSERT INTO audit_logs (
  actor_user_id,
  action,
  resource_type,
  resource_id,
  metadata
)
SELECT
  u.id,
  'security.bootstrap_super_admin',
  'app_user',
  CAST(u.id AS CHAR),
  JSON_OBJECT('firebase_uid', u.firebase_uid, 'role', 'super_admin')
FROM app_users u
WHERE u.firebase_uid = @bootstrap_firebase_uid
  AND NOT EXISTS (
    SELECT 1
    FROM audit_logs a
    WHERE a.action = 'security.bootstrap_super_admin'
      AND a.actor_user_id = u.id
  );

COMMIT;

SELECT
  u.id,
  u.firebase_uid,
  u.email,
  u.display_name,
  u.status,
  r.role_key
FROM app_users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.firebase_uid = @bootstrap_firebase_uid;
