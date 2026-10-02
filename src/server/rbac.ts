import type { NextFunction, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import type { AuthenticatedRequest } from './auth';
import { getMariaDbPool } from './mariadb';

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin.access',
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',
  FINANCIAL_READ: 'financial.read',
  FINANCIAL_MANAGE: 'financial.manage',
  AUDIT_READ: 'audit.read',
  SYSTEM_HEALTH_READ: 'system_health.read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface PermissionRow extends RowDataPacket {
  permission_key: string;
}

export async function getPermissionsForFirebaseUser(firebaseUid: string): Promise<Set<string>> {
  const pool = getMariaDbPool();
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT DISTINCT p.permission_key
       FROM app_users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE u.firebase_uid = ? AND u.status = 'active'`,
    [firebaseUid],
  );

  return new Set(rows.map((row) => row.permission_key));
}

export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser?.uid) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    try {
      const permissions = await getPermissionsForFirebaseUser(req.authUser.uid);
      if (!permissions.has(permission)) {
        res.status(403).json({ error: 'Você não possui permissão para esta operação.' });
        return;
      }
      next();
    } catch (error) {
      console.error('[RBAC] Falha ao consultar permissões:', error);
      res.status(503).json({ error: 'Serviço de autorização indisponível.' });
    }
  };
}
