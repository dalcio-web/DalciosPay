# MariaDB: segurança e permissões

O Firebase Authentication permanece como provedor de identidade. O MariaDB
armazena apenas perfis locais, papéis, permissões e auditoria. Nenhuma senha do
Firebase deve ser copiada para este banco.

## Aplicação da migração

1. Faça backup dos bancos legados.
2. Crie um banco MariaDB separado para homologação.
3. Execute `migrations/001_security_rbac.sql` somente na homologação.
4. Cadastre o usuário administrador usando o `uid` exibido pelo Firebase
   Authentication.
5. Conceda `super_admin` em uma transação e registre a concessão na auditoria.
6. Valide `GET /api/admin/security-check` antes de liberar qualquer tela de
   administração.

Exemplo para cadastrar o primeiro administrador (substitua os valores):

```sql
START TRANSACTION;

INSERT INTO app_users (firebase_uid, email, display_name)
VALUES ('FIREBASE_UID', 'admin@example.com', 'Administrador')
ON DUPLICATE KEY UPDATE email = VALUES(email), display_name = VALUES(display_name);

INSERT IGNORE INTO user_roles (user_id, role_id, granted_by)
SELECT u.id, r.id, u.id
  FROM app_users u
  JOIN roles r ON r.role_key = 'super_admin'
 WHERE u.firebase_uid = 'FIREBASE_UID';

COMMIT;
```

Não use e-mail como identificador de autorização. O vínculo permanente é feito
por `firebase_uid`.
